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

      // Lorem Picsum random kép URL generálása (400-800px szélesség, 300-600px magasság)
      const width = Math.floor(Math.random() * 400) + 400;
      const height = Math.floor(Math.random() * 300) + 300;
      const randomId = Math.floor(Math.random() * 1000);
      const loremPicsumURL = `https://picsum.photos/id/${randomId}/${width}/${height}`;

      // Csak metaadatok mentése Firestore-ba (nem töltünk fel Storage-ba)
      await addDoc(collection(db, 'images'), {
        userId: user.uid,
        userEmail: user.email,
        fileName: selectedFile.name,
        storagePath: null, // Nincs Storage path
        downloadURL: loremPicsumURL,
        uploadedAt: serverTimestamp()
      });

      // Reset
      setSelectedFile(null);
      setPreview(null);
      if (onUploadSuccess) onUploadSuccess();
      
    } catch (err) {
      console.error('Feltöltési hiba:', err);
      setError('Hiba történt a feltöltés során');
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="upload-container">
      <h2>Új kép feltöltése</h2>
      
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
              <p>Kattints vagy húzd ide a képet</p>
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
