'use client';

import { useState } from 'react';
import Link from 'next/link';
import { authAPI } from '@/src/services/api';

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setMessage('');

    try {
      await authAPI.requestPasswordReset(email);
      setMessage('If the email exists, a reset link has been sent.');
      setEmail('');
    } catch (err: any) {
      setError(err.response?.data?.error || 'Request failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={styles.container}>
      <div style={styles.card}>
        <h1 style={styles.title}>Forgot Password</h1>
        <p style={styles.subtitle}>Enter your account email to receive a reset link.</p>

        {error && <div style={styles.error}>{error}</div>}
        {message && <div style={styles.success}>{message}</div>}

        <form onSubmit={handleSubmit} style={styles.form}>
          <div style={styles.formGroup}>
            <label style={styles.label}>Email</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              style={styles.input}
              placeholder="you@example.com"
            />
          </div>

          <button type="submit" disabled={loading} style={styles.button}>
            {loading ? 'Sending...' : 'Send Reset Link'}
          </button>
        </form>

        <p style={styles.linkText}>
          Already have your token?{' '}
          <Link href="/reset-password" style={styles.link}>
            Reset password
          </Link>
        </p>
        <p style={styles.linkText}>
          <Link href="/login" style={styles.link}>
            Back to Login
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
    background: 'linear-gradient(120deg, #5b6ee1 0%, #2f3e8f 100%)',
  },
  card: {
    background: 'white',
    borderRadius: '10px',
    padding: '36px',
    boxShadow: '0 16px 40px rgba(25, 30, 60, 0.2)',
    width: '100%',
    maxWidth: '420px',
  },
  title: {
    textAlign: 'center',
    marginBottom: '8px',
    color: '#1f2b5c',
    fontSize: '28px',
  },
  subtitle: {
    textAlign: 'center',
    color: '#58607f',
    fontSize: '14px',
    marginBottom: '22px',
  },
  form: {
    display: 'flex',
    flexDirection: 'column',
  },
  formGroup: {
    marginBottom: '18px',
    display: 'flex',
    flexDirection: 'column',
  },
  label: {
    marginBottom: '8px',
    fontWeight: '600',
    color: '#2c3558',
  },
  input: {
    padding: '11px 12px',
    borderRadius: '6px',
    border: '1px solid #d8deef',
    fontSize: '14px',
    fontFamily: 'inherit',
  },
  button: {
    padding: '12px',
    background: '#3f51b5',
    color: 'white',
    border: 'none',
    borderRadius: '6px',
    fontWeight: '600',
    cursor: 'pointer',
    fontSize: '14px',
    marginTop: '4px',
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
    textAlign: 'center',
    marginTop: '16px',
    fontSize: '14px',
    color: '#67708e',
  },
  link: {
    color: '#3f51b5',
    textDecoration: 'underline',
    cursor: 'pointer',
  },
};
