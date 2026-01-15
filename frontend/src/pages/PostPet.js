import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { petsAPI } from "../services/api";
import { useLocation as useLocationContext } from "../context/LocationContext";
import LocationPicker from "../components/LocationPicker";
import "./PostPet.css";

const PostPet = () => {
    const navigate = useNavigate();
    const { location: userLocation } = useLocationContext();

    const [currentStep, setCurrentStep] = useState(1);
    const [formData, setFormData] = useState({
        name: "",
        species: "dog",
        breed: "",
        ageValue: "",
        ageUnit: "months",
        gender: "unknown",
        size: "medium",
        color: "",
        description: "",
        vaccinated: false,
        neutered: false,
        healthConditions: "",
        adoptionFee: 0,
        adoptionFeeReason: "",
        contactPreference: "both",
    });

    // Separate location state managed by LocationPicker
    const [petLocation, setPetLocation] = useState({
        latitude: null,
        longitude: null,
        address: "",
        city: "",
    });

    // Initialize pet location from user's location
    useEffect(() => {
        if (
            userLocation &&
            userLocation.latitude &&
            userLocation.longitude &&
            !petLocation.latitude
        ) {
            setPetLocation((prev) => ({
                ...prev,
                latitude: userLocation.latitude,
                longitude: userLocation.longitude,
                city: userLocation.city || prev.city,
                address: userLocation.address || prev.address,
            }));
        }
    }, [userLocation, petLocation.latitude]);

    const [images, setImages] = useState([]);
    const [previews, setPreviews] = useState([]);
    const [error, setError] = useState("");
    const [loading, setLoading] = useState(false);

    // Scroll to top when step changes
    useEffect(() => {
        window.scrollTo({ top: 0, behavior: "smooth" });
    }, [currentStep]);

    const steps = [
        { number: 1, title: "Pet Info", icon: "🐾" },
        { number: 2, title: "Photos & Details", icon: "📸" },
        { number: 3, title: "Location & Finish", icon: "📍" },
    ];

    const speciesOptions = [
        { value: "dog", label: "Dog", icon: "🐕" },
        { value: "cat", label: "Cat", icon: "🐱" },
        { value: "bird", label: "Bird", icon: "🐦" },
        { value: "rabbit", label: "Rabbit", icon: "🐰" },
        { value: "hamster", label: "Hamster", icon: "🐹" },
        { value: "fish", label: "Fish", icon: "🐟" },
        { value: "turtle", label: "Turtle", icon: "🐢" },
        { value: "other", label: "Other", icon: "🐾" },
    ];

    const genderOptions = [
        { value: "male", label: "Male", icon: "♂️" },
        { value: "female", label: "Female", icon: "♀️" },
        { value: "unknown", label: "Unknown", icon: "❓" },
    ];

    const sizeOptions = [
        { value: "small", label: "Small", icon: "🐁" },
        { value: "medium", label: "Medium", icon: "🐕" },
        { value: "large", label: "Large", icon: "🦮" },
        { value: "extra-large", label: "XL", icon: "🐘" },
    ];

    const handleChange = (e) => {
        const { name, value, type, checked } = e.target;
        setFormData({
            ...formData,
            [name]: type === "checkbox" ? checked : value,
        });
        setError("");
    };

    const handleSpeciesSelect = (species) => {
        setFormData({ ...formData, species });
    };

    const handleImageChange = (e) => {
        const files = Array.from(e.target.files);
        if (files.length + images.length > 5) {
            setError("You can upload maximum 5 images");
            return;
        }

        setImages([...images, ...files]);
        const newPreviews = files.map((file) => URL.createObjectURL(file));
        setPreviews([...previews, ...newPreviews]);
    };

    const removeImage = (index) => {
        const newImages = [...images];
        const newPreviews = [...previews];
        newImages.splice(index, 1);
        newPreviews.splice(index, 1);
        setImages(newImages);
        setPreviews(newPreviews);
    };

    // Silent validation - returns true/false without setting errors
    const isStepValid = (step) => {
        switch (step) {
            case 1:
                return formData.name.trim() !== "" && formData.ageValue !== "";
            case 2:
                return formData.description.trim() !== "";
            case 3:
                return (
                    petLocation.city &&
                    petLocation.city.trim() !== "" &&
                    petLocation.latitude &&
                    petLocation.longitude &&
                    (parseFloat(formData.adoptionFee) <= 0 ||
                        formData.adoptionFeeReason.trim() !== "")
                );
            default:
                return true;
        }
    };

    // Validation with error messages - only called on explicit user action
    const validateStepWithErrors = (step) => {
        switch (step) {
            case 1:
                if (!formData.name.trim()) {
                    setError("Please enter your pet's name");
                    return false;
                }
                if (!formData.ageValue) {
                    setError("Please enter your pet's age");
                    return false;
                }
                return true;
            case 2:
                if (!formData.description.trim()) {
                    setError("Please add a description for your pet");
                    return false;
                }
                return true;
            case 3:
                if (!petLocation.city || !petLocation.city.trim()) {
                    setError("Please enter your city");
                    return false;
                }
                if (!petLocation.latitude || !petLocation.longitude) {
                    setError(
                        "Location coordinates are required. Please set your location using Auto Detect, Manual Entry, or the Map.",
                    );
                    return false;
                }
                if (
                    parseFloat(formData.adoptionFee) > 0 &&
                    !formData.adoptionFeeReason.trim()
                ) {
                    setError("Please provide a reason for the adoption fee");
                    return false;
                }
                return true;
            default:
                return true;
        }
    };

    const nextStep = () => {
        if (validateStepWithErrors(currentStep)) {
            setError(""); // Clear any previous errors
            setCurrentStep((prev) => Math.min(prev + 1, 3));
        }
    };

    const prevStep = () => {
        setError(""); // Clear any previous errors
        setCurrentStep((prev) => Math.max(prev - 1, 1));
    };

    // Prevent form submission on Enter key
    const handleFormKeyDown = (e) => {
        if (e.key === "Enter" && e.target.tagName !== "TEXTAREA") {
            e.preventDefault();
        }
    };

    const handleSubmit = async () => {
        if (!validateStepWithErrors(currentStep)) return;

        setLoading(true);

        try {
            const petData = {
                name: formData.name,
                species: formData.species,
                breed: formData.breed,
                age: {
                    value: parseInt(formData.ageValue),
                    unit: formData.ageUnit,
                },
                gender: formData.gender,
                size: formData.size,
                color: formData.color,
                description: formData.description,
                healthInfo: {
                    vaccinated: formData.vaccinated,
                    neutered: formData.neutered,
                    healthConditions: formData.healthConditions,
                },
                adoptionFee: parseFloat(formData.adoptionFee) || 0,
                adoptionFeeReason: formData.adoptionFeeReason,
                contactPreference: formData.contactPreference,
                location: {
                    latitude: petLocation.latitude,
                    longitude: petLocation.longitude,
                    address: petLocation.address,
                    city: petLocation.city,
                },
                images: images,
            };

            await petsAPI.create(petData);
            navigate("/my-pets");
        } catch (err) {
            console.error("Error creating pet:", err);
            // Handle different error types
            let errorMessage = "Failed to post pet. Please try again.";

            if (err.response?.data?.message) {
                errorMessage = err.response.data.message;
            } else if (err.message) {
                // Network errors or other JS errors
                if (err.message.includes("Network Error")) {
                    errorMessage =
                        "Network error. Please check your connection and try again.";
                } else if (err.message.includes("timeout")) {
                    errorMessage = "Request timed out. Please try again.";
                } else {
                    errorMessage = err.message;
                }
            }

            setError(errorMessage);
        } finally {
            setLoading(false);
        }
    };

    const renderStepContent = () => {
        switch (currentStep) {
            case 1:
                return (
                    <div className="step-content">
                        <div className="step-header">
                            <span className="step-icon">🐾</span>
                            <div>
                                <h2>Tell us about your pet</h2>
                                <p>
                                    Basic information to help adopters find them
                                </p>
                            </div>
                        </div>

                        <div className="form-group">
                            <label htmlFor="name">
                                What's your pet's name? *
                            </label>
                            <input
                                type="text"
                                id="name"
                                name="name"
                                className="form-control form-control-lg"
                                placeholder="e.g., Buddy, Luna, Max..."
                                value={formData.name}
                                onChange={handleChange}
                            />
                        </div>

                        <div className="form-group">
                            <label>What type of pet? *</label>
                            <div className="species-grid">
                                {speciesOptions.map((option) => (
                                    <button
                                        key={option.value}
                                        type="button"
                                        className={`species-card ${formData.species === option.value ? "selected" : ""}`}
                                        onClick={() =>
                                            handleSpeciesSelect(option.value)
                                        }
                                    >
                                        <span className="species-icon">
                                            {option.icon}
                                        </span>
                                        <span className="species-label">
                                            {option.label}
                                        </span>
                                    </button>
                                ))}
                            </div>
                        </div>

                        <div className="form-row">
                            <div className="form-group">
                                <label htmlFor="breed">Breed</label>
                                <input
                                    type="text"
                                    id="breed"
                                    name="breed"
                                    className="form-control"
                                    placeholder="e.g., Golden Retriever, Mixed"
                                    value={formData.breed}
                                    onChange={handleChange}
                                />
                            </div>
                            <div className="form-group">
                                <label htmlFor="color">Color</label>
                                <input
                                    type="text"
                                    id="color"
                                    name="color"
                                    className="form-control"
                                    placeholder="e.g., Brown and white"
                                    value={formData.color}
                                    onChange={handleChange}
                                />
                            </div>
                        </div>

                        <div className="form-group">
                            <label>Age *</label>
                            <div className="age-inputs">
                                <input
                                    type="number"
                                    name="ageValue"
                                    className="form-control"
                                    placeholder="Enter age"
                                    min="0"
                                    value={formData.ageValue}
                                    onChange={handleChange}
                                />
                                <select
                                    name="ageUnit"
                                    className="form-control"
                                    value={formData.ageUnit}
                                    onChange={handleChange}
                                >
                                    <option value="days">Days</option>
                                    <option value="weeks">Weeks</option>
                                    <option value="months">Months</option>
                                    <option value="years">Years</option>
                                </select>
                            </div>
                        </div>

                        <div className="form-group">
                            <label>Gender</label>
                            <div className="button-select-group">
                                {genderOptions.map((option) => (
                                    <button
                                        key={option.value}
                                        type="button"
                                        className={`button-select ${formData.gender === option.value ? "selected" : ""}`}
                                        onClick={() =>
                                            setFormData({
                                                ...formData,
                                                gender: option.value,
                                            })
                                        }
                                    >
                                        <span className="button-select-icon">
                                            {option.icon}
                                        </span>
                                        <span>{option.label}</span>
                                    </button>
                                ))}
                            </div>
                        </div>

                        <div className="form-group">
                            <label>Size</label>
                            <div className="button-select-group">
                                {sizeOptions.map((option) => (
                                    <button
                                        key={option.value}
                                        type="button"
                                        className={`button-select ${formData.size === option.value ? "selected" : ""}`}
                                        onClick={() =>
                                            setFormData({
                                                ...formData,
                                                size: option.value,
                                            })
                                        }
                                    >
                                        <span className="button-select-icon">
                                            {option.icon}
                                        </span>
                                        <span>{option.label}</span>
                                    </button>
                                ))}
                            </div>
                        </div>
                    </div>
                );

            case 2:
                return (
                    <div className="step-content">
                        <div className="step-header">
                            <span className="step-icon">📸</span>
                            <div>
                                <h2>Show off your pet</h2>
                                <p>Add photos and tell their story</p>
                            </div>
                        </div>

                        <div className="form-group">
                            <label>Photos</label>
                            <div className="photo-upload-area">
                                <div className="image-previews">
                                    {previews.map((preview, index) => (
                                        <div
                                            key={index}
                                            className="image-preview"
                                        >
                                            <img
                                                src={preview}
                                                alt={`Preview ${index + 1}`}
                                            />
                                            <button
                                                type="button"
                                                className="remove-image"
                                                onClick={() =>
                                                    removeImage(index)
                                                }
                                            >
                                                ×
                                            </button>
                                        </div>
                                    ))}
                                    {images.length < 5 && (
                                        <label className="add-image">
                                            <input
                                                type="file"
                                                accept="image/*"
                                                multiple
                                                onChange={handleImageChange}
                                                hidden
                                            />
                                            <span className="add-icon">📷</span>
                                            <span className="add-text">
                                                Add Photo
                                            </span>
                                        </label>
                                    )}
                                </div>
                                <p className="image-hint">
                                    📌 Upload up to 5 photos • Good photos
                                    increase adoption chances!
                                </p>
                            </div>
                        </div>

                        <div className="form-group">
                            <label htmlFor="description">
                                Tell their story *
                            </label>
                            <textarea
                                id="description"
                                name="description"
                                className="form-control"
                                placeholder="What makes your pet special? Describe their personality, favorite activities, quirks, and why they'd make a great companion..."
                                value={formData.description}
                                onChange={handleChange}
                                rows="5"
                            />
                            <p className="char-count">
                                {formData.description.length}/1000
                            </p>
                        </div>

                        <div className="health-section">
                            <label>Health Information</label>
                            <div className="health-toggles">
                                <label
                                    className={`health-toggle ${formData.vaccinated ? "active" : ""}`}
                                >
                                    <input
                                        type="checkbox"
                                        name="vaccinated"
                                        checked={formData.vaccinated}
                                        onChange={handleChange}
                                    />
                                    <span className="toggle-icon">💉</span>
                                    <span>Vaccinated</span>
                                </label>
                                <label
                                    className={`health-toggle ${formData.neutered ? "active" : ""}`}
                                >
                                    <input
                                        type="checkbox"
                                        name="neutered"
                                        checked={formData.neutered}
                                        onChange={handleChange}
                                    />
                                    <span className="toggle-icon">✂️</span>
                                    <span>Spayed/Neutered</span>
                                </label>
                            </div>
                            <input
                                type="text"
                                name="healthConditions"
                                className="form-control"
                                placeholder="Any health conditions or special needs? (optional)"
                                value={formData.healthConditions}
                                onChange={handleChange}
                            />
                        </div>
                    </div>
                );

            case 3:
                return (
                    <div className="step-content">
                        <div className="step-header">
                            <span className="step-icon">📍</span>
                            <div>
                                <h2>Almost done!</h2>
                                <p>Location and final details</p>
                            </div>
                        </div>

                        <LocationPicker
                            value={petLocation}
                            onChange={setPetLocation}
                            showAddress={true}
                            required={true}
                            label="Pet Location"
                        />

                        <div className="form-group">
                            <label htmlFor="contactPreference">
                                How should adopters reach you?
                            </label>
                            <div className="contact-options">
                                {[
                                    {
                                        value: "both",
                                        label: "Email & Phone",
                                        icon: "📱",
                                    },
                                    {
                                        value: "email",
                                        label: "Email Only",
                                        icon: "📧",
                                    },
                                    {
                                        value: "phone",
                                        label: "Phone Only",
                                        icon: "📞",
                                    },
                                ].map((option) => (
                                    <label
                                        key={option.value}
                                        className={`contact-option ${formData.contactPreference === option.value ? "selected" : ""}`}
                                    >
                                        <input
                                            type="radio"
                                            name="contactPreference"
                                            value={option.value}
                                            checked={
                                                formData.contactPreference ===
                                                option.value
                                            }
                                            onChange={handleChange}
                                        />
                                        <span className="option-icon">
                                            {option.icon}
                                        </span>
                                        <span>{option.label}</span>
                                    </label>
                                ))}
                            </div>
                        </div>

                        <div className="fee-section">
                            <div className="fee-header">
                                <span>💚</span>
                                <div>
                                    <strong>Expense Recovery (Optional)</strong>
                                    <p>
                                        NearPaws encourages free adoptions. Only
                                        add a fee for genuine expenses (vet
                                        bills, emergency care, etc.)
                                    </p>
                                </div>
                            </div>
                            <div className="form-group">
                                <label htmlFor="adoptionFee">
                                    Recovery Amount (₹)
                                </label>
                                <input
                                    type="number"
                                    id="adoptionFee"
                                    name="adoptionFee"
                                    className="form-control"
                                    placeholder="0"
                                    min="0"
                                    value={formData.adoptionFee}
                                    onChange={handleChange}
                                />
                            </div>
                            {parseFloat(formData.adoptionFee) > 0 && (
                                <div className="form-group">
                                    <label htmlFor="adoptionFeeReason">
                                        Reason for fee *
                                    </label>
                                    <textarea
                                        id="adoptionFeeReason"
                                        name="adoptionFeeReason"
                                        className="form-control"
                                        placeholder="e.g., Vet visit for vaccinations - ₹500, Emergency treatment - ₹250"
                                        value={formData.adoptionFeeReason}
                                        onChange={handleChange}
                                        rows="2"
                                    />
                                </div>
                            )}
                        </div>

                        <div className="preview-card">
                            <h3>🎉 Ready to post!</h3>
                            <div className="preview-summary">
                                <span className="preview-species">
                                    {
                                        speciesOptions.find(
                                            (s) => s.value === formData.species,
                                        )?.icon
                                    }
                                </span>
                                <div>
                                    <strong>
                                        {formData.name || "Your pet"}
                                    </strong>
                                    <p>
                                        {formData.breed || "Unknown breed"} •{" "}
                                        {formData.ageValue} {formData.ageUnit}{" "}
                                        old
                                        {petLocation.city &&
                                            ` • ${petLocation.city}`}
                                    </p>
                                </div>
                            </div>
                        </div>
                    </div>
                );

            default:
                return null;
        }
    };

    return (
        <div className="post-pet-page">
            <div className="container">
                <div className="post-pet-container">
                    <div className="wizard-header">
                        <h1>🏠 Find a Home for Your Pet</h1>
                        <p>Complete these 3 simple steps</p>
                    </div>

                    <div className="progress-bar">
                        {steps.map((step, index) => (
                            <div
                                key={step.number}
                                className={`progress-step ${currentStep >= step.number ? "active" : ""} ${currentStep > step.number ? "completed" : ""}`}
                            >
                                <div className="step-circle">
                                    {currentStep > step.number
                                        ? "✓"
                                        : step.icon}
                                </div>
                                <span className="step-title">{step.title}</span>
                                {index < steps.length - 1 && (
                                    <div className="step-line" />
                                )}
                            </div>
                        ))}
                    </div>

                    {error && (
                        <div className="alert alert-error">
                            <span>⚠️</span> {error}
                        </div>
                    )}

                    <form
                        onSubmit={(e) => e.preventDefault()}
                        onKeyDown={handleFormKeyDown}
                        className="post-pet-form"
                    >
                        {renderStepContent()}

                        <div className="form-navigation">
                            {currentStep > 1 && (
                                <button
                                    type="button"
                                    className="btn btn-secondary"
                                    onClick={prevStep}
                                >
                                    ← Back
                                </button>
                            )}
                            {currentStep === 1 && (
                                <button
                                    type="button"
                                    className="btn btn-secondary"
                                    onClick={() => navigate(-1)}
                                >
                                    Cancel
                                </button>
                            )}

                            {currentStep < 3 ? (
                                <button
                                    type="button"
                                    className="btn btn-primary"
                                    onClick={nextStep}
                                    disabled={!isStepValid(currentStep)}
                                >
                                    Next Step →
                                </button>
                            ) : (
                                <button
                                    type="button"
                                    className="btn btn-primary btn-post"
                                    onClick={handleSubmit}
                                    disabled={
                                        loading || !isStepValid(currentStep)
                                    }
                                >
                                    {loading ? (
                                        <>Posting...</>
                                    ) : (
                                        <>🎉 Post Pet for Adoption</>
                                    )}
                                </button>
                            )}
                        </div>
                    </form>
                </div>
            </div>
        </div>
    );
};

export default PostPet;
