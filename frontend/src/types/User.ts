// src/types/User.ts

export interface User {
  id: string;
  _id?: string; // MongoDB ID'si
  firstName: string;
  lastName: string;
  email: string;
  role: 'admin' | 'user';
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
  phone?: string;
  addresses?: Address[];
  avatar?: {
    public_id: string;
    url: string;
  };
}

export interface Address {
  _id: string;
  title: string;
  firstName: string;
  lastName: string;
  phone: string;
  street: string;
  city: string;
  state: string;
  zipCode: string;
  country: string;
  isDefault: boolean;
  createdAt: string;
}


export interface ApiResponse<T> {
  success: boolean;
  data: T;
  message?: string;
  count?: number;
  total?: number;
  pagination?: {
    next?: {
      page: number;
      limit: number;
    };
    prev?: {
      page: number;
      limit: number;
    };
  };
}