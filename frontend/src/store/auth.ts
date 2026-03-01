import { atom } from 'jotai';

export interface User {
  id: string;
  email: string;
  firstName?: string;
  lastName?: string;
}

export interface Admin {
  id: string;
  email: string;
}

export const userAtom = atom<User | null>(null);
export const adminAtom = atom<Admin | null>(null);
export const tokenAtom = atom<string | null>(null);
export const isAuthenticatedAtom = atom((get) => {
  const user = get(userAtom);
  const admin = get(adminAtom);
  return !!user || !!admin;
});
