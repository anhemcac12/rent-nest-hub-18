import { UserRole } from '@/types/user';
import { NotificationType, RelatedEntityType } from '@/lib/api/notificationsApi';

/**
 * Role-based link mapping for notification navigation.
 * This is a fallback utility for the frontend in case backend sends generic links.
 * The backend SHOULD send role-appropriate links, but this handles edge cases.
 */

type FeatureType = 'applications' | 'leases' | 'maintenance' | 'payments' | 'messages' | 'properties' | 'profile' | 'home';

const ROLE_LINKS: Record<FeatureType, Record<UserRole, string>> = {
  applications: {
    TENANT: '/dashboard/applications',
    LANDLORD: '/dashboard/landlord-applications',
    PROPERTY_MANAGER: '/dashboard/pm-applications',
  },
  leases: {
    TENANT: '/dashboard/leases',
    LANDLORD: '/dashboard/landlord-leases',
    PROPERTY_MANAGER: '/dashboard/pm-leases',
  },
  maintenance: {
    TENANT: '/dashboard/maintenance',
    LANDLORD: '/dashboard/landlord-maintenance',
    PROPERTY_MANAGER: '/dashboard/pm-maintenance',
  },
  payments: {
    TENANT: '/dashboard/payments',
    LANDLORD: '/dashboard/landlord-leases',
    PROPERTY_MANAGER: '/dashboard/pm-leases',
  },
  messages: {
    TENANT: '/dashboard/messages',
    LANDLORD: '/dashboard/landlord-messages',
    PROPERTY_MANAGER: '/dashboard/pm-messages',
  },
  properties: {
    TENANT: '/dashboard/rentals',
    LANDLORD: '/dashboard/landlord-properties',
    PROPERTY_MANAGER: '/dashboard/pm-properties',
  },
  profile: {
    TENANT: '/dashboard/profile',
    LANDLORD: '/dashboard/profile',
    PROPERTY_MANAGER: '/dashboard/profile',
  },
  home: {
    TENANT: '/dashboard',
    LANDLORD: '/dashboard/landlord',
    PROPERTY_MANAGER: '/dashboard/pm',
  },
};

/**
 * Map notification type to feature for link resolution
 */
const TYPE_TO_FEATURE: Record<NotificationType, FeatureType> = {
  APPLICATION: 'applications',
  LEASE: 'leases',
  MAINTENANCE: 'maintenance',
  PAYMENT: 'payments',
  MESSAGE: 'messages',
  PROPERTY: 'properties',
  SYSTEM: 'home',
};

/**
 * Get the role-appropriate link for a notification.
 * Uses the notification's link if it's already role-appropriate,
 * otherwise falls back to role-based mapping.
 */
export function getRoleAwareNotificationLink(
  notificationLink: string | undefined,
  notificationType: NotificationType,
  userRole: UserRole
): string {
  // If it's a property-specific link (e.g., /properties/123), keep it as-is
  if (notificationLink?.startsWith('/properties/')) {
    return notificationLink;
  }
  
  // If the notification already has a role-specific link, use it
  if (notificationLink && isRoleSpecificLink(notificationLink, userRole)) {
    return notificationLink;
  }
  
  // Fall back to role-based mapping
  const feature = TYPE_TO_FEATURE[notificationType];
  return ROLE_LINKS[feature][userRole];
}

/**
 * Check if a link is already role-specific for the given user role
 */
function isRoleSpecificLink(link: string, role: UserRole): boolean {
  if (role === 'LANDLORD') {
    return link.includes('/landlord-') || link.includes('/dashboard/landlord');
  }
  if (role === 'PROPERTY_MANAGER') {
    return link.includes('/pm-') || link.includes('/dashboard/pm');
  }
  if (role === 'TENANT') {
    // Tenant links don't have a prefix, so check it's not landlord or pm
    return !link.includes('/landlord-') && !link.includes('/pm-');
  }
  return true;
}

/**
 * Get the dashboard home link for a user role
 */
export function getDashboardHomeLink(role: UserRole): string {
  return ROLE_LINKS.home[role];
}

/**
 * Get the feature-specific link for a user role
 */
export function getFeatureLink(feature: FeatureType, role: UserRole): string {
  return ROLE_LINKS[feature][role];
}
