import React from 'react';
import { 
  Users, 
  FileText, 
  AlertTriangle, 
  TrendingUp,
  Calendar,
  CheckCircle,
  Clock,
  Target
} from 'lucide-react';
import { User, DashboardStats } from '../../types';
import { getUsers, getEODReports, getPlannedTasks, getTodayString } from '../../utils/storage';

interface AdminDashboardProps {
  user: User;
}

export const AdminDashboard: React.FC<AdminDashboardProps> = ({ user }) => {
  const today = getTodayString();
  const users = getUsers().filter(u => u.role === 'employee');
  const eodReports = getEODReports();
  const plannedTasks = getPlannedTasks();
  
  const todayReports = eodReports.filter(r => r.date === today);
  const todayPlanned = plannedTasks.filter(t => t.date === today);
  
  const stats: DashboardStats = {
    totalEmployees: users.length,
    todaySubmissions: todayReports.length,
    pendingReports: users.length - todayReports.length,
    complianceRate: users.length > 0 ? (todayReports.length / users.length) * 100 : 0,
  };

  // Recent activity
  const recentReports = eodReports
    .sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime())
    .slice(0, 5);

  // Weekly compliance data
  const weeklyCompliance = [];
  for (let i = 6; i >= 0; i--) {
    const date = new Date();
    date.setDate(date.getDate() - i);
    const dateString = date.toISOString().split('T')[0];
    const reportsForDate = eodReports.filter(r => r.date === dateString);
    weeklyCompliance.push({
      date: dateString,
      reports: reportsForDate.length,
      rate: users.length > 0 ? (reportsForDate.length / users.length) * 100 : 0,
    });
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">Admin Dashboard</h1>
        <p className="mt-2 text-gray-600">Overview of employee work tracking and compliance</p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <Users className="h-8 w-8 text-blue-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-500">Total Employees</p>
              <p className="text-2xl font-bold text-gray-900">{stats.totalEmployees}</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <CheckCircle className="h-8 w-8 text-emerald-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-500">Today's Submissions</p>
              <p className="text-2xl font-bold text-gray-900">{stats.todaySubmissions}</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <AlertTriangle className={`h-8 w-8 ${stats.pendingReports > 0 ? 'text-yellow-600' : 'text-gray-400'}`} />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-500">Pending Reports</p>
              <p className="text-2xl font-bold text-gray-900">{stats.pendingReports}</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <Target className="h-8 w-8 text-indigo-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-500">Compliance Rate</p>
              <p className="text-2xl font-bold text-gray-900">{stats.complianceRate.toFixed(0)}%</p>
            </div>
          </div>
        </div>
      </div>

      {/* Charts and Data */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
        {/* Weekly Compliance */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Weekly Compliance Trend</h3>
          <div className="space-y-4">
            {weeklyCompliance.map((day, index) => (
              <div key={day.date} className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <div className="text-sm text-gray-600">
                    {index === 6 ? 'Today' : index === 5 ? 'Yesterday' : new Date(day.date).toLocaleDateString('en-US', { weekday: 'short' })}
                  </div>
                  <div className="text-sm font-medium text-gray-900">
                    {day.reports}/{users.length}
                  </div>
                </div>
                <div className="flex items-center space-x-2">
                  <div className="w-24 bg-gray-200 rounded-full h-2">
                    <div 
                      className={`h-2 rounded-full transition-all duration-300 ${
                        day.rate >= 80 ? 'bg-emerald-600' : day.rate >= 60 ? 'bg-yellow-600' : 'bg-red-600'
                      }`}
                      style={{ width: `${day.rate}%` }}
                    ></div>
                  </div>
                  <span className="text-sm font-medium text-gray-600">{day.rate.toFixed(0)}%</span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Today's Activity */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Today's Activity</h3>
          <div className="space-y-4">
            <div className="flex items-center justify-between p-3 bg-blue-50 rounded-lg">
              <div className="flex items-center">
                <Calendar className="h-5 w-5 text-blue-600 mr-3" />
                <div>
                  <p className="text-sm font-medium text-blue-800">Tasks Planned</p>
                  <p className="text-xs text-blue-600">{todayPlanned.length} employees</p>
                </div>
              </div>
              <div className="text-right">
                <p className="text-lg font-bold text-blue-900">{todayPlanned.length}</p>
              </div>
            </div>

            <div className="flex items-center justify-between p-3 bg-emerald-50 rounded-lg">
              <div className="flex items-center">
                <FileText className="h-5 w-5 text-emerald-600 mr-3" />
                <div>
                  <p className="text-sm font-medium text-emerald-800">Reports Submitted</p>
                  <p className="text-xs text-emerald-600">{todayReports.length} employees</p>
                </div>
              </div>
              <div className="text-right">
                <p className="text-lg font-bold text-emerald-900">{todayReports.length}</p>
              </div>
            </div>

            {stats.pendingReports > 0 && (
              <div className="flex items-center justify-between p-3 bg-yellow-50 rounded-lg">
                <div className="flex items-center">
                  <Clock className="h-5 w-5 text-yellow-600 mr-3" />
                  <div>
                    <p className="text-sm font-medium text-yellow-800">Pending Reports</p>
                    <p className="text-xs text-yellow-600">Need attention</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-lg font-bold text-yellow-900">{stats.pendingReports}</p>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Recent Activity */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Recent Activity</h3>
        <div className="space-y-3">
          {recentReports.map((report) => {
            const reportUser = users.find(u => u.id === report.userId);
            return (
              <div key={report.id} className="flex items-center justify-between py-3 px-4 bg-gray-50 rounded-lg">
                <div className="flex items-center">
                  <FileText className="h-5 w-5 text-gray-400 mr-3" />
                  <div>
                    <p className="text-sm font-medium text-gray-900">
                      {reportUser?.name || 'Unknown User'}
                    </p>
                    <p className="text-xs text-gray-500">
                      End-of-Day Report • {new Date(report.date).toLocaleDateString()}
                    </p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-sm text-gray-900">{report.workingHours}h worked</p>
                  <p className="text-xs text-gray-500">{report.completedTasks.length} tasks completed</p>
                </div>
              </div>
            );
          })}
          
          {recentReports.length === 0 && (
            <div className="text-center py-8 text-gray-500">
              <FileText className="h-12 w-12 mx-auto mb-3 text-gray-300" />
              <p>No recent reports</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};