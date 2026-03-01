import {
  BaseQueryFn,
  FetchArgs,
  FetchBaseQueryError,
  createApi,
  fetchBaseQuery,
} from '@reduxjs/toolkit/query/react';
import { API_BASE_URL } from '@/src/config';

export type ApiEnvelope<T = any> = {
  success: boolean;
  data?: T;
  message?: string;
  error?: string;
};

type UploadFileArg = {
  folderId: string;
  file: File;
  fileType: string;
};

const rawBaseQuery = fetchBaseQuery({
  baseUrl: API_BASE_URL,
  prepareHeaders: (headers) => {
    if (typeof window !== 'undefined') {
      const token = localStorage.getItem('token');
      if (token) {
        headers.set('Authorization', `Bearer ${token}`);
      }
    }
    return headers;
  },
});

const baseQueryWithAuthRedirect: BaseQueryFn<
  string | FetchArgs,
  unknown,
  FetchBaseQueryError
> = async (args, api, extraOptions) => {
  const result = await rawBaseQuery(args, api, extraOptions);

  if (result.error?.status === 401 && typeof window !== 'undefined') {
    const requestUrl = typeof args === 'string' ? args : args.url || '';
    const cleanPath = requestUrl.split('?')[0];
    const isLoginRequest =
      cleanPath.endsWith('/auth/login') || cleanPath.endsWith('/admin/login');

    if (!isLoginRequest) {
      const isAdminRoute = window.location.pathname.startsWith('/admin');
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      localStorage.removeItem('admin');
      window.location.href = isAdminRoute ? '/admin/login' : '/login';
    }
  }

  return result;
};

export const apiSlice = createApi({
  reducerPath: 'api',
  baseQuery: baseQueryWithAuthRedirect,
  tagTypes: ['AdminPackages', 'AdminProfile', 'UserSubscription', 'Folders', 'Files'],
  endpoints: (builder) => ({
    registerUser: builder.mutation<ApiEnvelope, any>({
      query: (data) => ({
        url: '/auth/register',
        method: 'POST',
        body: data,
      }),
    }),
    loginUser: builder.mutation<ApiEnvelope, { email: string; password: string }>({
      query: (body) => ({
        url: '/auth/login',
        method: 'POST',
        body,
      }),
    }),
    verifyEmail: builder.mutation<ApiEnvelope, { token: string }>({
      query: (body) => ({
        url: '/auth/verify-email',
        method: 'POST',
        body,
      }),
    }),
    requestPasswordReset: builder.mutation<ApiEnvelope, { email: string }>({
      query: (body) => ({
        url: '/auth/request-password-reset',
        method: 'POST',
        body,
      }),
    }),
    resetPassword: builder.mutation<ApiEnvelope, { token: string; newPassword: string }>({
      query: (body) => ({
        url: '/auth/reset-password',
        method: 'POST',
        body,
      }),
    }),

    adminLogin: builder.mutation<ApiEnvelope, { email: string; password: string }>({
      query: (body) => ({
        url: '/admin/login',
        method: 'POST',
        body,
      }),
    }),
    getAdminProfile: builder.query<ApiEnvelope, void>({
      query: () => '/admin/profile',
      providesTags: ['AdminProfile'],
    }),
    getAdminPackages: builder.query<ApiEnvelope, void>({
      query: () => '/admin/packages',
      providesTags: ['AdminPackages'],
    }),
    createAdminPackage: builder.mutation<ApiEnvelope, any>({
      query: (data) => ({
        url: '/admin/packages',
        method: 'POST',
        body: data,
      }),
      invalidatesTags: ['AdminPackages'],
    }),
    updateAdminPackage: builder.mutation<ApiEnvelope, { id: string; data: any }>({
      query: ({ id, data }) => ({
        url: `/admin/packages/${id}`,
        method: 'PUT',
        body: data,
      }),
      invalidatesTags: ['AdminPackages'],
    }),
    deleteAdminPackage: builder.mutation<ApiEnvelope, { id: string }>({
      query: ({ id }) => ({
        url: `/admin/packages/${id}`,
        method: 'DELETE',
      }),
      invalidatesTags: ['AdminPackages'],
    }),

    getCurrentSubscription: builder.query<ApiEnvelope, void>({
      query: () => '/user/subscriptions/current',
      providesTags: ['UserSubscription'],
    }),
    assignSubscription: builder.mutation<ApiEnvelope, { packageId: string }>({
      query: (body) => ({
        url: '/user/subscriptions/assign',
        method: 'POST',
        body,
      }),
      invalidatesTags: ['UserSubscription'],
    }),
    getSubscriptionHistory: builder.query<ApiEnvelope, void>({
      query: () => '/user/subscriptions/history',
      providesTags: ['UserSubscription'],
    }),
    getPublicPackages: builder.query<ApiEnvelope, void>({
      query: () => '/admin/public-packages',
    }),

    createRootFolder: builder.mutation<ApiEnvelope, { folderName: string }>({
      query: (body) => ({
        url: '/user/folders',
        method: 'POST',
        body,
      }),
      invalidatesTags: ['Folders'],
    }),
    createSubfolder: builder.mutation<
      ApiEnvelope,
      { parentFolderId: string; folderName: string }
    >({
      query: (body) => ({
        url: '/user/folders/subfolder',
        method: 'POST',
        body,
      }),
      invalidatesTags: ['Folders'],
    }),
    getRootFolders: builder.query<ApiEnvelope, void>({
      query: () => '/user/folders',
      providesTags: ['Folders'],
    }),
    getAllFolders: builder.query<ApiEnvelope, void>({
      query: () => '/user/folders/all',
      providesTags: ['Folders'],
    }),
    getFolderStructure: builder.query<ApiEnvelope, { folderId: string }>({
      query: ({ folderId }) => `/user/folders/${folderId}`,
      providesTags: ['Folders', 'Files'],
    }),
    renameFolder: builder.mutation<ApiEnvelope, { folderId: string; newName: string }>({
      query: ({ folderId, newName }) => ({
        url: `/user/folders/${folderId}`,
        method: 'PUT',
        body: { newName },
      }),
      invalidatesTags: ['Folders'],
    }),
    deleteFolder: builder.mutation<ApiEnvelope, { folderId: string }>({
      query: ({ folderId }) => ({
        url: `/user/folders/${folderId}`,
        method: 'DELETE',
      }),
      invalidatesTags: ['Folders', 'Files'],
    }),

    uploadFile: builder.mutation<ApiEnvelope, UploadFileArg>({
      query: ({ folderId, file, fileType }) => {
        const formData = new FormData();
        formData.append('file', file);
        formData.append('folderId', folderId);
        formData.append('fileType', fileType);

        return {
          url: '/user/files/upload',
          method: 'POST',
          body: formData,
        };
      },
      invalidatesTags: ['Files', 'Folders'],
    }),
    getFolderFiles: builder.query<ApiEnvelope, { folderId: string }>({
      query: ({ folderId }) => `/user/files/folder/${folderId}`,
      providesTags: ['Files'],
    }),
    getUserFiles: builder.query<ApiEnvelope, void>({
      query: () => '/user/files/all',
      providesTags: ['Files'],
    }),
    getFile: builder.query<ApiEnvelope, { fileId: string }>({
      query: ({ fileId }) => `/user/files/${fileId}`,
      providesTags: ['Files'],
    }),
    renameFile: builder.mutation<ApiEnvelope, { fileId: string; newName: string }>({
      query: ({ fileId, newName }) => ({
        url: `/user/files/${fileId}`,
        method: 'PUT',
        body: { newName },
      }),
      invalidatesTags: ['Files'],
    }),
    deleteFile: builder.mutation<ApiEnvelope, { fileId: string }>({
      query: ({ fileId }) => ({
        url: `/user/files/${fileId}`,
        method: 'DELETE',
      }),
      invalidatesTags: ['Files', 'Folders'],
    }),
  }),
});

