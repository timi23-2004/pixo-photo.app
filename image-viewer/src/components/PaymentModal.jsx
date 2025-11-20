import React, { useState } from 'react';
import { loadStripe } from '@stripe/stripe-js';
import { Elements, CardElement, useStripe, useElements } from '@stripe/react-stripe-js';
import { getAuth } from 'firebase/auth';
import './PaymentModal.css';

// Stripe public key (később .env-be tesszük)
const stripePromise = loadStripe(import.meta.env.VITE_STRIPE_PUBLIC_KEY || 'pk_test_your_key_here');

function CheckoutForm({ amount, onSuccess, onCancel, imageData }) {
  const stripe = useStripe();
  const elements = useElements();
  const [error, setError] = useState(null);
  const [processing, setProcessing] = useState(false);

  const handleSubmit = async (event) => {
    event.preventDefault();

    if (!stripe || !elements) {
      return;
    }

    setProcessing(true);
    setError(null);

    try {
      // HTTP Function hívás - Payment Intent létrehozása CORS-szal
      const endpoint = `https://us-central1-${import.meta.env.VITE_FIREBASE_PROJECT_ID}.cloudfunctions.net/createPaymentIntentHttp`;
      const auth = getAuth();
      const currentUser = auth.currentUser;
      if (!currentUser) {
        setError('You need to login to pay');
        setProcessing(false);
        return;
      }
      const idToken = await currentUser.getIdToken();

      const resp = await fetch(endpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${idToken}`,
        },
        body: JSON.stringify({
          amount: amount,
          currency: 'usd',
          imageId: imageData.id,
          fileName: imageData.fileName,
        }),
      });
      const data = await resp.json();
      if (!resp.ok) {
        throw new Error(data?.error || 'Payment error');
      }
      const { clientSecret } = data;

      const { error: stripeError, paymentIntent } = await stripe.confirmCardPayment(clientSecret, {
        payment_method: {
          card: elements.getElement(CardElement)
        },
      });

      if (stripeError) {
        setError(stripeError.message);
        setProcessing(false);
      } else if (paymentIntent.status === 'succeeded') {
        onSuccess(paymentIntent);
      }
    } catch (err) {
      console.error('Payment error:', err);
      setError(err.message || 'Payment error occurred');
      setProcessing(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="payment-form">
      <div className="payment-header">
        <h3>HD Image Purchase</h3>
        <p className="payment-amount">${(amount / 100).toFixed(2)}</p>
      </div>

      <div className="payment-details">
        <p><strong>Image:</strong> {imageData.fileName}</p>
        <p><strong>Quality:</strong> HD (Original size)</p>
      </div>

      <div className="card-element-wrapper">
        <label>Card details</label>
        <CardElement
          options={{
            hidePostalCode: true,
            style: {
              base: {
                fontSize: '16px',
                color: '#424770',
                '::placeholder': {
                  color: '#aab7c4',
                },
              },
              invalid: {
                color: '#9e2146',
              },
            },
          }}
        />
      </div>

      {error && <div className="payment-error">{error}</div>}

      <div className="payment-actions">
        <button 
          type="button" 
          onClick={onCancel} 
          className="btn-cancel"
          disabled={processing}
        >
          Cancel
        </button>
        <button 
          type="submit" 
          disabled={!stripe || processing}
          className="btn-pay"
        >
          {processing ? 'Processing...' : 'Pay'}
        </button>
      </div>
    </form>
  );
}

export default function PaymentModal({ isOpen, onClose, onSuccess, imageData, amount = 100 }) {
  if (!isOpen) return null;

  return (
    <div className="payment-modal-overlay" onClick={onClose}>
      <div className="payment-modal-content" onClick={(e) => e.stopPropagation()}>
        <button className="payment-modal-close" onClick={onClose}>✕</button>
        <Elements stripe={stripePromise}>
          <CheckoutForm 
            amount={amount} 
            onSuccess={onSuccess}
            onCancel={onClose}
            imageData={imageData}
          />
        </Elements>
      </div>
    </div>
  );
}
