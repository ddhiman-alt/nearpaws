import React, { useState } from "react";
import { useLocation } from "../context/LocationContext";
import "./LocationFilter.css";

const LocationFilter = () => {
    const {
        location,
        searchRadius,
        updateSearchRadius,
        getCurrentLocation,
        parseAndSetLocation,
        loading,
        error,
        locationSource,
        hasValidCoordinates,
    } = useLocation();

    const [showManualInput, setShowManualInput] = useState(false);
    const [manualInput, setManualInput] = useState("");
    const [inputError, setInputError] = useState("");

    const radiusOptions = [5, 10, 25, 50, 100, 200];

    const handleManualSubmit = (e) => {
        e.preventDefault();
        setInputError("");

        if (!manualInput.trim()) {
            setInputError("Please enter coordinates or a Google Maps URL");
            return;
        }

        const success = parseAndSetLocation(manualInput);
        if (success) {
            setShowManualInput(false);
            setManualInput("");
        } else {
            setInputError(
                'Invalid format. Use "latitude, longitude" or paste a Google Maps URL',
            );
        }
    };

    const getLocationStatusText = () => {
        if (loading) return "Getting location...";
        if (!hasValidCoordinates) return "Location not set";

        if (location.isDefault) return "Using default location (New York)";

        switch (locationSource) {
            case "auto":
                return "Using your detected location";
            case "manual":
                return "Using your entered location";
            default:
                return "Location set";
        }
    };

    const getLocationStatusClass = () => {
        if (loading) return "status-loading";
        if (!hasValidCoordinates) return "status-none";
        if (location.isDefault) return "status-default";
        return "status-active";
    };

    return (
        <div className="location-filter">
            <div className="location-info">
                <span className="location-icon">📍</span>
                <span className={`location-text ${getLocationStatusClass()}`}>
                    {getLocationStatusText()}
                </span>
                <div className="location-actions">
                    <button
                        className="location-btn refresh-location"
                        onClick={getCurrentLocation}
                        disabled={loading}
                        title="Detect my location"
                    >
                        {loading ? "⏳" : "🔄"}
                    </button>
                    <button
                        className="location-btn edit-location"
                        onClick={() => setShowManualInput(!showManualInput)}
                        title="Enter location manually"
                    >
                        ✏️
                    </button>
                </div>
            </div>

            {/* Display current coordinates if available */}
            {hasValidCoordinates && !location.isDefault && (
                <div className="current-coords">
                    <small>
                        {location.latitude.toFixed(4)},{" "}
                        {location.longitude.toFixed(4)}
                        {location.city && ` • ${location.city}`}
                    </small>
                </div>
            )}

            {/* Manual input form */}
            {showManualInput && (
                <form
                    className="manual-location-form"
                    onSubmit={handleManualSubmit}
                >
                    <div className="manual-input-group">
                        <input
                            type="text"
                            className="manual-input"
                            placeholder="Enter coordinates (e.g., 40.7128, -74.0060) or paste Google Maps URL"
                            value={manualInput}
                            onChange={(e) => {
                                setManualInput(e.target.value);
                                setInputError("");
                            }}
                        />
                        <button type="submit" className="btn-set-location">
                            Set
                        </button>
                    </div>
                    {inputError && (
                        <div className="input-error">{inputError}</div>
                    )}
                    <div className="manual-input-tips">
                        <small>
                            💡 Tip: Right-click on Google Maps to copy
                            coordinates, or paste the full URL
                        </small>
                    </div>
                </form>
            )}

            {error && !showManualInput && (
                <div className="location-error">
                    {error}
                    <button
                        className="error-action"
                        onClick={() => setShowManualInput(true)}
                    >
                        Enter manually →
                    </button>
                </div>
            )}

            <div className="radius-selector">
                <label>Search within:</label>
                <div className="radius-buttons">
                    {radiusOptions.map((radius) => (
                        <button
                            key={radius}
                            className={`radius-btn ${searchRadius === radius ? "active" : ""}`}
                            onClick={() => updateSearchRadius(radius)}
                        >
                            {radius} km
                        </button>
                    ))}
                </div>
            </div>
        </div>
    );
};

export default LocationFilter;
