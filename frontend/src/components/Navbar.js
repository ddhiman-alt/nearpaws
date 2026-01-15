import React, { useState, useEffect, useCallback } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { adoptionAPI } from "../services/api";
import "./Navbar.css";

// Export a function to trigger notification refresh from other components
let refreshNotificationCallback = null;
export const refreshNotifications = () => {
    if (refreshNotificationCallback) {
        refreshNotificationCallback();
    }
};

const Navbar = () => {
    const { user, isAuthenticated, logout } = useAuth();
    const navigate = useNavigate();
    const location = useLocation();
    const [menuOpen, setMenuOpen] = useState(false);
    const [pendingRequestsCount, setPendingRequestsCount] = useState(0);

    // Fetch pending requests count
    const fetchPendingRequests = useCallback(async () => {
        if (!isAuthenticated) {
            setPendingRequestsCount(0);
            return;
        }

        try {
            const response = await adoptionAPI.getReceived();
            const pendingCount = response.data.data.filter(
                (req) => req.status === "pending",
            ).length;
            setPendingRequestsCount(pendingCount);
        } catch (error) {
            console.error("Error fetching requests:", error);
        }
    }, [isAuthenticated]);

    // Register the refresh callback
    useEffect(() => {
        refreshNotificationCallback = fetchPendingRequests;
        return () => {
            refreshNotificationCallback = null;
        };
    }, [fetchPendingRequests]);

    // Fetch on mount and when auth changes
    useEffect(() => {
        fetchPendingRequests();
    }, [fetchPendingRequests]);

    // Refresh count when navigating away from requests page
    useEffect(() => {
        if (location.pathname !== "/adoption-requests") {
            fetchPendingRequests();
        }
    }, [location.pathname, fetchPendingRequests]);

    // Poll for new requests every 30 seconds
    useEffect(() => {
        if (!isAuthenticated) return;

        const interval = setInterval(fetchPendingRequests, 30000);
        return () => clearInterval(interval);
    }, [isAuthenticated, fetchPendingRequests]);

    const handleLogout = () => {
        logout();
        setPendingRequestsCount(0);
        navigate("/");
        setMenuOpen(false);
    };

    return (
        <nav className="navbar">
            <div className="container navbar-container">
                <Link to="/" className="navbar-brand">
                    <span className="brand-icon">🐾</span>
                    <span className="brand-text">NearPaws</span>
                </Link>

                <button
                    className="menu-toggle"
                    onClick={() => setMenuOpen(!menuOpen)}
                >
                    <span></span>
                    <span></span>
                    <span></span>
                </button>

                <div className={`navbar-menu ${menuOpen ? "active" : ""}`}>
                    <div className="navbar-links">
                        <Link to="/browse" onClick={() => setMenuOpen(false)}>
                            Browse Pets
                        </Link>
                        {isAuthenticated && (
                            <>
                                <Link
                                    to="/post-pet"
                                    onClick={() => setMenuOpen(false)}
                                >
                                    Post a Pet
                                </Link>
                                <Link
                                    to="/my-pets"
                                    onClick={() => setMenuOpen(false)}
                                >
                                    My Listings
                                </Link>
                                <Link
                                    to="/adoption-requests"
                                    onClick={() => setMenuOpen(false)}
                                    className="nav-link-with-badge"
                                >
                                    Requests
                                    {pendingRequestsCount > 0 && (
                                        <span className="notification-badge">
                                            {pendingRequestsCount > 9
                                                ? "9+"
                                                : pendingRequestsCount}
                                        </span>
                                    )}
                                </Link>
                            </>
                        )}
                    </div>

                    <div className="navbar-auth">
                        {isAuthenticated ? (
                            <div className="user-menu">
                                <span className="user-name">
                                    👤 {user?.name}
                                </span>
                                <button
                                    className="btn btn-secondary btn-small"
                                    onClick={handleLogout}
                                >
                                    Logout
                                </button>
                            </div>
                        ) : (
                            <div className="auth-buttons">
                                <Link
                                    to="/login"
                                    className="btn btn-secondary btn-small"
                                    onClick={() => setMenuOpen(false)}
                                >
                                    Login
                                </Link>
                                <Link
                                    to="/register"
                                    className="btn btn-primary btn-small"
                                    onClick={() => setMenuOpen(false)}
                                >
                                    Sign Up
                                </Link>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </nav>
    );
};

export default Navbar;
