// client/src/types/types.ts
export type UserRole = 'landlord' | 'tenant';

export interface User {
  id: string;
  name: string;
  role: UserRole;
  email: string;
  phoneNumber?: string;
  dormFixId: string;
  isApproved: boolean;
  createdAt: string;
}

export interface AuthContextType {
  user: User | null;
  login: (email: string, password: string) => Promise<void>; 
  logout: () => void;
  updateUser: (updatedData: Partial<User>) => void;
  isLoading: boolean;
  error: string | null; 
}

export interface Room {
    id: string;
    room_number: string;
    capacity: number;
    currentOccupants: number; 
}

export interface TenantRequest {
  id: string;
  name: string;
  email: string;
  is_approved: boolean;
  room_number: string;
  joined_date: string;
}

export type MaintenanceStatus = 'Pending' | 'In Progress' | 'Completed' | 'Rejected';
export type IssueType = 'Plumbing' | 'Electrical' | 'Appliance' | 'Structural' | 'Other';
export type UrgencyLevel = 'Low' | 'Medium' | 'High' | 'Emergency';

export interface MaintenanceRequest {
  id: string;
  tenantId: string;
  dateSubmitted: string;
  issueType: IssueType;
  description: string;
  urgency: UrgencyLevel;
  status: MaintenanceStatus;
  adminRemarks?: string;
  notificationStatus?: string;
}

export interface Payment {
    id: string;
    tenantName?: string;
    roomNumber?: string;
    amount: number;
    paymentType: string;
    datePaid: string;
    status: 'Pending' | 'Verified' | 'Rejected' | 'Anomalous';
    proofImage: string;
    remarks?: string;
}

export interface LandlordMaintenanceRequest extends MaintenanceRequest {
    tenantName: string;
    roomNumber: string;
}