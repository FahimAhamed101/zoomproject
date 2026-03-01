import { store } from '@/src/store/store';
import { apiSlice, ApiEnvelope } from '@/src/store/apiSlice';

type AxiosLikeResponse<T = any> = { data: T };

type AxiosLikeError = {
  response: {
    status?: number | string;
    data: { error?: string; [key: string]: any };
  };
};

const toAxiosLikeError = (error: any): AxiosLikeError => {
  const status =
    error && typeof error === 'object' && 'status' in error ? (error.status as any) : undefined;

  const data =
    error && typeof error === 'object' && 'data' in error && error.data
      ? (error.data as any)
      : { error: 'Request failed' };

  return {
    response: {
      status,
      data,
    },
  };
};

const execute = async <T>(promise: any, unsubscribeAfter = false): Promise<AxiosLikeResponse<T>> => {
  const result = await promise;

  if (unsubscribeAfter && typeof promise.unsubscribe === 'function') {
    promise.unsubscribe();
  }

  if (result?.error) {
    throw toAxiosLikeError(result.error);
  }

  return { data: result.data as T };
};

const runQuery = async <T>(endpoint: any, arg?: any): Promise<AxiosLikeResponse<T>> => {
  const promise = store.dispatch(endpoint.initiate(arg, { forceRefetch: true }));
  return execute<T>(promise, true);
};

const runMutation = async <T>(endpoint: any, arg?: any): Promise<AxiosLikeResponse<T>> => {
  const promise = store.dispatch(endpoint.initiate(arg));
  return execute<T>(promise, false);
};

export const authAPI = {
  register: (data: any) => runMutation<ApiEnvelope>(apiSlice.endpoints.registerUser, data),
  login: (email: string, password: string) =>
    runMutation<ApiEnvelope>(apiSlice.endpoints.loginUser, { email, password }),
  verifyEmail: (token: string) =>
    runMutation<ApiEnvelope>(apiSlice.endpoints.verifyEmail, { token }),
  requestPasswordReset: (email: string) =>
    runMutation<ApiEnvelope>(apiSlice.endpoints.requestPasswordReset, { email }),
  resetPassword: (token: string, newPassword: string) =>
    runMutation<ApiEnvelope>(apiSlice.endpoints.resetPassword, { token, newPassword }),
};

export const adminAPI = {
  login: (email: string, password: string) =>
    runMutation<ApiEnvelope>(apiSlice.endpoints.adminLogin, { email, password }),
  getProfile: () => runQuery<ApiEnvelope>(apiSlice.endpoints.getAdminProfile),
  getAllPackages: () => runQuery<ApiEnvelope>(apiSlice.endpoints.getAdminPackages),
  createPackage: (data: any) =>
    runMutation<ApiEnvelope>(apiSlice.endpoints.createAdminPackage, data),
  updatePackage: (id: string, data: any) =>
    runMutation<ApiEnvelope>(apiSlice.endpoints.updateAdminPackage, { id, data }),
  deletePackage: (id: string) =>
    runMutation<ApiEnvelope>(apiSlice.endpoints.deleteAdminPackage, { id }),
};

export const userAPI = {
  getCurrentSubscription: () =>
    runQuery<ApiEnvelope>(apiSlice.endpoints.getCurrentSubscription),
  assignSubscription: (packageId: string) =>
    runMutation<ApiEnvelope>(apiSlice.endpoints.assignSubscription, { packageId }),
  getSubscriptionHistory: () =>
    runQuery<ApiEnvelope>(apiSlice.endpoints.getSubscriptionHistory),
  getPublicPackages: () => runQuery<ApiEnvelope>(apiSlice.endpoints.getPublicPackages),

  createRootFolder: (folderName: string) =>
    runMutation<ApiEnvelope>(apiSlice.endpoints.createRootFolder, { folderName }),
  createSubfolder: (parentFolderId: string, folderName: string) =>
    runMutation<ApiEnvelope>(apiSlice.endpoints.createSubfolder, {
      parentFolderId,
      folderName,
    }),
  getRootFolders: () => runQuery<ApiEnvelope>(apiSlice.endpoints.getRootFolders),
  getAllFolders: () => runQuery<ApiEnvelope>(apiSlice.endpoints.getAllFolders),
  getFolderStructure: (folderId: string) =>
    runQuery<ApiEnvelope>(apiSlice.endpoints.getFolderStructure, { folderId }),
  renameFolder: (folderId: string, newName: string) =>
    runMutation<ApiEnvelope>(apiSlice.endpoints.renameFolder, { folderId, newName }),
  deleteFolder: (folderId: string) =>
    runMutation<ApiEnvelope>(apiSlice.endpoints.deleteFolder, { folderId }),

  uploadFile: (folderId: string, file: File, fileType: string) =>
    runMutation<ApiEnvelope>(apiSlice.endpoints.uploadFile, {
      folderId,
      file,
      fileType,
    }),
  getFolderFiles: (folderId: string) =>
    runQuery<ApiEnvelope>(apiSlice.endpoints.getFolderFiles, { folderId }),
  getUserFiles: () => runQuery<ApiEnvelope>(apiSlice.endpoints.getUserFiles),
  getFile: (fileId: string) =>
    runQuery<ApiEnvelope>(apiSlice.endpoints.getFile, { fileId }),
  renameFile: (fileId: string, newName: string) =>
    runMutation<ApiEnvelope>(apiSlice.endpoints.renameFile, { fileId, newName }),
  deleteFile: (fileId: string) =>
    runMutation<ApiEnvelope>(apiSlice.endpoints.deleteFile, { fileId }),
};

export default apiSlice;

