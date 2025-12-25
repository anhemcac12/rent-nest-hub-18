export type UserRole = 'tenant' | 'landlord' | 'property_manager';

export interface User {
  id: string;
  email: string;
  password: string;
  role: UserRole;
  fullName: string;
  phone: string;
  avatar?: string;
  createdAt: string;
}

export interface CurrentUser {
  id: string;
  email: string;
  role: UserRole;
  fullName: string;
  phone: string;
  avatar?: string;
}
