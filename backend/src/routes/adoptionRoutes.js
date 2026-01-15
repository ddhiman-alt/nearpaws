const express = require('express');
const router = express.Router();
const { body } = require('express-validator');
const {
  createRequest,
  getReceivedRequests,
  getSentRequests,
  updateRequestStatus,
  withdrawRequest
} = require('../controllers/adoptionController');
const { protect } = require('../middleware/auth');

// Validation rules
const requestValidation = [
  body('petId').notEmpty().withMessage('Pet ID is required'),
  body('message')
    .trim()
    .notEmpty()
    .withMessage('Message is required')
    .isLength({ max: 500 })
    .withMessage('Message cannot exceed 500 characters')
];

// All routes are protected
router.use(protect);

router.post('/', requestValidation, createRequest);
router.get('/received', getReceivedRequests);
router.get('/sent', getSentRequests);
router.patch('/:id/status', updateRequestStatus);
router.delete('/:id', withdrawRequest);

module.exports = router;
