import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { petsAPI } from '../services/api';
import './MyPets.css';

const MyPets = () => {
  const [pets, setPets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchMyPets();
  }, []);

  const fetchMyPets = async () => {
    try {
      setLoading(true);
      const response = await petsAPI.getMyPets();
      setPets(response.data.data);
    } catch (err) {
      console.error('Error fetching pets:', err);
      setError('Failed to load your pets.');
    } finally {
      setLoading(false);
    }
  };

  const handleStatusChange = async (petId, newStatus) => {
    try {
      await petsAPI.updateStatus(petId, newStatus);
      setPets(pets.map(pet =>
        pet._id === petId ? { ...pet, status: newStatus } : pet
      ));
    } catch (err) {
      console.error('Error updating status:', err);
      alert('Failed to update status');
    }
  };

  const handleDelete = async (petId) => {
    if (!window.confirm('Are you sure you want to delete this listing?')) {
      return;
    }

    try {
      await petsAPI.delete(petId);
      setPets(pets.filter(pet => pet._id !== petId));
    } catch (err) {
      console.error('Error deleting pet:', err);
      alert('Failed to delete listing');
    }
  };

  const getSpeciesEmoji = (species) => {
    const emojis = {
      dog: '🐕',
      cat: '🐱',
      bird: '🐦',
      rabbit: '🐰',
      hamster: '🐹',
      fish: '🐟',
      turtle: '🐢',
      other: '🐾',
    };
    return emojis[species] || '🐾';
  };

  const getStatusBadge = (status) => {
    switch (status) {
      case 'available':
        return <span className="badge badge-success">Available</span>;
      case 'pending':
        return <span className="badge badge-warning">Pending</span>;
      case 'adopted':
        return <span className="badge badge-primary">Adopted</span>;
      default:
        return null;
    }
  };

  const imageUrl = (imgPath) => {
    return `${process.env.REACT_APP_API_URL?.replace('/api', '') || 'http://localhost:5000'}${imgPath}`;
  };

  if (loading) {
    return (
      <div className="loading-container">
        <div className="spinner"></div>
      </div>
    );
  }

  return (
    <div className="my-pets-page">
      <div className="container">
        <div className="page-header">
          <h1>My Pet Listings</h1>
          <Link to="/post-pet" className="btn btn-primary">
            + Post New Pet
          </Link>
        </div>

        {error && <div className="alert alert-error">{error}</div>}

        {pets.length === 0 ? (
          <div className="empty-state">
            <div className="empty-icon">📝</div>
            <h2>No listings yet</h2>
            <p>You haven't posted any pets for adoption.</p>
            <Link to="/post-pet" className="btn btn-primary">
              Post Your First Pet
            </Link>
          </div>
        ) : (
          <div className="pets-list">
            {pets.map((pet) => (
              <div key={pet._id} className="pet-list-item">
                <div className="pet-list-image">
                  {pet.images && pet.images.length > 0 ? (
                    <img src={imageUrl(pet.images[0])} alt={pet.name} />
                  ) : (
                    <div className="no-image-placeholder">
                      {getSpeciesEmoji(pet.species)}
                    </div>
                  )}
                </div>

                <div className="pet-list-info">
                  <div className="pet-list-header">
                    <h3>{getSpeciesEmoji(pet.species)} {pet.name}</h3>
                    {getStatusBadge(pet.status)}
                  </div>
                  <p className="pet-list-meta">
                    {pet.breed || 'Mixed'} • {pet.age?.value} {pet.age?.unit} • {pet.gender}
                  </p>
                  <p className="pet-list-location">
                    📍 {pet.location?.city || 'Location not set'}
                  </p>
                  <p className="pet-list-date">
                    Posted: {new Date(pet.createdAt).toLocaleDateString()}
                  </p>
                </div>

                <div className="pet-list-actions">
                  <Link to={`/pets/${pet._id}`} className="btn btn-secondary btn-small">
                    View
                  </Link>

                  <select
                    className="status-select"
                    value={pet.status}
                    onChange={(e) => handleStatusChange(pet._id, e.target.value)}
                  >
                    <option value="available">Available</option>
                    <option value="pending">Pending</option>
                    <option value="adopted">Adopted</option>
                  </select>

                  <button
                    className="btn btn-danger btn-small"
                    onClick={() => handleDelete(pet._id)}
                  >
                    Delete
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default MyPets;
