import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { adoptionAPI } from "../services/api";
import { refreshNotifications } from "../components/Navbar";
import "./AdoptionRequests.css";

const AdoptionRequests = () => {
    const [activeTab, setActiveTab] = useState("received");
    const [receivedRequests, setReceivedRequests] = useState([]);
    const [sentRequests, setSentRequests] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        fetchRequests();
    }, []);

    const fetchRequests = async () => {
        try {
            setLoading(true);
            const [receivedRes, sentRes] = await Promise.all([
                adoptionAPI.getReceived(),
                adoptionAPI.getSent(),
            ]);
            setReceivedRequests(receivedRes.data.data);
            setSentRequests(sentRes.data.data);
        } catch (err) {
            console.error("Error fetching requests:", err);
            setError("Failed to load adoption requests.");
        } finally {
            setLoading(false);
        }
    };

    const handleStatusUpdate = async (requestId, status) => {
        try {
            await adoptionAPI.updateStatus(requestId, status);
            setReceivedRequests(
                receivedRequests.map((req) =>
                    req._id === requestId ? { ...req, status } : req,
                ),
            );
            // Refresh notification badge count
            refreshNotifications();
        } catch (err) {
            console.error("Error updating request:", err);
            alert("Failed to update request status");
        }
    };

    const handleWithdraw = async (requestId) => {
        if (
            !window.confirm("Are you sure you want to withdraw this request?")
        ) {
            return;
        }

        try {
            await adoptionAPI.withdraw(requestId);
            setSentRequests(
                sentRequests.filter((req) => req._id !== requestId),
            );
        } catch (err) {
            console.error("Error withdrawing request:", err);
            alert("Failed to withdraw request");
        }
    };

    const getStatusBadge = (status) => {
        switch (status) {
            case "pending":
                return <span className="badge badge-warning">Pending</span>;
            case "accepted":
                return <span className="badge badge-success">Accepted</span>;
            case "rejected":
                return <span className="badge badge-danger">Rejected</span>;
            default:
                return null;
        }
    };

    const imageUrl = (imgPath) => {
        return `${process.env.REACT_APP_API_URL?.replace("/api", "") || "http://localhost:5000"}${imgPath}`;
    };

    if (loading) {
        return (
            <div className="loading-container">
                <div className="spinner"></div>
            </div>
        );
    }

    const currentRequests =
        activeTab === "received" ? receivedRequests : sentRequests;

    const pendingReceivedCount = receivedRequests.filter(
        (req) => req.status === "pending",
    ).length;

    const pendingSentCount = sentRequests.filter(
        (req) => req.status === "pending",
    ).length;

    return (
        <div className="requests-page">
            <div className="container">
                <h1>Adoption Requests</h1>

                {error && <div className="alert alert-error">{error}</div>}

                <div className="tabs">
                    <button
                        className={`tab ${activeTab === "received" ? "active" : ""}`}
                        onClick={() => setActiveTab("received")}
                    >
                        Received
                        {pendingReceivedCount > 0 && (
                            <span className="tab-badge">
                                {pendingReceivedCount} new
                            </span>
                        )}
                    </button>
                    <button
                        className={`tab ${activeTab === "sent" ? "active" : ""}`}
                        onClick={() => setActiveTab("sent")}
                    >
                        Sent
                        {pendingSentCount > 0 && (
                            <span className="tab-badge pending">
                                {pendingSentCount} pending
                            </span>
                        )}
                    </button>
                </div>

                {currentRequests.length === 0 ? (
                    <div className="empty-state">
                        <div className="empty-icon">📭</div>
                        <h2>No {activeTab} requests</h2>
                        <p>
                            {activeTab === "received"
                                ? "You haven't received any adoption requests yet."
                                : "You haven't sent any adoption requests yet."}
                        </p>
                        {activeTab === "sent" && (
                            <Link to="/" className="btn btn-primary">
                                Browse Pets
                            </Link>
                        )}
                    </div>
                ) : (
                    <div className="requests-list">
                        {currentRequests.map((request) => (
                            <div key={request._id} className="request-card">
                                <div className="request-pet">
                                    <div className="pet-image">
                                        {request.pet?.images &&
                                        request.pet.images.length > 0 ? (
                                            <img
                                                src={imageUrl(
                                                    request.pet.images[0],
                                                )}
                                                alt={request.pet.name}
                                            />
                                        ) : (
                                            <div className="no-image">🐾</div>
                                        )}
                                    </div>
                                    <div className="pet-info">
                                        <Link
                                            to={`/pets/${request.pet?._id}`}
                                            className="pet-name"
                                        >
                                            {request.pet?.name}
                                        </Link>
                                        <p className="pet-details">
                                            {request.pet?.species} •{" "}
                                            {request.pet?.breed}
                                        </p>
                                    </div>
                                </div>

                                <div className="request-content">
                                    {activeTab === "received" ? (
                                        <div className="requester-info">
                                            <p className="requester-label">
                                                Request from:
                                            </p>
                                            <p className="requester-name">
                                                {request.requester?.name}
                                            </p>
                                            <p className="requester-contact">
                                                📧 {request.requester?.email}
                                            </p>
                                            {request.requester?.phone && (
                                                <p className="requester-contact">
                                                    📱{" "}
                                                    {request.requester?.phone}
                                                </p>
                                            )}
                                        </div>
                                    ) : (
                                        <div className="owner-info">
                                            <p className="owner-label">
                                                Pet owner:
                                            </p>
                                            <p className="owner-name">
                                                {request.owner?.name}
                                            </p>
                                            {request.status === "accepted" && (
                                                <>
                                                    <p className="owner-contact">
                                                        📧{" "}
                                                        {request.owner?.email}
                                                    </p>
                                                    {request.owner?.phone && (
                                                        <p className="owner-contact">
                                                            📱{" "}
                                                            {
                                                                request.owner
                                                                    ?.phone
                                                            }
                                                        </p>
                                                    )}
                                                </>
                                            )}
                                        </div>
                                    )}

                                    <div className="request-message">
                                        <p className="message-label">
                                            Message:
                                        </p>
                                        <p className="message-text">
                                            "{request.message}"
                                        </p>
                                    </div>

                                    <div className="request-meta">
                                        <span className="request-date">
                                            {new Date(
                                                request.createdAt,
                                            ).toLocaleDateString()}
                                        </span>
                                        {getStatusBadge(request.status)}
                                    </div>
                                </div>

                                <div className="request-actions">
                                    {activeTab === "received" &&
                                        request.status === "pending" && (
                                            <>
                                                <button
                                                    className="btn btn-success btn-small"
                                                    onClick={() =>
                                                        handleStatusUpdate(
                                                            request._id,
                                                            "accepted",
                                                        )
                                                    }
                                                >
                                                    Accept
                                                </button>
                                                <button
                                                    className="btn btn-danger btn-small"
                                                    onClick={() =>
                                                        handleStatusUpdate(
                                                            request._id,
                                                            "rejected",
                                                        )
                                                    }
                                                >
                                                    Reject
                                                </button>
                                            </>
                                        )}
                                    {activeTab === "sent" &&
                                        request.status === "pending" && (
                                            <button
                                                className="btn btn-secondary btn-small"
                                                onClick={() =>
                                                    handleWithdraw(request._id)
                                                }
                                            >
                                                Withdraw
                                            </button>
                                        )}
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
};

export default AdoptionRequests;
