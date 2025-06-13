import React, { useState, useEffect } from 'react';
import { Plus, X, Save, AlertCircle, CheckCircle, Edit2, Calendar, Clock } from 'lucide-react';
import { User, PlannedTask } from '../../types';
import { getPlannedTasks, savePlannedTask, getTodayString, canEdit, getEditCount } from '../../utils/storage';

interface PlanTasksProps {
  user: User;
}

export const PlanTasks: React.FC<PlanTasksProps> = ({ user }) => {
  const [tasks, setTasks] = useState<string[]>(['']);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [savedTasks, setSavedTasks] = useState<string[]>([]);
  const [isEditing, setIsEditing] = useState(false);
  const [showSavedTasks, setShowSavedTasks] = useState(false);
  
  const today = getTodayString();
  const editCount = getEditCount(user.id, today, 'planned');
  const canEditToday = canEdit(user.id, today, 'planned');

  useEffect(() => {
    const plannedTasks = getPlannedTasks();
    const todayTask = plannedTasks.find(t => t.userId === user.id && t.date === today);
    
    if (todayTask && todayTask.tasks.length > 0) {
      setSavedTasks(todayTask.tasks);
      setShowSavedTasks(true);
      setTasks(['']); // Reset input tasks
    } else {
      setSavedTasks([]);
      setShowSavedTasks(false);
      setTasks(['']);
    }
  }, [user.id, today]);

  const addTask = () => {
    setTasks([...tasks, '']);
  };

  const removeTask = (index: number) => {
    if (tasks.length > 1) {
      setTasks(tasks.filter((_, i) => i !== index));
    }
  };

  const updateTask = (index: number, value: string) => {
    const newTasks = [...tasks];
    newTasks[index] = value;
    setTasks(newTasks);
  };

  const handleEdit = () => {
    if (!canEditToday) {
      setMessage({ type: 'error', text: 'You have reached the maximum number of edits (3) for today.' });
      return;
    }
    
    setIsEditing(true);
    setTasks(savedTasks.length > 0 ? [...savedTasks] : ['']);
    
    // Smooth scroll to form
    setTimeout(() => {
      const formElement = document.getElementById('task-form');
      if (formElement) {
        formElement.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }
    }, 100);
  };

  const handleCancel = () => {
    setIsEditing(false);
    setTasks(['']);
    setMessage(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!canEditToday) {
      setMessage({ type: 'error', text: 'You have reached the maximum number of edits (3) for today.' });
      return;
    }

    const validTasks = tasks.filter(task => task.trim() !== '');
    
    if (validTasks.length === 0) {
      setMessage({ type: 'error', text: 'Please add at least one task.' });
      return;
    }

    setIsSubmitting(true);
    
    try {
      const existingPlannedTasks = getPlannedTasks();
      const existingTask = existingPlannedTasks.find(t => t.userId === user.id && t.date === today);
      
      const plannedTask: PlannedTask = {
        id: existingTask?.id || Date.now().toString(),
        userId: user.id,
        date: today,
        tasks: validTasks,
        createdAt: existingTask?.createdAt || new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        editCount: existingTask ? (existingTask?.editCount || 0) + 1 : 0,
      };

      savePlannedTask(plannedTask);
      setSavedTasks(validTasks);
      setShowSavedTasks(true);
      setIsEditing(false);
      setTasks(['']);
      setMessage({ type: 'success', text: `Tasks ${existingTask ? 'updated' : 'saved'} successfully!` });
      
      // Clear message after 4 seconds
      setTimeout(() => setMessage(null), 4000);
    } catch (error) {
      console.error('Error saving tasks:', error);
      setMessage({ type: 'error', text: 'Failed to save tasks. Please try again.' });
    } finally {
      setIsSubmitting(false);
    }
  };

  const shouldShowForm = !showSavedTasks || isEditing;

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">Plan Your Tasks</h1>
        <p className="mt-2 text-gray-600 flex items-center">
          <Calendar className="h-4 w-4 mr-2" />
          Plan your tasks for today ({new Date().toLocaleDateString()})
        </p>
      </div>

      {/* Edit Count Warning */}
      {editCount >= 1 && <div className="mb-6 p-4 bg-blue-50 rounded-lg border border-blue-200 transition-all duration-300">
        <div className="flex items-center">
          <AlertCircle className="h-5 w-5 text-blue-600 mr-2" />
          <div>
            <p className="text-sm font-medium text-blue-800">
              Edit Count: {editCount}/3
            </p>
            <p className="text-xs text-blue-600">
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

      {/* Saved Tasks Display */}
      {showSavedTasks && !isEditing && (
        <div className="mb-8 bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden transition-all duration-500 transform scale-100 opacity-100">
          <div className="p-6 bg-gradient-to-r from-green-50 to-emerald-50 border-b border-gray-200">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <div className="p-2 bg-green-100 rounded-lg">
                  <CheckCircle className="h-5 w-5 text-green-600" />
                </div>
                <div>
                  <h2 className="text-lg font-semibold text-gray-900">Today's Planned Tasks</h2>
                  <p className="text-sm text-gray-600 flex items-center">
                    <Clock className="h-3 w-3 mr-1" />
                    {savedTasks.length} task{savedTasks.length !== 1 ? 's' : ''} planned
                  </p>
                </div>
              </div>
              {canEditToday && (
                <button
                  onClick={handleEdit}
                  className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-lg text-blue-700 bg-blue-100 hover:bg-blue-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-all duration-200 transform hover:scale-105"
                >
                  <Edit2 className="h-4 w-4 mr-2" />
                  Edit Tasks
                </button>
              )}
            </div>
          </div>
          
          <div className="p-6">
            <div className="space-y-3">
              {savedTasks.map((task, index) => (
                <div 
                  key={index}
                  className="flex items-center space-x-3 p-3 bg-gray-50 rounded-lg transition-all duration-300 transform hover:scale-102 hover:shadow-sm"
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
        </div>
      )}

      {/* Task Planning Form */}
      {shouldShowForm && (
        <div 
          id="task-form"
          className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 transition-all duration-500 transform scale-100 opacity-100"
        >
          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <div className="flex items-center justify-between mb-4">
                <label className="block text-sm font-medium text-gray-700">
                  {isEditing ? 'Edit Your Tasks' : "Today's Planned Tasks"}
                </label>
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
              
              <div className="space-y-4">
                {tasks.map((task, index) => (
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
                        onChange={(e) => updateTask(index, e.target.value)}
                        placeholder={`Task ${index + 1}...`}
                        className="block w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        disabled={!canEditToday}
                        autoFocus={index === 0 && isEditing}
                      />
                    </div>
                    
                    {tasks.length > 1 && (
                      <button
                        type="button"
                        onClick={() => removeTask(index)}
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
                onClick={addTask}
                className="mt-4 inline-flex items-center px-4 py-2 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 transform hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed"
                disabled={!canEditToday}
              >
                <Plus className="h-4 w-4 mr-2" />
                Add Another Task
              </button>
            </div>

            <div className="flex items-center justify-between pt-6 border-t border-gray-200">
              <p className="text-sm text-gray-500 flex items-center">
                <Calendar className="h-4 w-4 mr-1" />
                Tasks will be saved for {new Date().toLocaleDateString()}
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
                    Saving...
                  </>
                ) : (
                  `${isEditing ? 'Update' : 'Save'} Tasks`
                )}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* <style jsx>{`
        @keyframes slideInFromLeft {
          from {
            opacity: 0;
            transform: translateX(-20px);
          }
          to {
            opacity: 1;
            transform: translateX(0);
          }
        }

        @keyframes fadeInUp {
          from {
            opacity: 0;
            transform: translateY(20px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }

        .hover\:scale-102:hover {
          transform: scale(1.02);
        }

        .hover\:scale-105:hover {
          transform: scale(1.05);
        }

        .hover:scale-110:hover {
          transform: scale(1.1);
        }
      `}</style> */}
    </div>
  );
};