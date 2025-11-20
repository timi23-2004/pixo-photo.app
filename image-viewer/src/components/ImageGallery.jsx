import React, { useState, useEffect, useRef, useCallback } from 'react';
import { collection, query, where, orderBy, onSnapshot, deleteDoc, doc, limit, setDoc, getDocs } from 'firebase/firestore';
import { ref, deleteObject } from 'firebase/storage';
import { db, storage } from '../firebase';
import { useAuth } from '../context/AuthContext';
import PaymentModal from './PaymentModal';
import './ImageGallery.css';

export default function ImageGallery({ refreshTrigger, viewMode = 'all' }) {
  const [images, setImages] = useState([]);
  const [displayedImages, setDisplayedImages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedImage, setSelectedImage] = useState(null);
  const [page, setPage] = useState(1);
  const [previousLength, setPreviousLength] = useState(-1);
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [purchasedImages, setPurchasedImages] = useState(new Set());
  const { user } = useAuth();
  const observer = useRef();
  const IMAGES_PER_PAGE = 20;

  // Megvásárolt képek betöltése
  useEffect(() => {
    if (!user) return;

    const loadPurchases = async () => {
      const purchasesRef = collection(db, 'purchases');
      const q = query(purchasesRef, where('userId', '==', user.uid));
      const snapshot = await getDocs(q);
      const purchased = new Set(snapshot.docs.map(doc => doc.data().imageId));
      setPurchasedImages(purchased);
    };

    loadPurchases();
  }, [user]);

  useEffect(() => {
    if (!user) {
      setLoading(false);
      return;
    }

    setLoading(true);
    const imagesRef = collection(db, 'images');
    const q = viewMode === 'my' 
      ? query(imagesRef, where('userId', '==', user.uid), orderBy('uploadedAt', 'desc'))
      : query(imagesRef, orderBy('uploadedAt', 'desc'));

    const unsubscribe = onSnapshot(q, (snapshot) => {
      setLoading(false);
      const imageList = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        isHD: purchasedImages.has(doc.id)
      }));
      setImages(imageList);
      setDisplayedImages(imageList.slice(0, IMAGES_PER_PAGE));
      setPage(1);
    });

    return () => unsubscribe();
  }, [user, viewMode, refreshTrigger, purchasedImages]);

  // Végtelen scroll - következő oldal betöltése
  useEffect(() => {
    if (images.length === 0) return;
    const endIndex = page * IMAGES_PER_PAGE;
    const newDisplayed = images.slice(0, endIndex);
    
    if (newDisplayed.length > displayedImages.length) {
      setPreviousLength(displayedImages.length > 0 ? displayedImages.length : 0);
    }
    setDisplayedImages(newDisplayed);
  }, [page, images]);

  // Utolsó elem megfigyelése
  const lastImageRef = useCallback((node) => {
    if (loading) return;
    if (observer.current) observer.current.disconnect();
    
    observer.current = new IntersectionObserver((entries) => {
      if (entries[0].isIntersecting && displayedImages.length < images.length) {
        setPage(prevPage => prevPage + 1);
      }
    });
    
    if (node) observer.current.observe(node);
  }, [loading, displayedImages.length, images.length]);

  const handleDelete = async (image) => {
    if (!window.confirm('Delete this image?')) return;

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

  const handleHDView = () => {
    setShowPaymentModal(true);
  };

  const handlePaymentSuccess = async (paymentIntent) => {
    setShowPaymentModal(false);
    
    // Vásárlás mentése Firestore-ba
    try {
      const purchaseRef = doc(db, 'purchases', `${user.uid}_${selectedImage.id}`);
      await setDoc(purchaseRef, {
        userId: user.uid,
        imageId: selectedImage.id,
        paymentIntentId: paymentIntent.id,
        amount: paymentIntent.amount,
        currency: paymentIntent.currency,
        purchasedAt: new Date().toISOString(),
        imageFileName: selectedImage.fileName
      });

      // Frissítjük a megvásárolt képek listáját
      setPurchasedImages(prev => new Set([...prev, selectedImage.id]));

      // HD megtekintés - frissítjük a modal képét magasabb felbontásra
      const hdUrl = selectedImage.downloadURL.replace(/\/\d+\/\d+/, '/1920/1080');
      setSelectedImage({
        ...selectedImage,
        downloadURL: hdUrl,
        isHD: true
      });

      alert('Purchase successful! Now viewing in HD quality.');
    } catch (error) {
      console.error('Purchase save failed:', error);
      alert('Payment successful, but save failed.');
    }
  };

  if (loading) {
    return <div className="loading">Loading images...</div>;
  }

  return (
    <div className="gallery-container">
      {images.length === 0 && !loading ? (
        <div className="empty-state">
          <div className="empty-icon">📷</div>
          <h3>{viewMode === 'my' ? 'No uploaded images yet' : 'No images available'}</h3>
        </div>
      ) : (
        <>
          <div className="image-grid">
            {displayedImages.map((image, index) => {
              const isNewImage = index >= previousLength && previousLength >= 0;
              const animationDelay = isNewImage ? `${(index - previousLength) * 0.05}s` : '0s';
              return (
              <div 
                key={`${image.id}-${index}`}
                className={`image-card ${isNewImage ? 'fade-in' : ''}`}
                style={{ animationDelay }}
              >
                <img 
                  src={image.thumbnailURL || image.downloadURL} 
                  alt={image.fileName}
                  onClick={() => setSelectedImage(image)}
                  className="gallery-image"
                  loading="lazy"
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
            );
            })}
          </div>
          {displayedImages.length < images.length && (
            <div className="loading-more" ref={lastImageRef}>Loading more images...</div>
          )}
        </>
      )}

      {selectedImage && (
        <div className="modal" onClick={() => setSelectedImage(null)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <button className="modal-close" onClick={() => setSelectedImage(null)}>
              ✕
            </button>
            <img 
              src={selectedImage.isHD ? selectedImage.downloadURL : (selectedImage.thumbnailURL || selectedImage.downloadURL)} 
              alt={selectedImage.fileName} 
            />
            <div className="modal-info">
              <p><strong>Uploaded by:</strong> {selectedImage.userEmail}</p>
              <p><strong>Filename:</strong> {selectedImage.fileName}</p>
              {selectedImage.isHD && <p className="hd-badge">✓ HD Quality</p>}
              
              <div className="download-buttons">
                <button 
                  onClick={handleHDView}
                  className="btn-download-hd"
                  disabled={selectedImage?.isHD}
                >
                  {selectedImage?.isHD ? '✓ HD Active' : '💎 HD View'}
                  <span className="download-price">{selectedImage?.isHD ? 'Purchased' : '$1.00'}</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      <PaymentModal
        isOpen={showPaymentModal}
        onClose={() => setShowPaymentModal(false)}
        onSuccess={handlePaymentSuccess}
        imageData={selectedImage}
        amount={100}
      />
    </div>
  );
}
