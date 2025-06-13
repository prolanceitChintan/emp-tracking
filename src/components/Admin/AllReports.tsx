import React, { useState, useMemo } from 'react';
import { 
  FileText, 
  Calendar, 
  Users, 
  Filter,
  Download,
  Search,
  Eye,
  ChevronDown,
  ChevronUp,
  Clock,
  CheckCircle,
  Target
} from 'lucide-react';
import { User, EndOfDayReport, PlannedTask } from '../../types';
import { getUsers, getEODReports, getPlannedTasks, getTodayString } from '../../utils/storage';

interface AllReportsProps {
  currentUser: User;
}

export const AllReports: React.FC<AllReportsProps> = ({ currentUser }) => {
  const [dateFrom, setDateFrom] = useState(() => {
    const date = new Date();
    date.setDate(date.getDate() - 30); // Default to last 30 days
    return date.toISOString().split('T')[0];
  });
  const [dateTo, setDateTo] = useState(getTodayString());
  const [selectedUserId, setSelectedUserId] = useState('all');
  const [reportType, setReportType] = useState<'all' | 'eod' | 'planned'>('all');
  const [expandedReports, setExpandedReports] = useState<Set<string>>(new Set());
  const [searchTerm, setSearchTerm] = useState('');

  const users = getUsers().filter(u => u.role === 'employee');
  const eodReports = getEODReports();
  const plannedTasks = getPlannedTasks();

  const filteredData = useMemo(() => {
    let combinedReports: Array<{
      id: string;
      type: 'eod' | 'planned';
      userId: string;
      user: User;
      date: string;
      data: EndOfDayReport | PlannedTask;
      createdAt: string;
      updatedAt: string;
    }> = [];

    // Add EOD reports
    if (reportType === 'all' || reportType === 'eod') {
      eodReports.forEach(report => {
        const user = users.find(u => u.id === report.userId);
        if (user) {
          combinedReports.push({
            id: `eod-${report.id}`,
            type: 'eod',
            userId: report.userId,
            user,
            date: report.date,
            data: report,
            createdAt: report.createdAt,
            updatedAt: report.updatedAt,
          });
        }
      });
    }

    // Add planned tasks
    if (reportType === 'all' || reportType === 'planned') {
      plannedTasks.forEach(task => {
        const user = users.find(u => u.id === task.userId);
        if (user) {
          combinedReports.push({
            id: `planned-${task.id}`,
            type: 'planned',
            userId: task.userId,
            user,
            date: task.date,
            data: task,
            createdAt: task.createdAt,
            updatedAt: task.updatedAt,
          });
        }
      });
    }

    // Apply filters
    return combinedReports.filter(report => {
      // Date range filter
      const reportDate = new Date(report.date);
      const fromDate = new Date(dateFrom);
      const toDate = new Date(dateTo);
      
      if (reportDate < fromDate || reportDate > toDate) {
        return false;
      }

      // User filter
      if (selectedUserId !== 'all' && report.userId !== selectedUserId) {
        return false;
      }

      // Search filter
      if (searchTerm) {
        const searchLower = searchTerm.toLowerCase();
        const userName = report.user.name.toLowerCase();
        const userEmail = report.user.email.toLowerCase();
        const department = (report.user.department || '').toLowerCase();
        
        let taskContent = '';
        if (report.type === 'eod') {
          const eodData = report.data as EndOfDayReport;
          taskContent = eodData.completedTasks.join(' ').toLowerCase() + ' ' + 
                       eodData.challenges.toLowerCase() + ' ' +
                       eodData.nextDayPlan.join(' ').toLowerCase();
        } else {
          const plannedData = report.data as PlannedTask;
          taskContent = plannedData.tasks.join(' ').toLowerCase();
        }

        if (!userName.includes(searchLower) && 
            !userEmail.includes(searchLower) && 
            !department.includes(searchLower) &&
            !taskContent.includes(searchLower)) {
          return false;
        }
      }

      return true;
    }).sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime());
  }, [dateFrom, dateTo, selectedUserId, reportType, searchTerm, eodReports, plannedTasks, users]);

  const toggleExpanded = (reportId: string) => {
    const newExpanded = new Set(expandedReports);
    if (newExpanded.has(reportId)) {
      newExpanded.delete(reportId);
    } else {
      newExpanded.add(reportId);
    }
    setExpandedReports(newExpanded);
  };

  const exportToCSV = () => {
    const headers = [
      'Date', 'Employee', 'Email', 'Department', 'Report Type', 
      'Tasks/Content', 'Working Hours', 'Challenges', 'Next Day Plan', 
      'Edit Count', 'Created At', 'Updated At'
    ];
    
    const rows = filteredData.map(report => {
      const baseData = [
        report.date,
        report.user.name,
        report.user.email,
        report.user.department || '',
        report.type === 'eod' ? 'End of Day' : 'Planned Tasks',
      ];

      if (report.type === 'eod') {
        const eodData = report.data as EndOfDayReport;
        return [
          ...baseData,
          eodData.completedTasks.join('; '),
          eodData.workingHours.toString(),
          eodData.challenges,
          eodData.nextDayPlan.join('; '),
          eodData.editCount.toString(),
          new Date(report.createdAt).toLocaleString(),
          new Date(report.updatedAt).toLocaleString(),
        ];
      } else {
        const plannedData = report.data as PlannedTask;
        return [
          ...baseData,
          plannedData.tasks.join('; '),
          '',
          '',
          '',
          plannedData.editCount.toString(),
          new Date(report.createdAt).toLocaleString(),
          new Date(report.updatedAt).toLocaleString(),
        ];
      }
    });

    const csvContent = [headers, ...rows].map(row => 
      row.map(cell => `"${cell.replace(/"/g, '""')}"`).join(',')
    ).join('\n');
    
    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    
    const a = document.createElement('a');
    a.href = url;
    a.download = `all-reports-${dateFrom}-to-${dateTo}.csv`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const stats = {
    totalReports: filteredData.length,
    eodReports: filteredData.filter(r => r.type === 'eod').length,
    plannedReports: filteredData.filter(r => r.type === 'planned').length,
    uniqueEmployees: new Set(filteredData.map(r => r.userId)).size,
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">All Reports</h1>
        <p className="mt-2 text-gray-600">View and analyze all employee reports with advanced filtering</p>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 mb-6">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              From Date
            </label>
            <input
              type="date"
              value={dateFrom}
              onChange={(e) => setDateFrom(e.target.value)}
              max={getTodayString()}
              className="block w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              To Date
            </label>
            <input
              type="date"
              value={dateTo}
              onChange={(e) => setDateTo(e.target.value)}
              max={getTodayString()}
              className="block w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Employee
            </label>
            <select
              value={selectedUserId}
              onChange={(e) => setSelectedUserId(e.target.value)}
              className="block w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="all">All Employees</option>
              {users.map(user => (
                <option key={user.id} value={user.id}>{user.name}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Report Type
            </label>
            <select
              value={reportType}
              onChange={(e) => setReportType(e.target.value as 'all' | 'eod' | 'planned')}
              className="block w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="all">All Reports</option>
              <option value="eod">End of Day Reports</option>
              <option value="planned">Planned Tasks</option>
            </select>
          </div>
        </div>

        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div className="relative flex-1 max-w-md">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <Search className="h-5 w-5 text-gray-400" />
            </div>
            <input
              type="text"
              placeholder="Search reports, employees, tasks..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
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
            <FileText className="h-8 w-8 text-blue-600" />
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-500">Total Reports</p>
              <p className="text-2xl font-bold text-gray-900">{stats.totalReports}</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <div className="flex items-center">
            <CheckCircle className="h-8 w-8 text-emerald-600" />
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-500">EOD Reports</p>
              <p className="text-2xl font-bold text-gray-900">{stats.eodReports}</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <div className="flex items-center">
            <Target className="h-8 w-8 text-indigo-600" />
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-500">Planned Tasks</p>
              <p className="text-2xl font-bold text-gray-900">{stats.plannedReports}</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <div className="flex items-center">
            <Users className="h-8 w-8 text-purple-600" />
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-500">Active Employees</p>
              <p className="text-2xl font-bold text-gray-900">{stats.uniqueEmployees}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Reports List */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-200 flex items-center justify-between">
          <h3 className="text-lg font-semibold text-gray-900 flex items-center">
            <Filter className="h-5 w-5 mr-2" />
            Reports ({filteredData.length})
          </h3>
          <div className="text-sm text-gray-500">
            {dateFrom} to {dateTo}
          </div>
        </div>

        <div className="divide-y divide-gray-200">
          {filteredData.map((report) => {
            const isExpanded = expandedReports.has(report.id);
            const isEOD = report.type === 'eod';
            const eodData = isEOD ? report.data as EndOfDayReport : null;
            const plannedData = !isEOD ? report.data as PlannedTask : null;

            return (
              <div key={report.id} className="hover:bg-gray-50">
                <div 
                  className="px-6 py-4 cursor-pointer"
                  onClick={() => toggleExpanded(report.id)}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-4">
                      <div className={`p-2 rounded-lg ${
                        isEOD ? 'bg-emerald-100' : 'bg-blue-100'
                      }`}>
                        {isEOD ? (
                          <CheckCircle className={`h-5 w-5 ${
                            isEOD ? 'text-emerald-600' : 'text-blue-600'
                          }`} />
                        ) : (
                          <Target className="h-5 w-5 text-blue-600" />
                        )}
                      </div>
                      
                      <div>
                        <div className="flex items-center space-x-2">
                          <h4 className="text-sm font-medium text-gray-900">
                            {report.user.name}
                          </h4>
                          <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                            isEOD 
                              ? 'bg-emerald-100 text-emerald-800' 
                              : 'bg-blue-100 text-blue-800'
                          }`}>
                            {isEOD ? 'EOD Report' : 'Planned Tasks'}
                          </span>
                        </div>
                        <div className="flex items-center space-x-4 mt-1 text-xs text-gray-500">
                          <span className="flex items-center">
                            <Calendar className="h-3 w-3 mr-1" />
                            {new Date(report.date).toLocaleDateString()}
                          </span>
                          <span className="flex items-center">
                            <Clock className="h-3 w-3 mr-1" />
                            {new Date(report.updatedAt).toLocaleString()}
                          </span>
                          <span>{report.user.department}</span>
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center space-x-4">
                      {isEOD && eodData && (
                        <div className="text-right text-sm">
                          <p className="text-gray-900">{eodData.workingHours}h worked</p>
                          <p className="text-gray-500">{eodData.completedTasks.length} tasks</p>
                        </div>
                      )}
                      {!isEOD && plannedData && (
                        <div className="text-right text-sm">
                          <p className="text-gray-900">{plannedData.tasks.length} tasks planned</p>
                          <p className="text-gray-500">Edit count: {plannedData.editCount}</p>
                        </div>
                      )}
                      
                      {isExpanded ? (
                        <ChevronUp className="h-5 w-5 text-gray-400" />
                      ) : (
                        <ChevronDown className="h-5 w-5 text-gray-400" />
                      )}
                    </div>
                  </div>
                </div>

                {isExpanded && (
                  <div className="px-6 pb-4 border-t border-gray-100 bg-gray-50">
                    <div className="pt-4 space-y-4">
                      {isEOD && eodData ? (
                        <>
                          <div>
                            <h5 className="text-sm font-medium text-gray-700 mb-2">Completed Tasks</h5>
                            <ul className="list-disc list-inside space-y-1">
                              {eodData.completedTasks.map((task, index) => (
                                <li key={index} className="text-sm text-gray-600">{task}</li>
                              ))}
                            </ul>
                          </div>
                          
                          {eodData.challenges && (
                            <div>
                              <h5 className="text-sm font-medium text-gray-700 mb-2">Challenges</h5>
                              <p className="text-sm text-gray-600">{eodData.challenges}</p>
                            </div>
                          )}
                          
                          {eodData.nextDayPlan.length > 0 && (
                            <div>
                              <h5 className="text-sm font-medium text-gray-700 mb-2">Next Day Plan</h5>
                              <ul className="list-disc list-inside space-y-1">
                                {eodData.nextDayPlan.map((task, index) => (
                                  <li key={index} className="text-sm text-gray-600">{task}</li>
                                ))}
                              </ul>
                            </div>
                          )}
                          
                          <div className="flex items-center justify-between pt-2 border-t border-gray-200">
                            <span className="text-xs text-gray-500">
                              Working Hours: {eodData.workingHours}h
                            </span>
                            <span className="text-xs text-gray-500">
                              Edit Count: {eodData.editCount}/3
                            </span>
                          </div>
                        </>
                      ) : plannedData ? (
                        <>
                          <div>
                            <h5 className="text-sm font-medium text-gray-700 mb-2">Planned Tasks</h5>
                            <ul className="list-disc list-inside space-y-1">
                              {plannedData.tasks.map((task, index) => (
                                <li key={index} className="text-sm text-gray-600">{task}</li>
                              ))}
                            </ul>
                          </div>
                          
                          <div className="flex items-center justify-between pt-2 border-t border-gray-200">
                            <span className="text-xs text-gray-500">
                              Tasks Planned: {plannedData.tasks.length}
                            </span>
                            <span className="text-xs text-gray-500">
                              Edit Count: {plannedData.editCount}/3
                            </span>
                          </div>
                        </>
                      ) : null}
                    </div>
                  </div>
                )}
              </div>
            );
          })}

          {filteredData.length === 0 && (
            <div className="text-center py-12 text-gray-500">
              <FileText className="h-12 w-12 mx-auto mb-3 text-gray-300" />
              <p>No reports found for the selected criteria</p>
              <p className="text-sm mt-1">Try adjusting your filters or date range</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};