import React, { useState } from 'react';
import ImageUpload from './ImageUpload';
import './UploadPage.css';

export default function UploadPage({ onUploadSuccess }) {
  return (
    <div className="page-container">
      <div className="page-header">
        <h2>Tölts fel képet</h2>
        <p>Oszd meg képeidet a közösséggel</p>
      </div>
      <div className="upload-page-content">
        <ImageUpload onUploadSuccess={onUploadSuccess} />
      </div>
    </div>
  );
}
