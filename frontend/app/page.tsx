'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';

export default function Home() {
  const router = useRouter();

  useEffect(() => {
    const token = localStorage.getItem('token');
    const admin = localStorage.getItem('admin');
    const user = localStorage.getItem('user');

    if (token && admin) {
      router.push('/admin/dashboard');
      return;
    }

    if (token && user) {
      router.push('/dashboard');
    }
  }, [router]);

  return (
    <div style={styles.container}>
      <div style={styles.content}>
        <h1 style={styles.title}>Welcome to Zoomit</h1>
        <p style={styles.subtitle}>Secure File & Folder Management with Flexible Subscription Plans</p>
        
        <div style={styles.features}>
          <div style={styles.feature}>
            <div style={styles.icon}>🔒</div>
            <h3>Secure Storage</h3>
            <p>Your files are encrypted and stored securely</p>
          </div>
          <div style={styles.feature}>
            <div style={styles.icon}>📦</div>
            <h3>Flexible Plans</h3>
            <p>Choose from Free, Silver, Gold, or Diamond plans</p>
          </div>
          <div style={styles.feature}>
            <div style={styles.icon}>⚡</div>
            <h3>Fast Uploads</h3>
            <p>Quick and easy file uploading with drag & drop</p>
          </div>
          <div style={styles.feature}>
            <div style={styles.icon}>📊</div>
            <h3>Organization</h3>
            <p>Organize files in unlimited folder hierarchies</p>
          </div>
        </div>

        <div style={styles.actions}>
          <Link href="/register" style={{...styles.button, ...styles.primaryBtn}}>
            Get Started
          </Link>
          <Link href="/login" style={{...styles.button, ...styles.secondaryBtn}}>
            Sign In
          </Link>
        </div>
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
    background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
    padding: '20px',
  },
  content: {
    textAlign: 'center',
    color: 'white',
    maxWidth: '800px',
  },
  title: {
    fontSize: '48px',
    fontWeight: 'bold',
    marginBottom: '10px',
  },
  subtitle: {
    fontSize: '20px',
    marginBottom: '40px',
    opacity: 0.9,
  },
  features: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
    gap: '20px',
    marginBottom: '40px',
  },
  feature: {
    background: 'rgba(255, 255, 255, 0.1)',
    padding: '20px',
    borderRadius: '8px',
    backdropFilter: 'blur(10px)',
  },
  icon: {
    fontSize: '40px',
    marginBottom: '10px',
  },
  actions: {
    display: 'flex',
    gap: '20px',
    justifyContent: 'center',
  },
  button: {
    padding: '15px 30px',
    borderRadius: '8px',
    textDecoration: 'none',
    fontWeight: 'bold',
    fontSize: '16px',
    display: 'inline-block',
    cursor: 'pointer',
    border: 'none',
  },
  primaryBtn: {
    background: 'white',
    color: '#667eea',
  },
  secondaryBtn: {
    background: 'rgba(255, 255, 255, 0.2)',
    color: 'white',
    border: '2px solid white',
  },
};
