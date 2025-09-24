import React from 'react';

type Props = {
  open: boolean;
  onClose: () => void;
  qrValue: string | null;
  state: 'idle' | 'qr' | 'connected' | 'error';
  error?: string | null;
  expiresIn?: number;
  onRetry?: () => void;
};

export default function MinimalQRModal({ 
  open, 
  onClose, 
  qrValue, 
  state, 
  error, 
  expiresIn = 90, 
  onRetry 
}: Props) {
  console.log('MinimalQRModal render:', { open, qrValue, state });

  if (!open) {
    console.log('MinimalQRModal: not open, returning null');
    return null;
  }

  console.log('MinimalQRModal: rendering modal');

  return (
    <div style={{
      position: 'fixed',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      backgroundColor: 'rgba(0, 0, 0, 0.5)',
      zIndex: 9999,
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center'
    }}>
      <div style={{
        backgroundColor: 'white',
        padding: '20px',
        borderRadius: '8px',
        maxWidth: '400px',
        width: '90%',
        textAlign: 'center'
      }}>
        <h3>QR Code Modal</h3>
        <p>State: {state}</p>
        <p>QR Value: {qrValue ? 'Present' : 'Not present'}</p>
        <p>Expires in: {expiresIn}s</p>
        
        {qrValue && (
          <div style={{ margin: '20px 0' }}>
            <p>QR Code would be here:</p>
            <div style={{ 
              width: '200px', 
              height: '200px', 
              backgroundColor: '#f0f0f0', 
              margin: '0 auto',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              border: '1px solid #ccc'
            }}>
              QR Code
            </div>
          </div>
        )}
        
        <button 
          onClick={onClose}
          style={{
            padding: '10px 20px',
            backgroundColor: '#007bff',
            color: 'white',
            border: 'none',
            borderRadius: '4px',
            cursor: 'pointer'
          }}
        >
          Close
        </button>
      </div>
    </div>
  );
}
