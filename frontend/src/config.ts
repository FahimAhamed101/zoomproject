export const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api';

export const FETCH_OPTIONS = {
  headers: {
    'Content-Type': 'application/json',
  },
};

export const FILE_TYPES = {
  Image: ['image/jpeg', 'image/png', 'image/gif', 'image/webp'],
  Video: ['video/mp4', 'video/mpeg', 'video/webm'],
  PDF: ['application/pdf'],
  Audio: ['audio/mpeg', 'audio/wav', 'audio/ogg'],
};

export const FILE_TYPE_LABELS: Record<string, string> = {
  image: '🖼️ Image',
  video: '🎬 Video',
  pdf: '📄 PDF',
  audio: '🎵 Audio',
};
