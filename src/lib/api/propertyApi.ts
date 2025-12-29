import { API_BASE_URL } from './config';
import { getAuthToken } from './client';

// Types based on API documentation
export interface PropertyPhoto {
  id: number;
  url: string;
  isPrimary: boolean;
}

export interface PropertyLandlord {
  id: number;
  name: string;
  avatar: string | null;
  phone: string | null;
  email: string | null;
  responseRate: number;
  responseTime: string;
  propertiesCount: number;
  verified: boolean;
}

export interface PropertyResponseDTO {
  id: number;
  title: string;
  description: string;
  address: string;
  price: number;
  rentAmount: number;
  securityDeposit: number | null;
  currency: string;
  type: string;
  status: 'AVAILABLE' | 'RENTED' | 'PENDING' | 'UNDER_MAINTENANCE';
  bedrooms: number;
  bathrooms: number;
  size: number;
  floor: number | null;
  totalFloors: number | null;
  yearBuilt: number | null;
  furnished: boolean;
  petFriendly: boolean;
  parkingSpaces: number;
  amenities: string[];
  rules: string[];
  photos: PropertyPhoto[];
  coverImageUrl: string | null;
  thumbnail: string | null;
  landlord: PropertyLandlord;
  rating: number;
  reviewsCount: number;
  availableFrom: string | null;
  minimumLease: number;
  featured: boolean;
  verified: boolean;
  isNew: boolean;
  views: number;
  createdAt: string;
  updatedAt: string;
}

export interface PropertySummaryDTO {
  id: number;
  title: string;
  address: string;
  rentAmount: number;
  currency: string;
  type: string;
  status: string;
  bedrooms: number;
  bathrooms: number;
  size: number;
  coverImageUrl: string | null;
  featured: boolean;
  verified: boolean;
  isNew: boolean;
  landlordId: number;
  landlordName: string;
}

export interface PaginatedResponse<T> {
  content: T[];
  totalElements: number;
  totalPages: number;
  size: number;
  number: number;
  first: boolean;
  last: boolean;
}

export interface PropertySearchParams {
  search?: string;
  type?: string;
  minRent?: number;
  maxRent?: number;
  minBedrooms?: number;
  maxBedrooms?: number;
  minBathrooms?: number;
  maxBathrooms?: number;
  minSize?: number;
  maxSize?: number;
  furnished?: boolean;
  petFriendly?: boolean;
  amenities?: string;
  city?: string;
  availableFrom?: string;
  page?: number;
  size?: number;
  sort?: string;
}

export interface CreatePropertyData {
  title: string;
  description: string;
  address: string;
  rentAmount: number;
  securityDeposit?: number;
  type?: 'APARTMENT' | 'HOUSE' | 'STUDIO' | 'ROOM' | 'CONDO' | 'TOWNHOUSE';
  bedrooms?: number;
  bathrooms?: number;
  size?: number;
  currency?: string;
  furnished?: boolean;
  petFriendly?: boolean;
  parkingSpaces?: number;
  amenities?: string[];
  rules?: string[];
  availableFrom?: string;
  minimumLease?: number;
  roomAmount?: number; // Legacy field
  specs?: Record<string, unknown>;
  managerId?: number;
  files?: File[];
}

export interface UpdatePropertyData {
  title?: string;
  description?: string;
  address?: string;
  rentAmount?: number;
  securityDeposit?: number;
  status?: 'AVAILABLE' | 'RENTED' | 'PENDING' | 'UNDER_MAINTENANCE';
  type?: 'APARTMENT' | 'HOUSE' | 'STUDIO' | 'ROOM' | 'CONDO' | 'TOWNHOUSE';
  bedrooms?: number;
  bathrooms?: number;
  size?: number;
  currency?: string;
  furnished?: boolean;
  petFriendly?: boolean;
  parkingSpaces?: number;
  amenities?: string[];
  rules?: string[];
  availableFrom?: string;
  minimumLease?: number;
  roomAmount?: number;
  specs?: Record<string, unknown>;
  photos_to_add?: File[];
  photo_ids_to_delete?: number[];
  cover_image_photo_id?: number;
}

// Helper to build query string
function buildQueryString(params: PropertySearchParams): string {
  const searchParams = new URLSearchParams();
  
  if (params.search) searchParams.append('search', params.search);
  if (params.type) searchParams.append('type', params.type);
  if (params.minRent !== undefined) searchParams.append('minRent', String(params.minRent));
  if (params.maxRent !== undefined) searchParams.append('maxRent', String(params.maxRent));
  if (params.minBedrooms !== undefined) searchParams.append('minBedrooms', String(params.minBedrooms));
  if (params.maxBedrooms !== undefined) searchParams.append('maxBedrooms', String(params.maxBedrooms));
  if (params.minBathrooms !== undefined) searchParams.append('minBathrooms', String(params.minBathrooms));
  if (params.maxBathrooms !== undefined) searchParams.append('maxBathrooms', String(params.maxBathrooms));
  if (params.minSize !== undefined) searchParams.append('minSize', String(params.minSize));
  if (params.maxSize !== undefined) searchParams.append('maxSize', String(params.maxSize));
  if (params.furnished !== undefined) searchParams.append('furnished', String(params.furnished));
  if (params.petFriendly !== undefined) searchParams.append('petFriendly', String(params.petFriendly));
  if (params.amenities) searchParams.append('amenities', params.amenities);
  if (params.city) searchParams.append('city', params.city);
  if (params.availableFrom) searchParams.append('availableFrom', params.availableFrom);
  if (params.page !== undefined) searchParams.append('page', String(params.page));
  if (params.size !== undefined) searchParams.append('size', String(params.size));
  if (params.sort) searchParams.append('sort', params.sort);
  
  const queryString = searchParams.toString();
  return queryString ? `?${queryString}` : '';
}

// API Functions
export const propertyApi = {
  // Search properties (public)
  searchProperties: async (params: PropertySearchParams = {}): Promise<PaginatedResponse<PropertySummaryDTO>> => {
    const queryString = buildQueryString(params);
    const response = await fetch(`${API_BASE_URL}/api/properties${queryString}`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'ngrok-skip-browser-warning': 'true',
      },
    });
    
    if (!response.ok) {
      const error = await response.json().catch(() => ({}));
      throw new Error(error.message || 'Failed to fetch properties');
    }
    
    return response.json();
  },

  // Get single property (public)
  getProperty: async (propertyId: number): Promise<PropertyResponseDTO> => {
    const response = await fetch(`${API_BASE_URL}/api/properties/${propertyId}`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'ngrok-skip-browser-warning': 'true',
      },
    });
    
    if (!response.ok) {
      const error = await response.json().catch(() => ({}));
      throw new Error(error.message || 'Failed to fetch property');
    }
    
    return response.json();
  },

  // Get featured properties (public)
  getFeaturedProperties: async (): Promise<PropertySummaryDTO[]> => {
    const response = await fetch(`${API_BASE_URL}/api/properties/featured`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'ngrok-skip-browser-warning': 'true',
      },
    });
    
    if (!response.ok) {
      const error = await response.json().catch(() => ({}));
      throw new Error(error.message || 'Failed to fetch featured properties');
    }
    
    return response.json();
  },

  // Get properties by landlord (public)
  getPropertiesByLandlord: async (landlordId: number): Promise<PropertySummaryDTO[]> => {
    const response = await fetch(`${API_BASE_URL}/api/properties/landlord/${landlordId}`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'ngrok-skip-browser-warning': 'true',
      },
    });
    
    if (!response.ok) {
      const error = await response.json().catch(() => ({}));
      throw new Error(error.message || 'Failed to fetch landlord properties');
    }
    
    return response.json();
  },

  // Create property (landlord only)
  createProperty: async (data: CreatePropertyData): Promise<PropertyResponseDTO> => {
    const token = getAuthToken();
    if (!token) throw new Error('Authentication required');

    const formData = new FormData();
    formData.append('title', data.title);
    formData.append('description', data.description);
    formData.append('address', data.address);
    formData.append('rentAmount', String(data.rentAmount));
    
    if (data.securityDeposit !== undefined) {
      formData.append('securityDeposit', String(data.securityDeposit));
    }
    if (data.type) {
      formData.append('type', data.type);
    }
    if (data.bedrooms !== undefined) {
      formData.append('bedrooms', String(data.bedrooms));
    }
    if (data.bathrooms !== undefined) {
      formData.append('bathrooms', String(data.bathrooms));
    }
    if (data.size !== undefined) {
      formData.append('size', String(data.size));
    }
    if (data.currency) {
      formData.append('currency', data.currency);
    }
    if (data.furnished !== undefined) {
      formData.append('furnished', String(data.furnished));
    }
    if (data.petFriendly !== undefined) {
      formData.append('petFriendly', String(data.petFriendly));
    }
    if (data.parkingSpaces !== undefined) {
      formData.append('parkingSpaces', String(data.parkingSpaces));
    }
    if (data.amenities && data.amenities.length > 0) {
      data.amenities.forEach(amenity => formData.append('amenities', amenity));
    }
    if (data.rules && data.rules.length > 0) {
      data.rules.forEach(rule => formData.append('rules', rule));
    }
    if (data.availableFrom) {
      formData.append('availableFrom', data.availableFrom);
    }
    if (data.minimumLease !== undefined) {
      formData.append('minimumLease', String(data.minimumLease));
    }
    if (data.roomAmount !== undefined) {
      formData.append('roomAmount', String(data.roomAmount));
    }
    if (data.specs) {
      formData.append('specs', JSON.stringify(data.specs));
    }
    if (data.managerId !== undefined) {
      formData.append('managerId', String(data.managerId));
    }
    if (data.files) {
      data.files.forEach(file => formData.append('files', file));
    }

    const response = await fetch(`${API_BASE_URL}/api/properties`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'ngrok-skip-browser-warning': 'true',
      },
      body: formData,
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({}));
      throw new Error(error.message || 'Failed to create property');
    }

    return response.json();
  },

  // Update property (landlord only)
  updateProperty: async (propertyId: number, data: UpdatePropertyData): Promise<PropertyResponseDTO> => {
    const token = getAuthToken();
    if (!token) throw new Error('Authentication required');

    const formData = new FormData();
    
    if (data.title) formData.append('title', data.title);
    if (data.description) formData.append('description', data.description);
    if (data.address) formData.append('address', data.address);
    if (data.rentAmount !== undefined) formData.append('rentAmount', String(data.rentAmount));
    if (data.securityDeposit !== undefined) formData.append('securityDeposit', String(data.securityDeposit));
    if (data.status) formData.append('status', data.status);
    if (data.type) formData.append('type', data.type);
    if (data.bedrooms !== undefined) formData.append('bedrooms', String(data.bedrooms));
    if (data.bathrooms !== undefined) formData.append('bathrooms', String(data.bathrooms));
    if (data.size !== undefined) formData.append('size', String(data.size));
    if (data.currency) formData.append('currency', data.currency);
    if (data.furnished !== undefined) formData.append('furnished', String(data.furnished));
    if (data.petFriendly !== undefined) formData.append('petFriendly', String(data.petFriendly));
    if (data.parkingSpaces !== undefined) formData.append('parkingSpaces', String(data.parkingSpaces));
    if (data.amenities && data.amenities.length > 0) {
      data.amenities.forEach(amenity => formData.append('amenities', amenity));
    }
    if (data.rules && data.rules.length > 0) {
      data.rules.forEach(rule => formData.append('rules', rule));
    }
    if (data.availableFrom) formData.append('availableFrom', data.availableFrom);
    if (data.minimumLease !== undefined) formData.append('minimumLease', String(data.minimumLease));
    if (data.roomAmount !== undefined) formData.append('roomAmount', String(data.roomAmount));
    if (data.specs) formData.append('specs', JSON.stringify(data.specs));
    
    if (data.photos_to_add) {
      data.photos_to_add.forEach(file => formData.append('photos_to_add', file));
    }
    if (data.photo_ids_to_delete) {
      data.photo_ids_to_delete.forEach(id => formData.append('photo_ids_to_delete', String(id)));
    }
    if (data.cover_image_photo_id !== undefined) {
      formData.append('cover_image_photo_id', String(data.cover_image_photo_id));
    }

    const response = await fetch(`${API_BASE_URL}/api/properties/${propertyId}`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'ngrok-skip-browser-warning': 'true',
      },
      body: formData,
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({}));
      throw new Error(error.message || 'Failed to update property');
    }

    return response.json();
  },

  // Delete property (landlord only)
  deleteProperty: async (propertyId: number): Promise<void> => {
    const token = getAuthToken();
    if (!token) throw new Error('Authentication required');

    const response = await fetch(`${API_BASE_URL}/api/properties/${propertyId}`, {
      method: 'DELETE',
      headers: {
        'Authorization': `Bearer ${token}`,
        'ngrok-skip-browser-warning': 'true',
      },
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({}));
      throw new Error(error.message || 'Failed to delete property');
    }
  },

  // Assign manager to property (landlord only)
  assignManager: async (propertyId: number, managerEmail: string): Promise<PropertyResponseDTO> => {
    const token = getAuthToken();
    if (!token) throw new Error('Authentication required');

    const response = await fetch(`${API_BASE_URL}/api/properties/${propertyId}/manager`, {
      method: 'PUT',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
        'ngrok-skip-browser-warning': 'true',
      },
      body: JSON.stringify({ managerEmail }),
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({}));
      throw new Error(error.message || 'Failed to assign manager');
    }

    return response.json();
  },

  // Remove manager from property (landlord only)
  removeManager: async (propertyId: number): Promise<void> => {
    const token = getAuthToken();
    if (!token) throw new Error('Authentication required');

    const response = await fetch(`${API_BASE_URL}/api/properties/${propertyId}/manager`, {
      method: 'DELETE',
      headers: {
        'Authorization': `Bearer ${token}`,
        'ngrok-skip-browser-warning': 'true',
      },
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({}));
      throw new Error(error.message || 'Failed to remove manager');
    }
  },
};

export default propertyApi;
