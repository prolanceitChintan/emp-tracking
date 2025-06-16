import React, { useState, useEffect } from 'react';
import { Plus, X, Save, AlertCircle, CheckCircle, Edit2, Calendar, Clock, CheckSquare, Target, AlertTriangle } from 'lucide-react';
import { User, EndOfDayReport } from '../../types';
import { getEODReports, saveEODReport, getTodayString, canEdit, getEditCount } from '../../utils/storage';

interface EODReportProps {
  user: User;
}

export const EODReport: React.FC<EODReportProps> = ({ user }) => {
  const [completedTasks, setCompletedTasks] = useState<string[]>(['']);
  const [challenges, setChallenges] = useState('');
  const [nextDayPlan, setNextDayPlan] = useState<string[]>(['']);
  const [workingHours, setWorkingHours] = useState<number>(8);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [savedReport, setSavedReport] = useState<EndOfDayReport | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [showSavedReport, setShowSavedReport] = useState(false);
  
  const today = getTodayString();
  const editCount = getEditCount(user.id, today, 'eod');
  const canEditToday = canEdit(user.id, today, 'eod');

  useEffect(() => {
    const eodReports = getEODReports();
    const todayReport = eodReports.find(r => r.userId === user.id && r.date === today);
    
    if (todayReport && todayReport.completedTasks.length > 0) {
      setSavedReport(todayReport);
      setShowSavedReport(true);
      // Reset form to empty state
      setCompletedTasks(['']);
      setChallenges('');
      setNextDayPlan(['']);
      setWorkingHours(8);
    } else {
      setSavedReport(null);
      setShowSavedReport(false);
      setCompletedTasks(['']);
      setChallenges('');
      setNextDayPlan(['']);
      setWorkingHours(8);
    }
  }, [user.id, today]);

  const addCompletedTask = () => {
    setCompletedTasks([...completedTasks, '']);
  };

  const removeCompletedTask = (index: number) => {
    if (completedTasks.length > 1) {
      setCompletedTasks(completedTasks.filter((_, i) => i !== index));
    }
  };

  const updateCompletedTask = (index: number, value: string) => {
    const newTasks = [...completedTasks];
    newTasks[index] = value;
    setCompletedTasks(newTasks);
  };

  const addNextDayTask = () => {
    setNextDayPlan([...nextDayPlan, '']);
  };

  const removeNextDayTask = (index: number) => {
    if (nextDayPlan.length > 1) {
      setNextDayPlan(nextDayPlan.filter((_, i) => i !== index));
    }
  };

  const updateNextDayTask = (index: number, value: string) => {
    const newTasks = [...nextDayPlan];
    newTasks[index] = value;
    setNextDayPlan(newTasks);
  };

  const handleEdit = () => {
    if (!canEditToday || !savedReport) {
      setMessage({ type: 'error', text: 'You have reached the maximum number of edits (3) for today.' });
      return;
    }
    
    setIsEditing(true);
    setCompletedTasks([...savedReport.completedTasks, '']);
    setChallenges(savedReport.challenges);
    setNextDayPlan(savedReport.nextDayPlan.length > 0 ? [...savedReport.nextDayPlan, ''] : ['']);
    setWorkingHours(savedReport.workingHours);
    
    // Smooth scroll to form
    setTimeout(() => {
      const formElement = document.getElementById('eod-form');
      if (formElement) {
        formElement.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }
    }, 100);
  };

  const handleCancel = () => {
    setIsEditing(false);
    setCompletedTasks(['']);
    setChallenges('');
    setNextDayPlan(['']);
    setWorkingHours(8);
    setMessage(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!canEditToday) {
      setMessage({ type: 'error', text: 'You have reached the maximum number of edits (3) for today.' });
      return;
    }

    const validCompletedTasks = completedTasks.filter(task => task.trim() !== '');
    const validNextDayTasks = nextDayPlan.filter(task => task.trim() !== '');
    
    if (validCompletedTasks.length === 0) {
      setMessage({ type: 'error', text: 'Please add at least one completed task.' });
      return;
    }

    if (workingHours <= 0 || workingHours > 24) {
      setMessage({ type: 'error', text: 'Please enter valid working hours (1-24).' });
      return;
    }

    setIsSubmitting(true);
    
    try {
      const existingReports = getEODReports();
      const existingReport = existingReports.find(r => r.userId === user.id && r.date === today);
      
      const eodReport: EndOfDayReport = {
        id: existingReport?.id || Date.now().toString(),
        userId: user.id,
        date: today,
        completedTasks: validCompletedTasks,
        challenges: challenges.trim(),
        nextDayPlan: validNextDayTasks,
        workingHours,
        createdAt: existingReport?.createdAt || new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        editCount: existingReport ? (existingReport?.editCount || 0) + 1 : 0,
      };

      saveEODReport(eodReport);
      setSavedReport(eodReport);
      setShowSavedReport(true);
      setIsEditing(false);
      setCompletedTasks(['']);
      setChallenges('');
      setNextDayPlan(['']);
      setWorkingHours(8);
      setMessage({ type: 'success', text: `End-of-day report ${existingReport ? 'updated' : 'submitted'} successfully!` });
      
      // Clear message after 4 seconds
      setTimeout(() => setMessage(null), 4000);
    } catch (error) {
      setMessage({ type: 'error', text: 'Failed to submit report. Please try again.' });
    } finally {
      setIsSubmitting(false);
    }
  };

  const shouldShowForm = !showSavedReport || isEditing;

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">End-of-Day Report</h1>
        <p className="mt-2 text-gray-600 flex items-center">
          <Calendar className="h-4 w-4 mr-2" />
          Submit your daily report for today ({new Date().toLocaleDateString()})
        </p>
      </div>

      {/* Edit Count Warning */}
      {editCount >= 1 && <div className="mb-6 p-4 bg-red-50 rounded-lg border border-red-400 transition-all duration-300">
        <div className="flex items-center">
          <AlertCircle className="h-5 w-5 text-red-600 mr-2" />
          <div>
            <p className="text-sm font-medium text-red-600">
              Edit Count: {editCount}/3
            </p>
            <p className="text-xs text-red-600">
              {canEditToday
                ? `You have ${3 - editCount} edit${3 - editCount !== 1 ? 's' : ''} remaining for today.`
                : 'You have reached the maximum number of edits for today.'
              }
            </p>
          </div>
        </div>
      </div>}

      {/* Success/Error Message */}
      {message && (
        <div className={`mb-6 flex items-center space-x-2 p-4 rounded-lg transition-all duration-500 transform ${
          message.type === 'success' 
            ? 'bg-emerald-50 text-emerald-800 border border-emerald-200 scale-100 opacity-100' 
            : 'bg-red-50 text-red-800 border border-red-200 scale-100 opacity-100'
        }`}>
          {message.type === 'success' ? (
            <CheckCircle className="h-5 w-5 animate-pulse" />
          ) : (
            <AlertCircle className="h-5 w-5" />
          )}
          <span className="text-sm font-medium">{message.text}</span>
        </div>
      )}

      {/* Saved Report Display */}
      {showSavedReport && !isEditing && savedReport && (
        
        <div className="mb-8 bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden transition-all duration-500 transform scale-100 opacity-100">
          <div className="p-6 bg-gradient-to-r from-green-50 to-emerald-50 border-b border-gray-200">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <div className="p-2 bg-green-100 rounded-lg">
                  <CheckCircle className="h-5 w-5 text-green-600" />
                </div>
                <div>
                  <h2 className="text-lg font-semibold text-gray-900">Today's Report Submitted</h2>
                  <p className="text-sm text-gray-600 flex items-center">
                    <Clock className="h-3 w-3 mr-1" />
                    {savedReport.workingHours} hours • {savedReport.completedTasks.length} tasks completed
                  </p>
                </div>
              </div>
              {canEditToday && (
                <button
                  onClick={handleEdit}
                  className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-lg text-purple-700 bg-purple-100 hover:bg-purple-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-purple-500 transition-all duration-200 transform hover:scale-105"
                >
                  <Edit2 className="h-4 w-4 mr-2" />
                  Edit Report
                </button>
              )}
            </div>
          </div>
          
          <div className="p-6 space-y-6">
            {/* Completed Tasks Section with Working Hours Label */}
            <div>
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center space-x-2">
                  <CheckSquare className="h-5 w-5 text-purple-600" />
                  <h3 className="text-md font-semibold text-gray-900">Completed Tasks</h3>
                </div>
                {/* Working Hours Label moved here */}
                <div className="flex items-center space-x-2 px-3 py-1 bg-blue-100 rounded-full border border-blue-200">
                  <Clock className="h-4 w-4 text-blue-600" />
                  <span className="text-sm font-medium text-blue-800">{savedReport.workingHours}h</span>
                </div>
              </div>
              <div className="space-y-3">
                {savedReport.completedTasks.map((task, index) => (
                  <div 
                    key={index}
                    className="flex items-center space-x-3 p-3 bg-purple-50 rounded-lg border border-purple-200 transition-all duration-300 transform hover:scale-102 hover:shadow-sm"
                    style={{ animationDelay: `${index * 100}ms` }}
                  >
                    <div className="flex-shrink-0">
                      <div className="w-6 h-6 bg-purple-100 text-purple-600 rounded-full flex items-center justify-center text-sm font-medium">
                        ✓
                      </div>
                    </div>
                    <p className="flex-1 text-purple-900 font-medium">{task}</p>
                  </div>
                ))}
              </div>
            </div>

            {/* Challenges */}
            {savedReport.challenges && (
              <div>
                <div className="flex items-center space-x-2 mb-3">
                  <AlertTriangle className="h-5 w-5 text-orange-600" />
                  <h3 className="text-md font-semibold text-gray-900">Challenges Faced</h3>
                </div>
                <div className="p-4 bg-orange-50 rounded-lg border border-orange-200">
                  <p className="text-gray-800 whitespace-pre-wrap">{savedReport.challenges}</p>
                </div>
              </div>
            )}

            {/* Next Day Plan */}
            {savedReport.nextDayPlan.length > 0 && (
              <div>
                <div className="flex items-center space-x-2 mb-4">
                  <Target className="h-5 w-5 text-blue-600" />
                  <h3 className="text-md font-semibold text-gray-900">Tomorrow's Plan</h3>
                </div>
                <div className="space-y-3">
                  {savedReport.nextDayPlan.map((task, index) => (
                    <div 
                      key={index}
                      className="flex items-center space-x-3 p-3 bg-blue-50 rounded-lg transition-all duration-300 transform hover:scale-102 hover:shadow-sm"
                      style={{ animationDelay: `${index * 100}ms` }}
                    >
                      <div className="flex-shrink-0">
                        <div className="w-6 h-6 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center text-sm font-medium">
                          {index + 1}
                        </div>
                      </div>
                      <p className="flex-1 text-gray-900 font-medium">{task}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* EOD Report Form */}
      {shouldShowForm && (
        <div 
          id="eod-form"
          className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 transition-all duration-500 transform scale-100 opacity-100"
        >
          <form onSubmit={handleSubmit} className="space-y-8">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-lg font-semibold text-gray-900">
                {isEditing ? 'Edit Your Report' : 'Daily Report Form'}
              </h2>
              {isEditing && (
                <button
                  type="button"
                  onClick={handleCancel}
                  className="text-sm text-gray-500 hover:text-gray-700 transition-colors duration-200"
                >
                  Cancel
                </button>
              )}
            </div>

            {/* Completed Tasks */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-4">
                <CheckSquare className="h-4 w-4 inline mr-2" />
                Tasks Completed Today *
              </label>
              
              <div className="space-y-4">
                {completedTasks.map((task, index) => (
                  <div 
                    key={index} 
                    className="flex items-center space-x-3 transition-all duration-300 transform"
                    style={{ 
                      animation: `slideInFromLeft 0.5s ease-out ${index * 100}ms both`,
                    }}
                  >
                    <div className="flex-1">
                      <input
                        type="text"
                        value={task}
                        onChange={(e) => updateCompletedTask(index, e.target.value)}
                        placeholder={`Completed task ${index + 1}...`}
                        className="block w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        disabled={!canEditToday}
                        autoFocus={index === 0 && isEditing}
                      />
                    </div>
                    
                    {completedTasks.length > 1 && (
                      <button
                        type="button"
                        onClick={() => removeCompletedTask(index)}
                        className="p-2 text-red-600 hover:text-red-800 hover:bg-red-50 rounded-lg transition-all duration-200 transform hover:scale-110"
                        disabled={!canEditToday}
                      >
                        <X className="h-5 w-5" />
                      </button>
                    )}
                  </div>
                ))}
              </div>

              <button
                type="button"
                onClick={addCompletedTask}
                className="mt-4 inline-flex items-center px-4 py-2 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 transform hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed"
                disabled={!canEditToday}
              >
                <Plus className="h-4 w-4 mr-2" />
                Add Another Task
              </button>
            </div>

            {/* Working Hours */}
            <div>
              <label htmlFor="workingHours" className="block text-sm font-medium text-gray-700 mb-2">
                <Clock className="h-4 w-4 inline mr-2" />
                Working Hours Today *
              </label>
              <input
                type="number"
                id="workingHours"
                min="0.5"
                max="24"
                step="0.5"
                value={workingHours}
                onChange={(e) => setWorkingHours(parseFloat(e.target.value))}
                className="block w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                disabled={!canEditToday}
              />
            </div>

            {/* Challenges */}
            <div>
              <label htmlFor="challenges" className="block text-sm font-medium text-gray-700 mb-2">
                <AlertTriangle className="h-4 w-4 inline mr-2" />
                Challenges Faced (Optional)
              </label>
              <textarea
                id="challenges"
                rows={4}
                value={challenges}
                onChange={(e) => setChallenges(e.target.value)}
                placeholder="Describe any challenges or blockers you encountered today..."
                className="block w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                disabled={!canEditToday}
              />
            </div>

            <div className="flex items-center justify-between pt-6 border-t border-gray-200">
              <p className="text-sm text-gray-500 flex items-center">
                <Calendar className="h-4 w-4 mr-1" />
                Report will be saved for {new Date().toLocaleDateString()}
              </p>
              
              <button
                type="submit"
                disabled={isSubmitting || !canEditToday}
                className="inline-flex items-center px-6 py-3 border border-transparent text-sm font-medium rounded-lg shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 transform hover:scale-105"
              >
                <Save className="h-4 w-4 mr-2" />
                {isSubmitting ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                    Submitting...
                  </>
                ) : (
                  `${isEditing ? 'Update' : 'Submit'} Report`
                )}
              </button>
            </div>
          </form>
        </div>
      )}

    </div>
  );
};