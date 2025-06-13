import React, { useState, useEffect } from 'react';
import { Login } from './components/Auth/Login';
import { Navigation } from './components/Layout/Navigation';
import { EmployeeDashboard } from './components/Employee/Dashboard';
import { PlanTasks } from './components/Employee/PlanTasks';
import { EODReport } from './components/Employee/EODReport';
import { AdminDashboard } from './components/Admin/Dashboard';
import { UserManagement } from './components/Admin/UserManagement';
import { AllReports } from './components/Admin/AllReports';
import { ComplianceReport } from './components/Admin/ComplianceReport';
import { Profile } from './components/Shared/Profile';
import { User, AuthState } from './types';
import { getCurrentUser, logout } from './utils/storage';

function App() {
  const [authState, setAuthState] = useState<AuthState>({
    user: null,
    isAuthenticated: false
  });
  const [activeTab, setActiveTab] = useState('dashboard');

  useEffect(() => {
    const user = getCurrentUser();
    if (user) {
      setAuthState({ user, isAuthenticated: true });
    }
  }, []);

  const handleLogin = (user: User) => {
    setAuthState({ user, isAuthenticated: true });
    setActiveTab('dashboard');
  };

  const handleLogout = () => {
    logout();
    setAuthState({ user: null, isAuthenticated: false });
    setActiveTab('dashboard');
  };

  const handleUserUpdate = (updatedUser: User) => {
    setAuthState({ user: updatedUser, isAuthenticated: true });
  };

  if (!authState.isAuthenticated || !authState.user) {
    return <Login onLogin={handleLogin} />;
  }

  const renderContent = () => {
    const { user } = authState;

    if (user.role === 'employee') {
      switch (activeTab) {
        case 'dashboard':
          return <EmployeeDashboard user={user} />;
        case 'plan-tasks':
          return <PlanTasks user={user} />;
        case 'eod-report':
          return <EODReport user={user} />;
        case 'profile':
          return <Profile user={user} onUserUpdate={handleUserUpdate} />;
        default:
          return <EmployeeDashboard user={user} />;
      }
    } else {
      switch (activeTab) {
        case 'dashboard':
          return <AdminDashboard user={user} />;
        case 'users':
          return <UserManagement currentUser={user} />;
        case 'reports':
          return <AllReports currentUser={user} />;
        case 'compliance':
          return <ComplianceReport currentUser={user} />;
        case 'profile':
          return <Profile user={user} onUserUpdate={handleUserUpdate} />;
        default:
          return <AdminDashboard user={user} />;
      }
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <Navigation
        user={authState.user}
        activeTab={activeTab}
        onTabChange={setActiveTab}
        onLogout={handleLogout}
      />
      <main>
        {renderContent()}
      </main>
    </div>
  );
}

export default App;