import React, { useState } from 'react';
import ImageUpload from './ImageUpload';
import './UploadPage.css';

export default function UploadPage({ onUploadSuccess }) {
  return (
    <div className="page-container">
      <div className="upload-page-content">
        <ImageUpload onUploadSuccess={onUploadSuccess} />
      </div>
    </div>
  );
}
