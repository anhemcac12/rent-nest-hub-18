export interface Property {
  id: string;
  title: string;
  description: string;
  type: 'apartment' | 'house' | 'studio' | 'room' | 'condo' | 'townhouse';
  status: 'available' | 'rented' | 'pending';
  price: number;
  currency: string;
  
  // Location
  address: {
    street: string;
    city: string;
    state: string;
    zipCode: string;
    country: string;
  };
  
  // Details
  bedrooms: number;
  bathrooms: number;
  size: number; // in sqft
  floor?: number;
  totalFloors?: number;
  yearBuilt?: number;
  
  // Features
  furnished: boolean;
  petFriendly: boolean;
  parkingSpaces: number;
  amenities: string[];
  
  // Images
  images: string[];
  thumbnail: string;
  
  // Landlord
  landlord: {
    id: string;
    name: string;
    avatar: string;
    phone?: string;
    email?: string;
    responseRate: number;
    responseTime: string;
    propertiesCount: number;
    verified: boolean;
  };
  
  // Ratings
  rating: number;
  reviewsCount: number;
  
  // Dates
  availableFrom: string;
  minimumLease: number; // in months
  
  // Rules
  rules: string[];
  
  // Badges
  featured: boolean;
  isNew: boolean;
  verified: boolean;
  
  // Meta
  views: number;
  createdAt: string;
  updatedAt: string;
}

export interface PropertyFilter {
  search?: string;
  type?: Property['type'][];
  priceMin?: number;
  priceMax?: number;
  bedrooms?: number[];
  bathrooms?: number[];
  furnished?: boolean;
  petFriendly?: boolean;
  amenities?: string[];
  city?: string;
  sortBy?: 'price_asc' | 'price_desc' | 'newest' | 'rating' | 'views';
}

export interface Review {
  id: string;
  propertyId: string;
  userId: string;
  userName: string;
  userAvatar: string;
  rating: number;
  comment: string;
  createdAt: string;
}

export const PROPERTY_TYPES = [
  { value: 'apartment', label: 'Apartment' },
  { value: 'house', label: 'House' },
  { value: 'studio', label: 'Studio' },
  { value: 'room', label: 'Room' },
  { value: 'condo', label: 'Condo' },
  { value: 'townhouse', label: 'Townhouse' },
] as const;

export const AMENITIES = [
  'WiFi',
  'Air Conditioning',
  'Heating',
  'Kitchen',
  'Washer',
  'Dryer',
  'Dishwasher',
  'Parking',
  'Gym',
  'Pool',
  'Balcony',
  'Garden',
  'Security System',
  'Elevator',
  'Storage',
  'Cable TV',
  'Fireplace',
  'Hardwood Floors',
] as const;
