import React, {
    createContext,
    useContext,
    useState,
    useEffect,
    useCallback,
} from "react";

const LocationContext = createContext(null);

// Haversine formula to calculate distance between two points
export const calculateDistance = (lat1, lon1, lat2, lon2) => {
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

// Format distance for display
export const formatDistance = (distanceKm) => {
    if (distanceKm === null || distanceKm === undefined) return null;
    if (distanceKm < 1) {
        return `${Math.round(distanceKm * 1000)} m`;
    }
    if (distanceKm < 10) {
        return `${distanceKm.toFixed(1)} km`;
    }
    return `${Math.round(distanceKm)} km`;
};

export const LocationProvider = ({ children }) => {
    const [location, setLocation] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [searchRadius, setSearchRadius] = useState(null); // null = any distance (no limit)
    const [locationSource, setLocationSource] = useState(null); // 'auto', 'manual', 'default'

    // Get current location via browser geolocation API
    const getCurrentLocation = useCallback(() => {
        setLoading(true);
        setError(null);

        if (!navigator.geolocation) {
            setError(
                "Geolocation is not supported by your browser. Please enter your location manually.",
            );
            setLoading(false);
            return;
        }

        navigator.geolocation.getCurrentPosition(
            (position) => {
                const newLocation = {
                    latitude: position.coords.latitude,
                    longitude: position.coords.longitude,
                    accuracy: position.coords.accuracy,
                    timestamp: Date.now(),
                };
                setLocation(newLocation);
                setLocationSource("auto");
                setError(null);
                localStorage.setItem(
                    "userLocation",
                    JSON.stringify(newLocation),
                );
                localStorage.setItem("userLocationSource", "auto");
                setLoading(false);
            },
            (err) => {
                let errorMessage = "Unable to retrieve your location.";
                switch (err.code) {
                    case err.PERMISSION_DENIED:
                        errorMessage =
                            "Location permission denied. Please enable location services or enter your location manually.";
                        break;
                    case err.POSITION_UNAVAILABLE:
                        errorMessage =
                            "Location unavailable. Please try again or enter your location manually.";
                        break;
                    case err.TIMEOUT:
                        errorMessage =
                            "Location request timed out. Please try again or enter your location manually.";
                        break;
                    default:
                        errorMessage =
                            "Unable to get location. Please enter your location manually.";
                }
                setError(errorMessage);
                setLoading(false);

                // Set default location if geolocation fails (Bangalore, India)
                setLocation((prevLocation) => {
                    if (!prevLocation) {
                        const defaultLocation = {
                            latitude: 12.9537754,
                            longitude: 77.7008752,
                            city: "Bangalore",
                            isDefault: true,
                        };
                        setLocationSource("default");
                        return defaultLocation;
                    }
                    return prevLocation;
                });
            },
            {
                enableHighAccuracy: true,
                timeout: 10000,
                maximumAge: 60000, // Allow cached position up to 1 minute old
            },
        );
    }, []);

    // Initialize location on mount
    useEffect(() => {
        // Try to get stored location first
        const storedLocation = localStorage.getItem("userLocation");
        const storedSource = localStorage.getItem("userLocationSource");

        if (storedLocation) {
            try {
                const parsed = JSON.parse(storedLocation);
                setLocation(parsed);
                setLocationSource(storedSource || "auto");
                setLoading(false);
            } catch (e) {
                getCurrentLocation();
            }
        } else {
            getCurrentLocation();
        }

        const storedRadius = localStorage.getItem("searchRadius");
        if (storedRadius !== null) {
            setSearchRadius(parseInt(storedRadius));
        }
        // If no stored radius, keep the default null (any distance)
    }, [getCurrentLocation]);

    // Update location with validation
    const updateLocation = useCallback((newLocation, source = "manual") => {
        // Validate coordinates
        if (!newLocation) {
            setError("Invalid location data");
            return false;
        }

        const lat = parseFloat(newLocation.latitude);
        const lng = parseFloat(newLocation.longitude);

        if (isNaN(lat) || isNaN(lng)) {
            setError("Invalid coordinates");
            return false;
        }

        if (lat < -90 || lat > 90) {
            setError("Latitude must be between -90 and 90");
            return false;
        }

        if (lng < -180 || lng > 180) {
            setError("Longitude must be between -180 and 180");
            return false;
        }

        const validatedLocation = {
            latitude: lat,
            longitude: lng,
            address: newLocation.address || "",
            city: newLocation.city || "",
            timestamp: Date.now(),
            isDefault: false,
        };

        setLocation(validatedLocation);
        setLocationSource(source);
        setError(null);
        localStorage.setItem("userLocation", JSON.stringify(validatedLocation));
        localStorage.setItem("userLocationSource", source);
        return true;
    }, []);

    // Set location manually (with lat/lng input)
    const setManualLocation = useCallback(
        (latitude, longitude, address = "", city = "") => {
            return updateLocation(
                { latitude, longitude, address, city },
                "manual",
            );
        },
        [updateLocation],
    );

    // Parse and set location from Google Maps URL or coordinates string
    const parseAndSetLocation = useCallback(
        (input) => {
            if (!input || typeof input !== "string") {
                setError("Please enter valid coordinates or a Google Maps URL");
                return false;
            }

            // Try to parse Google Maps URL
            // Format: https://www.google.com/maps/@40.7128,-74.0060,15z
            const atMatch = input.match(/@(-?\d+\.?\d*),(-?\d+\.?\d*)/);

            // Format: https://maps.google.com/?q=40.7128,-74.0060
            const qMatch = input.match(/[?&]q=(-?\d+\.?\d*),(-?\d+\.?\d*)/);

            // Format: https://www.google.com/maps/place/.../@40.7128,-74.0060,15z
            const placeMatch = input.match(
                /place\/[^@]*@(-?\d+\.?\d*),(-?\d+\.?\d*)/,
            );

            // Plain coordinates: "40.7128, -74.0060" or "40.7128 -74.0060"
            const plainMatch = input
                .trim()
                .match(/^(-?\d+\.?\d*)[,\s]+(-?\d+\.?\d*)$/);

            let lat, lng;

            if (atMatch) {
                lat = parseFloat(atMatch[1]);
                lng = parseFloat(atMatch[2]);
            } else if (qMatch) {
                lat = parseFloat(qMatch[1]);
                lng = parseFloat(qMatch[2]);
            } else if (placeMatch) {
                lat = parseFloat(placeMatch[1]);
                lng = parseFloat(placeMatch[2]);
            } else if (plainMatch) {
                lat = parseFloat(plainMatch[1]);
                lng = parseFloat(plainMatch[2]);
            } else {
                setError(
                    'Could not parse location. Please enter coordinates as "latitude, longitude" or paste a Google Maps URL',
                );
                return false;
            }

            return setManualLocation(lat, lng);
        },
        [setManualLocation],
    );

    const updateSearchRadius = useCallback((radius) => {
        // null means "any distance" (no limit)
        if (radius === null) {
            setSearchRadius(null);
            localStorage.removeItem("searchRadius");
            return;
        }
        const validRadius = Math.max(1, Math.min(500, parseInt(radius) || 50));
        setSearchRadius(validRadius);
        localStorage.setItem("searchRadius", validRadius.toString());
    }, []);

    // Clear location data
    const clearLocation = useCallback(() => {
        setLocation(null);
        setLocationSource(null);
        setError(null);
        localStorage.removeItem("userLocation");
        localStorage.removeItem("userLocationSource");
    }, []);

    // Check if we have valid coordinates
    const hasValidCoordinates =
        location &&
        location.latitude !== undefined &&
        location.longitude !== undefined &&
        !isNaN(location.latitude) &&
        !isNaN(location.longitude);

    return (
        <LocationContext.Provider
            value={{
                location,
                loading,
                error,
                searchRadius,
                locationSource,
                hasValidCoordinates,
                // Methods
                getCurrentLocation,
                updateLocation,
                setManualLocation,
                parseAndSetLocation,
                updateSearchRadius,
                clearLocation,
                // Utility functions
                calculateDistance,
                formatDistance,
            }}
        >
            {children}
        </LocationContext.Provider>
    );
};

export const useLocation = () => {
    const context = useContext(LocationContext);
    if (!context) {
        throw new Error("useLocation must be used within a LocationProvider");
    }
    return context;
};
