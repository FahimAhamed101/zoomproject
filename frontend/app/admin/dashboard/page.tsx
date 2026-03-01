'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { adminAPI } from '@/src/services/api';

const DEFAULT_FILE_TYPES = ['Image', 'Video', 'PDF', 'Audio'];

type PackageFormData = {
  name: string;
  description: string;
  maxFolders: number;
  maxNestingLevel: number;
  allowedFileTypes: string[];
  maxFileSize: number;
  totalFileLimit: number;
  filesPerFolder: number;
  price: number;
};

type SubscriptionPackage = {
  id: string;
  name: string;
  description: string;
  maxFolders: number;
  maxNestingLevel: number;
  allowedFileTypes: string[];
  maxFileSize: number;
  totalFileLimit: number;
  filesPerFolder: number;
  price: number;
};

const defaultFormData: PackageFormData = {
  name: '',
  description: '',
  maxFolders: 3,
  maxNestingLevel: 2,
  allowedFileTypes: [...DEFAULT_FILE_TYPES],
  maxFileSize: 10,
  totalFileLimit: 20,
  filesPerFolder: 10,
  price: 0,
};

const normalizeAllowedTypes = (value: unknown): string[] => {
  if (Array.isArray(value)) {
    return value.map((v) => String(v));
  }

  if (typeof value === 'string' && value.trim().length > 0) {
    return value.split(',').map((v) => v.trim()).filter(Boolean);
  }

  return [...DEFAULT_FILE_TYPES];
};

const normalizePackage = (pkg: any): SubscriptionPackage => ({
  id: String(pkg?.id || ''),
  name: String(pkg?.name || 'Unnamed Package'),
  description: String(pkg?.description || ''),
  maxFolders: Number(pkg?.maxFolders) || 0,
  maxNestingLevel: Number(pkg?.maxNestingLevel) || 0,
  allowedFileTypes: normalizeAllowedTypes(pkg?.allowedFileTypes),
  maxFileSize: Number(pkg?.maxFileSize) || 0,
  totalFileLimit: Number(pkg?.totalFileLimit) || 0,
  filesPerFolder: Number(pkg?.filesPerFolder) || 0,
  price: Number(pkg?.price) || 0,
});

export default function AdminDashboard() {
  const router = useRouter();
  const [admin, setAdmin] = useState<any>(null);
  const [packages, setPackages] = useState<SubscriptionPackage[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [activeTab, setActiveTab] = useState<'dashboard' | 'packages'>('dashboard');
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formData, setFormData] = useState<PackageFormData>(defaultFormData);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setError('');
      const adminRes = await adminAPI.getProfile();
      setAdmin(adminRes.data.data);
      const pkgsRes = await adminAPI.getAllPackages();
      const rawPackages = pkgsRes?.data?.data;
      const normalizedPackages = Array.isArray(rawPackages)
        ? rawPackages.map(normalizePackage)
        : [];
      setPackages(normalizedPackages);
    } catch (err: any) {
      if (err.response?.status === 401) {
        router.push('/admin/login');
        return;
      }
      setPackages([]);
      setError(err.response?.data?.error || 'Failed to load admin data');
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('admin');
    localStorage.removeItem('user');
    router.push('/admin/login');
  };

  const handleFileTypeChange = (type: string) => {
    setFormData((prev) => ({
      ...prev,
      allowedFileTypes: prev.allowedFileTypes.includes(type)
        ? prev.allowedFileTypes.filter((t) => t !== type)
        : [...prev.allowedFileTypes, type],
    }));
  };

  const setNumberField = (field: keyof PackageFormData, value: string, min = 0) => {
    const parsed = Number(value);
    setFormData((prev) => ({
      ...prev,
      [field]: Number.isFinite(parsed) ? Math.max(min, parsed) : min,
    }));
  };

  const validateForm = () => {
    if (!formData.name.trim()) return 'Package name is required';
    if (formData.maxFolders < 1) return 'Max folders must be at least 1';
    if (formData.maxNestingLevel < 1) return 'Max nesting level must be at least 1';
    if (formData.maxFileSize < 1) return 'Max file size must be at least 1 MB';
    if (formData.totalFileLimit < 1) return 'Total file limit must be at least 1';
    if (formData.filesPerFolder < 1) return 'Files per folder must be at least 1';
    if (formData.price < 0) return 'Price cannot be negative';
    if (formData.allowedFileTypes.length === 0) return 'Select at least one file type';
    return '';
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    const validationError = validateForm();
    if (validationError) {
      setError(validationError);
      return;
    }

    const payload = {
      ...formData,
      name: formData.name.trim(),
      description: formData.description.trim(),
      maxFolders: Math.floor(formData.maxFolders),
      maxNestingLevel: Math.floor(formData.maxNestingLevel),
      maxFileSize: Math.floor(formData.maxFileSize),
      totalFileLimit: Math.floor(formData.totalFileLimit),
      filesPerFolder: Math.floor(formData.filesPerFolder),
    };

    try {
      setSubmitting(true);
      if (editingId) {
        await adminAPI.updatePackage(editingId, payload);
        setSuccess('Package updated successfully');
      } else {
        await adminAPI.createPackage(payload);
        setSuccess('Package created successfully');
      }

      resetForm();
      await loadData();
      setActiveTab('packages');
    } catch (err: any) {
      setError(err.response?.data?.error || 'Operation failed');
    } finally {
      setSubmitting(false);
    }
  };

  const resetForm = () => {
    setFormData(defaultFormData);
    setShowCreateForm(false);
    setEditingId(null);
  };

  const handleEdit = (pkg: SubscriptionPackage) => {
    setError('');
    setSuccess('');
    setFormData({
      name: pkg?.name || '',
      description: pkg?.description || '',
      maxFolders: Number(pkg?.maxFolders) || 1,
      maxNestingLevel: Number(pkg?.maxNestingLevel) || 1,
      allowedFileTypes: Array.isArray(pkg?.allowedFileTypes) && pkg.allowedFileTypes.length
        ? pkg.allowedFileTypes
        : [...DEFAULT_FILE_TYPES],
      maxFileSize: Number(pkg?.maxFileSize) || 1,
      totalFileLimit: Number(pkg?.totalFileLimit) || 1,
      filesPerFolder: Number(pkg?.filesPerFolder) || 1,
      price: Number(pkg?.price) || 0,
    });
    setEditingId(pkg.id);
    setShowCreateForm(true);
    setActiveTab('packages');
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this package?')) return;

    try {
      setError('');
      setSuccess('');
      await adminAPI.deletePackage(id);
      await loadData();
      setSuccess('Package deleted successfully');
    } catch (err: any) {
      setError(err.response?.data?.error || 'Delete failed');
    }
  };

  if (loading) {
    return <div style={styles.loading}>Loading...</div>;
  }

  return (
    <div style={styles.container}>
      <nav style={styles.navbar}>
        <h1 style={styles.logo}>Zoomit Admin</h1>
        <div style={styles.userInfo}>
          <span>{admin?.email}</span>
          <button onClick={handleLogout} style={styles.logoutBtn}>Logout</button>
        </div>
      </nav>

      <div style={styles.content}>
        <div style={styles.sidebar}>
          <button
            onClick={() => setActiveTab('dashboard')}
            style={{
              ...styles.tabBtn,
              ...(activeTab === 'dashboard' ? styles.tabBtnActive : {}),
            }}
          >
            Dashboard
          </button>
          <button
            onClick={() => setActiveTab('packages')}
            style={{
              ...styles.tabBtn,
              ...(activeTab === 'packages' ? styles.tabBtnActive : {}),
            }}
          >
            Subscription Packages
          </button>
        </div>

        <div style={styles.mainContent}>
          {error && <div style={styles.errorBox}>{error}</div>}
          {success && <div style={styles.successBox}>{success}</div>}

          {activeTab === 'dashboard' && (
            <div>
              <h2 style={styles.sectionTitle}>Admin Dashboard</h2>
              <p style={styles.welcomeText}>Manage subscription packages and system settings</p>
              <div style={styles.statsGrid}>
                <div style={styles.statCard}>
                  <h3>Total Packages</h3>
                  <p style={styles.statNumber}>{packages.length}</p>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'packages' && (
            <div>
              <div style={styles.header}>
                <h2 style={styles.sectionTitle}>Subscription Packages</h2>
                <button
                  onClick={() => {
                    setShowCreateForm(!showCreateForm);
                    if (showCreateForm) resetForm();
                  }}
                  style={styles.createBtn}
                >
                 New Package
                </button>
              </div>

              {showCreateForm && (
                <form onSubmit={handleSubmit} style={styles.form}>
                  <div style={styles.formGrid}>
                    <div style={styles.formGroup}>
                      <label>Package Name</label>
                      <input
                        type="text"
                        value={formData.name}
                        onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                        required
                        style={styles.input}
                      />
                    </div>

                    <div style={styles.formGroup}>
                      <label>Description</label>
                      <input
                        type="text"
                        value={formData.description}
                        onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                        style={styles.input}
                      />
                    </div>

                    <div style={styles.formGroup}>
                      <label>Price ($/month)</label>
                      <input
                        type="number"
                        min={0}
                        step="0.01"
                        value={formData.price}
                        onChange={(e) => setNumberField('price', e.target.value, 0)}
                        style={styles.input}
                      />
                    </div>

                    <div style={styles.formGroup}>
                      <label>Max Folders</label>
                      <input
                        type="number"
                        min={1}
                        value={formData.maxFolders}
                        onChange={(e) => setNumberField('maxFolders', e.target.value, 1)}
                        required
                        style={styles.input}
                      />
                    </div>

                    <div style={styles.formGroup}>
                      <label>Max Nesting Level</label>
                      <input
                        type="number"
                        min={1}
                        value={formData.maxNestingLevel}
                        onChange={(e) => setNumberField('maxNestingLevel', e.target.value, 1)}
                        required
                        style={styles.input}
                      />
                    </div>

                    <div style={styles.formGroup}>
                      <label>Max File Size (MB)</label>
                      <input
                        type="number"
                        min={1}
                        value={formData.maxFileSize}
                        onChange={(e) => setNumberField('maxFileSize', e.target.value, 1)}
                        required
                        style={styles.input}
                      />
                    </div>

                    <div style={styles.formGroup}>
                      <label>Total File Limit</label>
                      <input
                        type="number"
                        min={1}
                        value={formData.totalFileLimit}
                        onChange={(e) => setNumberField('totalFileLimit', e.target.value, 1)}
                        required
                        style={styles.input}
                      />
                    </div>

                    <div style={styles.formGroup}>
                      <label>Files Per Folder</label>
                      <input
                        type="number"
                        min={1}
                        value={formData.filesPerFolder}
                        onChange={(e) => setNumberField('filesPerFolder', e.target.value, 1)}
                        required
                        style={styles.input}
                      />
                    </div>
                  </div>

                  <div style={styles.fileTypesGroup}>
                    <label>Allowed File Types</label>
                    <div style={styles.checkboxGroup}>
                      {DEFAULT_FILE_TYPES.map((type) => (
                        <label key={type} style={styles.checkboxLabel}>
                          <input
                            type="checkbox"
                            checked={formData.allowedFileTypes.includes(type)}
                            onChange={() => handleFileTypeChange(type)}
                          />
                          {type}
                        </label>
                      ))}
                    </div>
                  </div>

                  <button type="submit" disabled={submitting} style={styles.submitBtn}>
                    {submitting ? 'Saving...' : editingId ? 'Update Package' : 'Create Package'}
                  </button>
                </form>
              )}

              <div style={styles.packagesTable}>
                {packages.length === 0 && (
                  <div style={styles.emptyState}>No packages found. Create your first package.</div>
                )}
                {packages.map((pkg) => (
                  <div key={pkg.id} style={styles.packageRow}>
                    <div style={styles.packageInfo}>
                      <h3>{pkg.name}</h3>
                      <p>{pkg.description || 'No description'}</p>
                      <small>Price: ${pkg.price}/month</small>
                    </div>
                    <div style={styles.packageLimits}>
                      <p>Folders: {pkg.maxFolders}</p>
                      <p>Nesting: {pkg.maxNestingLevel}</p>
                      <p>File Size: {pkg.maxFileSize}MB</p>
                      <p>Total Files: {pkg.totalFileLimit}</p>
                      <p>Files/Folder: {pkg.filesPerFolder}</p>
                      <p>Types: {pkg.allowedFileTypes.length ? pkg.allowedFileTypes.join(', ') : 'N/A'}</p>
                    </div>
                    <div style={styles.packageActions}>
                      <button onClick={() => handleEdit(pkg)} style={styles.editBtn}>
                        Edit
                      </button>
                      <button onClick={() => handleDelete(pkg.id)} style={styles.deleteBtn}>
                        Delete
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

const styles: Record<string, React.CSSProperties> = {
  container: {
    display: 'flex',
    flexDirection: 'column',
    minHeight: '100vh',
    background: '#f5f5f5',
  },
  navbar: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: '20px 40px',
    background: '#333',
    color: 'white',
  },
  logo: {
    fontSize: '24px',
    fontWeight: 'bold',
  },
  userInfo: {
    display: 'flex',
    gap: '20px',
    alignItems: 'center',
  },
  logoutBtn: {
    padding: '8px 16px',
    background: '#e74c3c',
    color: 'white',
    border: 'none',
    borderRadius: '4px',
    cursor: 'pointer',
  },
  content: {
    display: 'flex',
    flex: 1,
  },
  sidebar: {
    width: '220px',
    background: 'white',
    padding: '20px',
    borderRight: '1px solid #ddd',
  },
  tabBtn: {
    display: 'block',
    width: '100%',
    padding: '12px',
    marginBottom: '10px',
    border: 'none',
    background: '#f5f5f5',
    textAlign: 'left',
    cursor: 'pointer',
    borderRadius: '4px',
  },
  tabBtnActive: {
    background: '#667eea',
    color: 'white',
  },
  mainContent: {
    flex: 1,
    padding: '40px',
  },
  sectionTitle: {
    marginBottom: '20px',
    color: '#333',
  },
  errorBox: {
    background: '#fee',
    color: '#b30000',
    padding: '12px',
    borderRadius: '4px',
    marginBottom: '16px',
  },
  successBox: {
    background: '#eefbf1',
    color: '#0f6d2f',
    padding: '12px',
    borderRadius: '4px',
    marginBottom: '16px',
  },
  welcomeText: {
    color: '#666',
    marginBottom: '30px',
  },
  statsGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))',
    gap: '20px',
  },
  statCard: {
    background: 'white',
    padding: '20px',
    borderRadius: '8px',
    boxShadow: '0 2px 10px rgba(0,0,0,0.05)',
  },
  statNumber: {
    fontSize: '32px',
    fontWeight: 'bold',
    color: '#667eea',
    marginTop: '10px',
  },
  loading: {
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    minHeight: '100vh',
    fontSize: '18px',
  },
  header: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '30px',
  },
  createBtn: {
    padding: '10px 20px',
    background: '#667eea',
    color: 'white',
    border: 'none',
    borderRadius: '4px',
    cursor: 'pointer',
  },
  form: {
    background: 'white',
    padding: '20px',
    borderRadius: '8px',
    marginBottom: '30px',
    boxShadow: '0 2px 10px rgba(0,0,0,0.05)',
  },
  formGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
    gap: '20px',
    marginBottom: '20px',
  },
  formGroup: {
    display: 'flex',
    flexDirection: 'column',
  },
  input: {
    padding: '10px',
    border: '1px solid #ddd',
    borderRadius: '4px',
    marginTop: '5px',
  },
  fileTypesGroup: {
    marginBottom: '20px',
  },
  checkboxGroup: {
    display: 'flex',
    gap: '20px',
    marginTop: '10px',
    flexWrap: 'wrap',
  },
  checkboxLabel: {
    display: 'flex',
    gap: '8px',
    cursor: 'pointer',
  },
  submitBtn: {
    padding: '12px 20px',
    background: '#667eea',
    color: 'white',
    border: 'none',
    borderRadius: '4px',
    cursor: 'pointer',
    fontWeight: 'bold',
  },
  packagesTable: {
    background: 'white',
    borderRadius: '8px',
    overflow: 'hidden',
  },
  emptyState: {
    padding: '20px',
    color: '#666',
    fontSize: '14px',
    textAlign: 'center',
  },
  packageRow: {
    display: 'flex',
    padding: '20px',
    borderBottom: '1px solid #eee',
    gap: '20px',
  },
  packageInfo: {
    flex: 1,
  },
  packageLimits: {
    flex: 1,
    fontSize: '14px',
  },
  packageActions: {
    display: 'flex',
    gap: '10px',
  },
  editBtn: {
    padding: '8px 12px',
    background: '#f39c12',
    color: 'white',
    border: 'none',
    borderRadius: '4px',
    cursor: 'pointer',
  },
  deleteBtn: {
    padding: '8px 12px',
    background: '#e74c3c',
    color: 'white',
    border: 'none',
    borderRadius: '4px',
    cursor: 'pointer',
  },
};
