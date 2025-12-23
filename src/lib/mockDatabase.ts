import { User, CurrentUser, UserRole } from '@/types/user';

const USERS_KEY = 'rentmate_users';
const CURRENT_USER_KEY = 'rentmate_current_user';

// Pre-seeded test accounts
const seedUsers: User[] = [
  {
    id: 'tenant-001',
    email: 'tenant@test.com',
    password: 'password123',
    role: 'tenant',
    firstName: 'John',
    lastName: 'Tenant',
    avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=tenant',
    createdAt: new Date().toISOString(),
  },
  {
    id: 'landlord-001',
    email: 'landlord@test.com',
    password: 'password123',
    role: 'landlord',
    firstName: 'Jane',
    lastName: 'Landlord',
    avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=landlord',
    createdAt: new Date().toISOString(),
  },
  {
    id: 'admin-001',
    email: 'admin@test.com',
    password: 'password123',
    role: 'admin',
    firstName: 'Admin',
    lastName: 'User',
    avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=admin',
    createdAt: new Date().toISOString(),
  },
];

// Initialize mock database with seed data if empty
function initializeDatabase(): void {
  const existingUsers = localStorage.getItem(USERS_KEY);
  if (!existingUsers) {
    localStorage.setItem(USERS_KEY, JSON.stringify(seedUsers));
  }
}

// Get all users
export function getUsers(): User[] {
  initializeDatabase();
  const users = localStorage.getItem(USERS_KEY);
  return users ? JSON.parse(users) : [];
}

// Find user by email
export function findUserByEmail(email: string): User | undefined {
  const users = getUsers();
  return users.find((u) => u.email.toLowerCase() === email.toLowerCase());
}

// Add a new user
export function addUser(userData: Omit<User, 'id' | 'createdAt'>): User {
  const users = getUsers();
  const newUser: User = {
    ...userData,
    id: `user-${Date.now()}`,
    createdAt: new Date().toISOString(),
  };
  users.push(newUser);
  localStorage.setItem(USERS_KEY, JSON.stringify(users));
  return newUser;
}

// Convert User to CurrentUser (without password)
export function toCurrentUser(user: User): CurrentUser {
  return {
    id: user.id,
    email: user.email,
    role: user.role,
    firstName: user.firstName,
    lastName: user.lastName,
    avatar: user.avatar,
  };
}

// Session management
export function setCurrentUser(user: CurrentUser): void {
  localStorage.setItem(CURRENT_USER_KEY, JSON.stringify(user));
}

export function getCurrentUser(): CurrentUser | null {
  const user = localStorage.getItem(CURRENT_USER_KEY);
  return user ? JSON.parse(user) : null;
}

export function clearSession(): void {
  localStorage.removeItem(CURRENT_USER_KEY);
}

// Auth operations
export function loginUser(email: string, password: string): { success: boolean; user?: CurrentUser; error?: string } {
  const user = findUserByEmail(email);
  
  if (!user) {
    return { success: false, error: 'No account found with this email' };
  }
  
  if (user.password !== password) {
    return { success: false, error: 'Incorrect password' };
  }
  
  const currentUser = toCurrentUser(user);
  setCurrentUser(currentUser);
  return { success: true, user: currentUser };
}

export function signupUser(
  email: string,
  password: string,
  firstName: string,
  lastName: string,
  role: UserRole
): { success: boolean; user?: CurrentUser; error?: string } {
  const existingUser = findUserByEmail(email);
  
  if (existingUser) {
    return { success: false, error: 'An account with this email already exists' };
  }
  
  const newUser = addUser({
    email,
    password,
    firstName,
    lastName,
    role,
    avatar: `https://api.dicebear.com/7.x/avataaars/svg?seed=${email}`,
  });
  
  const currentUser = toCurrentUser(newUser);
  setCurrentUser(currentUser);
  return { success: true, user: currentUser };
}

export function logoutUser(): void {
  clearSession();
}
