import React from 'react';
import { 
  Calendar, 
  CheckCircle, 
  Clock, 
  AlertTriangle,
  TrendingUp,
  FileText
} from 'lucide-react';
import { User, PlannedTask, EndOfDayReport } from '../../types';
import { getPlannedTasks, getEODReports, getTodayString } from '../../utils/storage';

interface EmployeeDashboardProps {
  user: User;
}

export const EmployeeDashboard: React.FC<EmployeeDashboardProps> = ({ user }) => {
  const today = getTodayString();
  const plannedTasks = getPlannedTasks().filter(t => t.userId === user.id);
  const eodReports = getEODReports().filter(r => r.userId === user.id);
  
  const todayPlannedTask = plannedTasks.find(t => t.date === today);
  const todayEODReport = eodReports.find(r => r.date === today);
  
  const thisWeekReports = eodReports.filter(r => {
    const reportDate = new Date(r.date);
    const weekAgo = new Date();
    weekAgo.setDate(weekAgo.getDate() - 7);
    return reportDate >= weekAgo;
  });

  const completionRate = thisWeekReports.length > 0 
    ? thisWeekReports.reduce((acc, report) => acc + (report.completedTasks.length > 0 ? 1 : 0), 0) / thisWeekReports.length * 100 
    : 0;

  const avgWorkingHours = thisWeekReports.length > 0
    ? thisWeekReports.reduce((acc, report) => acc + report.workingHours, 0) / thisWeekReports.length
    : 0;

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">Welcome back, {user.name.split(' ')[0]}!</h1>
        <p className="mt-2 text-gray-600">Here's your work summary for today</p>
      </div>

      {/* Status Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <Calendar className="h-8 w-8 text-blue-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-500">Today's Date</p>
              <p className="text-lg font-semibold text-gray-900">
                {new Date().toLocaleDateString()}
              </p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <CheckCircle className={`h-8 w-8 ${todayPlannedTask ? 'text-emerald-600' : 'text-gray-400'}`} />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-500">Tasks Planned</p>
              <p className="text-lg font-semibold text-gray-900">
                {todayPlannedTask ? 'Completed' : 'Pending'}
              </p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <FileText className={`h-8 w-8 ${todayEODReport ? 'text-emerald-600' : 'text-gray-400'}`} />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-500">EOD Report</p>
              <p className="text-lg font-semibold text-gray-900">
                {todayEODReport ? 'Submitted' : 'Pending'}
              </p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <TrendingUp className="h-8 w-8 text-indigo-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-500">Weekly Reports</p>
              <p className="text-lg font-semibold text-gray-900">{thisWeekReports.length}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Action Items */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Today's Action Items</h3>
          <div className="space-y-4">
            {!todayPlannedTask && (
              <div className="flex items-center p-4 bg-yellow-50 rounded-lg border border-yellow-200">
                <AlertTriangle className="h-5 w-5 text-yellow-600 mr-3" />
                <div>
                  <p className="text-sm font-medium text-yellow-800">Plan your tasks for today</p>
                  <p className="text-xs text-yellow-600">Add your planned tasks to get started</p>
                </div>
              </div>
            )}
            
            {!todayEODReport && (
              <div className="flex items-center p-4 bg-blue-50 rounded-lg border border-blue-200">
                <Clock className="h-5 w-5 text-blue-600 mr-3" />
                <div>
                  <p className="text-sm font-medium text-blue-800">Submit end-of-day report</p>
                  <p className="text-xs text-blue-600">Report your completed tasks and progress</p>
                </div>
              </div>
            )}

            {todayPlannedTask && todayEODReport && (
              <div className="flex items-center p-4 bg-emerald-50 rounded-lg border border-emerald-200">
                <CheckCircle className="h-5 w-5 text-emerald-600 mr-3" />
                <div>
                  <p className="text-sm font-medium text-emerald-800">All tasks completed!</p>
                  <p className="text-xs text-emerald-600">Great job! You've completed all required submissions for today.</p>
                </div>
              </div>
            )}
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Weekly Summary</h3>
          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <span className="text-sm text-gray-600">Reports Submitted</span>
              <span className="text-sm font-semibold text-gray-900">{thisWeekReports.length}/7</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm text-gray-600">Completion Rate</span>
              <span className="text-sm font-semibold text-gray-900">{completionRate.toFixed(0)}%</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm text-gray-600">Avg. Working Hours</span>
              <span className="text-sm font-semibold text-gray-900">{avgWorkingHours.toFixed(1)}h</span>
            </div>
            
            <div className="pt-2">
              <div className="flex justify-between text-xs text-gray-500 mb-1">
                <span>Progress</span>
                <span>{completionRate.toFixed(0)}%</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div 
                  className="bg-emerald-600 h-2 rounded-full transition-all duration-300" 
                  style={{ width: `${completionRate}%` }}
                ></div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Recent Activity */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Recent Activity</h3>
        <div className="space-y-3">
          {thisWeekReports.slice(0, 5).map((report) => (
            <div key={report.id} className="flex items-center justify-between py-3 px-4 bg-gray-50 rounded-lg">
              <div className="flex items-center">
                <FileText className="h-5 w-5 text-gray-400 mr-3" />
                <div>
                  <p className="text-sm font-medium text-gray-900">
                    End-of-Day Report
                  </p>
                  <p className="text-xs text-gray-500">
                    {new Date(report.date).toLocaleDateString()}
                  </p>
                </div>
              </div>
              <div className="text-right">
                <p className="text-sm text-gray-900">{report.workingHours}h worked</p>
                <p className="text-xs text-gray-500">{report.completedTasks.length} tasks completed</p>
              </div>
            </div>
          ))}
          
          {thisWeekReports.length === 0 && (
            <div className="text-center py-8 text-gray-500">
              <FileText className="h-12 w-12 mx-auto mb-3 text-gray-300" />
              <p>No reports submitted this week</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};