import { api } from "./client";
import { API_ENDPOINTS } from "./config";

// Types
export type MaintenanceStatus = 
  | 'OPEN' 
  | 'ACCEPTED' 
  | 'IN_PROGRESS' 
  | 'SCHEDULED' 
  | 'COMPLETED' 
  | 'REJECTED' 
  | 'CANCELLED';

export type MaintenancePriority = 'LOW' | 'MEDIUM' | 'HIGH' | 'URGENT';

export type ActorType = 'TENANT' | 'LANDLORD' | 'PROPERTY_MANAGER' | 'SYSTEM';

export interface MaintenanceImage {
  id: number;
  url: string;
  uploadedAt: string;
}

export interface MaintenanceTimelineEvent {
  id: number;
  status: MaintenanceStatus;
  message: string;
  actor: ActorType;
  actorName: string;
  timestamp: string;
}

export interface MaintenanceRequest {
  id: number;
  leaseId: number;
  propertyId: number;
  propertyTitle: string;
  propertyAddress: string;
  tenantId: number;
  tenantName: string;
  landlordId: number;
  title: string;
  description: string;
  priority: MaintenancePriority;
  status: MaintenanceStatus;
  images: MaintenanceImage[];
  createdAt: string;
  updatedAt: string;
  scheduledFor?: string;
  completedAt?: string;
  notes?: string;
  rejectionReason?: string;
  estimatedCost?: number;
  actualCost?: number;
  assignedContractor?: string;
  timeline: MaintenanceTimelineEvent[];
}

export interface MaintenanceListItem {
  id: number;
  propertyId?: number;
  propertyTitle: string;
  tenantId?: number;
  tenantName?: string;
  title: string;
  priority: MaintenancePriority;
  status: MaintenanceStatus;
  createdAt: string;
  daysOpen: number;
}

export interface MaintenanceComment {
  id: number;
  requestId: number;
  authorId: number;
  authorName: string;
  authorRole: ActorType;
  content: string;
  images: MaintenanceImage[];
  createdAt: string;
}

export interface PropertyMaintenanceSummary {
  propertyId: number;
  propertyTitle: string;
  openCount: number;
  totalCount: number;
}

export interface MaintenanceSummary {
  total: number;
  open: number;
  accepted: number;
  inProgress: number;
  scheduled: number;
  completed: number;
  rejected: number;
  avgResolutionDays: number;
  urgentCount: number;
  overdueCount: number;
  byProperty: PropertyMaintenanceSummary[];
}

export interface PaginatedResponse<T> {
  content: T[];
  totalElements: number;
  totalPages: number;
  number: number;
  size: number;
}

// Request DTOs
export interface CreateMaintenanceRequest {
  leaseId: number;
  title: string;
  description: string;
  priority: MaintenancePriority;
  imageIds?: number[];
}

export interface AddCommentRequest {
  content: string;
  imageIds?: number[];
}

export interface AcceptRequestDto {
  notes?: string;
  estimatedCost?: number;
}

export interface RejectRequestDto {
  reason: string;
}

export interface StartWorkDto {
  assignedContractor?: string;
  notes?: string;
}

export interface ScheduleWorkDto {
  scheduledFor: string;
  assignedContractor?: string;
  notes?: string;
}

export interface ResolveRequestDto {
  resolutionNotes?: string;
  actualCost?: number;
}

export interface ReopenRequestDto {
  reason: string;
}

export interface UpdatePriorityDto {
  priority: MaintenancePriority;
  reason?: string;
}

// Query params
export interface MaintenanceQueryParams {
  status?: MaintenanceStatus | 'ALL';
  priority?: MaintenancePriority | 'ALL';
  leaseId?: number;
  propertyId?: number;
  page?: number;
  size?: number;
  sort?: string;
}

// API Functions

// ============ Tenant Endpoints ============

/**
 * Create a new maintenance request (Tenant only)
 */
export async function createMaintenanceRequest(data: CreateMaintenanceRequest): Promise<MaintenanceRequest> {
  return api.post(API_ENDPOINTS.MAINTENANCE, data);
}

/**
 * Get maintenance requests for current tenant
 */
export async function getMyMaintenanceRequests(
  params?: MaintenanceQueryParams
): Promise<PaginatedResponse<MaintenanceListItem>> {
  const queryParams = new URLSearchParams();
  
  if (params?.status && params.status !== 'ALL') queryParams.append('status', params.status);
  if (params?.priority && params.priority !== 'ALL') queryParams.append('priority', params.priority);
  if (params?.leaseId) queryParams.append('leaseId', params.leaseId.toString());
  if (params?.page !== undefined) queryParams.append('page', params.page.toString());
  if (params?.size !== undefined) queryParams.append('size', params.size.toString());
  if (params?.sort) queryParams.append('sort', params.sort);

  const query = queryParams.toString();
  return api.get(`${API_ENDPOINTS.MAINTENANCE_MY}${query ? `?${query}` : ''}`);
}

/**
 * Cancel a maintenance request (Tenant only, status must be OPEN)
 */
export async function cancelMaintenanceRequest(id: number): Promise<{ id: number; status: MaintenanceStatus }> {
  return api.patch(API_ENDPOINTS.MAINTENANCE_CANCEL(id));
}

// ============ Shared Endpoints ============

/**
 * Get maintenance request detail
 */
export async function getMaintenanceRequestDetail(id: number): Promise<MaintenanceRequest> {
  return api.get(API_ENDPOINTS.MAINTENANCE_DETAIL(id));
}

/**
 * Add comment to a maintenance request
 */
export async function addMaintenanceComment(id: number, data: AddCommentRequest): Promise<MaintenanceComment> {
  return api.post(API_ENDPOINTS.MAINTENANCE_COMMENTS(id), data);
}

/**
 * Get comments for a maintenance request
 */
export async function getMaintenanceComments(id: number): Promise<{ requestId: number; comments: MaintenanceComment[] }> {
  return api.get(API_ENDPOINTS.MAINTENANCE_COMMENTS(id));
}

/**
 * Upload image to a maintenance request
 */
export async function uploadMaintenanceImage(id: number, file: File): Promise<MaintenanceImage> {
  const formData = new FormData();
  formData.append('file', file);
  return api.upload(API_ENDPOINTS.MAINTENANCE_IMAGES(id), formData);
}

/**
 * Get timeline for a maintenance request
 */
export async function getMaintenanceTimeline(id: number): Promise<{ requestId: number; timeline: MaintenanceTimelineEvent[] }> {
  return api.get(API_ENDPOINTS.MAINTENANCE_TIMELINE(id));
}

// ============ Landlord/Property Manager Endpoints ============

/**
 * Get maintenance requests for landlord/property manager
 */
export async function getMaintenanceForLandlord(
  params?: MaintenanceQueryParams
): Promise<PaginatedResponse<MaintenanceListItem>> {
  const queryParams = new URLSearchParams();
  
  if (params?.status && params.status !== 'ALL') queryParams.append('status', params.status);
  if (params?.priority && params.priority !== 'ALL') queryParams.append('priority', params.priority);
  if (params?.propertyId) queryParams.append('propertyId', params.propertyId.toString());
  if (params?.page !== undefined) queryParams.append('page', params.page.toString());
  if (params?.size !== undefined) queryParams.append('size', params.size.toString());
  if (params?.sort) queryParams.append('sort', params.sort);

  const query = queryParams.toString();
  return api.get(`${API_ENDPOINTS.MAINTENANCE_FOR_LANDLORD}${query ? `?${query}` : ''}`);
}

/**
 * Get maintenance summary statistics
 */
export async function getMaintenanceSummary(): Promise<MaintenanceSummary> {
  return api.get(API_ENDPOINTS.MAINTENANCE_SUMMARY);
}

/**
 * Accept a maintenance request
 */
export async function acceptMaintenanceRequest(id: number, data?: AcceptRequestDto): Promise<MaintenanceRequest> {
  return api.patch(API_ENDPOINTS.MAINTENANCE_ACCEPT(id), data);
}

/**
 * Reject a maintenance request
 */
export async function rejectMaintenanceRequest(id: number, data: RejectRequestDto): Promise<MaintenanceRequest> {
  return api.patch(API_ENDPOINTS.MAINTENANCE_REJECT(id), data);
}

/**
 * Start work on a maintenance request
 */
export async function startMaintenanceWork(id: number, data?: StartWorkDto): Promise<MaintenanceRequest> {
  return api.patch(API_ENDPOINTS.MAINTENANCE_START(id), data);
}

/**
 * Schedule work for a maintenance request
 */
export async function scheduleMaintenanceWork(id: number, data: ScheduleWorkDto): Promise<MaintenanceRequest> {
  return api.patch(API_ENDPOINTS.MAINTENANCE_SCHEDULE(id), data);
}

/**
 * Resolve/complete a maintenance request
 */
export async function resolveMaintenanceRequest(id: number, data?: ResolveRequestDto): Promise<MaintenanceRequest> {
  return api.patch(API_ENDPOINTS.MAINTENANCE_RESOLVE(id), data);
}

/**
 * Reopen a maintenance request
 */
export async function reopenMaintenanceRequest(id: number, data: ReopenRequestDto): Promise<MaintenanceRequest> {
  return api.patch(API_ENDPOINTS.MAINTENANCE_REOPEN(id), data);
}

/**
 * Update priority of a maintenance request
 */
export async function updateMaintenancePriority(id: number, data: UpdatePriorityDto): Promise<MaintenanceRequest> {
  return api.patch(API_ENDPOINTS.MAINTENANCE_PRIORITY(id), data);
}
