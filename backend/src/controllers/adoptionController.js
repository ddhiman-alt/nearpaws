const AdoptionRequest = require('../models/AdoptionRequest');
const Pet = require('../models/Pet');
const { validationResult } = require('express-validator');

// @desc    Create adoption request
// @route   POST /api/adoptions
// @access  Private
exports.createRequest = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ success: false, errors: errors.array() });
    }

    const { petId, message } = req.body;

    // Check if pet exists
    const pet = await Pet.findById(petId);
    if (!pet) {
      return res.status(404).json({
        success: false,
        message: 'Pet not found'
      });
    }

    // Check if pet is available
    if (pet.status !== 'available') {
      return res.status(400).json({
        success: false,
        message: 'This pet is no longer available for adoption'
      });
    }

    // Check if user is not the pet owner
    if (pet.owner.toString() === req.user.id) {
      return res.status(400).json({
        success: false,
        message: 'You cannot request to adopt your own pet'
      });
    }

    // Check if user already requested this pet
    const existingRequest = await AdoptionRequest.findOne({
      pet: petId,
      requester: req.user.id
    });

    if (existingRequest) {
      return res.status(400).json({
        success: false,
        message: 'You have already requested to adopt this pet'
      });
    }

    const adoptionRequest = await AdoptionRequest.create({
      pet: petId,
      requester: req.user.id,
      owner: pet.owner,
      message
    });

    await adoptionRequest.populate([
      { path: 'pet', select: 'name species breed images' },
      { path: 'requester', select: 'name email phone' }
    ]);

    res.status(201).json({
      success: true,
      data: adoptionRequest
    });
  } catch (error) {
    console.error(error);
    if (error.code === 11000) {
      return res.status(400).json({
        success: false,
        message: 'You have already requested to adopt this pet'
      });
    }
    res.status(500).json({
      success: false,
      message: 'Server Error'
    });
  }
};

// @desc    Get requests for my pets (as owner)
// @route   GET /api/adoptions/received
// @access  Private
exports.getReceivedRequests = async (req, res) => {
  try {
    const requests = await AdoptionRequest.find({ owner: req.user.id })
      .populate('pet', 'name species breed images status')
      .populate('requester', 'name email phone location')
      .sort('-createdAt');

    res.status(200).json({
      success: true,
      count: requests.length,
      data: requests
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({
      success: false,
      message: 'Server Error'
    });
  }
};

// @desc    Get my sent requests (as requester)
// @route   GET /api/adoptions/sent
// @access  Private
exports.getSentRequests = async (req, res) => {
  try {
    const requests = await AdoptionRequest.find({ requester: req.user.id })
      .populate('pet', 'name species breed images status')
      .populate('owner', 'name email phone')
      .sort('-createdAt');

    res.status(200).json({
      success: true,
      count: requests.length,
      data: requests
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({
      success: false,
      message: 'Server Error'
    });
  }
};

// @desc    Update request status (accept/reject)
// @route   PATCH /api/adoptions/:id/status
// @access  Private
exports.updateRequestStatus = async (req, res) => {
  try {
    const { status } = req.body;

    if (!['accepted', 'rejected'].includes(status)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid status. Use "accepted" or "rejected"'
      });
    }

    const request = await AdoptionRequest.findById(req.params.id);

    if (!request) {
      return res.status(404).json({
        success: false,
        message: 'Request not found'
      });
    }

    // Only the pet owner can accept/reject
    if (request.owner.toString() !== req.user.id) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to update this request'
      });
    }

    request.status = status;
    await request.save();

    // If accepted, update pet status to pending
    if (status === 'accepted') {
      await Pet.findByIdAndUpdate(request.pet, { status: 'pending' });
    }

    await request.populate([
      { path: 'pet', select: 'name species breed images' },
      { path: 'requester', select: 'name email phone' }
    ]);

    res.status(200).json({
      success: true,
      data: request
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({
      success: false,
      message: 'Server Error'
    });
  }
};

// @desc    Withdraw my request
// @route   DELETE /api/adoptions/:id
// @access  Private
exports.withdrawRequest = async (req, res) => {
  try {
    const request = await AdoptionRequest.findById(req.params.id);

    if (!request) {
      return res.status(404).json({
        success: false,
        message: 'Request not found'
      });
    }

    // Only the requester can withdraw
    if (request.requester.toString() !== req.user.id) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to withdraw this request'
      });
    }

    await request.deleteOne();

    res.status(200).json({
      success: true,
      data: {}
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({
      success: false,
      message: 'Server Error'
    });
  }
};
