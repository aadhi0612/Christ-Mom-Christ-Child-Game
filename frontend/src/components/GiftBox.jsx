import React from 'react';
import './GiftBox.css';

const GiftBox = ({ name }) => {
  return (
    <div className="gift-container">
      <div className="recipient-name">{name}</div>
      <div className="gift-box">
        <div className="gift-lid">
          <div className="gift-bow"></div>
        </div>
        <div className="gift-base"></div>
      </div>
    </div>
  );
};

export default GiftBox; 