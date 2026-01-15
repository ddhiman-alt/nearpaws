const mongoose = require("mongoose");

const petSchema = new mongoose.Schema({
    name: {
        type: String,
        required: [true, "Please provide pet name"],
        trim: true,
        maxlength: [50, "Name cannot be more than 50 characters"],
    },
    species: {
        type: String,
        required: [true, "Please specify the species"],
        enum: [
            "dog",
            "cat",
            "bird",
            "rabbit",
            "hamster",
            "fish",
            "turtle",
            "other",
        ],
        lowercase: true,
    },
    breed: {
        type: String,
        trim: true,
        default: "Mixed/Unknown",
    },
    age: {
        value: {
            type: Number,
            required: [true, "Please provide age"],
        },
        unit: {
            type: String,
            enum: ["days", "weeks", "months", "years"],
            default: "months",
        },
    },
    gender: {
        type: String,
        enum: ["male", "female", "unknown"],
        default: "unknown",
    },
    size: {
        type: String,
        enum: ["small", "medium", "large", "extra-large"],
        default: "medium",
    },
    color: {
        type: String,
        trim: true,
    },
    description: {
        type: String,
        required: [true, "Please provide a description"],
        maxlength: [1000, "Description cannot be more than 1000 characters"],
    },
    healthInfo: {
        vaccinated: {
            type: Boolean,
            default: false,
        },
        neutered: {
            type: Boolean,
            default: false,
        },
        healthConditions: {
            type: String,
            trim: true,
        },
    },
    images: [
        {
            type: String,
        },
    ],
    location: {
        type: {
            type: String,
            enum: ["Point"],
            default: "Point",
        },
        coordinates: {
            type: [Number],
            required: [true, "Please provide location coordinates"],
        },
        address: {
            type: String,
            trim: true,
        },
        city: {
            type: String,
            trim: true,
        },
    },
    adoptionFee: {
        type: Number,
        default: 0,
    },
    adoptionFeeReason: {
        type: String,
        trim: true,
        maxlength: [
            500,
            "Adoption fee reason cannot be more than 500 characters",
        ],
    },
    status: {
        type: String,
        enum: ["available", "pending", "adopted"],
        default: "available",
    },
    owner: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
        required: true,
    },
    contactPreference: {
        type: String,
        enum: ["email", "phone", "both"],
        default: "both",
    },
    createdAt: {
        type: Date,
        default: Date.now,
    },
    updatedAt: {
        type: Date,
        default: Date.now,
    },
});

// Create geospatial index for location-based queries
petSchema.index({ location: "2dsphere" });
petSchema.index({ species: 1, status: 1 });
petSchema.index({ createdAt: -1 });

// Update the updatedAt field before saving
petSchema.pre("save", function (next) {
    this.updatedAt = Date.now();
    next();
});

module.exports = mongoose.model("Pet", petSchema);
