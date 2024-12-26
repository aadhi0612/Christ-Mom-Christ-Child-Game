import React, { useState, useEffect } from 'react';
import axios from 'axios';
import './SantaReveal.css';

const SantaReveal = ({ onClose }) => {
  const [santaName, setSantaName] = useState('');
  const [isRevealing, setIsRevealing] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    fetchMySanta();
  }, []);

  const fetchMySanta = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get('/api/user/my-santa', {
        headers: { Authorization: `Bearer ${token}` }
      });
      setSantaName(response.data.santa_name);
      setTimeout(() => {
        setIsRevealing(false);
      }, 3000);
    } catch (err) {
      setError('Failed to fetch Santa information');
      setIsRevealing(false);
    }
  };

  return (
    <div className="santa-reveal-overlay">
      <div className="santa-reveal-container">
        {isRevealing ? (
          <div className="santa-animation">
            <div className="sleigh">
              <span role="img" aria-label="santa">🎅</span>
            </div>
            <div className="stars">✨</div>
          </div>
        ) : (
          <div className="reveal-message">
            <h2 className="text-2xl font-bold text-red-600 mb-4">
              Your Secret Santa was...
            </h2>
            <div className="santa-name text-3xl font-extrabold text-green-700 mb-6">
              {santaName}
            </div>
            <p className="text-gray-600 mb-6">
              Thank them for all the wonderful Christmas challenges!
            </p>
            <button 
              onClick={onClose}
              className="close-button bg-green-500 text-white px-6 py-2 rounded-full hover:bg-green-600 transition-all"
            >
              Close
            </button>
          </div>
        )}
        {error && <div className="error-message text-red-500 mt-4">{error}</div>}
      </div>
    </div>
  );
};

export default SantaReveal; 