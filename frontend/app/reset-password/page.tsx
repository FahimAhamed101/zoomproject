'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { authAPI } from '@/src/services/api';

export default function ResetPasswordPage() {
  const router = useRouter();
  const [token, setToken] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    const tokenFromQuery = new URLSearchParams(window.location.search).get('token');
    if (tokenFromQuery) {
      setToken(tokenFromQuery);
    }
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setMessage('');

    if (!token.trim()) {
      setError('Reset token is required');
      setLoading(false);
      return;
    }

    if (newPassword !== confirmPassword) {
      setError('Passwords do not match');
      setLoading(false);
      return;
    }

    try {
      await authAPI.resetPassword(token.trim(), newPassword);
      setMessage('Password reset successfully. Redirecting to login...');
      setTimeout(() => router.push('/login'), 1800);
    } catch (err: any) {
      setError(err.response?.data?.error || 'Reset failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={styles.container}>
      <div style={styles.card}>
        <h1 style={styles.title}>Reset Password</h1>
        <p style={styles.subtitle}>Set a new password for your account.</p>

        {error && <div style={styles.error}>{error}</div>}
        {message && <div style={styles.success}>{message}</div>}

        <form onSubmit={handleSubmit} style={styles.form}>
          <div style={styles.formGroup}>
            <label style={styles.label}>Reset Token</label>
            <input
              type="text"
              value={token}
              onChange={(e) => setToken(e.target.value)}
              required
              style={styles.input}
              placeholder="Paste reset token"
            />
          </div>

          <div style={styles.formGroup}>
            <label style={styles.label}>New Password</label>
            <input
              type="password"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              required
              style={styles.input}
              placeholder="At least 8 characters"
            />
          </div>

          <div style={styles.formGroup}>
            <label style={styles.label}>Confirm New Password</label>
            <input
              type="password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              required
              style={styles.input}
              placeholder="Repeat your password"
            />
          </div>

          <button type="submit" disabled={loading} style={styles.button}>
            {loading ? 'Resetting...' : 'Reset Password'}
          </button>
        </form>

        <p style={styles.linkText}>
          Need a new reset link?{' '}
          <Link href="/forgot-password" style={styles.link}>
            Request it here
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
    background: 'linear-gradient(120deg, #2a4f96 0%, #1d2d62 100%)',
  },
  card: {
    background: 'white',
    borderRadius: '10px',
    padding: '36px',
    boxShadow: '0 16px 40px rgba(22, 36, 76, 0.24)',
    width: '100%',
    maxWidth: '440px',
  },
  title: {
    textAlign: 'center',
    marginBottom: '8px',
    color: '#162e69',
    fontSize: '28px',
  },
  subtitle: {
    textAlign: 'center',
    color: '#5d6c95',
    fontSize: '14px',
    marginBottom: '22px',
  },
  form: {
    display: 'flex',
    flexDirection: 'column',
  },
  formGroup: {
    marginBottom: '16px',
    display: 'flex',
    flexDirection: 'column',
  },
  label: {
    marginBottom: '8px',
    fontWeight: '600',
    color: '#2b3658',
  },
  input: {
    padding: '11px 12px',
    borderRadius: '6px',
    border: '1px solid #d2d9ea',
    fontSize: '14px',
    fontFamily: 'inherit',
  },
  button: {
    padding: '12px',
    background: '#2a4f96',
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
    marginTop: '14px',
    fontSize: '14px',
    color: '#63729a',
  },
  link: {
    color: '#2a4f96',
    textDecoration: 'underline',
    cursor: 'pointer',
  },
};
