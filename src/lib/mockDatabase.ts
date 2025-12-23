import { User, CurrentUser, UserRole } from '@/types/user';
import { Application, ApplicationEvent, Conversation, Message, Notification } from '@/types/tenant';
import { getPropertyById } from '@/data/mockProperties';

const USERS_KEY = 'rentmate_users';
const CURRENT_USER_KEY = 'rentmate_current_user';
const SAVED_PROPERTIES_KEY = 'rentmate_saved_properties';
const APPLICATIONS_KEY = 'rentmate_applications';
const CONVERSATIONS_KEY = 'rentmate_conversations';
const NOTIFICATIONS_KEY = 'rentmate_notifications';

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

// =====================
// SAVED PROPERTIES
// =====================

function getSavedPropertiesKey(userId: string): string {
  return `${SAVED_PROPERTIES_KEY}_${userId}`;
}

export function getSavedProperties(userId: string): string[] {
  const saved = localStorage.getItem(getSavedPropertiesKey(userId));
  return saved ? JSON.parse(saved) : [];
}

export function saveProperty(userId: string, propertyId: string): void {
  const saved = getSavedProperties(userId);
  if (!saved.includes(propertyId)) {
    saved.push(propertyId);
    localStorage.setItem(getSavedPropertiesKey(userId), JSON.stringify(saved));
  }
}

export function unsaveProperty(userId: string, propertyId: string): void {
  const saved = getSavedProperties(userId);
  const updated = saved.filter((id) => id !== propertyId);
  localStorage.setItem(getSavedPropertiesKey(userId), JSON.stringify(updated));
}

export function isPropertySaved(userId: string, propertyId: string): boolean {
  const saved = getSavedProperties(userId);
  return saved.includes(propertyId);
}

// =====================
// APPLICATIONS
// =====================

function getApplicationsKey(userId: string): string {
  return `${APPLICATIONS_KEY}_${userId}`;
}

export function getApplications(userId: string): Application[] {
  const apps = localStorage.getItem(getApplicationsKey(userId));
  return apps ? JSON.parse(apps) : [];
}

export function createApplication(
  userId: string,
  propertyId: string,
  moveInDate: string,
  message?: string
): Application | null {
  const property = getPropertyById(propertyId);
  if (!property) return null;

  const now = new Date().toISOString();
  const appId = `app-${Date.now()}`;

  const initialEvent: ApplicationEvent = {
    id: `event-${Date.now()}`,
    status: 'pending',
    message: 'Application submitted',
    timestamp: now,
  };

  const newApplication: Application = {
    id: appId,
    propertyId,
    property,
    tenantId: userId,
    status: 'pending',
    appliedAt: now,
    updatedAt: now,
    notes: message,
    documents: [],
    timeline: [initialEvent],
  };

  const apps = getApplications(userId);
  apps.push(newApplication);
  localStorage.setItem(getApplicationsKey(userId), JSON.stringify(apps));

  // Create notification for the landlord
  createNotification(
    property.landlord.id,
    'application',
    'New Lease Application',
    `You received a new application for ${property.title}`,
    '/dashboard/applications'
  );

  return newApplication;
}

export function withdrawApplication(userId: string, applicationId: string): void {
  const apps = getApplications(userId);
  const updated = apps.map((app) => {
    if (app.id === applicationId && app.status === 'pending') {
      const now = new Date().toISOString();
      return {
        ...app,
        status: 'withdrawn' as const,
        updatedAt: now,
        timeline: [
          ...app.timeline,
          {
            id: `event-${Date.now()}`,
            status: 'withdrawn' as const,
            message: 'Application withdrawn by tenant',
            timestamp: now,
          },
        ],
      };
    }
    return app;
  });
  localStorage.setItem(getApplicationsKey(userId), JSON.stringify(updated));
}

export function hasAppliedToProperty(userId: string, propertyId: string): boolean {
  const apps = getApplications(userId);
  return apps.some((app) => app.propertyId === propertyId && app.status !== 'withdrawn');
}

// =====================
// CONVERSATIONS
// =====================

function getConversationsKey(userId: string): string {
  return `${CONVERSATIONS_KEY}_${userId}`;
}

export function getConversations(userId: string): Conversation[] {
  const convs = localStorage.getItem(getConversationsKey(userId));
  return convs ? JSON.parse(convs) : [];
}

export function createConversation(
  userId: string,
  landlordId: string,
  landlordName: string,
  landlordAvatar: string,
  propertyId: string,
  propertyTitle: string,
  initialMessage: string
): Conversation {
  const now = new Date().toISOString();
  const convId = `conv-${Date.now()}`;
  const msgId = `msg-${Date.now()}`;

  const message: Message = {
    id: msgId,
    conversationId: convId,
    senderId: userId,
    senderType: 'tenant',
    content: initialMessage,
    timestamp: now,
    read: true,
  };

  const newConversation: Conversation = {
    id: convId,
    landlordId,
    landlordName,
    landlordAvatar,
    propertyId,
    propertyTitle,
    lastMessage: initialMessage,
    lastMessageAt: now,
    unreadCount: 0,
    messages: [message],
  };

  const convs = getConversations(userId);
  convs.push(newConversation);
  localStorage.setItem(getConversationsKey(userId), JSON.stringify(convs));

  // Create notification for the landlord
  createNotification(
    landlordId,
    'message',
    'New Message',
    `You received a new message about ${propertyTitle}`,
    '/dashboard/messages'
  );

  return newConversation;
}

export function getConversationByProperty(userId: string, propertyId: string): Conversation | undefined {
  const convs = getConversations(userId);
  return convs.find((c) => c.propertyId === propertyId);
}

// =====================
// NOTIFICATIONS
// =====================

function getNotificationsKey(userId: string): string {
  return `${NOTIFICATIONS_KEY}_${userId}`;
}

export function getNotifications(userId: string): Notification[] {
  const notifs = localStorage.getItem(getNotificationsKey(userId));
  return notifs ? JSON.parse(notifs) : [];
}

export function createNotification(
  userId: string,
  type: Notification['type'],
  title: string,
  description: string,
  link?: string
): Notification {
  const now = new Date().toISOString();
  const notifId = `notif-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

  const newNotification: Notification = {
    id: notifId,
    userId,
    type,
    title,
    description,
    read: false,
    link,
    createdAt: now,
  };

  const notifs = getNotifications(userId);
  notifs.unshift(newNotification); // Add to beginning
  localStorage.setItem(getNotificationsKey(userId), JSON.stringify(notifs));

  return newNotification;
}

export function markNotificationAsRead(userId: string, notificationId: string): void {
  const notifs = getNotifications(userId);
  const updated = notifs.map((n) => 
    n.id === notificationId ? { ...n, read: true } : n
  );
  localStorage.setItem(getNotificationsKey(userId), JSON.stringify(updated));
}

export function markAllNotificationsAsRead(userId: string): void {
  const notifs = getNotifications(userId);
  const updated = notifs.map((n) => ({ ...n, read: true }));
  localStorage.setItem(getNotificationsKey(userId), JSON.stringify(updated));
}

export function deleteNotification(userId: string, notificationId: string): void {
  const notifs = getNotifications(userId);
  const updated = notifs.filter((n) => n.id !== notificationId);
  localStorage.setItem(getNotificationsKey(userId), JSON.stringify(updated));
}

export function getUnreadNotificationCount(userId: string): number {
  const notifs = getNotifications(userId);
  return notifs.filter((n) => !n.read).length;
}
