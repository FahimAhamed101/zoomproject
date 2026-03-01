import { atom } from 'jotai';

export interface SubscriptionPackage {
  id: string;
  name: string;
  description?: string;
  maxFolders: number;
  maxNestingLevel: number;
  allowedFileTypes: string[];
  maxFileSize: number;
  totalFileLimit: number;
  filesPerFolder: number;
  price: number;
}

export const packagesAtom = atom<SubscriptionPackage[]>([]);
export const currentPackageAtom = atom<SubscriptionPackage | null>(null);
export const subscriptionHistoryAtom = atom<any[]>([]);
