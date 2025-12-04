export type UserRole = 'landlord' | 'tenant';

export interface User {
  id: string;
  name: string;
  role: UserRole;
  email: string;
  dormFixId: string;
  createdAt: string; // Add this to match SQL TIMESTAMP/DATETIME2
}

export interface AuthContextType {
  user: User | null;
  login: (email: string, password: string) => Promise<void>; 
  logout: () => void;
  isLoading: boolean;
  error: string | null;
  // For security purposes "role" is remove
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
