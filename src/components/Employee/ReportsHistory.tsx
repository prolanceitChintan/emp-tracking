import React, { useState, useMemo } from 'react';
import { 
  Calendar, 
  FileText, 
  Target, 
  Clock, 
  ChevronDown, 
  ChevronUp,
  Filter,
  Download,
  Search,
  CheckCircle,
  XCircle,
  Eye
} from 'lucide-react';
import { User, EndOfDayReport, PlannedTask } from '../../types';
import { getPlannedTasks, getEODReports, getTodayString } from '../../utils/storage';

interface ReportsHistoryProps {
  user: User;
}

interface DayReport {
  date: string;
  plannedTask?: PlannedTask;
  eodReport?: EndOfDayReport;
  hasPlanned: boolean;
  hasEOD: boolean;
}

export const ReportsHistory: React.FC<ReportsHistoryProps> = ({ user }) => {
  const [dateFrom, setDateFrom] = useState(() => {
    const date = new Date();
    date.setDate(date.getDate() - 30); // Default to last 30 days
    return date.toISOString().split('T')[0];
  });
  const [dateTo, setDateTo] = useState(getTodayString());
  const [searchTerm, setSearchTerm] = useState('');
  const [expandedRows, setExpandedRows] = useState<Set<string>>(new Set());
  const [filterType, setFilterType] = useState<'all' | 'planned' | 'eod' | 'complete'>('all');

  const plannedTasks = getPlannedTasks().filter(t => t.userId === user.id);
  const eodReports = getEODReports().filter(r => r.userId === user.id);

  const dayReports = useMemo(() => {
    const reports = new Map<string, DayReport>();
    
    // Add planned tasks (only submitted ones)
    plannedTasks.forEach(task => {
      if (task.date >= dateFrom && task.date <= dateTo) {
        reports.set(task.date, {
          date: task.date,
          plannedTask: task,
          hasPlanned: true,
          hasEOD: false,
        });
      }
    });

    // Add EOD reports (only submitted ones)
    eodReports.forEach(report => {
      if (report.date >= dateFrom && report.date <= dateTo) {
        const existing = reports.get(report.date) || {
          date: report.date,
          hasPlanned: false,
          hasEOD: false,
        };
        existing.eodReport = report;
        existing.hasEOD = true;
        reports.set(report.date, existing);
      }
    });

    // Convert to array and filter
    let filteredReports = Array.from(reports.values());

    // Apply search filter
    if (searchTerm) {
      const searchLower = searchTerm.toLowerCase();
      filteredReports = filteredReports.filter(report => {
        const plannedContent = report.plannedTask?.tasks.join(' ').toLowerCase() || '';
        const eodContent = [
          ...(report.eodReport?.completedTasks || []),
          report.eodReport?.challenges || '',
          ...(report.eodReport?.nextDayPlan || [])
        ].join(' ').toLowerCase();
        
        return plannedContent.includes(searchLower) || 
               eodContent.includes(searchLower) ||
               report.date.includes(searchLower);
      });
    }

    // Apply type filter
    if (filterType === 'planned') {
      filteredReports = filteredReports.filter(report => report.hasPlanned);
    } else if (filterType === 'eod') {
      filteredReports = filteredReports.filter(report => report.hasEOD);
    } else if (filterType === 'complete') {
      filteredReports = filteredReports.filter(report => report.hasPlanned && report.hasEOD);
    }

    // Sort by date (newest first)
    return filteredReports.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  }, [plannedTasks, eodReports, dateFrom, dateTo, searchTerm, filterType]);

  const toggleExpanded = (date: string) => {
    const newExpanded = new Set(expandedRows);
    if (newExpanded.has(date)) {
      newExpanded.delete(date);
    } else {
      newExpanded.add(date);
    }
    setExpandedRows(newExpanded);
  };

  const exportToCSV = () => {
    const headers = [
      'Date', 'Planned Tasks', 'Planned Tasks Count', 'Planned Edit Count',
      'Completed Tasks', 'Working Hours', 'Challenges', 'Next Day Plan', 
      'EOD Edit Count', 'Status'
    ];
    
    const rows = dayReports.map(report => [
      report.date,
      report.plannedTask?.tasks.join('; ') || '',
      report.plannedTask?.tasks.length || 0,
      report.plannedTask?.editCount || 0,
      report.eodReport?.completedTasks.join('; ') || '',
      report.eodReport?.workingHours || '',
      report.eodReport?.challenges || '',
      report.eodReport?.nextDayPlan.join('; ') || '',
      report.eodReport?.editCount || 0,
      report.hasPlanned && report.hasEOD ? 'Complete' : 'Partial'
    ]);

    const csvContent = [headers, ...rows].map(row => 
      row.map(cell => `"${cell.toString().replace(/"/g, '""')}"`).join(',')
    ).join('\n');
    
    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    
    const a = document.createElement('a');
    a.href = url;
    a.download = `my-reports-${dateFrom}-to-${dateTo}.csv`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const stats = {
    totalSubmissions: dayReports.length,
    completeDays: dayReports.filter(r => r.hasPlanned && r.hasEOD).length,
    plannedOnly: dayReports.filter(r => r.hasPlanned && !r.hasEOD).length,
    eodOnly: dayReports.filter(r => !r.hasPlanned && r.hasEOD).length,
    totalPlanned: dayReports.filter(r => r.hasPlanned).length,
    totalEOD: dayReports.filter(r => r.hasEOD).length,
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">My Reports History</h1>
        <p className="mt-2 text-gray-600">View all your submitted planned tasks and end-of-day reports</p>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 mb-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
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
              Filter by Type
            </label>
            <select
              value={filterType}
              onChange={(e) => setFilterType(e.target.value as 'all' | 'planned' | 'eod' | 'complete')}
              className="block w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="all">All Submissions</option>
              <option value="planned">Planned Tasks Only</option>
              <option value="eod">EOD Reports Only</option>
              <option value="complete">Complete Days</option>
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
              placeholder="Search tasks, challenges, plans..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
          
          <button
            onClick={exportToCSV}
            disabled={dayReports.length === 0}
            className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <Download className="h-4 w-4 mr-2" />
            Export CSV
          </button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-6 gap-4 mb-8">
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4">
          <div className="text-center">
            <FileText className="h-6 w-6 text-blue-600 mx-auto mb-2" />
            <p className="text-sm font-medium text-gray-500">Total Submissions</p>
            <p className="text-xl font-bold text-gray-900">{stats.totalSubmissions}</p>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4">
          <div className="text-center">
            <CheckCircle className="h-6 w-6 text-emerald-600 mx-auto mb-2" />
            <p className="text-sm font-medium text-gray-500">Complete Days</p>
            <p className="text-xl font-bold text-gray-900">{stats.completeDays}</p>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4">
          <div className="text-center">
            <Target className="h-6 w-6 text-blue-600 mx-auto mb-2" />
            <p className="text-sm font-medium text-gray-500">Planned Tasks</p>
            <p className="text-xl font-bold text-gray-900">{stats.totalPlanned}</p>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4">
          <div className="text-center">
            <FileText className="h-6 w-6 text-indigo-600 mx-auto mb-2" />
            <p className="text-sm font-medium text-gray-500">EOD Reports</p>
            <p className="text-xl font-bold text-gray-900">{stats.totalEOD}</p>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4">
          <div className="text-center">
            <Clock className="h-6 w-6 text-yellow-600 mx-auto mb-2" />
            <p className="text-sm font-medium text-gray-500">Planned Only</p>
            <p className="text-xl font-bold text-gray-900">{stats.plannedOnly}</p>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4">
          <div className="text-center">
            <Clock className="h-6 w-6 text-orange-600 mx-auto mb-2" />
            <p className="text-sm font-medium text-gray-500">EOD Only</p>
            <p className="text-xl font-bold text-gray-900">{stats.eodOnly}</p>
          </div>
        </div>
      </div>

      {/* Reports Table */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-200 flex items-center justify-between">
          <h3 className="text-lg font-semibold text-gray-900 flex items-center">
            <Filter className="h-5 w-5 mr-2" />
            Submitted Reports ({dayReports.length})
          </h3>
          <div className="text-sm text-gray-500">
            {dateFrom} to {dateTo}
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Date
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Planned Tasks
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  EOD Report
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Working Hours
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {dayReports.map((report) => {
                const isExpanded = expandedRows.has(report.date);
                const isComplete = report.hasPlanned && report.hasEOD;
                
                return (
                  <React.Fragment key={report.date}>
                    <tr className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-medium text-gray-900">
                          {new Date(report.date).toLocaleDateString()}
                        </div>
                        <div className="text-xs text-gray-500">
                          {new Date(report.date).toLocaleDateString('en-US', { weekday: 'short' })}
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center">
                          {report.hasPlanned ? (
                            <div className="flex items-center">
                              <CheckCircle className="h-4 w-4 text-emerald-600 mr-2" />
                              <span className="text-sm text-gray-900">
                                {report.plannedTask?.tasks.length} task{report.plannedTask?.tasks.length !== 1 ? 's' : ''}
                              </span>
                            </div>
                          ) : (
                            <div className="flex items-center">
                              <XCircle className="h-4 w-4 text-gray-400 mr-2" />
                              <span className="text-sm text-gray-500">Not submitted</span>
                            </div>
                          )}
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center">
                          {report.hasEOD ? (
                            <div className="flex items-center">
                              <CheckCircle className="h-4 w-4 text-emerald-600 mr-2" />
                              <span className="text-sm text-gray-900">
                                {report.eodReport?.completedTasks.length} task{report.eodReport?.completedTasks.length !== 1 ? 's' : ''}
                              </span>
                            </div>
                          ) : (
                            <div className="flex items-center">
                              <XCircle className="h-4 w-4 text-gray-400 mr-2" />
                              <span className="text-sm text-gray-500">Not submitted</span>
                            </div>
                          )}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {report.eodReport?.workingHours ? `${report.eodReport.workingHours}h` : '-'}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                          isComplete 
                            ? 'bg-emerald-100 text-emerald-800' 
                            : 'bg-blue-100 text-blue-800'
                        }`}>
                          {isComplete ? 'Complete' : 'Partial'}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                        <button
                          onClick={() => toggleExpanded(report.date)}
                          className="text-blue-600 hover:text-blue-800 flex items-center"
                        >
                          <Eye className="h-4 w-4 mr-1" />
                          {isExpanded ? 'Hide' : 'View'}
                          {isExpanded ? (
                            <ChevronUp className="h-4 w-4 ml-1" />
                          ) : (
                            <ChevronDown className="h-4 w-4 ml-1" />
                          )}
                        </button>
                      </td>
                    </tr>
                    
                    {isExpanded && (
                      <tr>
                        <td colSpan={6} className="px-6 py-4 bg-gray-50">
                          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                            {/* Planned Tasks */}
                            <div>
                              <h4 className="text-sm font-medium text-gray-900 mb-3 flex items-center">
                                <Target className="h-4 w-4 mr-2 text-blue-600" />
                                Planned Tasks
                              </h4>
                              {report.plannedTask ? (
                                <div className="space-y-2">
                                  <ul className="list-disc list-inside space-y-1">
                                    {report.plannedTask.tasks.map((task, index) => (
                                      <li key={index} className="text-sm text-gray-600">{task}</li>
                                    ))}
                                  </ul>
                                  <div className="text-xs text-gray-500 pt-2 border-t border-gray-200">
                                    Edit Count: {report.plannedTask.editCount}/3 • 
                                    Updated: {new Date(report.plannedTask.updatedAt).toLocaleString()}
                                  </div>
                                </div>
                              ) : (
                                <p className="text-sm text-gray-500 italic">No planned tasks submitted for this day</p>
                              )}
                            </div>

                            {/* EOD Report */}
                            <div>
                              <h4 className="text-sm font-medium text-gray-900 mb-3 flex items-center">
                                <FileText className="h-4 w-4 mr-2 text-emerald-600" />
                                End-of-Day Report
                              </h4>
                              {report.eodReport ? (
                                <div className="space-y-3">
                                  <div>
                                    <h5 className="text-xs font-medium text-gray-700 mb-1">Completed Tasks</h5>
                                    <ul className="list-disc list-inside space-y-1">
                                      {report.eodReport.completedTasks.map((task, index) => (
                                        <li key={index} className="text-sm text-gray-600">{task}</li>
                                      ))}
                                    </ul>
                                  </div>
                                  
                                  {report.eodReport.challenges && (
                                    <div>
                                      <h5 className="text-xs font-medium text-gray-700 mb-1">Challenges</h5>
                                      <p className="text-sm text-gray-600">{report.eodReport.challenges}</p>
                                    </div>
                                  )}
                                  
                                  {report.eodReport.nextDayPlan.length > 0 && (
                                    <div>
                                      <h5 className="text-xs font-medium text-gray-700 mb-1">Next Day Plan</h5>
                                      <ul className="list-disc list-inside space-y-1">
                                        {report.eodReport.nextDayPlan.map((task, index) => (
                                          <li key={index} className="text-sm text-gray-600">{task}</li>
                                        ))}
                                      </ul>
                                    </div>
                                  )}
                                  
                                  <div className="text-xs text-gray-500 pt-2 border-t border-gray-200">
                                    Working Hours: {report.eodReport.workingHours}h • 
                                    Edit Count: {report.eodReport.editCount}/3 • 
                                    Updated: {new Date(report.eodReport.updatedAt).toLocaleString()}
                                  </div>
                                </div>
                              ) : (
                                <p className="text-sm text-gray-500 italic">No end-of-day report submitted for this day</p>
                              )}
                            </div>
                          </div>
                        </td>
                      </tr>
                    )}
                  </React.Fragment>
                );
              })}
            </tbody>
          </table>

          {dayReports.length === 0 && (
            <div className="text-center py-12 text-gray-500">
              <FileText className="h-12 w-12 mx-auto mb-3 text-gray-300" />
              <p>No submitted reports found for the selected criteria</p>
              <p className="text-sm mt-1">Try adjusting your filters or date range</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};