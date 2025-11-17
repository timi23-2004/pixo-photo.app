import React from 'react';
import ImageGallery from './ImageGallery';
import './HomePage.css';

export default function HomePage() {
  return (
    <div className="page-container">
      <div className="page-header">
        <h2>Fedezd fel a képeket</h2>
        <p>Nézd meg a közösség által feltöltött képeket</p>
      </div>
      <ImageGallery viewMode="all" />
    </div>
  );
}
