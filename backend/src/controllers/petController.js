const Pet = require("../models/Pet");
const { validationResult } = require("express-validator");

// @desc    Create new pet listing
// @route   POST /api/pets
// @access  Private
exports.createPet = async (req, res) => {
    try {
        // Parse JSON strings from multipart form data
        let location = req.body.location;
        let age = req.body.age;
        let healthInfo = req.body.healthInfo;

        if (typeof location === "string") {
            location = JSON.parse(location);
        }
        if (typeof age === "string") {
            age = JSON.parse(age);
        }
        if (typeof healthInfo === "string") {
            healthInfo = JSON.parse(healthInfo);
        }

        const petData = {
            name: req.body.name,
            species: req.body.species,
            breed: req.body.breed,
            age: age,
            gender: req.body.gender,
            size: req.body.size,
            color: req.body.color,
            description: req.body.description,
            healthInfo: healthInfo,
            adoptionFee: req.body.adoptionFee,
            contactPreference: req.body.contactPreference,
            owner: req.user.id,
            location: {
                type: "Point",
                coordinates: [
                    parseFloat(location.longitude),
                    parseFloat(location.latitude),
                ],
                address: location.address,
                city: location.city,
            },
        };

        // Handle uploaded images
        if (req.files && req.files.length > 0) {
            petData.images = req.files.map(
                (file) => `/uploads/${file.filename}`,
            );
        }

        const pet = await Pet.create(petData);

        res.status(201).json({
            success: true,
            data: pet,
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({
            success: false,
            message: "Server Error",
        });
    }
};

// @desc    Get all pets with filtering and geospatial search
// @route   GET /api/pets
// @access  Public
exports.getPets = async (req, res) => {
    try {
        const {
            latitude,
            longitude,
            distance, // No default - if not provided, no distance filter
            species,
            gender,
            size,
            status = "available",
            search, // Search by name
            page = 1,
            limit = 10,
            sort = "-createdAt",
        } = req.query;

        let query = {};

        // Filter by status
        if (status) {
            query.status = status;
        }

        // Filter by species
        if (species) {
            query.species = species.toLowerCase();
        }

        // Filter by gender
        if (gender) {
            query.gender = gender.toLowerCase();
        }

        // Filter by size
        if (size) {
            query.size = size.toLowerCase();
        }

        // Search by name (case-insensitive)
        if (search && search.trim()) {
            query.name = { $regex: search.trim(), $options: "i" };
        }

        // Geospatial query - find pets within distance (in kilometers)
        // Only apply if latitude, longitude AND distance are provided
        if (latitude && longitude && distance) {
            const lat = parseFloat(latitude);
            const lng = parseFloat(longitude);
            const maxDistance = parseFloat(distance) * 1000; // Convert km to meters

            query.location = {
                $near: {
                    $geometry: {
                        type: "Point",
                        coordinates: [lng, lat],
                    },
                    $maxDistance: maxDistance,
                },
            };
        }

        const skip = (parseInt(page) - 1) * parseInt(limit);

        const pets = await Pet.find(query)
            .populate("owner", "name email phone")
            .sort(sort)
            .skip(skip)
            .limit(parseInt(limit));

        // Get total count for pagination
        const total = await Pet.countDocuments(query);

        res.status(200).json({
            success: true,
            count: pets.length,
            total,
            totalPages: Math.ceil(total / parseInt(limit)),
            currentPage: parseInt(page),
            data: pets,
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({
            success: false,
            message: "Server Error",
        });
    }
};

// @desc    Get pets near a location with distance calculation
// @route   GET /api/pets/nearby
// @access  Public
exports.getNearbyPets = async (req, res) => {
    try {
        const {
            latitude,
            longitude,
            distance, // No default - if not provided, no distance limit
            species,
            gender,
            size,
            search,
            sort = "distance", // Default sort by distance for nearby search
            sortDirection = "asc", // For distance: 'asc' = nearest first, 'desc' = farthest first
            status = "available",
            page = 1,
            limit = 12,
        } = req.query;

        if (!latitude || !longitude) {
            return res.status(400).json({
                success: false,
                message: "Please provide latitude and longitude",
            });
        }

        const lat = parseFloat(latitude);
        const lng = parseFloat(longitude);

        // Validate coordinates
        if (isNaN(lat) || isNaN(lng)) {
            return res.status(400).json({
                success: false,
                message: "Invalid coordinates",
            });
        }

        const matchStage = { status };
        if (species) {
            matchStage.species = species.toLowerCase();
        }
        if (gender) {
            matchStage.gender = gender.toLowerCase();
        }
        if (size) {
            matchStage.size = size.toLowerCase();
        }
        if (search && search.trim()) {
            matchStage.name = { $regex: search.trim(), $options: "i" };
        }

        // Build aggregation pipeline
        const pipeline = [];

        // GeoNear stage - with or without maxDistance
        const geoNearStage = {
            $geoNear: {
                near: {
                    type: "Point",
                    coordinates: [lng, lat],
                },
                distanceField: "distance",
                spherical: true,
                query: matchStage,
            },
        };

        // Only add maxDistance if distance is provided
        if (distance) {
            geoNearStage.$geoNear.maxDistance = parseFloat(distance) * 1000; // Convert km to meters
        }

        pipeline.push(geoNearStage);

        // Add distance in km
        pipeline.push({
            $addFields: {
                distanceInKm: {
                    $round: [{ $divide: ["$distance", 1000] }, 1],
                },
            },
        });

        // Apply sorting
        if (sort === "createdAt") {
            pipeline.push({ $sort: { createdAt: 1 } });
        } else if (sort === "-createdAt") {
            pipeline.push({ $sort: { createdAt: -1 } });
        } else if (sort === "distance") {
            // Sort by distance based on sortDirection
            if (sortDirection === "desc") {
                // Farthest first
                pipeline.push({ $sort: { distance: -1 } });
            } else {
                // Nearest first (default for distance sort)
                pipeline.push({ $sort: { distance: 1 } });
            }
        } else {
            // Default: sort by distance ascending (nearest first)
            pipeline.push({ $sort: { distance: 1 } });
        }

        // Count total before pagination
        const countPipeline = [...pipeline.slice(0, -1), { $count: "total" }]; // Exclude sort for count
        const countResult = await Pet.aggregate(countPipeline);
        const total = countResult.length > 0 ? countResult[0].total : 0;

        // Add pagination
        const skip = (parseInt(page) - 1) * parseInt(limit);
        pipeline.push({ $skip: skip });
        pipeline.push({ $limit: parseInt(limit) });

        // Lookup owner
        pipeline.push({
            $lookup: {
                from: "users",
                localField: "owner",
                foreignField: "_id",
                as: "owner",
                pipeline: [{ $project: { name: 1, email: 1, phone: 1 } }],
            },
        });
        pipeline.push({
            $unwind: { path: "$owner", preserveNullAndEmptyArrays: true },
        });

        const pets = await Pet.aggregate(pipeline);

        res.status(200).json({
            success: true,
            count: pets.length,
            total,
            totalPages: Math.ceil(total / parseInt(limit)),
            currentPage: parseInt(page),
            data: pets,
        });
    } catch (error) {
        console.error("getNearbyPets error:", error);
        // If geoNear fails (e.g., no 2dsphere index), fall back to regular query
        try {
            const {
                species,
                gender,
                size,
                search,
                status = "available",
                page = 1,
                limit = 12,
            } = req.query;
            const query = { status };
            if (species) {
                query.species = species.toLowerCase();
            }
            if (gender) {
                query.gender = gender.toLowerCase();
            }
            if (size) {
                query.size = size.toLowerCase();
            }
            if (search && search.trim()) {
                query.name = { $regex: search.trim(), $options: "i" };
            }

            const skip = (parseInt(page) - 1) * parseInt(limit);
            const total = await Pet.countDocuments(query);
            const pets = await Pet.find(query)
                .populate("owner", "name email phone")
                .sort("-createdAt")
                .skip(skip)
                .limit(parseInt(limit));

            return res.status(200).json({
                success: true,
                count: pets.length,
                total,
                totalPages: Math.ceil(total / parseInt(limit)),
                currentPage: parseInt(page),
                data: pets,
            });
        } catch (fallbackError) {
            console.error("Fallback error:", fallbackError);
            res.status(500).json({
                success: false,
                message: "Server Error",
            });
        }
    }
};

// @desc    Get single pet
// @route   GET /api/pets/:id
// @access  Public
exports.getPet = async (req, res) => {
    try {
        const pet = await Pet.findById(req.params.id).populate(
            "owner",
            "name email phone location",
        );

        if (!pet) {
            return res.status(404).json({
                success: false,
                message: "Pet not found",
            });
        }

        res.status(200).json({
            success: true,
            data: pet,
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({
            success: false,
            message: "Server Error",
        });
    }
};

// @desc    Update pet
// @route   PUT /api/pets/:id
// @access  Private
exports.updatePet = async (req, res) => {
    try {
        let pet = await Pet.findById(req.params.id);

        if (!pet) {
            return res.status(404).json({
                success: false,
                message: "Pet not found",
            });
        }

        // Make sure user is pet owner
        if (pet.owner.toString() !== req.user.id) {
            return res.status(403).json({
                success: false,
                message: "Not authorized to update this pet",
            });
        }

        const updateData = { ...req.body };

        // Update location if provided
        if (
            req.body.location &&
            req.body.location.latitude &&
            req.body.location.longitude
        ) {
            updateData.location = {
                type: "Point",
                coordinates: [
                    req.body.location.longitude,
                    req.body.location.latitude,
                ],
                address: req.body.location.address,
                city: req.body.location.city,
            };
        }

        // Handle new uploaded images
        if (req.files && req.files.length > 0) {
            const newImages = req.files.map(
                (file) => `/uploads/${file.filename}`,
            );
            updateData.images = [...(pet.images || []), ...newImages];
        }

        pet = await Pet.findByIdAndUpdate(req.params.id, updateData, {
            new: true,
            runValidators: true,
        });

        res.status(200).json({
            success: true,
            data: pet,
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({
            success: false,
            message: "Server Error",
        });
    }
};

// @desc    Delete pet
// @route   DELETE /api/pets/:id
// @access  Private
exports.deletePet = async (req, res) => {
    try {
        const pet = await Pet.findById(req.params.id);

        if (!pet) {
            return res.status(404).json({
                success: false,
                message: "Pet not found",
            });
        }

        // Make sure user is pet owner
        if (pet.owner.toString() !== req.user.id) {
            return res.status(403).json({
                success: false,
                message: "Not authorized to delete this pet",
            });
        }

        await pet.deleteOne();

        res.status(200).json({
            success: true,
            data: {},
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({
            success: false,
            message: "Server Error",
        });
    }
};

// @desc    Get pets by current user
// @route   GET /api/pets/my-pets
// @access  Private
exports.getMyPets = async (req, res) => {
    try {
        const pets = await Pet.find({ owner: req.user.id }).sort("-createdAt");

        res.status(200).json({
            success: true,
            count: pets.length,
            data: pets,
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({
            success: false,
            message: "Server Error",
        });
    }
};

// @desc    Update pet status
// @route   PATCH /api/pets/:id/status
// @access  Private
exports.updatePetStatus = async (req, res) => {
    try {
        const { status } = req.body;

        if (!["available", "pending", "adopted"].includes(status)) {
            return res.status(400).json({
                success: false,
                message: "Invalid status",
            });
        }

        let pet = await Pet.findById(req.params.id);

        if (!pet) {
            return res.status(404).json({
                success: false,
                message: "Pet not found",
            });
        }

        // Make sure user is pet owner
        if (pet.owner.toString() !== req.user.id) {
            return res.status(403).json({
                success: false,
                message: "Not authorized to update this pet",
            });
        }

        pet.status = status;
        await pet.save();

        res.status(200).json({
            success: true,
            data: pet,
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({
            success: false,
            message: "Server Error",
        });
    }
};
