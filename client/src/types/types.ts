export type UserRole = 'landlord' | 'tenant';

export interface User {
  id: string;
  name: string;
  role: UserRole;
  email: string;
  dormFixId: string;
  isApproved: boolean; // Add for Gate Keeper logic
  createdAt: string; // Add this to match SQL TIMESTAMP/DATETIME2
}

export interface AuthContextType {
  user: User | null;
  login: (email: string, password: string) => Promise<void>; 
  logout: () => void;
  isLoading: boolean;
  error: string | null; 
}
// --- NEW: Added Room Interface ---
// Matches the SQL query: SELECT id, room_number, capacity, currentOccupants...
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
  is_approved: boolean; // often SQL returns snake_case for raw queries unless aliased
  room_number: string;
  joined_date: string;
}

// NEW: Maintenance specific types
export type MaintenanceStatus = 'Pending' | 'In Progress' | 'Completed' | 'Rejected';
export type IssueType = 'Plumbing' | 'Electrical' | 'Appliance' | 'Structural' | 'Other';
export type UrgencyLevel = 'Low' | 'Medium' | 'High' | 'Emergency';

export interface MaintenanceRequest {
  id: string;
  tenantId: string;
  dateSubmitted: string; // ISO Date string (e.g. "2025-10-24")
  issueType: IssueType;
  description: string;
  urgency: UrgencyLevel;
  status: MaintenanceStatus;
  adminRemarks?: string; // Optional: For landlord feedback (Transparency)
}

export interface Payment {
    id: string;
    tenantName?: string;
    roomNumber?: string;
    amount: number;
    paymentType: string;
    datePaid: string;
    status: 'Pending' | 'Verified' | 'Rejected';
    proofImage: string;
    remarks?: string;
}

export interface LandlordMaintenanceRequest extends MaintenanceRequest {
    tenantName: string;
    roomNumber: string;
}