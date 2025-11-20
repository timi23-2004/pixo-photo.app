import React from 'react';
import ImageGallery from './ImageGallery';
import './HomePage.css';

export default function HomePage() {
  return (
    <div className="page-container">
      <ImageGallery viewMode="all" />
    </div>
  );
}
