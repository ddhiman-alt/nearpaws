import React from "react";
import { Link } from "react-router-dom";
import "./PetCard.css";

const PetCard = ({ pet, viewMode = "grid" }) => {
    const getStatusBadge = (status) => {
        switch (status) {
            case "available":
                return <span className="badge badge-success">Available</span>;
            case "pending":
                return <span className="badge badge-warning">Pending</span>;
            case "adopted":
                return <span className="badge badge-primary">Adopted</span>;
            default:
                return null;
        }
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

    const formatAge = (age) => {
        if (!age) return "Unknown";
        return `${age.value} ${age.unit}`;
    };

    const imageUrl =
        pet.images && pet.images.length > 0
            ? `${process.env.REACT_APP_API_URL?.replace("/api", "") || "http://localhost:5000"}${pet.images[0]}`
            : null;

    // List view layout
    if (viewMode === "list") {
        return (
            <Link to={`/pets/${pet._id}`} className="pet-card-list">
                <div className="pet-card-list-image">
                    {imageUrl ? (
                        <img
                            src={imageUrl}
                            alt={pet.name}
                            onError={(e) => {
                                e.target.onerror = null;
                                e.target.style.display = "none";
                                e.target.parentElement.classList.add(
                                    "no-image",
                                );
                            }}
                        />
                    ) : (
                        <div className="placeholder-image">
                            <span className="placeholder-emoji">
                                {getSpeciesEmoji(pet.species)}
                            </span>
                        </div>
                    )}
                </div>
                <div className="pet-card-list-content">
                    <div className="pet-card-list-header">
                        <h3 className="pet-card-name">
                            {getSpeciesEmoji(pet.species)} {pet.name}
                        </h3>
                        {getStatusBadge(pet.status)}
                    </div>
                    <p className="pet-card-breed">
                        {pet.breed || "Mixed/Unknown"}
                    </p>
                    <div className="pet-card-list-meta">
                        <span>{formatAge(pet.age)}</span>
                        <span className="separator">•</span>
                        <span className="capitalize">{pet.gender}</span>
                        <span className="separator">•</span>
                        <span className="capitalize">{pet.size}</span>
                        <span className="separator">•</span>
                        <span>📍 {pet.location?.city || "Unknown"}</span>
                        {pet.distanceInKm !== undefined && (
                            <>
                                <span className="separator">•</span>
                                <span className="pet-card-distance">
                                    {pet.distanceInKm} km away
                                </span>
                            </>
                        )}
                    </div>
                    {pet.description && (
                        <p className="pet-card-list-description">
                            {pet.description.length > 150
                                ? `${pet.description.substring(0, 150)}...`
                                : pet.description}
                        </p>
                    )}
                    <div className="pet-card-list-footer">
                        {pet.adoptionFee > 0 && (
                            <span className="pet-card-fee">
                                ₹{pet.adoptionFee}
                            </span>
                        )}
                        <span className="view-details">View Details →</span>
                    </div>
                </div>
            </Link>
        );
    }

    // Grid view layout (default)
    return (
        <Link to={`/pets/${pet._id}`} className="pet-card">
            <div className="pet-card-image">
                {imageUrl ? (
                    <img
                        src={imageUrl}
                        alt={pet.name}
                        onError={(e) => {
                            e.target.onerror = null; // Prevent infinite loop
                            e.target.style.display = "none";
                            e.target.parentElement.classList.add("no-image");
                        }}
                    />
                ) : (
                    <div className="placeholder-image">
                        <span className="placeholder-emoji">
                            {getSpeciesEmoji(pet.species)}
                        </span>
                    </div>
                )}
                <div className="pet-card-status">
                    {getStatusBadge(pet.status)}
                </div>
            </div>
            <div className="pet-card-content">
                <div className="pet-card-header">
                    <h3 className="pet-card-name">
                        {getSpeciesEmoji(pet.species)} {pet.name}
                    </h3>
                    {pet.distanceInKm !== undefined && (
                        <span className="pet-card-distance">
                            📍 {pet.distanceInKm} km
                        </span>
                    )}
                </div>
                <p className="pet-card-breed">{pet.breed || "Mixed/Unknown"}</p>
                <div className="pet-card-details">
                    <span>{formatAge(pet.age)}</span>
                    <span className="separator">•</span>
                    <span className="capitalize">{pet.gender}</span>
                    <span className="separator">•</span>
                    <span className="capitalize">{pet.size}</span>
                </div>
                <div className="pet-card-location">
                    📍 {pet.location?.city || "Location not specified"}
                </div>
                {pet.adoptionFee > 0 && (
                    <div className="pet-card-fee">
                        Adoption Fee: ₹{pet.adoptionFee}
                    </div>
                )}
            </div>
        </Link>
    );
};

export default PetCard;
