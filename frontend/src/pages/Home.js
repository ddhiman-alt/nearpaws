import React from "react";
import { Link } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import "./Home.css";

const Home = () => {
    const { isAuthenticated } = useAuth();

    return (
        <div className="home-page">
            {/* Hero Section */}
            <section className="hero">
                <div className="hero-background">
                    <div className="hero-overlay"></div>
                </div>
                <div className="container">
                    <div className="hero-content">
                        <span className="hero-badge">🐾 Find Love Nearby</span>
                        <h1>Give a Pet Their Forever Home</h1>
                        <p>
                            NearPaws connects loving families with adoptable
                            pets in their neighborhood. Every pet deserves a
                            second chance at happiness.
                        </p>
                        <div className="hero-buttons">
                            <Link
                                to="/browse"
                                className="btn btn-primary btn-lg"
                            >
                                🔍 Browse Pets
                            </Link>
                            {isAuthenticated ? (
                                <Link
                                    to="/post-pet"
                                    className="btn btn-secondary btn-lg"
                                >
                                    📝 Post a Pet
                                </Link>
                            ) : (
                                <Link
                                    to="/register"
                                    className="btn btn-secondary btn-lg"
                                >
                                    ✨ Get Started
                                </Link>
                            )}
                        </div>
                        <div className="hero-stats">
                            <div className="stat">
                                <span className="stat-icon">🏠</span>
                                <span className="stat-text">
                                    Local Adoptions
                                </span>
                            </div>
                            <div className="stat">
                                <span className="stat-icon">💚</span>
                                <span className="stat-text">Free Service</span>
                            </div>
                            <div className="stat">
                                <span className="stat-icon">🤝</span>
                                <span className="stat-text">
                                    Direct Contact
                                </span>
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            {/* How It Works Section */}
            <section className="how-it-works">
                <div className="container">
                    <div className="section-header">
                        <h2>How NearPaws Works</h2>
                        <p>Finding your new best friend is easy</p>
                    </div>
                    <div className="steps-grid">
                        <div className="step-card">
                            <div className="step-number">1</div>
                            <div className="step-icon">📍</div>
                            <h3>Set Your Location</h3>
                            <p>
                                Share your location to discover pets available
                                for adoption in your area.
                            </p>
                        </div>
                        <div className="step-card">
                            <div className="step-number">2</div>
                            <div className="step-icon">🔍</div>
                            <h3>Browse & Filter</h3>
                            <p>
                                Search through available pets. Filter by
                                species, distance, and more.
                            </p>
                        </div>
                        <div className="step-card">
                            <div className="step-number">3</div>
                            <div className="step-icon">💌</div>
                            <h3>Send a Request</h3>
                            <p>
                                Found a pet you love? Send an adoption request
                                directly to the owner.
                            </p>
                        </div>
                        <div className="step-card">
                            <div className="step-number">4</div>
                            <div className="step-icon">🏠</div>
                            <h3>Welcome Home</h3>
                            <p>
                                Meet the pet, finalize adoption, and welcome
                                your new family member!
                            </p>
                        </div>
                    </div>
                </div>
            </section>

            {/* For Pet Owners Section */}
            <section className="for-owners">
                <div className="container">
                    <div className="owners-content">
                        <div className="owners-text">
                            <span className="section-badge">
                                For Pet Owners
                            </span>
                            <h2>Need to Rehome Your Pet?</h2>
                            <p>
                                Life circumstances change. If you need to find a
                                new home for your pet, NearPaws helps you
                                connect with verified adopters in your area.
                            </p>
                            <ul className="benefits-list">
                                <li>
                                    <span className="check">✓</span>
                                    Post detailed listings with photos
                                </li>
                                <li>
                                    <span className="check">✓</span>
                                    Review adoption requests before responding
                                </li>
                                <li>
                                    <span className="check">✓</span>
                                    Communicate directly with potential adopters
                                </li>
                                <li>
                                    <span className="check">✓</span>
                                    Choose the best home for your pet
                                </li>
                            </ul>
                            {isAuthenticated ? (
                                <Link
                                    to="/post-pet"
                                    className="btn btn-primary"
                                >
                                    Post a Pet for Adoption
                                </Link>
                            ) : (
                                <Link
                                    to="/register"
                                    className="btn btn-primary"
                                >
                                    Create an Account
                                </Link>
                            )}
                        </div>
                        <div className="owners-image">
                            <div className="image-placeholder">
                                <span>🐕</span>
                                <span>🐱</span>
                                <span>🐰</span>
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            {/* Pet Categories Section */}
            <section className="categories">
                <div className="container">
                    <div className="section-header">
                        <h2>Find Your Perfect Match</h2>
                        <p>Browse pets by category</p>
                    </div>
                    <div className="categories-grid">
                        <Link
                            to="/browse?species=dog"
                            className="category-card"
                        >
                            <span className="category-icon">🐕</span>
                            <span className="category-name">Dogs</span>
                        </Link>
                        <Link
                            to="/browse?species=cat"
                            className="category-card"
                        >
                            <span className="category-icon">🐱</span>
                            <span className="category-name">Cats</span>
                        </Link>
                        <Link
                            to="/browse?species=bird"
                            className="category-card"
                        >
                            <span className="category-icon">🐦</span>
                            <span className="category-name">Birds</span>
                        </Link>
                        <Link
                            to="/browse?species=rabbit"
                            className="category-card"
                        >
                            <span className="category-icon">🐰</span>
                            <span className="category-name">Rabbits</span>
                        </Link>
                        <Link
                            to="/browse?species=hamster"
                            className="category-card"
                        >
                            <span className="category-icon">🐹</span>
                            <span className="category-name">Hamsters</span>
                        </Link>
                        <Link
                            to="/browse?species=fish"
                            className="category-card"
                        >
                            <span className="category-icon">🐟</span>
                            <span className="category-name">Fish</span>
                        </Link>
                        <Link
                            to="/browse?species=turtle"
                            className="category-card"
                        >
                            <span className="category-icon">🐢</span>
                            <span className="category-name">Turtles</span>
                        </Link>
                        <Link to="/browse" className="category-card">
                            <span className="category-icon">🐾</span>
                            <span className="category-name">All Pets</span>
                        </Link>
                    </div>
                </div>
            </section>

            {/* CTA Section */}
            <section className="cta paw-bg">
                <div className="container">
                    <div className="cta-content">
                        <h2>Ready to Find Your New Best Friend?</h2>
                        <p>
                            Thousands of pets are waiting for their forever
                            homes. Start browsing today!
                        </p>
                        <Link to="/browse" className="btn btn-white btn-lg">
                            Browse Available Pets
                        </Link>
                    </div>
                </div>
            </section>
        </div>
    );
};

export default Home;
