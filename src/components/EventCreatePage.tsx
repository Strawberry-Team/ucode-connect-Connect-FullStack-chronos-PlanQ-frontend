import React, { useState, useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import { useNavigate } from "react-router-dom";
import {
  format,
  parseISO,
} from "date-fns";
import { 
  createEvent, 
  getCalendarEvents,
} from "../actions/eventActions";
import eventService from "../services/eventService";
import { AppDispatch, RootState } from "../store";
import { 
  EventCategory, 
  EventType, 
  TaskPriority,
  CreateEventPayload,
} from "../types/eventTypes";
import { 
  Check, 
  UserPlus, 
  X, 
  Calendar, 
  CheckSquare, 
  Clock,
  ChevronRight,
  ChevronLeft,
  Plus
} from "lucide-react";
import { CalendarData } from "./CustomCalendar";
import { getUserCalendars } from "../actions/calendarActions";
// Add these utility functions
/**
 * Converts a local date to UTC for sending to the server
 */
const localToUTC = (date: Date): string => {
  return date.toISOString();
};

/**
 * Formats a UTC date string for datetime-local input
 */
function formatDateForInput(dateString: string): string {
  if (!dateString) return "";
  const date = new Date(dateString);
  
  // Format to local datetime string in the format YYYY-MM-DDThh:mm
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  const hours = String(date.getHours()).padStart(2, '0');
  const minutes = String(date.getMinutes()).padStart(2, '0');
  
  return `${year}-${month}-${day}T${hours}:${minutes}`;
}

// Predefined colors for the color picker
const predefinedColors = [
  "#4285F4", "#DB4437", "#F4B400", "#0F9D58", 
  "#AB47BC", "#00ACC1", "#FF7043", "#9E9D24",
  "#5C6BC0", "#26A69A", "#EC407A", "#FFA726",
];

const EventCreatePage: React.FC = () => {
  const dispatch: AppDispatch = useDispatch();
  const navigate = useNavigate();
  const authUser = useSelector((state: RootState) => state.auth.user);
  const { calendars = [] } = useSelector((state: RootState) => state.calendar || {});
  
  // Form data state
  const [formParticipants, setFormParticipants] = useState<{email: string, id?: number}[]>([]);
  const [newParticipantEmail, setNewParticipantEmail] = useState("");
  const [isSearchingUser, setIsSearchingUser] = useState(false);
  
  // Initialize event form data
  const [eventFormData, setEventFormData] = useState<{
    name: string;
    description: string;
    category: EventCategory;
    startedAt: string;
    endedAt: string;
    color: string;
    type: EventType;
    calendarId: number;
    priority?: TaskPriority;
  }>({
    name: "",
    description: "",
    category: EventCategory.HOME,
    startedAt: "",
    endedAt: "",
    color: "#4CAF50",
    type: EventType.TASK,
    calendarId: 0,
  });

  // Initialize with default calendar and current time
  useEffect(() => {
    console.log("Calendars loaded:", calendars); // Add this debug log
    
    if (calendars && calendars.length > 0) {
      // Find default calendar (non-holiday)
      const defaultCalendar = calendars.find(cal => cal.calendarType !== "holiday") || calendars[0];
      console.log("Default calendar selected:", defaultCalendar); // Add this debug log
      
      // Set current time for start and 30min later for end
      const now = new Date();
      const later = new Date(now);
      later.setMinutes(now.getMinutes() + 30);
      
      // Handle both direct and nested structures
      const calendarId = defaultCalendar.calendarId || 
                        (defaultCalendar.calendar && defaultCalendar.calendar.id) || 
                        0;
      
      const calendarColor = defaultCalendar.color || 
                            (defaultCalendar.calendar && defaultCalendar.calendar.color) || 
                            "#4CAF50";
      
      setEventFormData({
        ...eventFormData,
        startedAt: now.toISOString(),
        endedAt: later.toISOString(),
        color: calendarColor,
        calendarId: calendarId,
      });
      
      // Mark calendars as loaded
      setCalendarsLoading(false);
    } else if (calendars && calendars.length === 0) {
      // If we have an empty array, it means calendars have been loaded but user has none
      console.log("No calendars found"); // Add this debug log
      setCalendarsLoading(false);
    }
  }, [calendars]);


  useEffect(() => {
    console.log("EventCreatePage mounted, authUser:", authUser?.id);
    console.log("Initial calendars state:", calendars);
    
    if (authUser && authUser.id) {
      console.log("Dispatching getUserCalendars for user:", authUser.id);
      dispatch(getUserCalendars(String(authUser.id)));
    }
  }, [authUser, dispatch]);

  // Add a loading state for calendars
const [calendarsLoading, setCalendarsLoading] = useState(true);
  // Function to search users by email
  const searchUserByEmail = async (email: string) => {
    if (!email.trim()) return null;
    
    setIsSearchingUser(true);
    try {
      const users = await eventService.findUserByEmail(email);
      if (!users || users.length === 0) {
        return null;
      }
      return users;
    } catch (error) {
      console.error("Error finding user:", error);
      return null;
    } finally {
      setIsSearchingUser(false);
    }
  };

  // Function to add participant to form
  const addFormParticipant = async () => {
    if (!newParticipantEmail.trim()) return;
    
    // Check if this email is already in the list
    if (formParticipants.some(p => p.email === newParticipantEmail.trim())) {
      alert("This email is already added to participants");
      return;
    }
    
    // Search for the user
    const user = await searchUserByEmail(newParticipantEmail);
    if (!user) {
      alert("No user found with this email");
      return;
    }
    
    // Add to participants list
    setFormParticipants([...formParticipants, {
      email: newParticipantEmail,
      id: user.id
    }]);
    
    // Clear the input
    setNewParticipantEmail("");
  };

  // Function to remove participant from form
  const removeFormParticipant = (email: string) => {
    setFormParticipants(formParticipants.filter(p => p.email !== email));
  };

  // Function to handle form submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      // Create event payload
      const createPayload: CreateEventPayload = {
        name: eventFormData.name,
        description: eventFormData.description,
        category: eventFormData.category,
        startedAt: localToUTC(new Date(eventFormData.startedAt)),
        endedAt: localToUTC(new Date(eventFormData.endedAt)),
        color: eventFormData.color || 
              calendars.find(cal => cal.id === String(eventFormData.calendarId))?.color || 
              "#4CAF50",
        type: eventFormData.type,
        calendarId: eventFormData.calendarId
      };
      
      // Add priority for task type
      if (eventFormData.type === EventType.TASK && eventFormData.priority) {
        createPayload.priority = eventFormData.priority;
      }
      
      // Add participant IDs for arrangement type
      if (eventFormData.type === EventType.ARRANGEMENT && formParticipants.length > 0) {
        createPayload.participantIds = formParticipants
          .map(p => p.id)
          .filter(Boolean) as number[];
      }
      
      // Create event
      const newEvent = await dispatch(createEvent(createPayload));
      console.log("New event created:", newEvent);
      
      // Refresh calendar events
      if (authUser?.id) {
        await dispatch(getCalendarEvents(eventFormData.calendarId, authUser.id));
      }
      
      // Navigate back to calendar
      navigate("/");
    } catch (error) {
      console.error("Error creating event:", error);
    }
  };

  // Find selected calendar
  const selectedCalendar = eventFormData.calendarId ? 
  calendars.find(cal => 
    (cal.calendarId === eventFormData.calendarId) || 
    (cal.calendar && cal.calendar.id === eventFormData.calendarId)
  ) : 
  null;
  
  // Get event type styling
  let typeIcon;
  let typeColor;
  let typeBgColor;
  let typeLabel;
  
  switch(eventFormData.type) {
    case EventType.ARRANGEMENT:
      typeIcon = <Calendar className="h-5 w-5" />;
      typeColor = "text-indigo-600";
      typeBgColor = "bg-indigo-50";
      typeLabel = "Meeting";
      break;
    case EventType.TASK:
      typeIcon = <CheckSquare className="h-5 w-5" />;
      typeColor = "text-emerald-600";
      typeBgColor = "bg-emerald-50";
      typeLabel = "Task";
      break;
    case EventType.REMINDER:
      typeIcon = <Clock className="h-5 w-5" />;
      typeColor = "text-amber-600";
      typeBgColor = "bg-amber-50";
      typeLabel = "Reminder";
      break;
    default:
      typeIcon = <Clock className="h-5 w-5" />;
      typeColor = "text-amber-600";
      typeBgColor = "bg-amber-50";
      typeLabel = "New Event";
  }

  return (
    <div className="min-h-screen bg-gray-100 py-8">
      <div className="max-w-3xl mx-auto">
        {/* Header with back button */}
        <div className="mb-6 flex items-center justify-between">
          <button 
            onClick={() => navigate("/")}
            className="flex items-center text-gray-600 hover:text-gray-900"
          >
            <ChevronLeft size={20} className="mr-1" />
            Back to Calendar
          </button>
          
          <div className="w-10"></div> {/* Empty div for centering */}
        </div>
        
        {/* Event creation form */}
        <div className="bg-white rounded-lg shadow-xl overflow-hidden">
          <form onSubmit={handleSubmit}>
            {/* Header with gradient background */}
            <div 
              className="px-6 py-5 relative overflow-hidden"
              style={{ 
                backgroundColor: eventFormData.color,
                color: '#fff'
              }}
            >
              {/* Decorative circles in background */}
              <div className="absolute -right-12 -top-10 w-32 h-32 rounded-full bg-white opacity-10"></div>
              <div className="absolute -right-5 -bottom-20 w-40 h-40 rounded-full bg-white opacity-5"></div>
              
              <div className="relative z-10">
                {/* Event type badge */}
                <div className="flex items-center gap-2 mb-4">
                  <span className={`px-2.5 py-1 text-sm font-medium rounded-full ${typeBgColor} ${typeColor}`}>
                    {typeLabel}
                  </span>
                  
                  {selectedCalendar && (
                    <span className="flex items-center space-x-1 text-xs text-white/70">
                      <span className="w-2 h-2 rounded-full bg-white inline-block"></span>
                      <span>{selectedCalendar.title || "Calendar"}</span>
                    </span>
                  )}
                </div>
                
                {/* Title field */}
                <input
                  type="text"
                  value={eventFormData.name}
                  onChange={(e) => setEventFormData({ ...eventFormData, name: e.target.value })}
                  className="bg-transparent border-b border-white/30 text-white text-xl font-bold w-full focus:outline-none focus:border-white placeholder-white/50 pb-1 mb-3"
                  placeholder="Add title"
                  required
                  autoFocus
                />
              </div>
            </div>
            
            {/* Main form content */}
            <div className="p-6">
              <div className="space-y-6">
                {/* Date and time section */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label className="block text-sm font-medium text-gray-700">
                      Start Date & Time
                    </label>
                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                        <Clock size={16} className="text-gray-400" />
                      </div>
                      <input
                        type="datetime-local"
                        value={eventFormData.startedAt ? formatDateForInput(eventFormData.startedAt) : ""}
                        onChange={(e) => {
                          if (e.target.value) {
                            setEventFormData({ 
                              ...eventFormData, 
                              startedAt: new Date(e.target.value).toISOString()
                            });
                          }
                        }}
                        className="pl-10 w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                        required
                      />
                    </div>
                  </div>
                  
                  <div className="space-y-2">
                    <label className="block text-sm font-medium text-gray-700">
                      End Date & Time
                    </label>
                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                        <Clock size={16} className="text-gray-400" />
                      </div>
                      <input
                        type="datetime-local"
                        value={eventFormData.endedAt ? formatDateForInput(eventFormData.endedAt) : ""}
                        onChange={(e) => {
                          if (e.target.value) {
                            setEventFormData({ 
                              ...eventFormData, 
                              endedAt: new Date(e.target.value).toISOString()
                            });
                          }
                        }}
                        className="pl-10 w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                        required
                      />
                    </div>
                  </div>
                </div>
                
                {/* Description */}
                <div className="space-y-2">
                  <label className="block text-sm font-medium text-gray-700">
                    Description
                  </label>
                  <textarea
                    value={eventFormData.description}
                    onChange={(e) => setEventFormData({ ...eventFormData, description: e.target.value })}
                    className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                    rows={3}
                    placeholder="Add a description (optional)"
                  />
                </div>
                
                {/* Category & Type */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label className="block text-sm font-medium text-gray-700">
                      Category
                    </label>
                    <div className="relative">
                      <select
                        value={eventFormData.category}
                        onChange={(e) => setEventFormData({ 
                          ...eventFormData, 
                          category: e.target.value as EventCategory 
                        })}
                        className="w-full border border-gray-300 rounded-md px-3 py-2 pl-10 pr-10 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 appearance-none"
                      >
                        <option value={EventCategory.HOME}>Home</option>
                        <option value={EventCategory.WORK}>Work</option>
                      </select>
                      <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                        {eventFormData.category === EventCategory.HOME ? (
                          <span className="text-gray-500">🏠</span>
                        ) : (
                          <span className="text-gray-500">💼</span>
                        )}
                      </div>
                      <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
                        <ChevronRight size={16} className="text-gray-400" />
                      </div>
                    </div>
                  </div>
                  
                  <div className="space-y-2">
                    <label className="block text-sm font-medium text-gray-700">
                      Event Type
                    </label>
                    <div className="relative">
                      <select
                        value={eventFormData.type}
                        onChange={(e) => setEventFormData({ 
                          ...eventFormData, 
                          type: e.target.value as EventType 
                        })}
                        className="w-full border border-gray-300 rounded-md px-3 py-2 pl-10 pr-10 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 appearance-none"
                      >
                        <option value={EventType.TASK}>Task</option>
                        <option value={EventType.REMINDER}>Reminder</option>
                        <option value={EventType.ARRANGEMENT}>Arrangement</option>
                      </select>
                      <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                        {eventFormData.type === EventType.TASK ? (
                          <CheckSquare size={16} className="text-gray-500" />
                        ) : eventFormData.type === EventType.ARRANGEMENT ? (
                          <Calendar size={16} className="text-gray-500" />
                        ) : (
                          <Clock size={16} className="text-gray-500" />
                        )}
                      </div>
                      <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
                        <ChevronRight size={16} className="text-gray-400" />
                      </div>
                    </div>
                  </div>
                </div>
                
                {/* Participants section - only show for arrangement type */}
                {(eventFormData.type === EventType.ARRANGEMENT) && (
                  <div className="border-t pt-4 mt-4">
                    <div className="flex items-center justify-between mb-3">
                      <h3 className="text-sm font-medium text-gray-700">Participants</h3>
                      <div className="text-xs text-gray-500">{formParticipants.length} people</div>
                    </div>
                    
                    {/* Add participant form */}
                    <div className="flex mb-4">
                      <div className="relative flex-1">
                        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                          <UserPlus size={16} className="text-gray-400" />
                        </div>
                        <input
                          type="email"
                          value={newParticipantEmail}
                          onChange={(e) => setNewParticipantEmail(e.target.value)}
                          placeholder="Enter email address"
                          className="pl-10 w-full border border-gray-300 rounded-l-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                        />
                      </div>
                      <button
                        type="button"
                        onClick={addFormParticipant}
                        disabled={isSearchingUser || !newParticipantEmail.trim()}
                        className="bg-indigo-600 text-white px-4 py-2 rounded-r-md hover:bg-indigo-700 transition-colors disabled:bg-indigo-400 flex items-center"
                      >
                        {isSearchingUser ? (
                          <span className="flex items-center">
                            <div className="animate-spin mr-2 h-4 w-4 border-2 border-white border-opacity-50 border-t-white rounded-full"></div>
                            Searching...
                          </span>
                        ) : (
                          "Add"
                        )}
                      </button>
                    </div>
                    
                    {/* Participants list */}
                    {formParticipants.length > 0 ? (
                      <div className="space-y-2 max-h-48 overflow-y-auto border border-gray-200 rounded-md p-2">
                        {formParticipants.map((participant, index) => (
                          <div key={index} className="flex items-center justify-between bg-gray-50 p-2 rounded hover:bg-gray-100">
                            <span className="text-sm text-gray-800">{participant.email}</span>
                            <button
                              type="button"
                              onClick={() => removeFormParticipant(participant.email)}
                              className="p-1 text-gray-400 hover:text-red-500 rounded-full hover:bg-gray-200"
                            >
                              <X size={16} />
                            </button>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="p-4 bg-gray-50 rounded-md text-center text-sm text-gray-500">
                        No participants added yet. Add participants by email above.
                      </div>
                    )}
                  </div>
                )}
                
                {/* Task-specific fields */}
                {eventFormData.type === EventType.TASK && (
                  <div className="space-y-2">
                    <label className="block text-sm font-medium text-gray-700">
                      Priority
                    </label>
                    <div className="flex space-x-2">
                      {Object.values(TaskPriority).map(priority => (
                        <button
                          key={priority}
                          type="button"
                            onClick={() => setEventFormData({ 
                              ...eventFormData, 
                              priority: priority
                            })}
                            className={`px-3 py-1.5 rounded-full text-sm flex items-center ${
                              eventFormData.priority === priority
                                ? priority === TaskPriority.LOW 
                                  ? 'bg-blue-100 text-blue-800 border-2 border-blue-400' 
                                  : priority === TaskPriority.MEDIUM 
                                    ? 'bg-yellow-100 text-yellow-800 border-2 border-yellow-400' 
                                    : 'bg-red-100 text-red-800 border-2 border-red-400'
                                : 'bg-gray-100 text-gray-700 border-2 border-transparent hover:bg-gray-200'
                            }`}
                          >
                            {priority === TaskPriority.LOW && <span className="mr-1">🔽</span>}
                            {priority === TaskPriority.MEDIUM && <span className="mr-1">⏺️</span>}
                            {priority === TaskPriority.HIGH && <span className="mr-1">🔼</span>}
                            
                            {priority.charAt(0).toUpperCase() + priority.slice(1)}
                          </button>
                        ))}
                      </div>
                    </div>
                  )}
                  
                {/* Calendar selection */}
                <div className="space-y-2">
  <label className="block text-sm font-medium text-gray-700">
    Calendar
  </label>
  <div className="relative">
    {calendarsLoading ? (
      <div className="w-full border border-gray-300 rounded-md px-3 py-2 pl-10 bg-gray-50 text-gray-500">
        Loading calendars...
      </div>
    ) : (!calendars || calendars.filter(cal => cal.calendarType !== "holiday").length === 0) ? (
      <div className="w-full border border-gray-300 rounded-md px-3 py-2 pl-10 bg-gray-50 text-red-500">
        No calendars available. Please create a calendar first.
      </div>
    ) : (
      <select
        value={eventFormData.calendarId || ""}
        onChange={(e) => {
          const selectedCalendarId = parseInt(e.target.value);
          // Find the calendar with this ID (either direct or nested)
          const selectedCalendarItem = calendars.find(cal => 
            (cal.calendarId === selectedCalendarId) || 
            (cal.calendar && cal.calendar.id === selectedCalendarId)
          );
          
          const calendarColor = selectedCalendarItem ? 
            selectedCalendarItem.color || 
            (selectedCalendarItem.calendar && selectedCalendarItem.calendar.color) || 
            eventFormData.color : 
            eventFormData.color;
            
          setEventFormData({ 
            ...eventFormData, 
            calendarId: selectedCalendarId,
            color: calendarColor
          });
        }}
        className="w-full border border-gray-300 rounded-md px-3 py-2 pl-10 pr-10 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 appearance-none"
      >
        {calendars
          .filter(cal => cal.calendarType !== "holiday")
          .map((cal) => {
            // Handle both direct and nested structures
            const id = cal.calendarId || (cal.calendar && cal.calendar.id);
            const name = (cal.calendar && cal.calendar.name) || "Untitled Calendar";
            
            return (
              <option key={id} value={id}>
                {name}
              </option>
            );
          })}
      </select>
    )}
    
    {/* Color indicator */}
    {!calendarsLoading && selectedCalendar && (
      <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
        <div 
          className="w-4 h-4 rounded-full" 
          style={{ backgroundColor: selectedCalendar.color || 
                                  (selectedCalendar.calendar && selectedCalendar.calendar.color) || 
                                  eventFormData.color }}
        ></div>
      </div>
    )}
    
    {!calendarsLoading && calendars && calendars.filter(cal => cal.calendarType !== "holiday").length > 0 && (
      <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
        <ChevronRight size={16} className="text-gray-400" />
      </div>
    )}
  </div>
</div>
                
                {/* Color picker */}
                <div className="space-y-2">
                  <label className="block text-sm font-medium text-gray-700">
                    Event Color
                  </label>
                  <div className="flex items-center">
                    <div className="flex items-center gap-2 flex-wrap mr-3">
                      {predefinedColors.slice(0, 7).map(color => (
                        <button
                          key={color}
                          type="button"
                          onClick={() => setEventFormData({ ...eventFormData, color })}
                          className={`w-7 h-7 rounded-full transition-all ${
                            eventFormData.color === color ? 'ring-2 ring-offset-2 ring-indigo-500' : ''
                          }`}
                          style={{ backgroundColor: color }}
                        />
                      ))}
                    </div>
                    <input
                      type="color"
                      value={eventFormData.color}
                      onChange={(e) => setEventFormData({ ...eventFormData, color: e.target.value })}
                      className="h-9 w-9 border-0 p-0 rounded mr-2"
                    />
                    <div className="text-xs text-gray-500 flex-1">
                      If not selected, it will be the same as in the calendar
                    </div>
                  </div>
                </div>
              </div>
              
              {/* Action buttons */}
              <div className="mt-8 flex justify-end space-x-3">
                <button
                  type="button"
                  onClick={() => navigate("/")}
                  className="px-4 py-2 bg-white border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50 transition-colors text-sm font-medium shadow-sm"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 transition-colors text-sm font-medium shadow-sm flex items-center"
                >
                  <Plus size={16} className="mr-1" />
                  Create Event
                </button>
              </div>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default EventCreatePage;