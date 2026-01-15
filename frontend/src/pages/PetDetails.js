import React, { useState, useEffect } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import { petsAPI, adoptionAPI } from "../services/api";
import { useAuth } from "../context/AuthContext";
import { useLocation } from "../context/LocationContext";
import LocationMap from "../components/LocationMap";
import "./PetDetails.css";

const PetDetails = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const { user, isAuthenticated } = useAuth();
    const { location: userLocation } = useLocation();

    const [pet, setPet] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [activeImage, setActiveImage] = useState(0);
    const [showModal, setShowModal] = useState(false);
    const [requestMessage, setRequestMessage] = useState("");
    const [requestLoading, setRequestLoading] = useState(false);
    const [requestSuccess, setRequestSuccess] = useState(false);

    // Existing adoption request state
    const [existingRequest, setExistingRequest] = useState(null);
    const [withdrawLoading, setWithdrawLoading] = useState(false);

    useEffect(() => {
        const fetchPet = async () => {
            try {
                setLoading(true);
                const response = await petsAPI.getById(id);
                setPet(response.data.data);
            } catch (err) {
                console.error("Error fetching pet:", err);
                setError("Failed to load pet details.");
            } finally {
                setLoading(false);
            }
        };

        fetchPet();
    }, [id]);

    // Check if user has already sent a request for this pet
    useEffect(() => {
        const checkExistingRequest = async () => {
            if (!isAuthenticated || !id) return;

            try {
                const response = await adoptionAPI.getSent();
                const requests = response.data.data;
                const existing = requests.find(
                    (req) => req.pet?._id === id || req.pet === id,
                );
                setExistingRequest(existing || null);
            } catch (err) {
                console.error("Error checking existing request:", err);
            }
        };

        checkExistingRequest();
    }, [isAuthenticated, id]);

    const handleAdoptionRequest = async () => {
        if (!requestMessage.trim()) {
            return;
        }

        setRequestLoading(true);
        try {
            const response = await adoptionAPI.createRequest({
                petId: pet._id,
                message: requestMessage,
            });
            setRequestSuccess(true);
            // Set the new request as existing request
            setExistingRequest(response.data.data);
            setTimeout(() => {
                setShowModal(false);
                setRequestMessage("");
                setRequestSuccess(false);
            }, 2000);
        } catch (err) {
            console.error("Error sending request:", err);
            alert(err.response?.data?.message || "Failed to send request");
        } finally {
            setRequestLoading(false);
        }
    };

    const handleWithdrawRequest = async () => {
        if (!existingRequest) return;

        if (
            !window.confirm(
                "Are you sure you want to withdraw your adoption request?",
            )
        ) {
            return;
        }

        setWithdrawLoading(true);
        try {
            await adoptionAPI.withdraw(existingRequest._id);
            setExistingRequest(null);
        } catch (err) {
            console.error("Error withdrawing request:", err);
            alert(err.response?.data?.message || "Failed to withdraw request");
        } finally {
            setWithdrawLoading(false);
        }
    };

    const getRequestStatusBadge = (status) => {
        switch (status) {
            case "pending":
                return { class: "badge-warning", text: "Pending", icon: "⏳" };
            case "accepted":
                return { class: "badge-success", text: "Accepted", icon: "✓" };
            case "rejected":
                return { class: "badge-danger", text: "Rejected", icon: "✗" };
            default:
                return { class: "", text: status, icon: "" };
        }
    };

    const getStatusColor = (status) => {
        switch (status) {
            case "available":
                return "badge-success";
            case "pending":
                return "badge-warning";
            case "adopted":
                return "badge-primary";
            default:
                return "";
        }
    };

    const formatAge = (age) => {
        if (!age) return "Unknown";
        return `${age.value} ${age.unit}`;
    };

    const getSpeciesEmoji = (species) => {
        const emojis = {
            dog: "🐕",
            cat: "🐱",
            bird: "🐦",
            rabbit: "🐰",
            hamster: "🐹",
            fish: "🐟",
            turtle: "🐢",
            other: "🐾",
        };
        return emojis[species] || "🐾";
    };

    if (loading) {
        return (
            <div className="loading-container">
                <div className="spinner"></div>
            </div>
        );
    }

    if (error || !pet) {
        return (
            <div className="container">
                <div className="error-container">
                    <h2>Pet not found</h2>
                    <p>{error}</p>
                    <Link to="/" className="btn btn-primary">
                        Back to Home
                    </Link>
                </div>
            </div>
        );
    }

    const imageUrl = (imgPath) => {
        return `${process.env.REACT_APP_API_URL?.replace("/api", "") || "http://localhost:5000"}${imgPath}`;
    };

    // Check if current user is the pet owner
    // Ensure all IDs are compared as strings
    const getOwnerId = () => {
        if (!pet.owner) return null;
        if (typeof pet.owner === "string") return pet.owner;
        const id = pet.owner._id || pet.owner.id;
        return id ? String(id) : null;
    };
    const getUserId = () => {
        if (!user) return null;
        const id = user.id || user._id;
        return id ? String(id) : null;
    };
    const ownerId = getOwnerId();
    const userId = getUserId();
    const isOwner = !!(userId && ownerId && userId === ownerId);

    return (
        <div className="pet-details-page">
            <div className="container">
                <button className="back-button" onClick={() => navigate(-1)}>
                    ← Back
                </button>

                <div className="pet-details-container">
                    <div className="pet-gallery">
                        <div className="main-image">
                            {pet.images && pet.images.length > 0 ? (
                                <img
                                    src={imageUrl(pet.images[activeImage])}
                                    alt={pet.name}
                                    onError={(e) => {
                                        e.target.onerror = null;
                                        e.target.style.display = "none";
                                        e.target.parentElement.classList.add(
                                            "show-fallback",
                                        );
                                    }}
                                />
                            ) : null}
                            <div
                                className={`no-image ${pet.images && pet.images.length > 0 ? "fallback" : ""}`}
                            >
                                <span>{getSpeciesEmoji(pet.species)}</span>
                                <p>No image available</p>
                            </div>
                        </div>
                        {pet.images && pet.images.length > 1 && (
                            <div className="thumbnail-list">
                                {pet.images.map((img, index) => (
                                    <button
                                        key={index}
                                        className={`thumbnail ${index === activeImage ? "active" : ""}`}
                                        onClick={() => setActiveImage(index)}
                                    >
                                        <img
                                            src={imageUrl(img)}
                                            alt={`${pet.name} ${index + 1}`}
                                            onError={(e) => {
                                                e.target.onerror = null;
                                                e.target.style.display = "none";
                                            }}
                                        />
                                    </button>
                                ))}
                            </div>
                        )}
                    </div>

                    <div className="pet-info">
                        <div className="pet-header">
                            <h1>
                                {getSpeciesEmoji(pet.species)} {pet.name}
                            </h1>
                            <span
                                className={`badge ${getStatusColor(pet.status)}`}
                            >
                                {pet.status}
                            </span>
                        </div>

                        <p className="pet-breed">
                            {pet.breed || "Mixed/Unknown"}
                        </p>

                        <div className="pet-meta">
                            <div className="meta-item">
                                <span className="meta-label">Age</span>
                                <span className="meta-value">
                                    {formatAge(pet.age)}
                                </span>
                            </div>
                            <div className="meta-item">
                                <span className="meta-label">Gender</span>
                                <span className="meta-value capitalize">
                                    {pet.gender}
                                </span>
                            </div>
                            <div className="meta-item">
                                <span className="meta-label">Size</span>
                                <span className="meta-value capitalize">
                                    {pet.size}
                                </span>
                            </div>
                            {pet.color && (
                                <div className="meta-item">
                                    <span className="meta-label">Color</span>
                                    <span className="meta-value">
                                        {pet.color}
                                    </span>
                                </div>
                            )}
                        </div>

                        <div className="pet-section">
                            <h3>About {pet.name}</h3>
                            <p>{pet.description}</p>
                        </div>

                        <div className="pet-section">
                            <h3>Health Information</h3>
                            <div className="health-tags">
                                <span
                                    className={`health-tag ${pet.healthInfo?.vaccinated ? "positive" : "negative"}`}
                                >
                                    {pet.healthInfo?.vaccinated ? "✓" : "✗"}{" "}
                                    Vaccinated
                                </span>
                                <span
                                    className={`health-tag ${pet.healthInfo?.neutered ? "positive" : "negative"}`}
                                >
                                    {pet.healthInfo?.neutered ? "✓" : "✗"}{" "}
                                    Spayed/Neutered
                                </span>
                            </div>
                            {pet.healthInfo?.healthConditions && (
                                <p className="health-notes">
                                    <strong>Notes:</strong>{" "}
                                    {pet.healthInfo.healthConditions}
                                </p>
                            )}
                        </div>

                        <div className="pet-section">
                            <h3>Location</h3>
                            <p className="location-text">
                                📍{" "}
                                {pet.location?.city || "Location not specified"}
                                {pet.location?.address &&
                                    `, ${pet.location.address}`}
                            </p>

                            {/* Interactive Map */}
                            {pet.location?.coordinates && (
                                <LocationMap
                                    petLocation={pet.location}
                                    userLocation={userLocation}
                                    petName={pet.name}
                                    showDirections={true}
                                />
                            )}
                        </div>

                        {pet.adoptionFee > 0 && (
                            <div className="adoption-fee-section">
                                <div className="adoption-fee-header">
                                    <span className="fee-label">
                                        Expense Recovery:
                                    </span>
                                    <strong className="fee-amount">
                                        ₹{pet.adoptionFee}
                                    </strong>
                                </div>
                                {pet.adoptionFeeReason && (
                                    <div className="adoption-fee-reason">
                                        <span className="reason-label">
                                            📋 Reason:
                                        </span>
                                        <p>{pet.adoptionFeeReason}</p>
                                    </div>
                                )}
                                <div className="adoption-fee-note">
                                    <span>💚</span>
                                    <small>
                                        This fee covers the caretaker's expenses
                                        in helping this animal.
                                    </small>
                                </div>
                            </div>
                        )}

                        <div className="pet-actions">
                            {isOwner ? (
                                <Link
                                    to={`/my-pets`}
                                    className="btn btn-primary"
                                >
                                    Manage Listing
                                </Link>
                            ) : existingRequest ? (
                                // User has already sent a request
                                <div className="existing-request-status">
                                    <div className="request-status-card">
                                        <div className="request-status-header">
                                            <span className="request-status-icon">
                                                {
                                                    getRequestStatusBadge(
                                                        existingRequest.status,
                                                    ).icon
                                                }
                                            </span>
                                            <span>Your Adoption Request</span>
                                        </div>
                                        <div className="request-status-body">
                                            <span
                                                className={`badge ${getRequestStatusBadge(existingRequest.status).class}`}
                                            >
                                                {
                                                    getRequestStatusBadge(
                                                        existingRequest.status,
                                                    ).text
                                                }
                                            </span>
                                            <p className="request-date">
                                                Sent on{" "}
                                                {new Date(
                                                    existingRequest.createdAt,
                                                ).toLocaleDateString()}
                                            </p>
                                            {existingRequest.message && (
                                                <p className="request-message-preview">
                                                    "
                                                    {existingRequest.message.substring(
                                                        0,
                                                        100,
                                                    )}
                                                    {existingRequest.message
                                                        .length > 100
                                                        ? "..."
                                                        : ""}
                                                    "
                                                </p>
                                            )}
                                        </div>
                                        {existingRequest.status ===
                                            "pending" && (
                                            <button
                                                className="btn btn-secondary btn-small"
                                                onClick={handleWithdrawRequest}
                                                disabled={withdrawLoading}
                                            >
                                                {withdrawLoading
                                                    ? "Withdrawing..."
                                                    : "Withdraw Request"}
                                            </button>
                                        )}
                                        {existingRequest.status ===
                                            "accepted" && (
                                            <div className="request-accepted-info">
                                                <p>
                                                    🎉 Great news! The owner has
                                                    accepted your request.
                                                </p>
                                                <p>
                                                    Contact them to arrange the
                                                    adoption.
                                                </p>
                                            </div>
                                        )}
                                        {existingRequest.status ===
                                            "rejected" && (
                                            <div className="request-rejected-info">
                                                <p>
                                                    The owner has declined your
                                                    request.
                                                </p>
                                                <Link
                                                    to="/browse"
                                                    className="btn btn-primary btn-small"
                                                >
                                                    Browse Other Pets
                                                </Link>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            ) : pet.status === "available" ? (
                                isAuthenticated ? (
                                    <button
                                        className="btn btn-primary btn-large"
                                        onClick={() => setShowModal(true)}
                                    >
                                        🐾 Request to Adopt
                                    </button>
                                ) : (
                                    <Link
                                        to="/login"
                                        className="btn btn-primary btn-large"
                                    >
                                        Login to Request Adoption
                                    </Link>
                                )
                            ) : (
                                <button
                                    className="btn btn-secondary btn-large"
                                    disabled
                                >
                                    {pet.status === "pending"
                                        ? "Adoption Pending"
                                        : "Already Adopted"}
                                </button>
                            )}
                        </div>

                        {pet.owner && (
                            <div className="owner-info">
                                <h3>Posted by</h3>
                                <div className="owner-card">
                                    <div className="owner-avatar">
                                        {pet.owner.name
                                            ?.charAt(0)
                                            .toUpperCase()}
                                    </div>
                                    <div className="owner-details">
                                        <p className="owner-name">
                                            {pet.owner.name}
                                        </p>
                                        {isAuthenticated &&
                                            pet.contactPreference !==
                                                "phone" && (
                                                <p className="owner-contact">
                                                    📧 {pet.owner.email}
                                                </p>
                                            )}
                                        {isAuthenticated &&
                                            pet.owner.phone &&
                                            pet.contactPreference !==
                                                "email" && (
                                                <p className="owner-contact">
                                                    📱 {pet.owner.phone}
                                                </p>
                                            )}
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {/* Adoption Request Modal */}
            {showModal && (
                <div
                    className="modal-overlay"
                    onClick={() => !requestLoading && setShowModal(false)}
                >
                    <div className="modal" onClick={(e) => e.stopPropagation()}>
                        {requestSuccess ? (
                            <div className="modal-success">
                                <div className="success-icon">✓</div>
                                <h3>Request Sent!</h3>
                                <p>
                                    The owner will be notified of your interest.
                                </p>
                            </div>
                        ) : (
                            <>
                                <div className="modal-header">
                                    <h2>Request to Adopt {pet.name}</h2>
                                    <button
                                        className="modal-close"
                                        onClick={() => setShowModal(false)}
                                        disabled={requestLoading}
                                    >
                                        ×
                                    </button>
                                </div>
                                <div className="modal-body">
                                    <p>
                                        Send a message to the owner explaining
                                        why you'd like to adopt {pet.name}.
                                    </p>
                                    <textarea
                                        className="form-control"
                                        placeholder="Hi! I'm interested in adopting this pet because..."
                                        value={requestMessage}
                                        onChange={(e) =>
                                            setRequestMessage(e.target.value)
                                        }
                                        rows="5"
                                        maxLength="500"
                                    />
                                    <p className="char-count">
                                        {requestMessage.length}/500 characters
                                    </p>
                                </div>
                                <div className="modal-footer">
                                    <button
                                        className="btn btn-secondary"
                                        onClick={() => setShowModal(false)}
                                        disabled={requestLoading}
                                    >
                                        Cancel
                                    </button>
                                    <button
                                        className="btn btn-primary"
                                        onClick={handleAdoptionRequest}
                                        disabled={
                                            requestLoading ||
                                            !requestMessage.trim()
                                        }
                                    >
                                        {requestLoading
                                            ? "Sending..."
                                            : "Send Request"}
                                    </button>
                                </div>
                            </>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
};

export default PetDetails;
