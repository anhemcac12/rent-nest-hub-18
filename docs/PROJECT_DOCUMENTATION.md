# RentEase - Complete Project Documentation

> **Purpose**: This document provides comprehensive details for any AI agent to understand, maintain, and extend this project.

---

## Table of Contents

1. [Project Overview](#project-overview)
2. [Tech Stack](#tech-stack)
3. [Project Structure](#project-structure)
4. [Authentication System](#authentication-system)
5. [API Integration](#api-integration)
6. [Real-time WebSocket System](#real-time-websocket-system)
7. [User Roles & Dashboards](#user-roles--dashboards)
8. [Key Features by Role](#key-features-by-role)
9. [Design System](#design-system)
10. [State Management](#state-management)
11. [Backend Requirements](#backend-requirements)
12. [Common Patterns](#common-patterns)
13. [File Reference](#file-reference)

---

## Project Overview

RentEase is a property rental management platform connecting **Tenants**, **Landlords**, and **Property Managers**. It provides:

- Property listings and search
- Lease application workflow
- Lease agreement management
- Rent payment tracking
- Maintenance request handling
- Real-time messaging
- Notification system

---

## Tech Stack

| Category | Technology |
|----------|------------|
| Framework | React 18 + TypeScript |
| Build Tool | Vite |
| Styling | Tailwind CSS + shadcn/ui |
| Routing | React Router DOM v6 |
| State/Data | TanStack React Query v5 |
| Forms | React Hook Form + Zod |
| WebSocket | STOMP.js + SockJS |
| Icons | Lucide React |
| Toasts | Sonner |
| Date Utils | date-fns |

---

## Project Structure

```
src/
├── components/
│   ├── ui/                    # shadcn/ui components (Button, Card, Dialog, etc.)
│   ├── layout/                # Header, Footer
│   ├── dashboard/             # Dashboard layout, sidebars, stats
│   ├── landlord/              # Landlord-specific components
│   ├── tenant/                # Tenant-specific components
│   ├── property/              # Property-related components
│   └── maintenance/           # Maintenance components
├── contexts/
│   ├── AuthContext.tsx        # Authentication state
│   └── RealtimeContext.tsx    # WebSocket & real-time notifications
├── hooks/
│   ├── use-mobile.tsx         # Mobile detection
│   ├── use-toast.ts           # Toast notifications
│   └── useChatWebSocket.ts    # Chat WebSocket hook
├── lib/
│   ├── api/                   # All API integration files
│   │   ├── client.ts          # HTTP client with auth interceptors
│   │   ├── config.ts          # API endpoints configuration
│   │   ├── authApi.ts         # Authentication API
│   │   ├── userApi.ts         # User profile API
│   │   ├── propertyApi.ts     # Properties API
│   │   ├── leaseApi.ts        # Lease agreements API
│   │   ├── leaseApplicationApi.ts  # Applications API
│   │   ├── paymentApi.ts      # Payments API
│   │   ├── maintenanceApi.ts  # Maintenance API
│   │   ├── conversationsApi.ts # Messaging API
│   │   ├── notificationsApi.ts # Notifications API
│   │   ├── savedPropertiesApi.ts
│   │   ├── fileApi.ts         # File uploads
│   │   └── API_IMPLEMENTATION_STATUS.md  # ⚠️ IMPORTANT: Track API status here
│   ├── websocket/
│   │   ├── notificationWebSocket.ts  # Notification WebSocket
│   │   └── chatWebSocket.ts          # Chat WebSocket
│   ├── utils/
│   │   └── notificationLinks.ts      # Notification link resolver
│   └── utils.ts               # General utilities (cn, etc.)
├── pages/
│   ├── Index.tsx              # Landing page
│   ├── Properties.tsx         # Property listings
│   ├── PropertyDetail.tsx     # Single property view
│   ├── Auth.tsx               # Login/Signup
│   ├── About.tsx, Contact.tsx, Help.tsx
│   └── dashboard/
│       ├── DashboardHome.tsx  # Role-based redirect
│       ├── Profile.tsx        # User profile (shared)
│       ├── Messages.tsx       # Messaging (shared)
│       ├── Notifications.tsx  # Notifications (shared)
│       ├── tenant/            # Tenant dashboard pages
│       ├── landlord/          # Landlord dashboard pages
│       └── property-manager/  # Property manager pages
├── types/
│   ├── user.ts                # User, CurrentUser, UserRole
│   ├── property.ts            # Property, PropertyFilter
│   ├── tenant.ts              # Tenant-related types
│   ├── landlord.ts            # Landlord-related types
│   └── lease.ts               # Lease types
├── data/
│   └── mockProperties.ts      # Mock data (for reference)
└── index.css                  # Design system tokens
```

---

## Authentication System

### Flow

1. User logs in via `/auth` page
2. `authApi.login()` calls backend, receives tokens
3. Tokens stored in localStorage (`access_token`, `refresh_token`)
4. `AuthContext` provides user state globally
5. `api/client.ts` automatically attaches tokens to all requests
6. Token refresh handled automatically on 401 errors

### Key Files

- `src/contexts/AuthContext.tsx` - Auth state provider
- `src/lib/api/authApi.ts` - Login, signup, logout, password APIs
- `src/lib/api/client.ts` - HTTP client with interceptors
- `src/pages/Auth.tsx` - Login/Signup UI

### User Types

```typescript
type UserRole = "TENANT" | "LANDLORD" | "PROPERTY_MANAGER";

interface CurrentUser {
  id: string;
  email: string;
  role: UserRole;
  fullName: string;
  phone: string;
  avatar?: string;
}
```

### Protected Routes

All `/dashboard/*` routes require authentication. The `DashboardLayout` component handles role-based sidebar rendering.

---

## API Integration

### HTTP Client (`src/lib/api/client.ts`)

```typescript
// All API calls go through this client
import { api } from './client';

// Methods available:
api.get<T>(endpoint)
api.post<T>(endpoint, data)
api.put<T>(endpoint, data)
api.patch<T>(endpoint, data?)
api.delete<T>(endpoint)
```

### API Configuration (`src/lib/api/config.ts`)

```typescript
export const API_BASE_URL = 'http://localhost:8081';
export const WS_URL = 'ws://localhost:8081';

export const API_ENDPOINTS = {
  // Auth
  LOGIN: '/api/auth/login',
  SIGNUP: '/api/auth/register',
  LOGOUT: '/api/auth/logout',
  REFRESH_TOKEN: '/api/auth/refresh',
  
  // Users
  CURRENT_USER: '/api/users/me',
  UPDATE_PROFILE: '/api/users/me',
  
  // Properties
  PROPERTIES: '/api/properties',
  PROPERTY_BY_ID: (id: string) => `/api/properties/${id}`,
  MY_PROPERTIES: '/api/properties/my-properties',
  
  // Lease Applications
  LEASE_APPLICATIONS: '/api/lease-applications',
  MY_APPLICATIONS: '/api/lease-applications/my-applications',
  PROPERTY_APPLICATIONS: (propertyId: string) => `/api/lease-applications/property/${propertyId}`,
  
  // Lease Agreements
  LEASE_AGREEMENTS: '/api/lease-agreements',
  TENANT_LEASES: '/api/lease-agreements/tenant',
  LANDLORD_LEASES: '/api/lease-agreements/landlord',
  
  // Payments
  RENT_SCHEDULE: (leaseId: string) => `/api/lease-agreements/${leaseId}/rent-schedule`,
  PAY_RENT: (scheduleId: number) => `/api/rent-schedule/${scheduleId}/pay`,
  
  // Maintenance
  MAINTENANCE_REQUESTS: '/api/maintenance-requests',
  
  // Conversations
  CONVERSATIONS: '/api/conversations',
  
  // Notifications
  NOTIFICATIONS: '/api/notifications',
  NOTIFICATIONS_UNREAD_COUNT: '/api/notifications/unread-count',
  // ... more endpoints
};
```

### API Implementation Status

**⚠️ CRITICAL**: Always check and update `src/lib/api/API_IMPLEMENTATION_STATUS.md` when:
- Implementing new API endpoints
- Modifying existing API calls
- Checking what's implemented vs not

---

## Real-time WebSocket System

### Architecture

```
┌─────────────────┐     ┌──────────────────────┐     ┌─────────────┐
│   React App     │────▶│  RealtimeContext     │────▶│  WebSocket  │
│                 │     │                      │     │   Server    │
│ - Notifications │◀────│ - Connection mgmt    │◀────│             │
│ - Auto-refresh  │     │ - Notification state │     │ STOMP/SockJS│
│ - Toasts        │     │ - Refresh callbacks  │     │             │
└─────────────────┘     └──────────────────────┘     └─────────────┘
```

### Key Files

1. **`src/lib/websocket/notificationWebSocket.ts`**
   - STOMP client configuration
   - Connects to `/ws` endpoint with SockJS
   - Subscribes to `/user/queue/notifications`
   - Handles reconnection automatically

2. **`src/contexts/RealtimeContext.tsx`**
   - Manages WebSocket connection lifecycle
   - Stores notifications in state
   - Provides `subscribeToRefresh(types, callback)` for auto-refresh
   - Shows toast on new notifications

### Usage Pattern

```typescript
// In any component that needs auto-refresh:
import { useRealtime } from '@/contexts/RealtimeContext';

function MyComponent() {
  const { subscribeToRefresh } = useRealtime();
  
  const fetchData = useCallback(async () => {
    // Fetch data from API
  }, []);

  useEffect(() => {
    // Subscribe to specific notification types
    const unsubscribe = subscribeToRefresh(
      ['APPLICATION', 'LEASE'], 
      () => fetchData()
    );
    return unsubscribe;
  }, [subscribeToRefresh, fetchData]);
}
```

### Notification Types

```typescript
type NotificationType = 
  | 'APPLICATION'  // Lease application updates
  | 'LEASE'        // Lease agreement updates
  | 'MAINTENANCE'  // Maintenance request updates
  | 'MESSAGE'      // New messages
  | 'PAYMENT'      // Payment updates
  | 'PROPERTY'     // Property updates
  | 'SYSTEM';      // System notifications
```

### Backend WebSocket Requirements

See `docs/NOTIFICATIONS_BACKEND_IMPLEMENTATION.md` for:
- WebSocket configuration (STOMP over SockJS)
- Message format and destinations
- Notification triggers for all events

---

## User Roles & Dashboards

### Role-Based Routing

| Role | Dashboard Path | Sidebar Component |
|------|---------------|-------------------|
| TENANT | `/dashboard/tenant/*` | `TenantSidebar` |
| LANDLORD | `/dashboard/landlord/*` | `LandlordSidebar` |
| PROPERTY_MANAGER | `/dashboard/property-manager/*` | `PropertyManagerSidebar` |

### Dashboard Layout

```
┌──────────────────────────────────────────────────┐
│                    Header                         │
├────────────┬─────────────────────────────────────┤
│            │                                      │
│  Sidebar   │           Main Content              │
│  (role-    │                                      │
│   based)   │                                      │
│            │                                      │
└────────────┴─────────────────────────────────────┘
```

---

## Key Features by Role

### Tenant Features

| Feature | Page | API |
|---------|------|-----|
| Browse properties | `/properties` | `propertyApi.getProperties()` |
| View property details | `/properties/:id` | `propertyApi.getPropertyById()` |
| Apply for lease | Modal in PropertyDetail | `leaseApplicationApi.createApplication()` |
| View applications | `/dashboard/tenant/applications` | `leaseApplicationApi.getMyApplications()` |
| View leases | `/dashboard/tenant/leases` | `leaseApi.getTenantLeases()` |
| Accept/Reject lease | Modal | `leaseApi.acceptLease()` / `rejectLease()` |
| Pay rent | `/dashboard/tenant/payments` | `paymentApi.payRent()` |
| Submit maintenance | `/dashboard/tenant/maintenance` | `maintenanceApi.createRequest()` |
| Messages | `/dashboard/messages` | `conversationsApi.*` |

### Landlord Features

| Feature | Page | API |
|---------|------|-----|
| Manage properties | `/dashboard/landlord/properties` | `propertyApi.getMyProperties()` |
| Create property | Modal | `propertyApi.createProperty()` |
| View applications | `/dashboard/landlord/applications` | `leaseApplicationApi.getPropertyApplications()` |
| Approve/Reject apps | Modal | `leaseApplicationApi.updateStatus()` |
| Create lease | `/dashboard/landlord/leases` | `leaseApi.createLease()` |
| Track maintenance | `/dashboard/landlord/maintenance` | `maintenanceApi.*` |
| Messages | `/dashboard/messages` | `conversationsApi.*` |

### Property Manager Features

Similar to Landlord but scoped to assigned properties only.

---

## Design System

### Tailwind Configuration

```typescript
// tailwind.config.ts - Key customizations
{
  theme: {
    extend: {
      colors: {
        border: "hsl(var(--border))",
        background: "hsl(var(--background))",
        foreground: "hsl(var(--foreground))",
        primary: {
          DEFAULT: "hsl(var(--primary))",
          foreground: "hsl(var(--primary-foreground))",
        },
        // ... other semantic colors
      }
    }
  }
}
```

### CSS Variables (`src/index.css`)

```css
:root {
  --background: 0 0% 100%;
  --foreground: 222.2 84% 4.9%;
  --primary: 221.2 83.2% 53.3%;
  --primary-foreground: 210 40% 98%;
  /* ... */
}

.dark {
  --background: 222.2 84% 4.9%;
  --foreground: 210 40% 98%;
  /* ... */
}
```

### UI Components

All UI components are from shadcn/ui in `src/components/ui/`:
- Button, Card, Dialog, Sheet, Tabs
- Form, Input, Select, Textarea
- Table, Badge, Avatar
- Toast (Sonner), Tooltip
- And more...

### Design Rules

1. **NEVER use direct colors** - Always use semantic tokens
2. **Use HSL format** - All colors must be HSL
3. **Responsive design** - Use Tailwind breakpoints
4. **Dark mode support** - Use CSS variables that adapt

---

## State Management

### React Query

Used for server state management:

```typescript
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';

// Fetching data
const { data, isLoading, error } = useQuery({
  queryKey: ['properties'],
  queryFn: () => propertyApi.getProperties()
});

// Mutations
const mutation = useMutation({
  mutationFn: (data) => propertyApi.createProperty(data),
  onSuccess: () => {
    queryClient.invalidateQueries({ queryKey: ['properties'] });
  }
});
```

### Context Providers

1. **AuthContext** - User authentication state
2. **RealtimeContext** - WebSocket & notifications

### Local State

- `useState` for component-level state
- `useCallback`/`useMemo` for performance
- React Hook Form for form state

---

## Backend Requirements

### Expected Backend Stack

- Java Spring Boot
- PostgreSQL database
- WebSocket with STOMP over SockJS

### API Response Format

```typescript
// Paginated response
interface PageResponse<T> {
  content: T[];
  totalElements: number;
  totalPages: number;
  size: number;
  number: number;
}

// Error response
interface ErrorResponse {
  message: string;
  status: number;
  timestamp: string;
}
```

### Authentication

- JWT tokens (access + refresh)
- Access token in `Authorization: Bearer <token>` header
- Refresh token endpoint for renewal

### WebSocket

- Endpoint: `/ws` (SockJS)
- User notifications: `/user/queue/notifications`
- Chat messages: `/user/queue/messages`

### Key Backend Documentation

| Document | Purpose |
|----------|---------|
| `docs/NOTIFICATIONS_API_SPECIFICATION.md` | Notifications REST API |
| `docs/NOTIFICATIONS_BACKEND_IMPLEMENTATION.md` | WebSocket & notification triggers |
| `docs/CONVERSATIONS_MESSAGES_API_SPECIFICATION.md` | Chat/messaging API |
| `docs/MAINTENANCE_API_SPECIFICATION.md` | Maintenance requests API |
| `docs/LEASE_PAYMENT_FLOW_SPECIFICATION.md` | Payment flow details |
| `docs/MONTHLY_RENT_TRACKING_SPECIFICATION.md` | Rent schedule logic |

---

## Common Patterns

### API Call with Loading State

```typescript
const [loading, setLoading] = useState(false);

const handleAction = async () => {
  setLoading(true);
  try {
    await api.post('/endpoint', data);
    toast.success('Success!');
  } catch (error) {
    toast.error('Failed');
  } finally {
    setLoading(false);
  }
};
```

### Modal Pattern

```typescript
const [isOpen, setIsOpen] = useState(false);
const [selectedItem, setSelectedItem] = useState<Item | null>(null);

const openModal = (item: Item) => {
  setSelectedItem(item);
  setIsOpen(true);
};

<Dialog open={isOpen} onOpenChange={setIsOpen}>
  <DialogContent>
    {selectedItem && <ItemForm item={selectedItem} />}
  </DialogContent>
</Dialog>
```

### Real-time Refresh Pattern

```typescript
const { subscribeToRefresh } = useRealtime();

useEffect(() => {
  const unsubscribe = subscribeToRefresh(['TYPE'], fetchData);
  return unsubscribe;
}, [subscribeToRefresh, fetchData]);
```

---

## File Reference

### Must-Read Files for New Features

| When implementing... | Read these files |
|---------------------|------------------|
| New API endpoint | `client.ts`, `config.ts`, existing API file |
| New dashboard page | Existing page in same role folder |
| Real-time feature | `RealtimeContext.tsx`, `notificationWebSocket.ts` |
| New component | `components/ui/` for base components |
| Authentication | `AuthContext.tsx`, `authApi.ts` |
| Styling | `index.css`, `tailwind.config.ts` |

### Update These Files

| After... | Update |
|----------|--------|
| Adding new API | `API_IMPLEMENTATION_STATUS.md` |
| Adding routes | `App.tsx` |
| Adding sidebar items | Role-specific sidebar component |
| Adding notification type | Backend docs + `RealtimeContext.tsx` |

---

## Troubleshooting

### Common Issues

1. **API calls failing**: Check `config.ts` for correct endpoint
2. **Auth not working**: Check token storage keys in `config.ts`
3. **WebSocket not connecting**: Verify `/ws` endpoint and token
4. **Styles not applying**: Use semantic tokens, not direct colors
5. **Real-time not updating**: Check `subscribeToRefresh` types match

### Debug Tools

- Browser DevTools Console for WebSocket logs (`[NotificationWS]` prefix)
- Network tab for API calls
- React DevTools for state inspection

---

## Version History

- **Latest Update**: Real-time WebSocket notifications with auto-refresh
- **Key Features**: Full CRUD for properties, applications, leases, payments, maintenance, messaging

---

*This documentation should be updated whenever significant changes are made to the project architecture.*
