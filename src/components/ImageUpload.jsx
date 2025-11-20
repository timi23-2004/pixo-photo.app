import React, { useState } from 'react';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';
import { storage, db } from '../firebase';
import { useAuth } from '../context/AuthContext';
import './ImageUpload.css';

export default function ImageUpload({ onUploadSuccess }) {
  const [selectedFile, setSelectedFile] = useState(null);
  const [preview, setPreview] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState('');
  const { user } = useAuth();

  const handleFileSelect = (e) => {
    const file = e.target.files[0];
    if (file) {
      if (!file.type.startsWith('image/')) {
        setError('Csak képfájlokat tölthetsz fel');
        return;
      }
      if (file.size > 10 * 1024 * 1024) {
        setError('A kép максимum 10MB lehet');
        return;
      }
      setSelectedFile(file);
      setPreview(URL.createObjectURL(file));
      setError('');
    }
  };

  const handleUpload = async () => {
    if (!selectedFile) return;

    try {
      setUploading(true);
      setError('');

      // Egyedi fájlnév generálása
      const timestamp = Date.now();
      const fileName = `${timestamp}_${selectedFile.name}`;
      const storagePath = `users/${user.uid}/images/original/${fileName}`;

      // Feltöltés Firebase Storage-ba (eredeti méret)
      const storageRef = ref(storage, storagePath);
      await uploadBytes(storageRef, selectedFile);
      const downloadURL = await getDownloadURL(storageRef);

      // Thumbnail path (Firebase Function fogja létrehozni)
      const thumbnailPath = `users/${user.uid}/images/thumbnails/thumb_${fileName}`;

      // Metaadatok mentése Firestore-ba
      await addDoc(collection(db, 'images'), {
        userId: user.uid,
        userEmail: user.email,
        fileName: selectedFile.name,
        storagePath: storagePath,
        thumbnailPath: thumbnailPath,
        downloadURL: downloadURL, // HD verzió
        thumbnailURL: null, // Function fogja frissíteni
        uploadedAt: serverTimestamp(),
        processed: false // Jelzi hogy még nincs thumbnail
      });

      // Reset
      setSelectedFile(null);
      setPreview(null);
      if (onUploadSuccess) onUploadSuccess();
      alert('Image uploaded! Thumbnail generation in progress...');
      
    } catch (err) {
      console.error('Upload error:', err);
      setError('Upload error occurred');
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="upload-container">
      <h2>Upload new image</h2>
      
      {error && <div className="error-message">{error}</div>}
      
      <div className="upload-area">
        <input
          type="file"
          accept="image/*"
          onChange={handleFileSelect}
          disabled={uploading}
          id="file-input"
          className="file-input"
        />
        <label htmlFor="file-input" className="file-label">
          {preview ? (
            <img src={preview} alt="Preview" className="preview-image" />
          ) : (
            <div className="upload-placeholder">
              <span className="upload-icon">📷</span>
              <p>Click or drag image here</p>
              <p className="upload-hint">Max 10MB, JPG, PNG, GIF</p>
            </div>
          )}
        </label>
      </div>

      {selectedFile && (
        <div className="upload-actions">
          <button onClick={handleUpload} disabled={uploading} className="btn-upload">
            {uploading ? 'Feltöltés...' : 'Feltöltés'}
          </button>
          <button 
            onClick={() => {
              setSelectedFile(null);
              setPreview(null);
            }} 
            disabled={uploading}
            className="btn-cancel"
          >
            Mégse
          </button>
        </div>
      )}
    </div>
  );
}
