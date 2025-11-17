import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import './Auth.css';

export default function Login({ onToggle }) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { signIn } = useAuth();

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!email || !password) {
      setError('Kérlek töltsd ki az összes mezőt');
      return;
    }

    try {
      setError('');
      setLoading(true);
      await signIn(email, password);
    } catch (err) {
      console.error(err);
      setError(getErrorMessage(err.code));
    } finally {
      setLoading(false);
    }
  };

  const getErrorMessage = (code) => {
    switch (code) {
      case 'auth/invalid-email':
        return 'Érvénytelen email cím';
      case 'auth/user-not-found':
        return 'Nincs ilyen felhasználó';
      case 'auth/wrong-password':
        return 'Hibás jelszó';
      case 'auth/invalid-credential':
        return 'Hibás email vagy jelszó';
      default:
        return 'Hiba történt a bejelentkezés során';
    }
  };

  return (
    <div className="auth-container">
      <div className="auth-card">
        <h2>Bejelentkezés</h2>
        {error && <div className="error-message">{error}</div>}
        
        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label>Email</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="email@example.com"
              disabled={loading}
            />
          </div>

          <div className="form-group">
            <label>Jelszó</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              disabled={loading}
            />
          </div>

          <button type="submit" className="btn-primary" disabled={loading}>
            {loading ? 'Bejelentkezés...' : 'Bejelentkezés'}
          </button>
        </form>

        <p className="auth-toggle">
          Nincs még fiókod? 
          <button onClick={onToggle} className="btn-link">
            Regisztrálj
          </button>
        </p>
      </div>
    </div>
  );
}
