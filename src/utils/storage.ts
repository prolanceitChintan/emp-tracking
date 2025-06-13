import { User, PlannedTask, EndOfDayReport } from '../types';

const STORAGE_KEYS = {
  USERS: 'worktrack_users',
  PLANNED_TASKS: 'worktrack_planned_tasks',
  EOD_REPORTS: 'worktrack_eod_reports',
  CURRENT_USER: 'worktrack_current_user',
};

// Initialize default data
const initializeStorage = () => {
  const users = getUsers();
  if (users.length === 0) {
    // Create default admin and employee
    const defaultUsers: User[] = [
      {
        id: '1',
        email: 'admin@company.com',
        name: 'System Administrator',
        role: 'admin',
        department: 'IT',
        position: 'Administrator',
        phone: '+1-555-0001',
        createdAt: new Date().toISOString(),
      },
      {
        id: '2',
        email: 'john.doe@company.com',
        name: 'John Doe',
        role: 'employee',
        department: 'Engineering',
        position: 'Software Developer',
        phone: '+1-555-0002',
        createdAt: new Date().toISOString(),
      },
      {
        id: '3',
        email: 'jane.smith@company.com',
        name: 'Jane Smith',
        role: 'employee',
        department: 'Marketing',
        position: 'Marketing Specialist',
        phone: '+1-555-0003',
        createdAt: new Date().toISOString(),
      },
    ];
    localStorage.setItem(STORAGE_KEYS.USERS, JSON.stringify(defaultUsers));
  }
};

// User management
export const getUsers = (): User[] => {
  const users = localStorage.getItem(STORAGE_KEYS.USERS);
  return users ? JSON.parse(users) : [];
};

export const saveUser = (user: User): void => {
  const users = getUsers();
  const existingIndex = users.findIndex(u => u.id === user.id);
  
  if (existingIndex >= 0) {
    users[existingIndex] = user;
  } else {
    users.push(user);
  }
  
  localStorage.setItem(STORAGE_KEYS.USERS, JSON.stringify(users));
};

export const deleteUser = (userId: string): void => {
  const users = getUsers().filter(u => u.id !== userId);
  localStorage.setItem(STORAGE_KEYS.USERS, JSON.stringify(users));
  
  // Also delete related data
  const plannedTasks = getPlannedTasks().filter(t => t.userId !== userId);
  localStorage.setItem(STORAGE_KEYS.PLANNED_TASKS, JSON.stringify(plannedTasks));
  
  const eodReports = getEODReports().filter(r => r.userId !== userId);
  localStorage.setItem(STORAGE_KEYS.EOD_REPORTS, JSON.stringify(eodReports));
};

// Authentication
export const authenticate = (email: string, password: string): User | null => {
  // Mock authentication - in real app, this would be secure
  const users = getUsers();
  const user = users.find(u => u.email === email);
  
  if (user && (password === 'admin123' || password === 'emp123')) {
    localStorage.setItem(STORAGE_KEYS.CURRENT_USER, JSON.stringify(user));
    return user;
  }
  
  return null;
};

export const getCurrentUser = (): User | null => {
  const user = localStorage.getItem(STORAGE_KEYS.CURRENT_USER);
  return user ? JSON.parse(user) : null;
};

export const logout = (): void => {
  localStorage.removeItem(STORAGE_KEYS.CURRENT_USER);
};

// Planned tasks
export const getPlannedTasks = (): PlannedTask[] => {
  const tasks = localStorage.getItem(STORAGE_KEYS.PLANNED_TASKS);
  return tasks ? JSON.parse(tasks) : [];
};

export const savePlannedTask = (task: PlannedTask): void => {
  const tasks = getPlannedTasks();
  const existingIndex = tasks.findIndex(t => t.id === task.id);
  
  if (existingIndex >= 0) {
    tasks[existingIndex] = task;
  } else {
    tasks.push(task);
  }
  
  localStorage.setItem(STORAGE_KEYS.PLANNED_TASKS, JSON.stringify(tasks));
};

export const deletePlannedTask = (taskId: string): void => {
  const tasks = getPlannedTasks().filter(t => t.id !== taskId);
  localStorage.setItem(STORAGE_KEYS.PLANNED_TASKS, JSON.stringify(tasks));
};

// End of day reports
export const getEODReports = (): EndOfDayReport[] => {
  const reports = localStorage.getItem(STORAGE_KEYS.EOD_REPORTS);
  return reports ? JSON.parse(reports) : [];
};

export const saveEODReport = (report: EndOfDayReport): void => {
  const reports = getEODReports();
  const existingIndex = reports.findIndex(r => r.id === report.id);
  
  if (existingIndex >= 0) {
    reports[existingIndex] = report;
  } else {
    reports.push(report);
  }
  
  localStorage.setItem(STORAGE_KEYS.EOD_REPORTS, JSON.stringify(reports));
};

export const deleteEODReport = (reportId: string): void => {
  const reports = getEODReports().filter(r => r.id !== reportId);
  localStorage.setItem(STORAGE_KEYS.EOD_REPORTS, JSON.stringify(reports));
};

// Utility functions
export const getTodayString = (): string => {
  return new Date().toISOString().split('T')[0];
};

export const getEditCount = (userId: string, date: string, type: 'planned' | 'eod'): number => {
  if (type === 'planned') {
    const task = getPlannedTasks().find(t => t.userId === userId && t.date === date);
    return task?.editCount || 0;
  } else {
    const report = getEODReports().find(r => r.userId === userId && r.date === date);
    return report?.editCount || 0;
  }
};

export const canEdit = (userId: string, date: string, type: 'planned' | 'eod'): boolean => {
  const editCount = getEditCount(userId, date, type);
  return editCount < 3;
};

// Initialize storage on first load
initializeStorage();