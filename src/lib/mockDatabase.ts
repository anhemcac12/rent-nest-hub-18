import { User, CurrentUser, UserRole } from '@/types/user';
import { Application, ApplicationEvent, Conversation, Message, Notification, MaintenanceRequest } from '@/types/tenant';
import { Property } from '@/types/property';
import { getPropertyById, mockProperties } from '@/data/mockProperties';
import { PropertyManager, LeaseAgreement } from '@/types/landlord';

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
    role: 'TENANT',
    fullName: 'John Tenant',
    phone: '+1234567890',
    avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=tenant',
    createdAt: new Date().toISOString(),
  },
  {
    id: 'landlord-001',
    email: 'landlord@test.com',
    password: 'password123',
    role: 'LANDLORD',
    fullName: 'Jane Landlord',
    phone: '+1234567891',
    avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=landlord',
    createdAt: new Date().toISOString(),
  },
  {
    id: 'pm-001',
    email: 'manager@test.com',
    password: 'password123',
    role: 'PROPERTY_MANAGER',
    fullName: 'Mike Manager',
    phone: '+1234567892',
    avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=manager',
    createdAt: new Date().toISOString(),
  },
];

// Initialize mock database with seed data if empty
function initializeDatabase(): void {
  const existingUsers = localStorage.getItem(USERS_KEY);
  if (!existingUsers) {
    localStorage.setItem(USERS_KEY, JSON.stringify(seedUsers));
  } else {
    // Ensure property manager exists in existing users
    const users = JSON.parse(existingUsers);
    const pmExists = users.some((u: User) => u.id === 'pm-001');
    if (!pmExists) {
      const pmUser = seedUsers.find(u => u.id === 'pm-001');
      if (pmUser) {
        users.push(pmUser);
        localStorage.setItem(USERS_KEY, JSON.stringify(users));
      }
    }
    // Remove admin user if exists
    const adminIndex = users.findIndex((u: User) => u.id === 'admin-001');
    if (adminIndex !== -1) {
      users.splice(adminIndex, 1);
      localStorage.setItem(USERS_KEY, JSON.stringify(users));
    }
  }
  // Initialize sample lease agreements for demo landlord
  initializeSampleLeases();
}

// Initialize sample lease agreements for testing
function initializeSampleLeases(): void {
  const SAMPLE_LEASES_INITIALIZED_KEY = 'rentmate_sample_leases_initialized';
  const alreadyInitialized = localStorage.getItem(SAMPLE_LEASES_INITIALIZED_KEY);
  
  if (alreadyInitialized) return;
  
  const landlordId = 'landlord-001';
  const tenantId = 'tenant-001';
  const tenant = seedUsers.find(u => u.id === tenantId);
  
  // Get mock properties for demo
  const sampleProperties = mockProperties.slice(0, 3);
  
  const now = new Date();
  const oneMonthAgo = new Date(now);
  oneMonthAgo.setMonth(oneMonthAgo.getMonth() - 1);
  
  const oneYearFromNow = new Date(now);
  oneYearFromNow.setFullYear(oneYearFromNow.getFullYear() + 1);
  
  const sixMonthsFromNow = new Date(now);
  sixMonthsFromNow.setMonth(sixMonthsFromNow.getMonth() + 6);
  
  const sampleLeases: LeaseAgreement[] = [
    // Active lease
    {
      id: 'lease-sample-001',
      applicationId: 'app-sample-001',
      propertyId: sampleProperties[0]?.id || '1',
      property: sampleProperties[0] || mockProperties[0],
      tenantId: tenantId,
      tenantName: tenant?.fullName || 'John Tenant',
      tenantEmail: tenant?.email || 'tenant@test.com',
      tenantAvatar: tenant?.avatar,
      landlordId: landlordId,
      startDate: oneMonthAgo.toISOString(),
      endDate: oneYearFromNow.toISOString(),
      monthlyRent: 2500,
      securityDeposit: 5000,
      documents: [
        {
          id: 'doc-001',
          name: 'Lease Agreement.pdf',
          type: 'pdf',
          url: '#',
          uploadedAt: oneMonthAgo.toISOString(),
        },
        {
          id: 'doc-002',
          name: 'Move-in Checklist.pdf',
          type: 'pdf',
          url: '#',
          uploadedAt: oneMonthAgo.toISOString(),
        }
      ],
      status: 'active',
      paymentStatus: 'paid',
      paymentAmount: 7500,
      paidAt: oneMonthAgo.toISOString(),
      sentToTenantAt: oneMonthAgo.toISOString(),
      tenantRespondedAt: oneMonthAgo.toISOString(),
      createdAt: oneMonthAgo.toISOString(),
      updatedAt: oneMonthAgo.toISOString(),
    },
    // Pending tenant lease
    {
      id: 'lease-sample-002',
      applicationId: 'app-sample-002',
      propertyId: sampleProperties[1]?.id || '2',
      property: sampleProperties[1] || mockProperties[1],
      tenantId: tenantId,
      tenantName: tenant?.fullName || 'John Tenant',
      tenantEmail: tenant?.email || 'tenant@test.com',
      tenantAvatar: tenant?.avatar,
      landlordId: landlordId,
      startDate: new Date().toISOString(),
      endDate: sixMonthsFromNow.toISOString(),
      monthlyRent: 1800,
      securityDeposit: 3600,
      documents: [
        {
          id: 'doc-003',
          name: 'Lease Agreement.pdf',
          type: 'pdf',
          url: '#',
          uploadedAt: new Date().toISOString(),
        }
      ],
      status: 'pending_tenant',
      sentToTenantAt: new Date().toISOString(),
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    },
    // Rejected lease
    {
      id: 'lease-sample-003',
      applicationId: 'app-sample-003',
      propertyId: sampleProperties[2]?.id || '3',
      property: sampleProperties[2] || mockProperties[2],
      tenantId: tenantId,
      tenantName: tenant?.fullName || 'John Tenant',
      tenantEmail: tenant?.email || 'tenant@test.com',
      tenantAvatar: tenant?.avatar,
      landlordId: landlordId,
      startDate: new Date().toISOString(),
      endDate: oneYearFromNow.toISOString(),
      monthlyRent: 3200,
      securityDeposit: 6400,
      documents: [
        {
          id: 'doc-004',
          name: 'Lease Agreement.pdf',
          type: 'pdf',
          url: '#',
          uploadedAt: oneMonthAgo.toISOString(),
        }
      ],
      status: 'rejected',
      rejectionReason: 'Found a better option closer to work. Thank you for your time.',
      sentToTenantAt: oneMonthAgo.toISOString(),
      tenantRespondedAt: new Date(oneMonthAgo.getTime() + 86400000).toISOString(),
      createdAt: oneMonthAgo.toISOString(),
      updatedAt: new Date(oneMonthAgo.getTime() + 86400000).toISOString(),
    },
  ];
  
  localStorage.setItem(`${LEASE_AGREEMENTS_KEY}_${landlordId}`, JSON.stringify(sampleLeases));
  localStorage.setItem(SAMPLE_LEASES_INITIALIZED_KEY, 'true');
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
    fullName: user.fullName,
    phone: user.phone,
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
  fullName: string,
  phone: string,
  role: UserRole
): { success: boolean; user?: CurrentUser; error?: string } {
  const existingUser = findUserByEmail(email);
  
  if (existingUser) {
    return { success: false, error: 'An account with this email already exists' };
  }
  
  const newUser = addUser({
    email,
    password,
    fullName,
    phone,
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

// =====================
// LANDLORD FUNCTIONS
// =====================

const LANDLORD_PROPERTIES_KEY = 'rentmate_landlord_properties';
const LEASE_AGREEMENTS_KEY = 'rentmate_lease_agreements';
const PROPERTY_MANAGERS_KEY = 'rentmate_property_managers';
const GLOBAL_APPLICATIONS_KEY = 'rentmate_global_applications';

// Get properties owned by a landlord
export function getLandlordProperties(landlordId: string): Property[] {
  // For demo, return mock properties where landlord.id matches or use stored ones
  const storedProps = localStorage.getItem(`${LANDLORD_PROPERTIES_KEY}_${landlordId}`);
  const customProps: Property[] = storedProps ? JSON.parse(storedProps) : [];
  
  // Also include mock properties for demo landlord
  const mockProps = mockProperties.filter(p => 
    p.landlord.id === landlordId || 
    (landlordId === 'landlord-001' && ['1', '2', '3'].includes(p.id))
  );
  
  return [...mockProps, ...customProps];
}

// Add a new property for landlord
export function addLandlordProperty(landlordId: string, propertyData: Partial<Property>): Property {
  const user = getUsers().find(u => u.id === landlordId);
  const newProperty: Property = {
    id: `prop-${Date.now()}`,
    title: propertyData.title || 'New Property',
    description: propertyData.description || '',
    type: propertyData.type || 'apartment',
    status: 'available',
    price: propertyData.price || 0,
    currency: 'USD',
    address: propertyData.address || { street: '', city: '', state: '', zipCode: '', country: 'USA' },
    bedrooms: propertyData.bedrooms || 0,
    bathrooms: propertyData.bathrooms || 1,
    size: propertyData.size || 0,
    furnished: propertyData.furnished || false,
    petFriendly: propertyData.petFriendly || false,
    parkingSpaces: propertyData.parkingSpaces || 0,
    amenities: propertyData.amenities || [],
    images: ['https://images.unsplash.com/photo-1502672260266-1c1ef2d93688?w=800'],
    thumbnail: 'https://images.unsplash.com/photo-1502672260266-1c1ef2d93688?w=800',
    landlord: {
      id: landlordId,
      name: user?.fullName || 'Unknown',
      avatar: user?.avatar || '',
      email: user?.email,
      responseRate: 95,
      responseTime: 'Within a day',
      propertiesCount: 1,
      verified: true,
    },
    rating: 0,
    reviewsCount: 0,
    availableFrom: propertyData.availableFrom || new Date().toISOString().split('T')[0],
    minimumLease: propertyData.minimumLease || 12,
    rules: [],
    featured: false,
    isNew: true,
    verified: false,
    views: 0,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };

  const storedProps = localStorage.getItem(`${LANDLORD_PROPERTIES_KEY}_${landlordId}`);
  const props: Property[] = storedProps ? JSON.parse(storedProps) : [];
  props.push(newProperty);
  localStorage.setItem(`${LANDLORD_PROPERTIES_KEY}_${landlordId}`, JSON.stringify(props));
  
  return newProperty;
}

// Update a landlord property
export function updateLandlordProperty(propertyId: string, updates: Partial<Property>): boolean {
  // Implementation for updating property
  return true;
}

// Get all applications for landlord's properties
export function getApplicationsForLandlord(landlordId: string): Application[] {
  const properties = getLandlordProperties(landlordId);
  const propertyIds = properties.map(p => p.id);
  
  // Get all applications from all users
  const allUsers = getUsers();
  const allApplications: Application[] = [];
  
  allUsers.forEach(user => {
    const userApps = getApplications(user.id);
    userApps.forEach(app => {
      if (propertyIds.includes(app.propertyId)) {
        allApplications.push(app);
      }
    });
  });
  
  return allApplications;
}

// Update application status (approve/reject)
export function updateApplicationStatus(
  applicationId: string,
  status: 'approved' | 'rejected',
  message?: string
): boolean {
  const allUsers = getUsers();
  
  for (const user of allUsers) {
    const apps = getApplications(user.id);
    const appIndex = apps.findIndex(a => a.id === applicationId);
    
    if (appIndex !== -1) {
      const app = apps[appIndex];
      const now = new Date().toISOString();
      
      apps[appIndex] = {
        ...app,
        status,
        updatedAt: now,
        timeline: [
          ...app.timeline,
          {
            id: `event-${Date.now()}`,
            status,
            message: message || (status === 'approved' ? 'Application approved' : 'Application rejected'),
            timestamp: now,
          },
        ],
      };
      
      localStorage.setItem(`${APPLICATIONS_KEY}_${user.id}`, JSON.stringify(apps));
      
      // Create notification for tenant
      createNotification(
        user.id,
        'application',
        status === 'approved' ? 'Application Approved!' : 'Application Update',
        status === 'approved' 
          ? `Your application for ${app.property.title} has been approved!`
          : `Your application for ${app.property.title} has been rejected.`,
        '/dashboard/applications'
      );
      
      // If approved, create lease agreement
      if (status === 'approved') {
        const leaseUser = getUsers().find(u => u.id === user.id);
        createLeaseAgreement(app, leaseUser);
      }
      
      return true;
    }
  }
  
  return false;
}

// Create lease agreement (used internally when auto-creating from old flow)
function createLeaseAgreement(application: Application, tenant?: User): void {
  const leases = getLeaseAgreements(application.property.landlord.id);
  const startDate = new Date();
  const endDate = new Date();
  endDate.setMonth(endDate.getMonth() + application.property.minimumLease);
  
  const newLease: LeaseAgreement = {
    id: `lease-${Date.now()}`,
    applicationId: application.id,
    propertyId: application.propertyId,
    property: application.property,
    tenantId: application.tenantId,
    tenantName: tenant?.fullName || 'Unknown',
    tenantEmail: tenant?.email || '',
    tenantAvatar: tenant?.avatar,
    landlordId: application.property.landlord.id,
    startDate: startDate.toISOString(),
    endDate: endDate.toISOString(),
    monthlyRent: application.property.price,
    securityDeposit: application.property.price * 2,
    documents: [],
    status: 'active',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };
  
  leases.push(newLease);
  localStorage.setItem(`${LEASE_AGREEMENTS_KEY}_${application.property.landlord.id}`, JSON.stringify(leases));
}

// Check and update expired leases
function checkAndUpdateExpiredLeases(landlordId: string): void {
  const stored = localStorage.getItem(`${LEASE_AGREEMENTS_KEY}_${landlordId}`);
  if (!stored) return;
  
  const leases: LeaseAgreement[] = JSON.parse(stored);
  const now = new Date();
  let hasUpdates = false;
  
  const updatedLeases = leases.map(lease => {
    // Only check active leases for expiration
    if (lease.status === 'active') {
      const endDate = new Date(lease.endDate);
      if (endDate < now) {
        hasUpdates = true;
        return {
          ...lease,
          status: 'expired' as const,
          updatedAt: now.toISOString(),
        };
      }
    }
    return lease;
  });
  
  if (hasUpdates) {
    localStorage.setItem(`${LEASE_AGREEMENTS_KEY}_${landlordId}`, JSON.stringify(updatedLeases));
  }
}

// Get lease agreements for landlord
export function getLeaseAgreements(landlordId: string): LeaseAgreement[] {
  // Check for expired leases first
  checkAndUpdateExpiredLeases(landlordId);
  
  const stored = localStorage.getItem(`${LEASE_AGREEMENTS_KEY}_${landlordId}`);
  return stored ? JSON.parse(stored) : [];
}

// Create lease agreement from landlord (new enhanced flow)
export function createLeaseFromApplication(
  applicationId: string,
  landlordId: string,
  leaseData: {
    monthlyRent: number;
    securityDeposit: number;
    startDate: string;
    endDate: string;
    documents: { id: string; name: string; type: 'pdf' | 'image'; url: string; uploadedAt: string }[];
  }
): LeaseAgreement | null {
  // Find the application
  const allUsers = getUsers();
  let application: Application | null = null;
  let tenant: User | null = null;
  
  for (const user of allUsers) {
    const apps = getApplications(user.id);
    const found = apps.find(a => a.id === applicationId);
    if (found) {
      application = found;
      tenant = user;
      break;
    }
  }
  
  if (!application) return null;
  
  const now = new Date().toISOString();
  const newLease: LeaseAgreement = {
    id: `lease-${Date.now()}`,
    applicationId,
    propertyId: application.propertyId,
    property: application.property,
    tenantId: application.tenantId,
    tenantName: tenant?.fullName || 'Unknown',
    tenantEmail: tenant?.email || '',
    tenantAvatar: tenant?.avatar,
    landlordId,
    startDate: leaseData.startDate,
    endDate: leaseData.endDate,
    monthlyRent: leaseData.monthlyRent,
    securityDeposit: leaseData.securityDeposit,
    documents: leaseData.documents,
    status: 'pending_tenant',
    sentToTenantAt: now,
    createdAt: now,
    updatedAt: now,
  };
  
  const leases = getLeaseAgreements(landlordId);
  leases.push(newLease);
  localStorage.setItem(`${LEASE_AGREEMENTS_KEY}_${landlordId}`, JSON.stringify(leases));
  
  // Notify tenant
  createNotification(
    application.tenantId,
    'application',
    'New Lease Agreement',
    `A lease agreement for ${application.property.title} is ready for your review.`,
    '/dashboard/leases'
  );
  
  return newLease;
}

// Get leases for tenant
export function getTenantLeases(tenantId: string): LeaseAgreement[] {
  const allLandlords = getUsers().filter(u => u.role === 'LANDLORD');
  const tenantLeases: LeaseAgreement[] = [];
  
  allLandlords.forEach(landlord => {
    const leases = getLeaseAgreements(landlord.id);
    leases.forEach(lease => {
      if (lease.tenantId === tenantId) {
        tenantLeases.push(lease);
      }
    });
  });
  
  return tenantLeases;
}

// Tenant accepts lease
export function acceptLease(leaseId: string): boolean {
  const allLandlords = getUsers().filter(u => u.role === 'LANDLORD');
  
  for (const landlord of allLandlords) {
    const leases = getLeaseAgreements(landlord.id);
    const leaseIndex = leases.findIndex(l => l.id === leaseId);
    
    if (leaseIndex !== -1) {
      const now = new Date().toISOString();
      leases[leaseIndex] = {
        ...leases[leaseIndex],
        status: 'payment_pending',
        tenantRespondedAt: now,
        updatedAt: now,
      };
      localStorage.setItem(`${LEASE_AGREEMENTS_KEY}_${landlord.id}`, JSON.stringify(leases));
      return true;
    }
  }
  return false;
}

// Tenant rejects lease
export function rejectLease(leaseId: string, reason: string): boolean {
  const allLandlords = getUsers().filter(u => u.role === 'LANDLORD');
  
  for (const landlord of allLandlords) {
    const leases = getLeaseAgreements(landlord.id);
    const leaseIndex = leases.findIndex(l => l.id === leaseId);
    
    if (leaseIndex !== -1) {
      const now = new Date().toISOString();
      const lease = leases[leaseIndex];
      
      leases[leaseIndex] = {
        ...lease,
        status: 'rejected',
        rejectionReason: reason,
        tenantRespondedAt: now,
        updatedAt: now,
      };
      localStorage.setItem(`${LEASE_AGREEMENTS_KEY}_${landlord.id}`, JSON.stringify(leases));
      
      // Notify landlord
      createNotification(
        landlord.id,
        'application',
        'Lease Agreement Rejected',
        `${lease.tenantName} has rejected the lease for ${lease.property.title}.`,
        '/dashboard/leases'
      );
      
      return true;
    }
  }
  return false;
}

// Process lease payment
export function processLeasePayment(leaseId: string): boolean {
  const allLandlords = getUsers().filter(u => u.role === 'LANDLORD');
  
  for (const landlord of allLandlords) {
    const leases = getLeaseAgreements(landlord.id);
    const leaseIndex = leases.findIndex(l => l.id === leaseId);
    
    if (leaseIndex !== -1) {
      const now = new Date().toISOString();
      const lease = leases[leaseIndex];
      
      leases[leaseIndex] = {
        ...lease,
        status: 'active',
        paymentStatus: 'paid',
        paymentAmount: lease.securityDeposit + lease.monthlyRent,
        paidAt: now,
        updatedAt: now,
      };
      localStorage.setItem(`${LEASE_AGREEMENTS_KEY}_${landlord.id}`, JSON.stringify(leases));
      
      // Notify landlord
      createNotification(
        landlord.id,
        'payment',
        'Payment Received',
        `${lease.tenantName} has paid $${(lease.securityDeposit + lease.monthlyRent).toLocaleString()} for ${lease.property.title}.`,
        '/dashboard/leases'
      );
      
      return true;
    }
  }
  return false;
}

// Get landlord conversations
export function getLandlordConversations(landlordId: string): Conversation[] {
  const stored = localStorage.getItem(`${CONVERSATIONS_KEY}_landlord_${landlordId}`);
  if (stored) return JSON.parse(stored);
  
  // Also check for conversations where landlord is the recipient
  const allUsers = getUsers();
  const conversations: Conversation[] = [];
  
  allUsers.forEach(user => {
    const userConvs = getConversations(user.id);
    userConvs.forEach(conv => {
      if (conv.landlordId === landlordId) {
        conversations.push(conv);
      }
    });
  });
  
  return conversations;
}

// Add message to conversation
export function addMessageToConversation(
  conversationId: string,
  senderId: string,
  senderType: 'tenant' | 'landlord',
  content: string
): Conversation | null {
  const allUsers = getUsers();
  
  for (const user of allUsers) {
    const convs = getConversations(user.id);
    const convIndex = convs.findIndex(c => c.id === conversationId);
    
    if (convIndex !== -1) {
      const now = new Date().toISOString();
      const newMessage: Message = {
        id: `msg-${Date.now()}`,
        conversationId,
        senderId,
        senderType,
        content,
        timestamp: now,
        read: false,
      };
      
      convs[convIndex] = {
        ...convs[convIndex],
        messages: [...convs[convIndex].messages, newMessage],
        lastMessage: content,
        lastMessageAt: now,
      };
      
      localStorage.setItem(`${CONVERSATIONS_KEY}_${user.id}`, JSON.stringify(convs));
      return convs[convIndex];
    }
  }
  
  return null;
}

// Property Managers
export function getPropertyManagers(propertyId: string): PropertyManager[] {
  const stored = localStorage.getItem(`${PROPERTY_MANAGERS_KEY}_${propertyId}`);
  return stored ? JSON.parse(stored) : [];
}

export function addPropertyManager(propertyId: string, user: User): PropertyManager {
  const managers = getPropertyManagers(propertyId);
  const newManager: PropertyManager = {
    id: `manager-${Date.now()}`,
    propertyId,
    userId: user.id,
    userName: user.fullName,
    userEmail: user.email,
    userAvatar: user.avatar,
    role: 'manager',
    addedAt: new Date().toISOString(),
  };
  
  managers.push(newManager);
  localStorage.setItem(`${PROPERTY_MANAGERS_KEY}_${propertyId}`, JSON.stringify(managers));
  return newManager;
}

export function removePropertyManager(propertyId: string, managerId: string): boolean {
  const managers = getPropertyManagers(propertyId);
  const updated = managers.filter(m => m.id !== managerId);
  localStorage.setItem(`${PROPERTY_MANAGERS_KEY}_${propertyId}`, JSON.stringify(updated));
  return true;
}

// =====================
// PROPERTY MANAGER FUNCTIONS
// =====================

// Get all properties a user manages
export function getPropertiesForManager(userId: string): Property[] {
  const allProperties = mockProperties;
  const managedProperties: Property[] = [];
  
  allProperties.forEach(property => {
    const managers = getPropertyManagers(property.id);
    if (managers.some(m => m.userId === userId)) {
      managedProperties.push(property);
    }
  });
  
  // Also check landlord-added properties
  const allUsers = getUsers().filter(u => u.role === 'LANDLORD');
  allUsers.forEach(landlord => {
    const storedProps = localStorage.getItem(`${LANDLORD_PROPERTIES_KEY}_${landlord.id}`);
    if (storedProps) {
      const props: Property[] = JSON.parse(storedProps);
      props.forEach(property => {
        const managers = getPropertyManagers(property.id);
        if (managers.some(m => m.userId === userId)) {
          managedProperties.push(property);
        }
      });
    }
  });
  
  return managedProperties;
}

// Get applications for managed properties
export function getApplicationsForManager(userId: string): Application[] {
  const managedProperties = getPropertiesForManager(userId);
  const propertyIds = managedProperties.map(p => p.id);
  
  const allUsers = getUsers();
  const allApplications: Application[] = [];
  
  allUsers.forEach(user => {
    const userApps = getApplications(user.id);
    userApps.forEach(app => {
      if (propertyIds.includes(app.propertyId)) {
        allApplications.push(app);
      }
    });
  });
  
  return allApplications;
}

// Get leases for managed properties
export function getLeasesForManager(userId: string): LeaseAgreement[] {
  const managedProperties = getPropertiesForManager(userId);
  const propertyIds = managedProperties.map(p => p.id);
  
  const allLandlords = getUsers().filter(u => u.role === 'LANDLORD');
  const managerLeases: LeaseAgreement[] = [];
  
  allLandlords.forEach(landlord => {
    const leases = getLeaseAgreements(landlord.id);
    leases.forEach(lease => {
      if (propertyIds.includes(lease.propertyId)) {
        managerLeases.push(lease);
      }
    });
  });
  
  return managerLeases;
}

// Get maintenance requests for managed properties
import { mockMaintenanceRequests } from '@/data/mockTenant';
export function getMaintenanceForManager(userId: string): MaintenanceRequest[] {
  const managedProperties = getPropertiesForManager(userId);
  const propertyIds = managedProperties.map(p => p.id);
  
  // Filter mock maintenance requests by managed property IDs
  return mockMaintenanceRequests.filter(req => 
    req.propertyId && propertyIds.includes(req.propertyId)
  );
}

// Get conversations for managed properties
export function getConversationsForManager(userId: string): Conversation[] {
  const managedProperties = getPropertiesForManager(userId);
  const propertyIds = managedProperties.map(p => p.id);
  
  const allUsers = getUsers();
  const conversations: Conversation[] = [];
  
  allUsers.forEach(user => {
    const userConvs = getConversations(user.id);
    userConvs.forEach(conv => {
      if (propertyIds.includes(conv.propertyId)) {
        conversations.push(conv);
      }
    });
  });
  
  return conversations;
}
