export interface User {
  id: string;
  email: string;
  name: string;
  role: 'employee' | 'admin';
  department?: string;
  position?: string;
  phone?: string;
  createdAt: string;
}

export interface PlannedTask {
  id: string;
  userId: string;
  date: string;
  tasks: string[];
  createdAt: string;
  updatedAt: string;
  editCount: number;
}

export interface EndOfDayReport {
  id: string;
  userId: string;
  date: string;
  completedTasks: string[];
  challenges: string;
  nextDayPlan: string[];
  workingHours: number;
  createdAt: string;
  updatedAt: string;
  editCount: number;
}

export interface AuthState {
  user: User | null;
  isAuthenticated: boolean;
}

export interface DashboardStats {
  totalEmployees: number;
  todaySubmissions: number;
  pendingReports: number;
  complianceRate: number;
}