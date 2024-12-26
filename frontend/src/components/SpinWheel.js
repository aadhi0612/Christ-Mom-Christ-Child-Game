import React, { useState, useEffect } from 'react';
import axios from 'axios';
import './SpinWheel.css';

const SpinWheel = ({ onClose }) => {
  const [spinning, setSpinning] = useState(false);
  const [showName, setShowName] = useState(false);
  const [pairedName, setPairedName] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    fetchPairedInfo();
  }, []);

  const fetchPairedInfo = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get('/api/user/paired-info', {
        headers: { Authorization: `Bearer ${token}` }
      });
      setPairedName(response.data.paired_name);
    } catch (err) {
      setError('Failed to fetch paired information');
    }
  };

  const handleReveal = () => {
    setSpinning(true);
    setTimeout(() => {
      setSpinning(false);
      setShowName(true);
    }, 3000);
  };

  return (
    <div className="reveal-container p-8 bg-gradient-to-r from-red-100 to-green-100 rounded-lg shadow-xl">
      <div className="christmas-lights"></div>
      
      {showName && (
        <div className="name-display">
          <h2 className="text-2xl font-bold text-red-600 mb-4 text-center">
            🎄 Your Christ Child is 🎄
          </h2>
          <div className="text-3xl font-extrabold text-green-700 text-center mb-6">
            {pairedName}
          </div>
        </div>
      )}

      <div className="gift-box-container">
        <div className={`gift-box ${spinning ? 'shaking' : ''} ${showName ? 'opened' : ''}`}>
          <div className="gift-lid"></div>
          <div className="gift-body">
            {!showName && <div className="question-mark">?</div>}
          </div>
          <div className="gift-ribbon"></div>
        </div>
      </div>

      <div className="controls mt-8 flex justify-center">
        {!showName && (
          <button
            onClick={handleReveal}
            disabled={spinning}
            className="reveal-btn"
          >
            {spinning ? '🎁 Unwrapping...' : '🎁 Open Your Gift!'}
          </button>
        )}
        <button
          onClick={onClose}
          className="close-btn ml-4"
        >
          Return to Workshop
        </button>
      </div>

      {error && <div className="text-red-500 mt-4 text-center">{error}</div>}
    </div>
  );
};

export default SpinWheel;