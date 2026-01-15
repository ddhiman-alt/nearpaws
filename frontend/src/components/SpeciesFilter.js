import React from 'react';
import './SpeciesFilter.css';

const SpeciesFilter = ({ selectedSpecies, onSpeciesChange }) => {
  const species = [
    { value: '', label: 'All Pets', emoji: '🐾' },
    { value: 'dog', label: 'Dogs', emoji: '🐕' },
    { value: 'cat', label: 'Cats', emoji: '🐱' },
    { value: 'bird', label: 'Birds', emoji: '🐦' },
    { value: 'rabbit', label: 'Rabbits', emoji: '🐰' },
    { value: 'hamster', label: 'Hamsters', emoji: '🐹' },
    { value: 'fish', label: 'Fish', emoji: '🐟' },
    { value: 'turtle', label: 'Turtles', emoji: '🐢' },
    { value: 'other', label: 'Other', emoji: '🦎' },
  ];

  return (
    <div className="species-filter">
      <div className="species-buttons">
        {species.map((s) => (
          <button
            key={s.value}
            className={`species-btn ${selectedSpecies === s.value ? 'active' : ''}`}
            onClick={() => onSpeciesChange(s.value)}
          >
            <span className="species-emoji">{s.emoji}</span>
            <span className="species-label">{s.label}</span>
          </button>
        ))}
      </div>
    </div>
  );
};

export default SpeciesFilter;
