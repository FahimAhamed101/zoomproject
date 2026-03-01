'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { authAPI } from '@/src/services/api';

type VerifyStatus = 'loading' | 'success' | 'error' | 'idle';

export default function VerifyEmailPage() {
  const [token, setToken] = useState('');
  const [checkedToken, setCheckedToken] = useState(false);
  const [status, setStatus] = useState<VerifyStatus>('idle');
  const [message, setMessage] = useState('');

  useEffect(() => {
    const tokenFromQuery = new URLSearchParams(window.location.search).get('token') || '';
    setToken(tokenFromQuery);
    setCheckedToken(true);
  }, []);

  useEffect(() => {
    if (!checkedToken) {
      return;
    }

    if (!token) {
      setStatus('error');
      setMessage('Verification token is missing.');
      return;
    }

    const runVerification = async () => {
      try {
        setStatus('loading');
        const res = await authAPI.verifyEmail(token);
        setStatus('success');
        setMessage(res.data?.data?.message || 'Email verified successfully.');
      } catch (err: any) {
        setStatus('error');
        setMessage(err.response?.data?.error || 'Email verification failed.');
      }
    };

    runVerification();
  }, [token, checkedToken]);

  return (
    <div style={styles.container}>
      <div style={styles.card}>
        <h1 style={styles.title}>Email Verification</h1>

        {status === 'loading' && <p style={styles.info}>Verifying your email...</p>}
        {status === 'success' && <div style={styles.success}>{message}</div>}
        {status === 'error' && <div style={styles.error}>{message}</div>}

        <p style={styles.linkText}>
          <Link href="/login" style={styles.link}>
            Continue to Login
          </Link>
        </p>
        <p style={styles.linkText}>
          <Link href="/register" style={styles.link}>
            Back to Register
          </Link>
        </p>
      </div>
    </div>
  );
}

const styles: Record<string, React.CSSProperties> = {
  container: {
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    minHeight: '100vh',
    padding: '20px',
    background: 'linear-gradient(120deg, #2b667e 0%, #1d4352 100%)',
  },
  card: {
    background: 'white',
    borderRadius: '10px',
    padding: '36px',
    boxShadow: '0 16px 40px rgba(16, 45, 54, 0.24)',
    width: '100%',
    maxWidth: '420px',
    textAlign: 'center',
  },
  title: {
    marginBottom: '14px',
    color: '#16495d',
    fontSize: '28px',
  },
  info: {
    color: '#425a74',
    fontSize: '15px',
    marginBottom: '18px',
  },
  error: {
    background: '#fff0f0',
    color: '#bf2f2f',
    padding: '12px',
    borderRadius: '6px',
    marginBottom: '16px',
    fontSize: '14px',
  },
  success: {
    background: '#eefcf2',
    color: '#21834e',
    padding: '12px',
    borderRadius: '6px',
    marginBottom: '16px',
    fontSize: '14px',
  },
  linkText: {
    marginTop: '14px',
    fontSize: '14px',
    color: '#63729a',
  },
  link: {
    color: '#2b667e',
    textDecoration: 'underline',
    cursor: 'pointer',
  },
};
