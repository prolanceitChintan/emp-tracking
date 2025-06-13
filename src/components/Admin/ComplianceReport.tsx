import React, { useState } from 'react';
import { 
  Calendar, 
  Users, 
  AlertTriangle, 
  FileText,
  Download,
  Filter
} from 'lucide-react';
import { User } from '../../types';
import { getUsers, getEODReports, getTodayString } from '../../utils/storage';

interface ComplianceReportProps {
  currentUser: User;
}

export const ComplianceReport: React.FC<ComplianceReportProps> = ({ currentUser }) => {
  const [selectedDate, setSelectedDate] = useState(getTodayString());
  const [showOnlyMissing, setShowOnlyMissing] = useState(false);
  
  const users = getUsers().filter(u => u.role === 'employee');
  const eodReports = getEODReports();
  
  const reportsForDate = eodReports.filter(r => r.date === selectedDate);
  const submittedUserIds = reportsForDate.map(r => r.userId);
  
  const complianceData = users.map(user => {
    const hasSubmitted = submittedUserIds.includes(user.id);
    const userReport = reportsForDate.find(r => r.userId === user.id);
    
    return {
      user,
      hasSubmitted,
      report: userReport,
      status: hasSubmitted ? 'submitted' : 'missing',
    };
  });

  const filteredData = showOnlyMissing 
    ? complianceData.filter(item => !item.hasSubmitted)
    : complianceData;

  const submissionRate = users.length > 0 ? (reportsForDate.length / users.length) * 100 : 0;
  const missingCount = users.length - reportsForDate.length;

  const exportToCSV = () => {
    const headers = ['Name', 'Email', 'Department', 'Status', 'Working Hours', 'Tasks Completed', 'Submission Time'];
    const rows = complianceData.map(item => [
      item.user.name,
      item.user.email,
      item.user.department || '',
      item.status,
      item.report?.workingHours || '',
      item.report?.completedTasks.length || '',
      item.report ? new Date(item.report.updatedAt).toLocaleString() : '',
    ]);

    const csvContent = [headers, ...rows].map(row => row.join(',')).join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    
    const a = document.createElement('a');
    a.href = url;
    a.download = `compliance-report-${selectedDate}.csv`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">Compliance Report</h1>
        <p className="mt-2 text-gray-600">Monitor employee report submission compliance</p>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 mb-6">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div className="flex flex-col sm:flex-row sm:items-center gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Select Date
              </label>
              <input
                type="date"
                value={selectedDate}
                onChange={(e) => setSelectedDate(e.target.value)}
                max={getTodayString()}
                className="block w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
            
            <div className="flex items-center mt-4 sm:mt-6">
              <input
                type="checkbox"
                id="showOnlyMissing"
                checked={showOnlyMissing}
                onChange={(e) => setShowOnlyMissing(e.target.checked)}
                className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
              />
              <label htmlFor="showOnlyMissing" className="ml-2 text-sm text-gray-700">
                Show only missing reports
              </label>
            </div>
          </div>
          
          <button
            onClick={exportToCSV}
            className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition duration-200"
          >
            <Download className="h-4 w-4 mr-2" />
            Export CSV
          </button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <div className="flex items-center">
            <Users className="h-8 w-8 text-blue-600" />
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-500">Total Employees</p>
              <p className="text-2xl font-bold text-gray-900">{users.length}</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <div className="flex items-center">
            <FileText className="h-8 w-8 text-emerald-600" />
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-500">Reports Submitted</p>
              <p className="text-2xl font-bold text-gray-900">{reportsForDate.length}</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <div className="flex items-center">
            <AlertTriangle className={`h-8 w-8 ${missingCount > 0 ? 'text-red-600' : 'text-gray-400'}`} />
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-500">Missing Reports</p>
              <p className="text-2xl font-bold text-gray-900">{missingCount}</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <div className="flex items-center">
            <Calendar className="h-8 w-8 text-indigo-600" />
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-500">Compliance Rate</p>
              <p className="text-2xl font-bold text-gray-900">{submissionRate.toFixed(0)}%</p>
            </div>
          </div>
        </div>
      </div>

      {/* Compliance Table */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-200 flex items-center justify-between">
          <h3 className="text-lg font-semibold text-gray-900 flex items-center">
            <Filter className="h-5 w-5 mr-2" />
            Compliance Report for {new Date(selectedDate).toLocaleDateString()}
          </h3>
          <div className="text-sm text-gray-500">
            Showing {filteredData.length} of {users.length} employees
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Employee
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Department
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Working Hours
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Tasks Completed
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Submission Time
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filteredData.map((item) => (
                <tr key={item.user.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div>
                      <div className="text-sm font-medium text-gray-900">{item.user.name}</div>
                      <div className="text-sm text-gray-500">{item.user.email}</div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {item.user.department || '-'}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                      item.hasSubmitted 
                        ? 'bg-emerald-100 text-emerald-800' 
                        : 'bg-red-100 text-red-800'
                    }`}>
                      {item.hasSubmitted ? 'Submitted' : 'Missing'}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {item.report?.workingHours ? `${item.report.workingHours}h` : '-'}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {item.report?.completedTasks.length || '-'}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {item.report ? new Date(item.report.updatedAt).toLocaleString() : '-'}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          {filteredData.length === 0 && (
            <div className="text-center py-12 text-gray-500">
              <FileText className="h-12 w-12 mx-auto mb-3 text-gray-300" />
              <p>No records found for the selected criteria</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};