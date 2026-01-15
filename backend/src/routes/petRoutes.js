const express = require("express");
const router = express.Router();
const { body } = require("express-validator");
const {
    createPet,
    getPets,
    getNearbyPets,
    getPet,
    updatePet,
    deletePet,
    getMyPets,
    updatePetStatus,
} = require("../controllers/petController");
const { protect } = require("../middleware/auth");
const upload = require("../middleware/upload");

// Validation rules
const petValidation = [
    body("name").trim().notEmpty().withMessage("Pet name is required"),
    body("species").trim().notEmpty().withMessage("Species is required"),
    body("age.value").isNumeric().withMessage("Age is required"),
    body("description")
        .trim()
        .notEmpty()
        .withMessage("Description is required"),
    body("location.latitude").isNumeric().withMessage("Latitude is required"),
    body("location.longitude").isNumeric().withMessage("Longitude is required"),
];

// Protected routes (specific paths first)
router.get("/user/my-pets", protect, getMyPets);

// Public routes
router.get("/", getPets);
router.get("/nearby", getNearbyPets);
router.get("/:id", getPet);

// Protected routes with params
router.post("/", protect, upload.array("images", 5), createPet);
router.put("/:id", protect, upload.array("images", 5), updatePet);
router.patch("/:id/status", protect, updatePetStatus);
router.delete("/:id", protect, deletePet);

module.exports = router;
