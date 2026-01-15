import React, { useEffect, useState, useMemo } from "react";
import { MapContainer, TileLayer, Marker, Popup, useMap } from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import "./LocationMap.css";

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

// Custom pet marker icon (red)
const petIcon = new L.Icon({
    iconUrl:
        "data:image/svg+xml;charset=UTF-8," +
        encodeURIComponent(`
    <svg xmlns="http://www.w3.org/2000/svg" width="32" height="42" viewBox="0 0 32 42">
      <path d="M16 0C7.163 0 0 7.163 0 16c0 12 16 26 16 26s16-14 16-26c0-8.837-7.163-16-16-16z" fill="#ef4444"/>
      <circle cx="16" cy="16" r="8" fill="white"/>
      <text x="16" y="20" text-anchor="middle" fill="#ef4444" font-size="12" font-weight="bold">🐾</text>
    </svg>
  `),
    iconSize: [32, 42],
    iconAnchor: [16, 42],
    popupAnchor: [0, -42],
});

// Custom user marker icon (blue)
const userIcon = new L.Icon({
    iconUrl:
        "data:image/svg+xml;charset=UTF-8," +
        encodeURIComponent(`
    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24">
      <circle cx="12" cy="12" r="10" fill="#3b82f6" stroke="white" stroke-width="3"/>
      <circle cx="12" cy="12" r="4" fill="white"/>
    </svg>
  `),
    iconSize: [24, 24],
    iconAnchor: [12, 12],
    popupAnchor: [0, -12],
});

// Haversine formula to calculate distance between two points
const calculateDistance = (lat1, lon1, lat2, lon2) => {
    const R = 6371; // Earth's radius in kilometers
    const dLat = ((lat2 - lat1) * Math.PI) / 180;
    const dLon = ((lon2 - lon1) * Math.PI) / 180;
    const a =
        Math.sin(dLat / 2) * Math.sin(dLat / 2) +
        Math.cos((lat1 * Math.PI) / 180) *
            Math.cos((lat2 * Math.PI) / 180) *
            Math.sin(dLon / 2) *
            Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
};

// Component to fit bounds showing both markers
const FitBounds = ({ petCoords, userCoords }) => {
    const map = useMap();

    useEffect(() => {
        if (petCoords && userCoords) {
            const bounds = L.latLngBounds([petCoords, userCoords]);
            map.fitBounds(bounds, { padding: [50, 50], maxZoom: 15 });
        } else if (petCoords) {
            map.setView(petCoords, 14);
        }
    }, [map, petCoords, userCoords]);

    return null;
};

const LocationMap = ({
    petLocation,
    userLocation,
    petName = "Pet",
    showDirections = true,
}) => {
    const [distance, setDistance] = useState(null);
    const [copied, setCopied] = useState(false);

    // Calculate distance between pet and user
    useEffect(() => {
        if (
            petLocation?.coordinates &&
            userLocation?.latitude &&
            userLocation?.longitude
        ) {
            // MongoDB stores coordinates as [longitude, latitude]
            const petLng = petLocation.coordinates[0];
            const petLat = petLocation.coordinates[1];

            const dist = calculateDistance(
                userLocation.latitude,
                userLocation.longitude,
                petLat,
                petLng,
            );
            setDistance(dist);
        }
    }, [petLocation, userLocation]);

    // Memoize coordinates
    const petCoords = useMemo(() => {
        if (!petLocation?.coordinates) return null;
        return [petLocation.coordinates[1], petLocation.coordinates[0]]; // [lat, lng]
    }, [petLocation]);

    const userCoords = useMemo(() => {
        if (!userLocation?.latitude || !userLocation?.longitude) return null;
        return [userLocation.latitude, userLocation.longitude];
    }, [userLocation]);

    // No coordinates available
    if (!petLocation?.coordinates) {
        return (
            <div className="location-map-container">
                <div className="map-placeholder">
                    <span className="placeholder-icon">📍</span>
                    <p>Location not available</p>
                </div>
            </div>
        );
    }

    const petLng = petLocation.coordinates[0];
    const petLat = petLocation.coordinates[1];

    // Format distance display
    const formatDistance = (dist) => {
        if (dist < 1) {
            return `${Math.round(dist * 1000)} m`;
        }
        return `${dist.toFixed(1)} km`;
    };

    // OpenStreetMap directions URL (using OSRM)
    const directionsUrl =
        userLocation?.latitude && userLocation?.longitude
            ? `https://www.openstreetmap.org/directions?engine=osrm_car&route=${userLocation.latitude},${userLocation.longitude};${petLat},${petLng}`
            : `https://www.openstreetmap.org/?mlat=${petLat}&mlon=${petLng}#map=15/${petLat}/${petLng}`;

    // Google Maps directions URL (as backup option)
    const googleDirectionsUrl =
        userLocation?.latitude && userLocation?.longitude
            ? `https://www.google.com/maps/dir/?api=1&origin=${userLocation.latitude},${userLocation.longitude}&destination=${petLat},${petLng}`
            : `https://www.google.com/maps/search/?api=1&query=${petLat},${petLng}`;

    const handleCopyCoordinates = () => {
        navigator.clipboard.writeText(`${petLat}, ${petLng}`);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };

    return (
        <div className="location-map-container">
            {/* Distance badge */}
            {distance !== null && (
                <div className="distance-badge">
                    <span className="distance-icon">📍</span>
                    <span className="distance-value">
                        {formatDistance(distance)}
                    </span>
                    <span className="distance-label">away from you</span>
                </div>
            )}

            {/* Interactive OpenStreetMap */}
            <MapContainer
                center={petCoords}
                zoom={14}
                style={{ height: "300px", width: "100%" }}
                className="map-interactive"
            >
                <TileLayer
                    attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                    url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                />
                <FitBounds petCoords={petCoords} userCoords={userCoords} />

                {/* Pet marker */}
                <Marker position={petCoords} icon={petIcon}>
                    <Popup>
                        <strong>🐾 {petName}'s Location</strong>
                        {petLocation.city && (
                            <>
                                <br />
                                {petLocation.city}
                            </>
                        )}
                        {petLocation.address && (
                            <>
                                <br />
                                {petLocation.address}
                            </>
                        )}
                    </Popup>
                </Marker>

                {/* User marker */}
                {userCoords && (
                    <Marker position={userCoords} icon={userIcon}>
                        <Popup>
                            <strong>📍 Your Location</strong>
                        </Popup>
                    </Marker>
                )}
            </MapContainer>

            {/* Action buttons */}
            {showDirections && (
                <div className="map-actions">
                    <a
                        href={directionsUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="btn btn-directions"
                    >
                        <span>🗺️</span>
                        {userLocation?.latitude
                            ? "Get Directions"
                            : "View on Map"}
                    </a>
                    <a
                        href={googleDirectionsUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="btn btn-google"
                        title="Open in Google Maps"
                    >
                        <span>🌐</span>
                        Google Maps
                    </a>
                    <button
                        className="btn btn-copy"
                        onClick={handleCopyCoordinates}
                        title="Copy coordinates"
                    >
                        <span>{copied ? "✓" : "📋"}</span>
                        {copied ? "Copied!" : "Copy"}
                    </button>
                </div>
            )}

            {/* Legend */}
            {userLocation?.latitude && (
                <div className="map-legend">
                    <div className="legend-item">
                        <span className="legend-marker pet"></span>
                        <span>Pet's Location</span>
                    </div>
                    <div className="legend-item">
                        <span className="legend-marker user"></span>
                        <span>Your Location</span>
                    </div>
                </div>
            )}
        </div>
    );
};

export default LocationMap;
