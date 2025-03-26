import React, { useState, useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import { X, Edit2, Trash2, UserPlus, Check, Calendar } from "lucide-react";
import { AppDispatch, RootState } from "../store";
import { 
  createEvent,
  updateEvent,
  deleteEvent,
  addEventParticipant,
  updateEventParticipant,
  removeEventParticipant
} from "../actions/eventActions";
import {
  Event,
  CreateEventPayload,
  UpdateEventPayload,
  EventType,
  EventCategory,
  TaskPriority,
  ResponseStatus
} from "../types/eventTypes";
import Alert from "./Alert";

interface EventModalProps {
  isOpen: boolean;
  onClose: () => void;
  mode: 'create' | 'view' | 'edit';
  selectedDate?: Date;
  selectedEvent?: Event;
  selectedCalendarId?: number;
}

const EventModal: React.FC<EventModalProps> = ({
  isOpen,
  onClose,
  mode,
  selectedDate,
  selectedEvent,
  selectedCalendarId
}) => {
  const dispatch: AppDispatch = useDispatch();
  const { calendars } = useSelector((state: RootState) => state.calendar);
  const authUser = useSelector((state: RootState) => state.auth.user);
  
  const [alertMessage, setAlertMessage] = useState<string | null>(null);
  const [isViewMode, setIsViewMode] = useState(mode === 'view');
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [newParticipantEmail, setNewParticipantEmail] = useState("");
  
  // Form state
  const [eventName, setEventName] = useState("");
  const [eventDescription, setEventDescription] = useState("");
  const [eventCategory, setEventCategory] = useState<EventCategory>(EventCategory.HOME);
  const [eventType, setEventType] = useState<EventType>(EventType.REMINDER);
  const [eventStartDate, setEventStartDate] = useState("");
  const [eventEndDate, setEventEndDate] = useState("");
  const [eventCalendarId, setEventCalendarId] = useState<number | undefined>(selectedCalendarId);
  const [eventColor, setEventColor] = useState("#4CAF50");
  const [taskPriority, setTaskPriority] = useState<TaskPriority>(TaskPriority.MEDIUM);
  const [isTaskCompleted, setIsTaskCompleted] = useState(false);
  
  // Initialize form values when the modal opens or the selected event changes
  useEffect(() => {
    if (mode === 'create' && selectedDate) {
      // Create mode with selected date
      const startDate = new Date(selectedDate);
      // Round to nearest half hour
      startDate.setMinutes(Math.ceil(startDate.getMinutes() / 30) * 30, 0, 0);
      
      const endDate = new Date(startDate);
      endDate.setMinutes(endDate.getMinutes() + 30);
      
      setEventStartDate(formatDateTimeForInput(startDate));
      setEventEndDate(formatDateTimeForInput(endDate));
      setEventCalendarId(selectedCalendarId);
    } else if (selectedEvent) {
      // Edit or view mode with selected event
      setEventName(selectedEvent.name);
      setEventDescription(selectedEvent.description || "");
      setEventCategory(selectedEvent.category);
      setEventType(selectedEvent.type);
      setEventStartDate(formatDateTimeForInput(new Date(selectedEvent.startedAt)));
      setEventEndDate(formatDateTimeForInput(new Date(selectedEvent.endedAt)));
      
      // Find event calendar
      const participation = selectedEvent.participations.find(
        p => p.calendarMember.userId === authUser?.id
      );
      if (participation) {
        setEventCalendarId(participation.calendarMember.calendarId);
        setEventColor(participation.color);
      }
      
      // Task specific information
      if (selectedEvent.type === EventType.TASK && selectedEvent.task) {
        setTaskPriority(selectedEvent.task.priority);
        setIsTaskCompleted(selectedEvent.task.isCompleted);
      }
    }
    
    setIsViewMode(mode === 'view');
  }, [mode, selectedDate, selectedEvent, selectedCalendarId, authUser?.id]);
  
  // Helper functions
  const formatDateTimeForInput = (date: Date): string => {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    const hours = String(date.getHours()).padStart(2, '0');
    const minutes = String(date.getMinutes()).padStart(2, '0');
    
    return `${year}-${month}-${day}T${hours}:${minutes}`;
  };
  
  // Event handlers
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      if (mode === 'create') {
        // Create new event
        if (!eventCalendarId) {
          setAlertMessage("Please select a calendar");
          return;
        }
        
        const eventData: CreateEventPayload = {
          name: eventName,
          description: eventDescription,
          category: eventCategory,
          startedAt: new Date(eventStartDate).toISOString(),
          endedAt: new Date(eventEndDate).toISOString(),
          type: eventType,
          calendarId: eventCalendarId,
          color: eventColor
        };
        
        // Add task priority if the event is a task
        if (eventType === EventType.TASK) {
          eventData.priority = taskPriority;
        }
        
        await dispatch(createEvent(eventData));
        setAlertMessage("Event created successfully");
        
        // Close the modal after a short delay
        setTimeout(() => {
          onClose();
          setAlertMessage(null);
        }, 1500);
      } else if (selectedEvent) {
        // Update existing event
        const eventData: UpdateEventPayload = {
          name: eventName,
          description: eventDescription,
          category: eventCategory,
          startedAt: new Date(eventStartDate).toISOString(),
          endedAt: new Date(eventEndDate).toISOString()
        };
        
        // Add task specific fields if the event is a task
        if (selectedEvent.type === EventType.TASK) {
          eventData.priority = taskPriority;
          eventData.isCompleted = isTaskCompleted;
        }
        
        await dispatch(updateEvent(selectedEvent.id, eventData));
        setAlertMessage("Event updated successfully");
        
        // Close the modal after a short delay
        setTimeout(() => {
          onClose();
          setAlertMessage(null);
        }, 1500);
      }
    } catch (error: any) {
      setAlertMessage(error.message || "Failed to save event");
    }
  };
  
  const handleDelete = async () => {
    if (!selectedEvent) return;
    
    try {
      await dispatch(deleteEvent(selectedEvent.id));
      setAlertMessage("Event deleted successfully");
      
      // Close the modals after a short delay
      setTimeout(() => {
        setIsDeleteModalOpen(false);
        onClose();
        setAlertMessage(null);
      }, 1500);
    } catch (error: any) {
      setAlertMessage(error.message || "Failed to delete event");
    }
  };
  
  const handleAddParticipant = async () => {
    if (!selectedEvent || !eventCalendarId) return;
    
    try {
      await dispatch(addEventParticipant(selectedEvent.id, eventCalendarId, newParticipantEmail));
      setAlertMessage("Participant added successfully");
      setNewParticipantEmail("");
    } catch (error: any) {
      setAlertMessage(error.message || "Failed to add participant");
    }
  };
  
  const handleUpdateParticipantStatus = async (calendarMemberId: number, status: ResponseStatus) => {
    if (!selectedEvent) return;
    
    try {
      await dispatch(updateEventParticipant(selectedEvent.id, calendarMemberId, { responseStatus: status }));
      setAlertMessage("Response updated successfully");
    } catch (error: any) {
      setAlertMessage(error.message || "Failed to update response");
    }
  };
  
  const handleRemoveParticipant = async (calendarMemberId: number) => {
    if (!selectedEvent) return;
    
    try {
      await dispatch(removeEventParticipant(selectedEvent.id, calendarMemberId));
      setAlertMessage("Participant removed successfully");
    } catch (error: any) {
      setAlertMessage(error.message || "Failed to remove participant");
    }
  };
  
  // UI helper function
  const getStatusBadgeColor = (status: ResponseStatus) => {
    switch (status) {
      case ResponseStatus.ACCEPTED:
        return "bg-green-100 text-green-800";
      case ResponseStatus.DECLINED:
        return "bg-red-100 text-red-800";
      case ResponseStatus.PENDING:
        return "bg-yellow-100 text-yellow-800";
      case ResponseStatus.INVITED:
        return "bg-blue-100 text-blue-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };
  
  if (!isOpen) return null;
  
  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-3xl overflow-hidden">
        {/* Header with title and close button */}
        <div className="bg-indigo-600 text-white px-6 py-4 flex justify-between items-center">
          <h2 className="text-xl font-bold">
            {mode === 'create' ? 'Create New Event' : 
             isViewMode ? 'Event Details' : 'Edit Event'}
          </h2>
          <div className="flex items-center space-x-2">
            {selectedEvent && (
              <>
                {isViewMode ? (
                  <button 
                    onClick={() => setIsViewMode(false)}
                    className="p-2 rounded-full hover:bg-indigo-700 transition-colors"
                    title="Edit Event"
                  >
                    <Edit2 size={18} />
                  </button>
                ) : (
                  <button 
                    onClick={() => setIsViewMode(true)}
                    className="p-2 rounded-full hover:bg-indigo-700 transition-colors"
                    title="View Event"
                  >
                    <Calendar size={18} />
                  </button>
                )}
                <button 
                  onClick={() => setIsDeleteModalOpen(true)}
                  className="p-2 rounded-full hover:bg-indigo-700 transition-colors"
                  title="Delete Event"
                >
                  <Trash2 size={18} />
                </button>
              </>
            )}
            <button 
              onClick={onClose}
              className="p-2 rounded-full hover:bg-indigo-700 transition-colors"
              title="Close"
            >
              <X size={18} />
            </button>
          </div>
        </div>
        
        <div className="p-6">
          <form onSubmit={handleSubmit}>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Title
                </label>
                <input
                  type="text"
                  value={eventName}
                  onChange={(e) => setEventName(e.target.value)}
                  disabled={isViewMode}
                  className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 disabled:bg-gray-100 disabled:text-gray-700"
                  placeholder="Event title"
                  required
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Start Date & Time
                </label>
                <input
                  type="datetime-local"
                  value={eventStartDate}
                  onChange={(e) => setEventStartDate(e.target.value)}
                  disabled={isViewMode}
                  className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 disabled:bg-gray-100 disabled:text-gray-700"
                  required
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  End Date & Time
                </label>
                <input
                  type="datetime-local"
                  value={eventEndDate}
                  onChange={(e) => setEventEndDate(e.target.value)}
                  disabled={isViewMode}
                  className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 disabled:bg-gray-100 disabled:text-gray-700"
                  required
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Event Type
                </label>
                <select
                  value={eventType}
                  onChange={(e) => setEventType(e.target.value as EventType)}
                  disabled={isViewMode || (mode !== 'create' && selectedEvent)}
                  className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 disabled:bg-gray-100 disabled:text-gray-700"
                >
                  <option value={EventType.REMINDER}>Reminder</option>
                  <option value={EventType.TASK}>Task</option>
                  <option value={EventType.ARRANGEMENT}>Arrangement</option>
                </select>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Category
                </label>
                <select
                  value={eventCategory}
                  onChange={(e) => setEventCategory(e.target.value as EventCategory)}
                  disabled={isViewMode}
                  className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 disabled:bg-gray-100 disabled:text-gray-700"
                >
                  <option value={EventCategory.HOME}>Home</option>
                  <option value={EventCategory.WORK}>Work</option>
                </select>
              </div>
              
              {mode === 'create' && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Calendar
                  </label>
                  <select
                    value={eventCalendarId || ""}
                    onChange={(e) => setEventCalendarId(Number(e.target.value))}
                    disabled={isViewMode}
                    className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 disabled:bg-gray-100 disabled:text-gray-700"
                    required
                  >
                    <option value="">Select a calendar</option>
                    {calendars.map((cal) => (
                      <option key={cal.id} value={cal.id}>
                        {cal.calendar?.name || "Untitled"}
                      </option>
                    ))}
                  </select>
                </div>
              )}
              
              {(eventType === EventType.TASK || (selectedEvent?.type === EventType.TASK)) && (
                <>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Priority
                    </label>
                    <select
                      value={taskPriority}
                      onChange={(e) => setTaskPriority(e.target.value as TaskPriority)}
                      disabled={isViewMode}
                      className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 disabled:bg-gray-100 disabled:text-gray-700"
                    >
                      <option value={TaskPriority.LOW}>Low</option>
                      <option value={TaskPriority.MEDIUM}>Medium</option>
                      <option value={TaskPriority.HIGH}>High</option>
                    </select>
                  </div>
                  
                  <div className="flex items-center">
                    <label className="inline-flex items-center mt-3">
                      <input
                        type="checkbox"
                        checked={isTaskCompleted}
                        onChange={(e) => setIsTaskCompleted(e.target.checked)}
                        disabled={isViewMode}
                        className="form-checkbox h-5 w-5 text-indigo-600 transition duration-150 ease-in-out"
                      />
                      <span className="ml-2 text-sm text-gray-700">Mark as completed</span>
                    </label>
                  </div>
                </>
              )}
              
              {mode === 'create' && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Color
                  </label>
                  <div className="flex items-center">
                    <input
                      type="color"
                      value={eventColor}
                      onChange={(e) => setEventColor(e.target.value)}
                      disabled={isViewMode}
                      className="h-10 w-10 border-0 p-0 rounded mr-2"
                    />
                    <div className="text-xs text-gray-500">
                      Choose a color for this event
                    </div>
                  </div>
                </div>
              )}
              
              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Description
                </label>
                <textarea
                  value={eventDescription}
                  onChange={(e) => setEventDescription(e.target.value)}
                  disabled={isViewMode}
                  className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 disabled:bg-gray-100 disabled:text-gray-700"
                  rows={3}
                  placeholder="Add a description (optional)"
                ></textarea>
              </div>
            </div>
            
            {/* Participants section for arrangement events */}
            {(eventType === EventType.ARRANGEMENT || selectedEvent?.type === EventType.ARRANGEMENT) && selectedEvent && (
              <div className="mt-6 border-t pt-6">
                <h3 className="text-lg font-medium text-gray-900 mb-3">Participants</h3>
                
                {/* Add new participant */}
                <div className="flex flex-col md:flex-row md:items-center md:space-x-3 mb-4">
                  <div className="flex-1 mb-2 md:mb-0">
                    <input
                      type="email"
                      value={newParticipantEmail}
                      onChange={(e) => setNewParticipantEmail(e.target.value)}
                      disabled={isViewMode}
                      className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 disabled:bg-gray-100 disabled:text-gray-700"
                      placeholder="Add participant by email"
                    />
                  </div>
                  <button
                    type="button"
                    onClick={handleAddParticipant}
                    disabled={isViewMode || !newParticipantEmail}
                    className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:bg-gray-300 disabled:cursor-not-allowed"
                  >
                    <UserPlus size={16} className="mr-2" />
                    Add
                  </button>
                </div>
                
                {/* Participants list */}
                <div className="mt-3 max-h-60 overflow-y-auto">
                  {selectedEvent.participations.length > 0 ? (
                    <ul className="divide-y divide-gray-200 border rounded-md">
                      {selectedEvent.participations.map((participation) => (
                        <li key={participation.id} className="flex items-center py-3 px-4 hover:bg-gray-50">
                          <img
                            src={`http://localhost:3000/uploads/avatars/${participation.calendarMember.user.profilePictureName}`}
                            alt={`${participation.calendarMember.user.firstName} ${participation.calendarMember.user.lastName}`}
                            className="h-10 w-10 rounded-full object-cover"
                          />
                          <div className="ml-3 flex-1">
                            <p className="text-sm font-medium text-gray-900">
                              {participation.calendarMember.user.firstName} {participation.calendarMember.user.lastName}
                            </p>
                            <p className="text-xs text-gray-500">{participation.calendarMember.user.email}</p>
                          </div>
                          <div className="ml-2 flex items-center">
                            <span className={`text-xs px-2 py-1 rounded-full ${getStatusBadgeColor(participation.responseStatus)}`}>
                              {participation.responseStatus}
                            </span>
                            
                            {/* Action buttons */}
                            {!isViewMode && authUser?.id === selectedEvent.creatorId && (
                              <button
                                type="button"
                                onClick={() => handleRemoveParticipant(participation.calendarMemberId)}
                                className="ml-2 p-1 text-gray-500 hover:text-red-600"
                              >
                                <Trash2 size={16} />
                              </button>
                            )}
                            
                            {/* Response buttons for the current user */}
                            {authUser?.id === participation.calendarMember.userId && !isViewMode && (
                              <div className="ml-2 flex space-x-1">
                                <button
                                  type="button"
                                  onClick={() => handleUpdateParticipantStatus(participation.calendarMemberId, ResponseStatus.ACCEPTED)}
                                  className={`p-1 rounded ${
                                    participation.responseStatus === ResponseStatus.ACCEPTED
                                      ? 'bg-green-100 text-green-700'
                                      : 'text-gray-500 hover:text-green-600'
                                  }`}
                                  title="Accept"
                                >
                                  <Check size={16} />
                                </button>
                                <button
                                  type="button"
                                  onClick={() => handleUpdateParticipantStatus(participation.calendarMemberId, ResponseStatus.DECLINED)}
                                  className={`p-1 rounded ${
                                    participation.responseStatus === ResponseStatus.DECLINED
                                      ? 'bg-red-100 text-red-700'
                                      : 'text-gray-500 hover:text-red-600'
                                  }`}
                                  title="Decline"
                                >
                                  <X size={16} />
                                </button>
                              </div>
                            )}
                          </div>
                        </li>
                      ))}
                    </ul>
                  ) : (
                    <p className="text-sm text-gray-500 italic">No participants yet</p>
                  )}
                </div>
              </div>
            )}
            
            {/* Action buttons */}
            {!isViewMode && (
              <div className="flex justify-end mt-6 space-x-3 pt-4 border-t">
                <button
                  type="button"
                  onClick={onClose}
                  className="px-4 py-2 border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 transition-colors"
                >
                  {mode === 'create' ? 'Create Event' : 'Save Changes'}
                </button>
              </div>
            )}
          </form>
        </div>
      </div>
      
      {/* Delete confirmation modal */}
      {isDeleteModalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-[60] p-4">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-md p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-3">Confirm Deletion</h3>
            <p className="text-gray-600 mb-6">
              Are you sure you want to delete this event? This action cannot be undone.
            </p>
            <div className="flex justify-end space-x-3">
              <button
                type="button"
                onClick={() => setIsDeleteModalOpen(false)}
                className="px-4 py-2 border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50 transition-colors"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleDelete}
                className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 transition-colors"
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}
      
      {/* Alert for notifications */}
      {alertMessage && (
        <Alert message={alertMessage} onClose={() => setAlertMessage(null)} />
      )}
    </div>
  );
};

export default EventModal;
