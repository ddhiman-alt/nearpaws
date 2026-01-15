import React, { useState, useEffect, useCallback, useRef } from "react";
import {
    MapContainer,
    TileLayer,
    Marker,
    useMapEvents,
    useMap,
} from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import "./LocationPicker.css";

// Fix for default marker icons in Leaflet with webpack
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
    iconRetinaUrl:
        "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon-2x.png",
    iconUrl:
        "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon.png",
    shadowUrl:
        "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png",
});

// Custom marker icon
const customIcon = new L.Icon({
    iconUrl:
        "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon.png",
    iconRetinaUrl:
        "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon-2x.png",
    shadowUrl:
        "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png",
    iconSize: [25, 41],
    iconAnchor: [12, 41],
    popupAnchor: [1, -34],
    shadowSize: [41, 41],
});

// Component to handle map clicks
const MapClickHandler = ({ onLocationSelect }) => {
    useMapEvents({
        click: (e) => {
            onLocationSelect(e.latlng.lat, e.latlng.lng);
        },
    });
    return null;
};

// Component to update map view (center and zoom)
const MapViewUpdater = ({ center, zoom }) => {
    const map = useMap();
    useEffect(() => {
        if (center && center[0] && center[1]) {
            map.setView(center, zoom || map.getZoom());
        }
    }, [center, zoom, map]);
    return null;
};

// Location Search component using Nominatim API
const LocationSearch = ({ onSelect }) => {
    const [query, setQuery] = useState("");
    const [suggestions, setSuggestions] = useState([]);
    const [isSearching, setIsSearching] = useState(false);
    const [showSuggestions, setShowSuggestions] = useState(false);
    const searchRef = useRef(null);
    const debounceRef = useRef(null);

    // Close suggestions when clicking outside
    useEffect(() => {
        const handleClickOutside = (e) => {
            if (searchRef.current && !searchRef.current.contains(e.target)) {
                setShowSuggestions(false);
            }
        };
        document.addEventListener("mousedown", handleClickOutside);
        return () =>
            document.removeEventListener("mousedown", handleClickOutside);
    }, []);

    // Search using Nominatim API
    const searchLocation = useCallback(async (searchQuery) => {
        if (!searchQuery || searchQuery.length < 3) {
            setSuggestions([]);
            return;
        }

        setIsSearching(true);
        try {
            const response = await fetch(
                `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(
                    searchQuery,
                )}&limit=5&addressdetails=1`,
                {
                    headers: {
                        "Accept-Language": "en",
                    },
                },
            );
            const data = await response.json();
            setSuggestions(data);
            setShowSuggestions(true);
        } catch (error) {
            console.error("Search error:", error);
            setSuggestions([]);
        } finally {
            setIsSearching(false);
        }
    }, []);

    // Debounced search
    const handleInputChange = (e) => {
        const value = e.target.value;
        setQuery(value);

        // Clear previous timeout
        if (debounceRef.current) {
            clearTimeout(debounceRef.current);
        }

        // Set new timeout for debounced search
        debounceRef.current = setTimeout(() => {
            searchLocation(value);
        }, 300);
    };

    // Handle suggestion selection
    const handleSelect = (suggestion) => {
        const lat = parseFloat(suggestion.lat);
        const lng = parseFloat(suggestion.lon);

        // Extract city and address from the result
        const address = suggestion.address || {};
        const cityName =
            address.city ||
            address.town ||
            address.village ||
            address.municipality ||
            "";
        const displayAddress = suggestion.display_name
            .split(",")
            .slice(0, 2)
            .join(",");

        onSelect({
            latitude: lat,
            longitude: lng,
            city: cityName,
            address: displayAddress,
            displayName: suggestion.display_name,
        });

        setQuery(suggestion.display_name.split(",").slice(0, 2).join(", "));
        setShowSuggestions(false);
        setSuggestions([]);
    };

    // Format suggestion display
    const formatSuggestion = (suggestion) => {
        const parts = suggestion.display_name.split(",");
        const main = parts.slice(0, 2).join(",");
        const secondary = parts.slice(2, 4).join(",");
        return { main, secondary };
    };

    return (
        <div className="location-search" ref={searchRef}>
            <div className="search-input-wrapper">
                <span className="search-icon">🔍</span>
                <input
                    type="text"
                    className="search-input"
                    placeholder="Search for a location..."
                    value={query}
                    onChange={handleInputChange}
                    onFocus={() =>
                        suggestions.length > 0 && setShowSuggestions(true)
                    }
                />
                {isSearching && <span className="search-spinner"></span>}
                {query && !isSearching && (
                    <button
                        type="button"
                        className="search-clear"
                        onClick={() => {
                            setQuery("");
                            setSuggestions([]);
                            setShowSuggestions(false);
                        }}
                    >
                        ×
                    </button>
                )}
            </div>

            {showSuggestions && suggestions.length > 0 && (
                <ul className="search-suggestions">
                    {suggestions.map((suggestion, index) => {
                        const { main, secondary } =
                            formatSuggestion(suggestion);
                        return (
                            <li
                                key={suggestion.place_id || index}
                                className="suggestion-item"
                                onClick={() => handleSelect(suggestion)}
                            >
                                <span className="suggestion-icon">📍</span>
                                <div className="suggestion-text">
                                    <span className="suggestion-main">
                                        {main}
                                    </span>
                                    {secondary && (
                                        <span className="suggestion-secondary">
                                            {secondary}
                                        </span>
                                    )}
                                </div>
                            </li>
                        );
                    })}
                </ul>
            )}

            {showSuggestions &&
                query.length >= 3 &&
                suggestions.length === 0 &&
                !isSearching && (
                    <div className="search-no-results">
                        No locations found. Try a different search term.
                    </div>
                )}
        </div>
    );
};

const LocationPicker = ({
    value,
    onChange,
    showAddress = true,
    required = false,
    label = "Location",
}) => {
    const [inputMode, setInputMode] = useState("auto"); // 'auto', 'manual', 'map'
    const [coordinates, setCoordinates] = useState({
        latitude: value?.latitude || "",
        longitude: value?.longitude || "",
    });
    const [address, setAddress] = useState(value?.address || "");
    const [city, setCity] = useState(value?.city || "");
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");
    const [mapKey, setMapKey] = useState(0); // For forcing map re-render
    const [hasInteracted, setHasInteracted] = useState(false); // Track if user has interacted

    // Update local state when value prop changes
    useEffect(() => {
        if (value) {
            setCoordinates({
                latitude: value.latitude || "",
                longitude: value.longitude || "",
            });
            setAddress(value.address || "");
            setCity(value.city || "");
        }
    }, [value]);

    // Notify parent of changes
    const notifyChange = useCallback(
        (lat, lng, addr, cty) => {
            if (lat && lng) {
                onChange({
                    latitude: parseFloat(lat),
                    longitude: parseFloat(lng),
                    address: addr || address,
                    city: cty || city,
                });
            }
        },
        [onChange, address, city],
    );

    // Get current location via browser API
    const getCurrentLocation = () => {
        setLoading(true);
        setError("");
        setHasInteracted(true);

        if (!navigator.geolocation) {
            setError("Geolocation is not supported by your browser");
            setLoading(false);
            return;
        }

        navigator.geolocation.getCurrentPosition(
            (position) => {
                const lat = position.coords.latitude;
                const lng = position.coords.longitude;
                setCoordinates({ latitude: lat, longitude: lng });
                notifyChange(lat, lng, address, city);
                setLoading(false);
                setMapKey((prev) => prev + 1); // Force map update
            },
            (err) => {
                setError(
                    "Unable to get your location. Please enter it manually or use the map.",
                );
                setLoading(false);
            },
            {
                enableHighAccuracy: true,
                timeout: 10000,
                maximumAge: 0,
            },
        );
    };

    // Handle manual coordinate input
    const handleCoordinateChange = (field, val) => {
        setHasInteracted(true);
        const newCoordinates = { ...coordinates, [field]: val };
        setCoordinates(newCoordinates);

        // Only notify if both values are valid numbers
        const lat = parseFloat(newCoordinates.latitude);
        const lng = parseFloat(newCoordinates.longitude);

        if (
            !isNaN(lat) &&
            !isNaN(lng) &&
            lat >= -90 &&
            lat <= 90 &&
            lng >= -180 &&
            lng <= 180
        ) {
            notifyChange(lat, lng, address, city);
            setError("");
        }
    };

    // Handle address/city change
    const handleAddressChange = (field, val) => {
        setHasInteracted(true);
        if (field === "address") {
            setAddress(val);
            onChange({
                latitude: parseFloat(coordinates.latitude) || null,
                longitude: parseFloat(coordinates.longitude) || null,
                address: val,
                city,
            });
        } else {
            setCity(val);
            onChange({
                latitude: parseFloat(coordinates.latitude) || null,
                longitude: parseFloat(coordinates.longitude) || null,
                address,
                city: val,
            });
        }
    };

    // Parse Google Maps URL or coordinates from paste
    const handlePasteCoordinates = (e) => {
        const pastedText = e.clipboardData?.getData("text") || "";

        // Try to parse Google Maps URL
        const urlMatch = pastedText.match(/@(-?\d+\.?\d*),(-?\d+\.?\d*)/);
        const queryMatch = pastedText.match(
            /[?&]q=(-?\d+\.?\d*),(-?\d+\.?\d*)/,
        );
        // OpenStreetMap URL format: https://www.openstreetmap.org/#map=15/40.7128/-74.0060
        const osmMatch = pastedText.match(
            /openstreetmap\.org\/#map=\d+\/(-?\d+\.?\d*)\/(-?\d+\.?\d*)/,
        );
        // Plain coordinates
        const plainMatch = pastedText.match(
            /^(-?\d+\.?\d*)[,\s]+(-?\d+\.?\d*)$/,
        );

        let lat, lng;

        if (urlMatch) {
            lat = parseFloat(urlMatch[1]);
            lng = parseFloat(urlMatch[2]);
        } else if (queryMatch) {
            lat = parseFloat(queryMatch[1]);
            lng = parseFloat(queryMatch[2]);
        } else if (osmMatch) {
            lat = parseFloat(osmMatch[1]);
            lng = parseFloat(osmMatch[2]);
        } else if (plainMatch) {
            lat = parseFloat(plainMatch[1]);
            lng = parseFloat(plainMatch[2]);
        }

        if (
            lat !== undefined &&
            lng !== undefined &&
            !isNaN(lat) &&
            !isNaN(lng) &&
            lat >= -90 &&
            lat <= 90 &&
            lng >= -180 &&
            lng <= 180
        ) {
            e.preventDefault();
            setHasInteracted(true);
            setCoordinates({ latitude: lat, longitude: lng });
            notifyChange(lat, lng, address, city);
            setError("");
            setMapKey((prev) => prev + 1);
        }
    };

    // Handle map click
    const handleMapClick = (lat, lng) => {
        setHasInteracted(true);
        setCoordinates({ latitude: lat, longitude: lng });
        notifyChange(lat, lng, address, city);
        setError("");
    };

    // Handle location search selection
    const [mapZoom, setMapZoom] = useState(13);

    const handleSearchSelect = (location) => {
        setHasInteracted(true);
        setCoordinates({
            latitude: location.latitude,
            longitude: location.longitude,
        });
        if (location.city) {
            setCity(location.city);
        }
        if (location.address) {
            setAddress(location.address);
        }
        notifyChange(
            location.latitude,
            location.longitude,
            location.address || address,
            location.city || city,
        );
        setMapZoom(16); // Zoom in when selecting from search
        setMapKey((prev) => prev + 1);
        setError("");
    };

    const hasValidCoordinates =
        coordinates.latitude &&
        coordinates.longitude &&
        !isNaN(parseFloat(coordinates.latitude)) &&
        !isNaN(parseFloat(coordinates.longitude));

    const mapCenter = hasValidCoordinates
        ? [parseFloat(coordinates.latitude), parseFloat(coordinates.longitude)]
        : [40.7128, -74.006]; // Default to NYC

    return (
        <div className="location-picker">
            <label className="location-picker-label">
                {label} {required && "*"}
            </label>

            {/* Input mode tabs */}
            <div className="location-mode-tabs">
                <button
                    type="button"
                    className={`mode-tab ${inputMode === "auto" ? "active" : ""}`}
                    onClick={() => setInputMode("auto")}
                >
                    <span className="tab-icon">📍</span>
                    Auto Detect
                </button>
                <button
                    type="button"
                    className={`mode-tab ${inputMode === "manual" ? "active" : ""}`}
                    onClick={() => setInputMode("manual")}
                >
                    <span className="tab-icon">✏️</span>
                    Enter Manually
                </button>
                <button
                    type="button"
                    className={`mode-tab ${inputMode === "map" ? "active" : ""}`}
                    onClick={() => setInputMode("map")}
                >
                    <span className="tab-icon">🗺️</span>
                    Pick on Map
                </button>
            </div>

            {error && <div className="location-error">{error}</div>}

            {/* Auto detect mode */}
            {inputMode === "auto" && (
                <div className="location-auto">
                    <button
                        type="button"
                        className="btn btn-detect"
                        onClick={getCurrentLocation}
                        disabled={loading}
                    >
                        {loading ? (
                            <>
                                <span className="spinner-small"></span>
                                Detecting...
                            </>
                        ) : (
                            <>
                                <span>📍</span>
                                {hasValidCoordinates
                                    ? "Update Location"
                                    : "Detect My Location"}
                            </>
                        )}
                    </button>

                    {hasValidCoordinates && (
                        <div className="detected-location">
                            <span className="success-icon">✓</span>
                            <span>
                                Location detected:{" "}
                                {parseFloat(coordinates.latitude).toFixed(6)},{" "}
                                {parseFloat(coordinates.longitude).toFixed(6)}
                            </span>
                        </div>
                    )}

                    <p className="location-hint">
                        Click the button to use your current location, or switch
                        to manual entry if auto-detection doesn't work.
                    </p>
                </div>
            )}

            {/* Manual entry mode */}
            {inputMode === "manual" && (
                <div className="location-manual">
                    <div className="coordinates-input">
                        <div className="coord-field">
                            <label>Latitude</label>
                            <input
                                type="text"
                                className="form-control"
                                placeholder="e.g., 40.7128"
                                value={coordinates.latitude}
                                onChange={(e) =>
                                    handleCoordinateChange(
                                        "latitude",
                                        e.target.value,
                                    )
                                }
                                onPaste={handlePasteCoordinates}
                            />
                        </div>
                        <div className="coord-field">
                            <label>Longitude</label>
                            <input
                                type="text"
                                className="form-control"
                                placeholder="e.g., -74.0060"
                                value={coordinates.longitude}
                                onChange={(e) =>
                                    handleCoordinateChange(
                                        "longitude",
                                        e.target.value,
                                    )
                                }
                                onPaste={handlePasteCoordinates}
                            />
                        </div>
                    </div>

                    <div className="location-tips">
                        <p>
                            <strong>💡 Tips:</strong>
                        </p>
                        <ul>
                            <li>
                                Paste a Google Maps or OpenStreetMap URL to
                                extract coordinates
                            </li>
                            <li>
                                Or paste coordinates in format:{" "}
                                <code>40.7128, -74.0060</code>
                            </li>
                            <li>
                                Find coordinates by right-clicking on Google
                                Maps or using the map picker tab
                            </li>
                        </ul>
                    </div>

                    <button
                        type="button"
                        className="btn btn-secondary btn-use-current"
                        onClick={getCurrentLocation}
                        disabled={loading}
                    >
                        {loading ? "Detecting..." : "📍 Use Current Location"}
                    </button>
                </div>
            )}

            {/* Map picker mode - Using OpenStreetMap */}
            {inputMode === "map" && (
                <div className="location-map">
                    {/* Search bar */}
                    <LocationSearch onSelect={handleSearchSelect} />

                    {/* Map */}
                    <MapContainer
                        key={mapKey}
                        center={mapCenter}
                        zoom={mapZoom}
                        style={{ height: "300px", width: "100%" }}
                        className="map-container"
                    >
                        <TileLayer
                            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                        />
                        <MapClickHandler onLocationSelect={handleMapClick} />
                        <MapViewUpdater center={mapCenter} zoom={mapZoom} />
                        {hasValidCoordinates && (
                            <Marker
                                position={[
                                    parseFloat(coordinates.latitude),
                                    parseFloat(coordinates.longitude),
                                ]}
                                icon={customIcon}
                            />
                        )}
                    </MapContainer>

                    <p className="map-hint">
                        🔍 Search for a place above, or click on the map to set
                        location
                    </p>

                    {hasValidCoordinates && (
                        <div className="selected-location">
                            <span>📍</span>
                            Selected:{" "}
                            {parseFloat(coordinates.latitude).toFixed(6)},{" "}
                            {parseFloat(coordinates.longitude).toFixed(6)}
                            {city && (
                                <span className="selected-city"> • {city}</span>
                            )}
                        </div>
                    )}
                </div>
            )}

            {/* Address fields (optional) */}
            {showAddress && (
                <div className="address-fields">
                    <div className="address-row">
                        <div className="form-group">
                            <label>City {required && "*"}</label>
                            <input
                                type="text"
                                className="form-control"
                                placeholder="Enter city name"
                                value={city}
                                onChange={(e) =>
                                    handleAddressChange("city", e.target.value)
                                }
                            />
                        </div>
                        <div className="form-group">
                            <label>Address/Area (Optional)</label>
                            <input
                                type="text"
                                className="form-control"
                                placeholder="Neighborhood or area"
                                value={address}
                                onChange={(e) =>
                                    handleAddressChange(
                                        "address",
                                        e.target.value,
                                    )
                                }
                            />
                        </div>
                    </div>
                </div>
            )}

            {/* Validation indicator - only show after user interaction or if valid */}
            {required && (hasValidCoordinates || hasInteracted) && (
                <div
                    className={`validation-indicator ${hasValidCoordinates ? "valid" : "invalid"}`}
                >
                    {hasValidCoordinates ? (
                        <>
                            <span>✓</span> Location coordinates set
                        </>
                    ) : (
                        <>
                            <span>!</span> Please set your location coordinates
                        </>
                    )}
                </div>
            )}
        </div>
    );
};

export default LocationPicker;
