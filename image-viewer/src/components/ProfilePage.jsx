import React from 'react';
import { useAuth } from '../context/AuthContext';
import ImageGallery from './ImageGallery';
import './ProfilePage.css';

export default function ProfilePage() {
  const { user, signOut } = useAuth();

  const handleSignOut = async () => {
    try {
      await signOut();
    } catch (error) {
      console.error('Logout error:', error);
    }
  };

  return (
    <div className="page-container">
      <div className="profile-header">
        <div className="profile-info">
          <div className="profile-avatar">
            {user?.email?.charAt(0).toUpperCase()}
          </div>
          <div className="profile-details">
            <h2>{user?.email}</h2>
            <p className="profile-joined">Joined the community</p>
          </div>
        </div>
        <button onClick={handleSignOut} className="btn-signout">
          Logout
        </button>
      </div>

      <div className="profile-content">
        <h3>My Uploads</h3>
        <ImageGallery viewMode="my" />
      </div>
    </div>
  );
}
