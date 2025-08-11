export interface User {
  id: string;
  username: string;
  email: string;
  firstName: string;
  lastName: string;
  fullName: string;
  avatar?: {
    public_id: string | null;
    url: string | null;
  };
  role: 'user' | 'admin';
  emailVerified: boolean;
  lastLogin?: string;
  createdAt: string;
}

export interface AuthState {
    user: User | null;
    token: string | null;
}

export type ProfileUpdateFormData = {
  firstName: string;
  lastName: string;
  username: string;
  avatar?: FileList;
};