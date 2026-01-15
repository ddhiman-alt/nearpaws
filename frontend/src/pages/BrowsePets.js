import React, { useState, useEffect, useCallback } from "react";
import { useSearchParams, Link } from "react-router-dom";
import { petsAPI } from "../services/api";
import { useLocation } from "../context/LocationContext";
import { useAuth } from "../context/AuthContext";
import PetCard from "../components/PetCard";
import "./BrowsePets.css";

const BrowsePets = () => {
    const [searchParams, setSearchParams] = useSearchParams();
    const [pets, setPets] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [totalPages, setTotalPages] = useState(1);
    const [totalCount, setTotalCount] = useState(0);

    // Filters
    const [selectedSpecies, setSelectedSpecies] = useState(
        searchParams.get("species") || "",
    );
    const [selectedGender, setSelectedGender] = useState("");
    const [selectedSize, setSelectedSize] = useState("");
    const [currentPage, setCurrentPage] = useState(1);

    // Search
    const [searchQuery, setSearchQuery] = useState("");
    const [searchInput, setSearchInput] = useState("");

    // View mode: 'grid' or 'list'
    const [viewMode, setViewMode] = useState("grid");

    // Sort
    const [sortBy, setSortBy] = useState("nearest"); // 'nearest', 'farthest', 'newest', 'oldest'

    // Mobile filter drawer
    const [mobileFiltersOpen, setMobileFiltersOpen] = useState(false);

    const {
        location,
        searchRadius,
        updateSearchRadius,
        getCurrentLocation,
        loading: locationLoading,
        error: locationError,
        hasValidCoordinates,
    } = useLocation();
    const { isAuthenticated } = useAuth();

    const speciesOptions = [
        { value: "", label: "All Pets", icon: "🐾" },
        { value: "dog", label: "Dogs", icon: "🐕" },
        { value: "cat", label: "Cats", icon: "🐱" },
        { value: "bird", label: "Birds", icon: "🐦" },
        { value: "rabbit", label: "Rabbits", icon: "🐰" },
        { value: "hamster", label: "Hamsters", icon: "🐹" },
        { value: "fish", label: "Fish", icon: "🐟" },
        { value: "turtle", label: "Turtles", icon: "🐢" },
        { value: "other", label: "Other", icon: "🦎" },
    ];

    const genderOptions = [
        { value: "", label: "Any" },
        { value: "male", label: "Male", icon: "♂️" },
        { value: "female", label: "Female", icon: "♀️" },
    ];

    const sizeOptions = [
        { value: "", label: "Any" },
        { value: "small", label: "Small", icon: "🐁" },
        { value: "medium", label: "Medium", icon: "🐕" },
        { value: "large", label: "Large", icon: "🦮" },
        { value: "extra-large", label: "XL", icon: "🐘" },
    ];

    const sortOptions = [
        { value: "nearest", label: "Nearest First", icon: "📍" },
        { value: "farthest", label: "Farthest First", icon: "🗺️" },
        { value: "newest", label: "Newest First", icon: "🆕" },
        { value: "oldest", label: "Oldest First", icon: "📅" },
    ];

    const radiusOptions = [
        { value: null, label: "Any" },
        { value: 5, label: "5 km" },
        { value: 10, label: "10 km" },
        { value: 25, label: "25 km" },
        { value: 50, label: "50 km" },
        { value: 100, label: "100 km" },
        { value: 200, label: "200 km" },
        { value: 500, label: "500 km" },
    ];

    const fetchPets = useCallback(async () => {
        try {
            setLoading(true);
            setError(null);

            const params = {
                status: "available",
                page: currentPage,
                limit: 12,
            };

            if (selectedSpecies) params.species = selectedSpecies;
            if (selectedGender) params.gender = selectedGender;
            if (selectedSize) params.size = selectedSize;
            if (searchQuery) params.search = searchQuery;

            // Add sort parameter
            if (sortBy === "newest") {
                params.sort = "-createdAt";
            } else if (sortBy === "oldest") {
                params.sort = "createdAt";
            } else if (sortBy === "nearest") {
                params.sort = "distance";
                params.sortDirection = "asc";
            } else if (sortBy === "farthest") {
                params.sort = "distance";
                params.sortDirection = "desc";
            }

            let response;

            if (hasValidCoordinates) {
                params.latitude = location.latitude;
                params.longitude = location.longitude;
                // Only add distance if it's not null (null = any distance)
                if (searchRadius !== null) {
                    params.distance = searchRadius;
                }
                try {
                    response = await petsAPI.getNearby(params);
                } catch (nearbyErr) {
                    console.warn(
                        "Nearby search failed, falling back to regular listing",
                    );
                    response = await petsAPI.getAll(params);
                }
            } else {
                response = await petsAPI.getAll(params);
            }

            const petsData = response.data.data;

            setPets(petsData);
            setTotalPages(response.data.totalPages || 1);
            setTotalCount(response.data.total || response.data.count || 0);
        } catch (err) {
            console.error("Error fetching pets:", err);
            setError("Failed to load pets. Please try again.");
        } finally {
            setLoading(false);
        }
    }, [
        location,
        searchRadius,
        selectedSpecies,
        selectedGender,
        selectedSize,
        searchQuery,
        sortBy,
        currentPage,
        hasValidCoordinates,
    ]);

    useEffect(() => {
        if (!locationLoading) {
            fetchPets();
        }
    }, [fetchPets, locationLoading]);

    // Update URL when species changes (use replace to avoid multiple history entries)
    useEffect(() => {
        const currentSpecies = searchParams.get("species") || "";
        // Only update if the URL doesn't match the state (avoid redundant history entries)
        if (currentSpecies !== selectedSpecies) {
            if (selectedSpecies) {
                setSearchParams(
                    { species: selectedSpecies },
                    { replace: true },
                );
            } else {
                setSearchParams({}, { replace: true });
            }
        }
    }, [selectedSpecies, searchParams, setSearchParams]);

    // Reset page when filters change
    useEffect(() => {
        setCurrentPage(1);
    }, [
        selectedSpecies,
        selectedGender,
        selectedSize,
        searchRadius,
        searchQuery,
        sortBy,
    ]);

    // Lock body scroll when mobile filters are open
    useEffect(() => {
        if (mobileFiltersOpen) {
            document.body.style.overflow = "hidden";
        } else {
            document.body.style.overflow = "";
        }
        return () => {
            document.body.style.overflow = "";
        };
    }, [mobileFiltersOpen]);

    // Handle search submit
    const handleSearch = (e) => {
        e.preventDefault();
        setSearchQuery(searchInput);
    };

    // Clear search
    const clearSearch = () => {
        setSearchInput("");
        setSearchQuery("");
    };

    const handleClearFilters = () => {
        setSelectedSpecies("");
        setSelectedGender("");
        setSelectedSize("");
        setSearchInput("");
        setSearchQuery("");
        setCurrentPage(1);
    };

    const hasActiveFilters =
        selectedSpecies || selectedGender || selectedSize || searchQuery;

    // Close mobile filters when a filter is applied
    const handleMobileFilterClose = () => {
        setMobileFiltersOpen(false);
    };

    // Count active filters for badge
    const activeFilterCount = [
        selectedSpecies,
        selectedGender,
        selectedSize,
        searchRadius !== null,
    ].filter(Boolean).length;

    return (
        <div className="browse-page">
            {/* Mobile Filter Overlay */}
            {mobileFiltersOpen && (
                <div
                    className="mobile-filter-overlay"
                    onClick={handleMobileFilterClose}
                />
            )}

            {/* Sidebar Filters */}
            <aside
                className={`filters-sidebar ${mobileFiltersOpen ? "mobile-open" : ""}`}
            >
                <div className="filters-header">
                    <h2>🔍 Filters</h2>
                    <div className="filters-header-actions">
                        {hasActiveFilters && (
                            <button
                                className="clear-filters"
                                onClick={handleClearFilters}
                            >
                                Clear All
                            </button>
                        )}
                        <button
                            className="mobile-filter-close"
                            onClick={handleMobileFilterClose}
                            aria-label="Close filters"
                        >
                            ✕
                        </button>
                    </div>
                </div>

                {/* Location Section */}
                <div className="filter-section">
                    <h3>📍 Location</h3>
                    <div className="location-status">
                        {locationLoading ? (
                            <span className="status-loading">
                                Detecting location...
                            </span>
                        ) : hasValidCoordinates ? (
                            <span className="status-active">
                                ✓ Location set
                                {location.city && ` (${location.city})`}
                            </span>
                        ) : (
                            <span className="status-none">
                                Location not set
                            </span>
                        )}
                    </div>
                    <button
                        className="btn btn-sm btn-outline"
                        onClick={getCurrentLocation}
                        disabled={locationLoading}
                    >
                        {locationLoading
                            ? "Detecting..."
                            : "📍 Update Location"}
                    </button>
                    {locationError && (
                        <p className="location-error-text">{locationError}</p>
                    )}
                </div>

                {/* Distance Section */}
                <div className="filter-section">
                    <h3>📏 Distance</h3>
                    <div className="radius-options">
                        {radiusOptions.map((option) => (
                            <button
                                key={option.label}
                                className={`radius-btn ${searchRadius === option.value ? "active" : ""}`}
                                onClick={() => updateSearchRadius(option.value)}
                            >
                                {option.label}
                            </button>
                        ))}
                    </div>
                </div>

                {/* Species Section */}
                <div className="filter-section">
                    <h3>🐾 Pet Type</h3>
                    <div className="species-options">
                        {speciesOptions.map((option) => (
                            <button
                                key={option.value}
                                className={`species-btn ${selectedSpecies === option.value ? "active" : ""}`}
                                onClick={() => setSelectedSpecies(option.value)}
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

                {/* Gender Section */}
                <div className="filter-section">
                    <h3>⚧ Gender</h3>
                    <div className="filter-btn-group">
                        {genderOptions.map((option) => (
                            <button
                                key={option.value}
                                className={`filter-btn ${selectedGender === option.value ? "active" : ""}`}
                                onClick={() => setSelectedGender(option.value)}
                            >
                                {option.icon && (
                                    <span className="filter-btn-icon">
                                        {option.icon}
                                    </span>
                                )}
                                <span>{option.label}</span>
                            </button>
                        ))}
                    </div>
                </div>

                {/* Size Section */}
                <div className="filter-section">
                    <h3>📐 Size</h3>
                    <div className="filter-btn-group">
                        {sizeOptions.map((option) => (
                            <button
                                key={option.value}
                                className={`filter-btn ${selectedSize === option.value ? "active" : ""}`}
                                onClick={() => setSelectedSize(option.value)}
                            >
                                {option.icon && (
                                    <span className="filter-btn-icon">
                                        {option.icon}
                                    </span>
                                )}
                                <span>{option.label}</span>
                            </button>
                        ))}
                    </div>
                </div>

                {/* Post Pet CTA */}
                {isAuthenticated && (
                    <div className="sidebar-cta">
                        <p>Have a pet that needs a home?</p>
                        <Link
                            to="/post-pet"
                            className="btn btn-primary btn-block"
                        >
                            📝 Post a Pet
                        </Link>
                    </div>
                )}
            </aside>

            {/* Mobile Apply Button - Outside sidebar to avoid transform issues */}
            <div
                className={`mobile-apply-filters ${mobileFiltersOpen ? "visible" : ""}`}
            >
                <button
                    className="btn btn-primary btn-block"
                    onClick={handleMobileFilterClose}
                >
                    Show {totalCount} {totalCount === 1 ? "Pet" : "Pets"}
                </button>
            </div>

            {/* Main Content */}
            <main className="browse-content">
                {/* Search Bar */}
                <div className="search-bar-container">
                    <form onSubmit={handleSearch} className="search-form">
                        {/* Mobile Filter Button */}
                        <button
                            type="button"
                            className="mobile-filter-btn"
                            onClick={() => setMobileFiltersOpen(true)}
                        >
                            <svg
                                width="20"
                                height="20"
                                viewBox="0 0 24 24"
                                fill="none"
                                stroke="currentColor"
                                strokeWidth="2"
                                strokeLinecap="round"
                                strokeLinejoin="round"
                            >
                                <polygon points="22 3 2 3 10 12.46 10 19 14 21 14 12.46 22 3" />
                            </svg>
                            {activeFilterCount > 0 && (
                                <span className="filter-badge">
                                    {activeFilterCount}
                                </span>
                            )}
                        </button>
                        <div className="search-input-wrapper">
                            <span className="search-icon">🔍</span>
                            <input
                                type="text"
                                className="search-input"
                                placeholder="Search pets by name..."
                                value={searchInput}
                                onChange={(e) => setSearchInput(e.target.value)}
                            />
                            {(searchInput || searchQuery) && (
                                <button
                                    type="button"
                                    className="search-clear"
                                    onClick={clearSearch}
                                    title="Clear search"
                                >
                                    ✕
                                </button>
                            )}
                        </div>
                        <button
                            type="submit"
                            className="btn btn-primary search-btn"
                        >
                            Search
                        </button>
                    </form>
                </div>

                <div className="browse-header">
                    <div className="results-info">
                        <h1>
                            {searchQuery
                                ? `Search results for "${searchQuery}"`
                                : selectedSpecies
                                  ? `${speciesOptions.find((s) => s.value === selectedSpecies)?.label || "Pets"} for Adoption`
                                  : "All Pets for Adoption"}
                        </h1>
                        {!loading && (
                            <p className="results-count">
                                {totalCount} {totalCount === 1 ? "pet" : "pets"}{" "}
                                found
                                {hasValidCoordinates &&
                                    searchRadius !== null &&
                                    ` within ${searchRadius} km`}
                            </p>
                        )}
                    </div>

                    <div className="browse-controls">
                        {/* Sort Dropdown */}
                        <div className="sort-control">
                            <label htmlFor="sort-select">Sort:</label>
                            <select
                                id="sort-select"
                                className="sort-select"
                                value={sortBy}
                                onChange={(e) => setSortBy(e.target.value)}
                            >
                                {sortOptions.map((option) => (
                                    <option
                                        key={option.value}
                                        value={option.value}
                                    >
                                        {option.label}
                                    </option>
                                ))}
                            </select>
                        </div>

                        {/* View Toggle */}
                        <div className="view-toggle">
                            <button
                                className={`view-btn ${viewMode === "grid" ? "active" : ""}`}
                                onClick={() => setViewMode("grid")}
                                title="Grid view"
                            >
                                <svg
                                    width="18"
                                    height="18"
                                    viewBox="0 0 24 24"
                                    fill="currentColor"
                                >
                                    <rect
                                        x="3"
                                        y="3"
                                        width="7"
                                        height="7"
                                        rx="1"
                                    />
                                    <rect
                                        x="14"
                                        y="3"
                                        width="7"
                                        height="7"
                                        rx="1"
                                    />
                                    <rect
                                        x="3"
                                        y="14"
                                        width="7"
                                        height="7"
                                        rx="1"
                                    />
                                    <rect
                                        x="14"
                                        y="14"
                                        width="7"
                                        height="7"
                                        rx="1"
                                    />
                                </svg>
                            </button>
                            <button
                                className={`view-btn ${viewMode === "list" ? "active" : ""}`}
                                onClick={() => setViewMode("list")}
                                title="List view"
                            >
                                <svg
                                    width="18"
                                    height="18"
                                    viewBox="0 0 24 24"
                                    fill="currentColor"
                                >
                                    <rect
                                        x="3"
                                        y="4"
                                        width="18"
                                        height="4"
                                        rx="1"
                                    />
                                    <rect
                                        x="3"
                                        y="10"
                                        width="18"
                                        height="4"
                                        rx="1"
                                    />
                                    <rect
                                        x="3"
                                        y="16"
                                        width="18"
                                        height="4"
                                        rx="1"
                                    />
                                </svg>
                            </button>
                        </div>
                    </div>
                </div>

                {loading ? (
                    <div className="loading-container">
                        <div className="spinner"></div>
                        <p>Finding pets near you...</p>
                    </div>
                ) : error ? (
                    <div className="error-container">
                        <div className="error-icon">😿</div>
                        <h3>Oops! Something went wrong</h3>
                        <p>{error}</p>
                        <button className="btn btn-primary" onClick={fetchPets}>
                            Try Again
                        </button>
                    </div>
                ) : pets.length === 0 ? (
                    <div className="no-results">
                        <div className="no-results-icon">🔍</div>
                        <h3>No pets found</h3>
                        <p>
                            {hasActiveFilters
                                ? "Try adjusting your filters or expanding your search radius."
                                : "No pets available in your area yet. Check back soon!"}
                        </p>
                        {hasActiveFilters && (
                            <button
                                className="btn btn-secondary"
                                onClick={handleClearFilters}
                            >
                                Clear Filters
                            </button>
                        )}
                        {isAuthenticated && (
                            <Link to="/post-pet" className="btn btn-primary">
                                Be the First to Post
                            </Link>
                        )}
                    </div>
                ) : (
                    <>
                        <div className={`pets-${viewMode}`}>
                            {pets.map((pet) => (
                                <PetCard
                                    key={pet._id}
                                    pet={pet}
                                    viewMode={viewMode}
                                />
                            ))}
                        </div>

                        {/* Pagination */}
                        {totalPages > 1 && (
                            <div className="pagination">
                                <button
                                    className="pagination-btn"
                                    disabled={currentPage === 1}
                                    onClick={() => setCurrentPage((p) => p - 1)}
                                >
                                    ← Previous
                                </button>
                                <div className="pagination-pages">
                                    {Array.from(
                                        { length: totalPages },
                                        (_, i) => i + 1,
                                    )
                                        .filter((page) => {
                                            // Show first, last, and pages around current
                                            return (
                                                page === 1 ||
                                                page === totalPages ||
                                                Math.abs(page - currentPage) <=
                                                    1
                                            );
                                        })
                                        .map((page, index, array) => (
                                            <React.Fragment key={page}>
                                                {index > 0 &&
                                                    array[index - 1] !==
                                                        page - 1 && (
                                                        <span className="pagination-ellipsis">
                                                            ...
                                                        </span>
                                                    )}
                                                <button
                                                    className={`pagination-page ${currentPage === page ? "active" : ""}`}
                                                    onClick={() =>
                                                        setCurrentPage(page)
                                                    }
                                                >
                                                    {page}
                                                </button>
                                            </React.Fragment>
                                        ))}
                                </div>
                                <button
                                    className="pagination-btn"
                                    disabled={currentPage === totalPages}
                                    onClick={() => setCurrentPage((p) => p + 1)}
                                >
                                    Next →
                                </button>
                            </div>
                        )}
                    </>
                )}
            </main>
        </div>
    );
};

export default BrowsePets;
