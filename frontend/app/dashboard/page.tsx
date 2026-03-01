'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { userAPI } from '@/src/services/api';
import { API_BASE_URL } from '@/src/config';

export default function DashboardPage() {
  const router = useRouter();
  const [user, setUser] = useState<any>(null);
  const [currentPackage, setCurrentPackage] = useState<any>(null);
  const [packages, setPackages] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'dashboard' | 'packages' | 'files'>('dashboard');

  useEffect(() => {
    const loadData = async () => {
      try {
        const userStr = localStorage.getItem('user');
        if (userStr) {
          setUser(JSON.parse(userStr));
        }

        const currentPkgRes = await userAPI.getCurrentSubscription();
        setCurrentPackage(currentPkgRes.data.data);

        const pkgsRes = await userAPI.getPublicPackages();
        setPackages(pkgsRes.data.data);
      } catch (err: any) {
        if (err.response?.status === 401) {
          router.push('/login');
        }
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, [router]);

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    localStorage.removeItem('admin');
    router.push('/login');
  };

  const handleSelectPackage = async (packageId: string) => {
    try {
      const res = await userAPI.assignSubscription(packageId);
      setCurrentPackage(res.data.data.package);
      alert('Subscription updated successfully');
    } catch (err: any) {
      alert(err.response?.data?.error || 'Failed to update subscription');
    }
  };

  if (loading) {
    return <div style={styles.loading}>Loading...</div>;
  }

  return (
    <div style={styles.container}>
      <nav style={styles.navbar}>
        <h1 style={styles.logo}>Zoomit</h1>
        <div style={styles.userInfo}>
          <span>{user?.email}</span>
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
            Packages
          </button>
          <button
            onClick={() => setActiveTab('files')}
            style={{
              ...styles.tabBtn,
              ...(activeTab === 'files' ? styles.tabBtnActive : {}),
            }}
          >
            Files and Folders
          </button>
        </div>

        <div style={styles.mainContent}>
          {activeTab === 'dashboard' && (
            <div>
              <h2 style={styles.sectionTitle}>Current Subscription</h2>
              {currentPackage ? (
                <div style={styles.packageCard}>
                  <h3 style={styles.packageName}>{currentPackage.name}</h3>
                  <p style={styles.packageDetail}>Max Folders: {currentPackage.maxFolders}</p>
                  <p style={styles.packageDetail}>Max Nesting Level: {currentPackage.maxNestingLevel}</p>
                  <p style={styles.packageDetail}>Allowed File Types: {currentPackage.allowedFileTypes.join(', ')}</p>
                  <p style={styles.packageDetail}>Max File Size: {currentPackage.maxFileSize} MB</p>
                  <p style={styles.packageDetail}>Total File Limit: {currentPackage.totalFileLimit}</p>
                  <p style={styles.packageDetail}>Files Per Folder: {currentPackage.filesPerFolder}</p>
                </div>
              ) : (
                <p style={styles.noPackage}>No subscription selected yet.</p>
              )}
            </div>
          )}

          {activeTab === 'packages' && (
            <div>
              <h2 style={styles.sectionTitle}>Choose Your Subscription Plan</h2>
              <div style={styles.packagesGrid}>
                {packages.map((pkg) => (
                  <div key={pkg.id} style={styles.packageCard}>
                    <h3 style={styles.packageName}>{pkg.name}</h3>
                    <p style={styles.packagePrice}>${pkg.price}/month</p>
                    <p style={styles.packageDetail}>Max Folders: {pkg.maxFolders}</p>
                    <p style={styles.packageDetail}>Max Nesting: {pkg.maxNestingLevel}</p>
                    <p style={styles.packageDetail}>File Types: {pkg.allowedFileTypes.join(', ')}</p>
                    <p style={styles.packageDetail}>Max File Size: {pkg.maxFileSize} MB</p>
                    <p style={styles.packageDetail}>Total Files: {pkg.totalFileLimit}</p>
                    <p style={styles.packageDetail}>Files/Folder: {pkg.filesPerFolder}</p>
                    <button
                      onClick={() => handleSelectPackage(pkg.id)}
                      disabled={currentPackage?.id === pkg.id}
                      style={{
                        ...styles.selectBtn,
                        ...(currentPackage?.id === pkg.id ? styles.selectBtnDisabled : {}),
                      }}
                    >
                      {currentPackage?.id === pkg.id ? 'Current Plan' : 'Select Plan'}
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {activeTab === 'files' && (
            <div>
              <h2 style={styles.sectionTitle}>Files and Folders Management</h2>
              <FilesManagement />
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function FilesManagement() {
  const [folders, setFolders] = useState<any[]>([]);
  const [files, setFiles] = useState<any[]>([]);
  const [currentFolder, setCurrentFolder] = useState<any>(null);
  const [newFolderName, setNewFolderName] = useState('');
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [selectedFileType, setSelectedFileType] = useState('Image');
  const [fileInputKey, setFileInputKey] = useState(0);
  const [renamingFolderId, setRenamingFolderId] = useState<string | null>(null);
  const [renamingFolderName, setRenamingFolderName] = useState('');
  const [renamingFileId, setRenamingFileId] = useState<string | null>(null);
  const [renamingFileName, setRenamingFileName] = useState('');
  const [notice, setNotice] = useState<{ type: 'error' | 'success'; text: string } | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    loadRootFolders();
  }, []);

  const baseUrl = API_BASE_URL.replace(/\/api\/?$/, '');
  const currentFolderId = currentFolder?.id as string | undefined;

  const setErrorNotice = (text: string) => setNotice({ type: 'error', text });
  const setSuccessNotice = (text: string) => setNotice({ type: 'success', text });

  const clearEditingStates = () => {
    setRenamingFolderId(null);
    setRenamingFolderName('');
    setRenamingFileId(null);
    setRenamingFileName('');
  };

  const loadRootFolders = async () => {
    try {
      setLoading(true);
      setNotice(null);
      const res = await userAPI.getRootFolders();
      setFolders(res.data.data);
      setCurrentFolder(null);
      setFiles([]);
      clearEditingStates();
    } catch {
      setErrorNotice('Failed to load root folders');
    } finally {
      setLoading(false);
    }
  };

  const loadFolderStructure = async (folderId: string) => {
    try {
      setLoading(true);
      setNotice(null);
      const res = await userAPI.getFolderStructure(folderId);
      setCurrentFolder(res.data.data);
      setFiles(res.data.data.files);
      clearEditingStates();
    } catch {
      setErrorNotice('Failed to load folder');
    } finally {
      setLoading(false);
    }
  };

  const refreshCurrentView = async () => {
    if (currentFolderId) {
      await loadFolderStructure(currentFolderId);
    } else {
      await loadRootFolders();
    }
  };

  const handleCreateFolder = async () => {
    if (!newFolderName.trim()) return;

    try {
      setNotice(null);
      if (currentFolder) {
        await userAPI.createSubfolder(currentFolder.id, newFolderName.trim());
      } else {
        await userAPI.createRootFolder(newFolderName.trim());
      }
      setNewFolderName('');
      await refreshCurrentView();
      setSuccessNotice('Folder created successfully');
    } catch (err: any) {
      setErrorNotice(err.response?.data?.error || 'Failed to create folder');
    }
  };

  const handleDeleteFolder = async (folderId: string) => {
    if (!confirm('Delete this folder and all of its contents?')) return;

    try {
      setNotice(null);
      await userAPI.deleteFolder(folderId);
      await refreshCurrentView();
      setSuccessNotice('Folder deleted successfully');
    } catch (err: any) {
      setErrorNotice(err.response?.data?.error || 'Failed to delete folder');
    }
  };

  const startRenameFolder = (folder: any) => {
    setRenamingFolderId(folder.id);
    setRenamingFolderName(folder.name);
  };

  const submitRenameFolder = async () => {
    if (!renamingFolderId || !renamingFolderName.trim()) return;

    try {
      setNotice(null);
      await userAPI.renameFolder(renamingFolderId, renamingFolderName.trim());
      setRenamingFolderId(null);
      setRenamingFolderName('');
      await refreshCurrentView();
      setSuccessNotice('Folder renamed successfully');
    } catch (err: any) {
      setErrorNotice(err.response?.data?.error || 'Failed to rename folder');
    }
  };

  const handleUploadFile = async () => {
    if (!currentFolderId) {
      setErrorNotice('Open a folder before uploading files');
      return;
    }

    if (!selectedFile) {
      setErrorNotice('Select a file first');
      return;
    }

    try {
      setLoading(true);
      setNotice(null);
      await userAPI.uploadFile(currentFolderId, selectedFile, selectedFileType);
      setSelectedFile(null);
      setFileInputKey((prev) => prev + 1);
      await refreshCurrentView();
      setSuccessNotice('File uploaded successfully');
    } catch (err: any) {
      setErrorNotice(err.response?.data?.error || 'Failed to upload file');
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteFile = async (fileId: string) => {
    if (!confirm('Delete this file?')) return;

    try {
      setNotice(null);
      await userAPI.deleteFile(fileId);
      await refreshCurrentView();
      setSuccessNotice('File deleted successfully');
    } catch (err: any) {
      setErrorNotice(err.response?.data?.error || 'Failed to delete file');
    }
  };

  const startRenameFile = (file: any) => {
    setRenamingFileId(file.id);
    setRenamingFileName(file.name);
  };

  const submitRenameFile = async () => {
    if (!renamingFileId || !renamingFileName.trim()) return;

    try {
      setNotice(null);
      await userAPI.renameFile(renamingFileId, renamingFileName.trim());
      setRenamingFileId(null);
      setRenamingFileName('');
      await refreshCurrentView();
      setSuccessNotice('File renamed successfully');
    } catch (err: any) {
      setErrorNotice(err.response?.data?.error || 'Failed to rename file');
    }
  };

  const formatFileSize = (size: number) => {
    if (!size && size !== 0) return '0 B';
    if (size < 1024) return `${size} B`;
    const kb = size / 1024;
    if (kb < 1024) return `${kb.toFixed(1)} KB`;
    const mb = kb / 1024;
    if (mb < 1024) return `${mb.toFixed(2)} MB`;
    const gb = mb / 1024;
    return `${gb.toFixed(2)} GB`;
  };

  const getFileUrl = (file: any) => {
    const normalizedPath = String(file?.path || '')
      .replace(/\\/g, '/')
      .replace(/^\.?\//, '')
      .replace(/^\/+/, '');
    return `${baseUrl}/${normalizedPath}`;
  };

  const visibleFolders = currentFolder ? currentFolder.subfolders || [] : folders;

  return (
    <div style={styles.filesContainer}>
      <div style={styles.breadcrumb}>
        {currentFolder && (
          <button onClick={loadRootFolders} style={styles.backBtn}>Back to Root</button>
        )}
        <span style={styles.pathText}>
          {currentFolder ? `Folder: ${currentFolder.name}` : 'Folder: Root'}
        </span>
      </div>

      {notice && (
        <div style={notice.type === 'error' ? styles.inlineError : styles.inlineSuccess}>
          {notice.text}
        </div>
      )}

      <div style={styles.createFolder}>
        <input
          type="text"
          placeholder="New folder name..."
          value={newFolderName}
          onChange={(e) => setNewFolderName(e.target.value)}
          style={styles.folderInput}
        />
        <button onClick={handleCreateFolder} disabled={loading} style={styles.createBtn}>
          Create Folder
        </button>
      </div>

      <div style={styles.uploadSection}>
        <h4 style={styles.subTitle}>Upload File</h4>
        {!currentFolder && (
          <p style={styles.hintText}>Open a folder first to upload files.</p>
        )}
        {currentFolder && (
          <div style={styles.uploadRow}>
            <input
              key={fileInputKey}
              type="file"
              onChange={(e) => setSelectedFile(e.target.files?.[0] || null)}
              style={styles.fileInput}
            />
            <select
              value={selectedFileType}
              onChange={(e) => setSelectedFileType(e.target.value)}
              style={styles.typeSelect}
            >
              <option value="Image">Image</option>
              <option value="Video">Video</option>
              <option value="PDF">PDF</option>
              <option value="Audio">Audio</option>
            </select>
            <button
              onClick={handleUploadFile}
              disabled={loading || !selectedFile}
              style={styles.uploadBtn}
            >
              Upload
            </button>
          </div>
        )}
      </div>

      {loading ? (
        <p>Loading...</p>
      ) : (
        <>
          <h4 style={styles.subTitle}>{currentFolder ? 'Subfolders' : 'Root Folders'}</h4>
          <div style={styles.itemsGrid}>
            {visibleFolders.length === 0 && (
              <p style={styles.hintText}>No folders available in this view.</p>
            )}

            {visibleFolders.map((folder: any) => (
              <div key={folder.id} style={styles.folderItem}>
                <div style={styles.folderIcon}>FOLDER</div>
                {renamingFolderId === folder.id ? (
                  <div style={styles.renameGroup}>
                    <input
                      value={renamingFolderName}
                      onChange={(e) => setRenamingFolderName(e.target.value)}
                      style={styles.renameInput}
                    />
                    <div style={styles.actionRow}>
                      <button onClick={submitRenameFolder} style={styles.smallBtn}>Save</button>
                      <button
                        onClick={() => {
                          setRenamingFolderId(null);
                          setRenamingFolderName('');
                        }}
                        style={styles.smallBtnMuted}
                      >
                        Cancel
                      </button>
                    </div>
                  </div>
                ) : (
                  <p style={styles.itemName}>{folder.name}</p>
                )}
                <small style={styles.itemCount}>{folder._count?.files || 0} files</small>
                <div style={styles.actionRow}>
                  <button onClick={() => loadFolderStructure(folder.id)} style={styles.smallBtn}>Open</button>
                  <button onClick={() => startRenameFolder(folder)} style={styles.smallBtnMuted}>Rename</button>
                  <button onClick={() => handleDeleteFolder(folder.id)} style={styles.smallBtnDanger}>Delete</button>
                </div>
              </div>
            ))}
          </div>

          {currentFolder && (
            <div style={styles.filesList}>
              <h4 style={styles.subTitle}>Files in Current Folder</h4>
              {files.length === 0 && (
                <p style={styles.hintText}>No files in this folder yet.</p>
              )}

              {files.map((file: any) => (
                <div key={file.id} style={styles.fileItem}>
                  <div style={styles.fileMeta}>
                    {renamingFileId === file.id ? (
                      <div style={styles.renameGroup}>
                        <input
                          value={renamingFileName}
                          onChange={(e) => setRenamingFileName(e.target.value)}
                          style={styles.renameInput}
                        />
                        <div style={styles.actionRow}>
                          <button onClick={submitRenameFile} style={styles.smallBtn}>Save</button>
                          <button
                            onClick={() => {
                              setRenamingFileId(null);
                              setRenamingFileName('');
                            }}
                            style={styles.smallBtnMuted}
                          >
                            Cancel
                          </button>
                        </div>
                      </div>
                    ) : (
                      <span style={styles.fileName}>{file.name}</span>
                    )}
                    <small style={styles.itemCount}>
                      {formatFileSize(file.size)} | {file.fileType}
                    </small>
                  </div>

                  <div style={styles.actionRow}>
                    <a href={getFileUrl(file)} target="_blank" rel="noreferrer" style={styles.smallLinkBtn}>
                      Download
                    </a>
                    <button onClick={() => startRenameFile(file)} style={styles.smallBtnMuted}>Rename</button>
                    <button onClick={() => handleDeleteFile(file.id)} style={styles.smallBtnDanger}>Delete</button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </>
      )}
    </div>
  );
}

const styles: Record<string, React.CSSProperties> = {
  container: {
    display: 'flex',
    flexDirection: 'column',
    minHeight: '100vh',
    background: '#f3f4f8',
  },
  navbar: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: '20px 40px',
    background: '#1f2744',
    color: 'white',
    boxShadow: '0 2px 10px rgba(0,0,0,0.12)',
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
    background: '#c0392b',
    color: 'white',
    border: 'none',
    borderRadius: '6px',
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
    borderRight: '1px solid #e6e8f1',
  },
  tabBtn: {
    display: 'block',
    width: '100%',
    padding: '12px',
    marginBottom: '10px',
    border: 'none',
    background: '#f4f6fb',
    textAlign: 'left',
    cursor: 'pointer',
    borderRadius: '6px',
    fontSize: '14px',
    color: '#354167',
  },
  tabBtnActive: {
    background: '#3f51b5',
    color: 'white',
  },
  mainContent: {
    flex: 1,
    padding: '40px',
  },
  sectionTitle: {
    marginBottom: '20px',
    color: '#263253',
  },
  loading: {
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    minHeight: '100vh',
    fontSize: '18px',
  },
  noPackage: {
    color: '#8791ad',
  },
  packageCard: {
    background: 'white',
    padding: '20px',
    borderRadius: '10px',
    marginBottom: '20px',
    boxShadow: '0 2px 12px rgba(0,0,0,0.05)',
  },
  packageName: {
    fontSize: '18px',
    marginBottom: '10px',
    color: '#2a3557',
  },
  packagePrice: {
    fontSize: '16px',
    color: '#3f51b5',
    fontWeight: 'bold',
    marginBottom: '10px',
  },
  packageDetail: {
    margin: '5px 0',
    fontSize: '14px',
    color: '#546083',
  },
  packagesGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))',
    gap: '20px',
  },
  selectBtn: {
    marginTop: '15px',
    padding: '10px',
    background: '#3f51b5',
    color: 'white',
    border: 'none',
    borderRadius: '6px',
    cursor: 'pointer',
    width: '100%',
  },
  selectBtnDisabled: {
    background: '#d0d5e5',
    color: '#5d6787',
    cursor: 'not-allowed',
  },
  filesContainer: {
    background: 'white',
    padding: '20px',
    borderRadius: '10px',
    boxShadow: '0 2px 12px rgba(0,0,0,0.05)',
  },
  breadcrumb: {
    display: 'flex',
    gap: '10px',
    alignItems: 'center',
    marginBottom: '16px',
  },
  backBtn: {
    padding: '8px 12px',
    background: '#3f51b5',
    color: 'white',
    border: 'none',
    borderRadius: '6px',
    cursor: 'pointer',
  },
  pathText: {
    fontSize: '14px',
    color: '#4d5674',
    fontWeight: '600',
  },
  inlineError: {
    background: '#fff2f2',
    color: '#b93838',
    padding: '12px',
    borderRadius: '6px',
    marginBottom: '14px',
    fontSize: '14px',
  },
  inlineSuccess: {
    background: '#eefcf2',
    color: '#1f8048',
    padding: '12px',
    borderRadius: '6px',
    marginBottom: '14px',
    fontSize: '14px',
  },
  createFolder: {
    display: 'flex',
    gap: '10px',
    marginBottom: '18px',
  },
  folderInput: {
    flex: 1,
    padding: '10px',
    border: '1px solid #d8deef',
    borderRadius: '6px',
  },
  createBtn: {
    padding: '10px 20px',
    background: '#3f51b5',
    color: 'white',
    border: 'none',
    borderRadius: '6px',
    cursor: 'pointer',
  },
  uploadSection: {
    marginBottom: '18px',
    borderTop: '1px solid #eceff7',
    paddingTop: '16px',
  },
  subTitle: {
    marginBottom: '10px',
    color: '#2f3a5f',
  },
  hintText: {
    color: '#7a84a3',
    fontSize: '14px',
    marginBottom: '8px',
  },
  uploadRow: {
    display: 'flex',
    gap: '10px',
    flexWrap: 'wrap',
    alignItems: 'center',
  },
  fileInput: {
    flex: 1,
    minWidth: '220px',
  },
  typeSelect: {
    padding: '10px',
    border: '1px solid #d8deef',
    borderRadius: '6px',
    minWidth: '110px',
  },
  uploadBtn: {
    padding: '10px 16px',
    background: '#1f8f7a',
    color: 'white',
    border: 'none',
    borderRadius: '6px',
    cursor: 'pointer',
  },
  itemsGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fill, minmax(190px, 1fr))',
    gap: '14px',
    marginBottom: '26px',
  },
  folderItem: {
    background: '#f8f9fd',
    padding: '14px',
    borderRadius: '8px',
    border: '1px solid #e8ecf7',
  },
  folderIcon: {
    fontSize: '11px',
    letterSpacing: '0.08em',
    color: '#6f7895',
    marginBottom: '8px',
    fontWeight: '700',
  },
  itemName: {
    fontSize: '14px',
    margin: '4px 0',
    wordBreak: 'break-word',
    color: '#2c3558',
    fontWeight: '600',
  },
  itemCount: {
    color: '#6f7895',
    fontSize: '12px',
  },
  filesList: {
    marginTop: '8px',
    borderTop: '1px solid #eceff7',
    paddingTop: '16px',
  },
  fileItem: {
    display: 'flex',
    justifyContent: 'space-between',
    gap: '12px',
    alignItems: 'center',
    padding: '12px',
    background: '#f8f9fd',
    borderRadius: '6px',
    marginBottom: '10px',
    border: '1px solid #e8ecf7',
  },
  fileMeta: {
    display: 'flex',
    flexDirection: 'column',
    gap: '4px',
    minWidth: '200px',
  },
  fileName: {
    color: '#2c3558',
    fontWeight: '600',
    wordBreak: 'break-word',
  },
  renameGroup: {
    display: 'flex',
    flexDirection: 'column',
    gap: '6px',
  },
  renameInput: {
    padding: '8px',
    border: '1px solid #d8deef',
    borderRadius: '6px',
    minWidth: '140px',
  },
  actionRow: {
    display: 'flex',
    gap: '8px',
    flexWrap: 'wrap',
    alignItems: 'center',
  },
  smallBtn: {
    padding: '6px 10px',
    background: '#3f51b5',
    color: 'white',
    border: 'none',
    borderRadius: '6px',
    cursor: 'pointer',
    fontSize: '12px',
  },
  smallBtnMuted: {
    padding: '6px 10px',
    background: '#e5e9f5',
    color: '#364062',
    border: 'none',
    borderRadius: '6px',
    cursor: 'pointer',
    fontSize: '12px',
  },
  smallBtnDanger: {
    padding: '6px 10px',
    background: '#c0392b',
    color: 'white',
    border: 'none',
    borderRadius: '6px',
    cursor: 'pointer',
    fontSize: '12px',
  },
  smallLinkBtn: {
    padding: '6px 10px',
    background: '#1f8f7a',
    color: 'white',
    borderRadius: '6px',
    cursor: 'pointer',
    fontSize: '12px',
    textDecoration: 'none',
    display: 'inline-block',
  },
};
