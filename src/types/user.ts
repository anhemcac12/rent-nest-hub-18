export type UserRole = 'tenant' | 'landlord' | 'admin' | 'property_manager';

export interface User {
  id: string;
  email: string;
  password: string;
  role: UserRole;
  firstName: string;
  lastName: string;
  avatar?: string;
  phone?: string;
  createdAt: string;
}

export interface CurrentUser {
  id: string;
  email: string;
  role: UserRole;
  firstName: string;
  lastName: string;
  avatar?: string;
}
