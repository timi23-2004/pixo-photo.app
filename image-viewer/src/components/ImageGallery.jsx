import React, { useState, useEffect } from 'react';
import { collection, query, where, orderBy, onSnapshot, deleteDoc, doc } from 'firebase/firestore';
import { ref, deleteObject } from 'firebase/storage';
import { db, storage } from '../firebase';
import { useAuth } from '../context/AuthContext';
import './ImageGallery.css';

export default function ImageGallery({ refreshTrigger, viewMode = 'all' }) {
  const [images, setImages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedImage, setSelectedImage] = useState(null);
  const { user } = useAuth();

  useEffect(() => {
    if (!user) return;

    const imagesRef = collection(db, 'images');
    const q = viewMode === 'my' 
      ? query(imagesRef, where('userId', '==', user.uid), orderBy('uploadedAt', 'desc'))
      : query(imagesRef, orderBy('uploadedAt', 'desc'));

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const imageList = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      setImages(imageList);
      setLoading(false);
    });

    return () => unsubscribe();
  }, [user, viewMode, refreshTrigger]);

  const handleDelete = async (image) => {
    if (!window.confirm('Biztosan törlöd ezt a képet?')) return;

    try {
      // Törlés Storage-ból (ha van storage path)
      if (image.storagePath) {
        const storageRef = ref(storage, image.storagePath);
        await deleteObject(storageRef);
      }

      // Törlés Firestore-ból
      await deleteDoc(doc(db, 'images', image.id));
    } catch (error) {
      console.error('Törlési hiba:', error);
      alert('Hiba történt a törlés során');
    }
  };

  if (loading) {
    return <div className="loading">Képek betöltése...</div>;
  }

  return (
    <div className="gallery-container">
      {images.length === 0 && !loading ? (
        <div className="empty-state">
          <p>📷</p>
          <p>{viewMode === 'my' ? 'Még nincs feltöltött képed' : 'Még nincs feltöltött kép'}</p>
        </div>
      ) : (
        <div className="image-grid">
          {images.map((image) => (
            <div key={image.id} className="image-card">
              <img 
                src={image.downloadURL} 
                alt={image.fileName}
                onClick={() => setSelectedImage(image)}
                className="gallery-image"
              />
              <div className="image-info">
                <p className="image-user">{image.userEmail}</p>
                {image.userId === user.uid && (
                  <button 
                    onClick={() => handleDelete(image)}
                    className="btn-delete"
                  >
                    🗑️
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {selectedImage && (
        <div className="modal" onClick={() => setSelectedImage(null)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <button className="modal-close" onClick={() => setSelectedImage(null)}>
              ✕
            </button>
            <img src={selectedImage.downloadURL} alt={selectedImage.fileName} />
            <div className="modal-info">
              <p><strong>Feltöltötte:</strong> {selectedImage.userEmail}</p>
              <p><strong>Fájlnév:</strong> {selectedImage.fileName}</p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
