import React from 'react';
import { 
  LayoutDashboard, 
  Users, 
  FileText, 
  ClipboardList, 
  UserCircle, 
  LogOut,
  BarChart3,
  History
} from 'lucide-react';
import { User } from '../../types';

interface NavigationProps {
  user: User;
  activeTab: string;
  onTabChange: (tab: string) => void;
  onLogout: () => void;
}

export const Navigation: React.FC<NavigationProps> = ({ 
  user,
  activeTab,
  onTabChange,
  onLogout
}) => {
  const employeeMenuItems = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { id: 'plan-tasks', label: 'Plan Tasks', icon: ClipboardList },
    { id: 'eod-report', label: 'End of Day Report', icon: FileText },
    { id: 'reports-history', label: 'My Reports', icon: History },
    { id: 'profile', label: 'Profile', icon: UserCircle },
  ];

  const adminMenuItems = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { id: 'users', label: 'User Management', icon: Users },
    { id: 'reports', label: 'All Reports', icon: FileText },
    { id: 'compliance', label: 'Compliance', icon: BarChart3 },
    { id: 'profile', label: 'Profile', icon: UserCircle },
  ];

  const menuItems = user.role === 'admin' ? adminMenuItems : employeeMenuItems;

  return (
    <nav className="bg-white shadow-lg">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16">
          <div className="flex items-center">
            <div className="flex-shrink-0 flex items-center">
              <div className="h-8 w-8 bg-blue-600 rounded-lg flex items-center justify-center">
                <LayoutDashboard className="h-5 w-5 text-white" />
              </div>
              <span className="ml-3 text-xl font-bold text-gray-900">WorkTracker</span>
            </div>
            
            <div className="hidden md:ml-10 md:flex md:space-x-8">
              {menuItems.map((item) => {
                const Icon = item.icon;
                return (
                  <button
                    key={item.id}
                    onClick={() => onTabChange(item.id)}
                    className={`inline-flex items-center px-1 pt-1 text-sm font-medium transition duration-200 ${
                      activeTab === item.id
                        ? 'text-blue-600 border-b-2 border-blue-600'
                        : 'text-gray-500 hover:text-gray-700 hover:border-gray-300 border-b-2 border-transparent'
                    }`}
                  >
                    <Icon className="h-4 w-4 mr-2" />
                    {item.label}
                  </button>
                );
              })}
            </div>
          </div>

          <div className="flex items-center space-x-4">
            <div className="flex items-center space-x-3">
              <div className="text-right">
                <p className="text-sm font-medium text-gray-900">{user.name}</p>
                <p className="text-xs text-gray-500 capitalize">{user.role}</p>
              </div>
              <div className="h-8 w-8 bg-gray-300 rounded-full flex items-center justify-center">
                <UserCircle className="h-5 w-5 text-gray-600" />
              </div>
            </div>
            
            <button
              onClick={onLogout}
              className="inline-flex items-center px-3 py-2 border border-transparent text-sm leading-4 font-medium rounded-md text-gray-500 hover:text-gray-700 focus:outline-none transition duration-200"
            >
              <LogOut className="h-4 w-4" />
            </button>
          </div>
        </div>
      </div>

      {/* Mobile menu */}
      <div className="md:hidden">
        <div className="px-2 pt-2 pb-3 space-y-1 sm:px-3 bg-gray-50">
          {menuItems.map((item) => {
            const Icon = item.icon;
            return (
              <button
                key={item.id}
                onClick={() => onTabChange(item.id)}
                className={`flex items-center w-full px-3 py-2 rounded-md text-sm font-medium transition duration-200 ${
                  activeTab === item.id
                    ? 'text-blue-600 bg-blue-50'
                    : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
                }`}
              >
                <Icon className="h-4 w-4 mr-3" />
                {item.label}
              </button>
            );
          })}
        </div>
      </div>
    </nav>
  );
};