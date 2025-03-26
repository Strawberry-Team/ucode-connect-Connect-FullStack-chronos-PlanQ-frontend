import React, { useState, useEffect, useMemo } from "react";
import { useDispatch, useSelector } from "react-redux";
import {
  format,
  startOfMonth,
  endOfMonth,
  startOfWeek,
  endOfWeek,
  addDays,
  addMonths,
  subMonths,
  addWeeks,
  subWeeks,
  getWeek,
  parseISO,
  isSameDay,
} from "date-fns";
import { 
  createEvent, 
  updateEvent, 
  deleteEvent, 
  getEvent,
  getCalendarEvents,
  addEventParticipant,
  updateEventParticipant,
  removeEventParticipant
} from "../actions/eventActions";
import eventService  from "../services/eventService";
import { AppDispatch, RootState } from "../store";
import { 
  EventCategory, 
  EventType, 
  TaskPriority, 
  ResponseStatus,
  CreateEventPayload,
  UpdateEventPayload,
  Event
} from "../types/eventTypes";
import { 
  Check, 
  Edit2, 
  Trash2, 
  UserPlus, 
  AlertCircle, 
  X, 
  Calendar, 
  CheckSquare, 
  Clock,
  ChevronRight,
  Plus
} from "lucide-react";
import { useNavigate } from "react-router-dom";

export interface CalendarEvent {
  id: string;
  title: string;
  start: string;
  end?: string;
  description?: string;
  calendarId: string;
  type: "task" | "reminder" | "arrangement" | "holiday";
  color: string;
  category?: "home" | "work";
  priority?: "low" | "medium" | "high";
  isCompleted?: boolean;
  creatorId?: number;
  participations?: any[];
  deleted?: boolean; // Add this flag for deletion notifications
}

export interface CalendarData {
  id: string;
  title: string;
  description: string;
  isVisible: boolean;
  color: string;
  calendarType: string;
  events?: CalendarEvent[];
  creatorId?: string;
  role?: string;
}

interface CustomCalendarProps {
  events: CalendarEvent[];
  calendars: CalendarData[];
  onAddEvent: (event: CalendarEvent) => void;
}
const predefinedColors = [
  "#4285F4", "#DB4437", "#F4B400", "#0F9D58", 
  "#AB47BC", "#00ACC1", "#FF7043", "#9E9D24",
  "#5C6BC0", "#26A69A", "#EC407A", "#FFA726",
];
/*
  Function to calculate event positions
*/
const calculateEventPositions = (
  events: CalendarEvent[],
  startHour: number,
  hourHeight: number
) => {
  if (!events || events.length === 0) return [];

  const sortedEvents = events
    .slice()
    .sort((a, b) => {
      if (!a.start || !b.start) return 0;
      return new Date(a.start).getTime() - new Date(b.start).getTime();
    });

  const groups: CalendarEvent[][] = [];
  let currentGroup: CalendarEvent[] = [];

  sortedEvents.forEach((event) => {
    if (!event || !event.start) return;
    
    const eventStart = new Date(event.start);
const eventEnd = event.end
  ? new Date(event.end)
  : new Date(eventStart.getTime() + 30 * 60000);
    
    if (currentGroup.length === 0) {
      currentGroup.push(event);
    } else {
      const overlap = currentGroup.some((ev) => {
        if (!ev || !ev.start) return false;
        
        const evStart = new Date(ev.start).getTime();
        const evEnd = ev.end
          ? new Date(ev.end).getTime()
          : new Date(ev.start).getTime() + 30 * 60000;
        
        return eventStart < evEnd && eventEnd > evStart;
      });
      
      if (overlap) {
        currentGroup.push(event);
      } else {
        groups.push(currentGroup);
        currentGroup = [event];
      }
    }
  });
  
  if (currentGroup.length) {
    groups.push(currentGroup);
  }

  const layouts: { event: CalendarEvent; column: number; total: number }[] = [];
  
  groups.forEach((group) => {
    const columns: CalendarEvent[] = [];
    
    group.forEach((event) => {
      if (!event || !event.start) return;
      
      const eventStart = new Date(event.start).getTime();
      const eventEnd = event.end
        ? new Date(event.end).getTime()
        : new Date(event.start).getTime() + 30 * 60000;
      
      let placed = false;
      
      for (let i = 0; i < columns.length; i++) {
        const lastEvent = columns[i];
        if (!lastEvent || !lastEvent.start) continue;
        
        const lastEnd = lastEvent.end
          ? new Date(lastEvent.end).getTime()
          : new Date(lastEvent.start).getTime() + 30 * 60000;
        
        if (eventStart >= lastEnd) {
          columns[i] = event;
          layouts.push({ event, column: i, total: 0 });
          placed = true;
          break;
        }
      }
      
      if (!placed) {
        columns.push(event);
        layouts.push({ event, column: columns.length - 1, total: 0 });
      }
    });
    
    group.forEach((event) => {
      if (!event) return;
      
      const layout = layouts.find((l) => l.event.id === event.id);
      if (layout) {
        layout.total = columns.length;
      }
    });
  });

  return layouts.map((item) => {
    if (!item.event.start) return null;
    
    const eventStart = new Date(item.event.start);
    const eventEnd = item.event.end
      ? new Date(item.event.end)
      : new Date(eventStart.getTime() + 30 * 60000);
    
    const startMinutes = eventStart.getHours() * 60 + eventStart.getMinutes();
    const endMinutes = eventEnd.getHours() * 60 + eventEnd.getMinutes();
    const top = ((startMinutes - startHour * 60) / 60) * hourHeight;
    const height = ((endMinutes - startMinutes) / 60) * hourHeight;

    const widthPercentage = 100 / item.total;
    const leftPercentage = item.column * widthPercentage;
    
    return {
      event: item.event,
      top,
      height,
      left: leftPercentage,
      width: widthPercentage,
    };
  }).filter(Boolean) as any[];
};

/*
  Year View Component
*/
interface YearViewProps {
  year: number;
  events: CalendarEvent[];
  onDayClick: (date: string) => void;
}

const utcToLocal = (dateString: string): Date => {
  const date = new Date(dateString);
  return date;
};

/**
 * Converts a local date to UTC for sending to the server
 */
const localToUTC = (date: Date): string => {
  return date.toISOString();
};

/**
 * Formats a UTC date string for datetime-local input
 * Converts from UTC to local timezone first
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

const YearView: React.FC<YearViewProps> = ({ year, events, onDayClick }) => {
  const months = [
    "January", "February", "March", "April", "May", "June",
    "July", "August", "September", "October", "November", "December"
  ];
  return (
    <div className="grid grid-cols-4 gap-6 p-6 bg-slate-50 rounded-lg">
      {months.map((month, index) => {
        const monthEvents = events.filter((event) => {
          if (!event || !event.start) return false;
          
          const eventDate = new Date(event.start);
          return (
            eventDate.getFullYear() === year &&
            eventDate.getMonth() === index
          );
        });
        
        const daysCount = new Date(year, index + 1, 0).getDate();
        const firstDayIndex = new Date(year, index, 1).getDay();
        const blanks = Array.from({ length: firstDayIndex }, () => null);
        const days = Array.from({ length: daysCount }, (_, i) => i + 1);
        const totalCells = blanks.length + days.length;
        const remainder = totalCells % 7;
        const trailingBlanks = remainder
          ? Array.from({ length: 7 - remainder }, () => null)
          : [];
        
        const allCells = [...blanks, ...days, ...trailingBlanks];
        
        return (
          <div key={month} className="bg-white shadow-sm rounded-lg overflow-hidden">
            <h3 className="text-lg font-semibold px-4 py-3 bg-indigo-50 text-indigo-800 border-b border-indigo-100">
              {month}
            </h3>
            <div className="grid grid-cols-7 text-center text-xs font-medium text-slate-500 bg-slate-50">
              <span className="py-1">Su</span>
              <span className="py-1">Mo</span>
              <span className="py-1">Tu</span>
              <span className="py-1">We</span>
              <span className="py-1">Th</span>
              <span className="py-1">Fr</span>
              <span className="py-1">Sa</span>
            </div>
            <div className="grid grid-cols-7 text-center text-sm">
              {allCells.map((cell, idx) => {
                if (cell === null) {
                  return <div key={idx} className="p-1"></div>;
                } else {
                  const date = new Date(year, index, cell);
                  const eventsForDay = monthEvents.filter(
                    (event) => {
                      if (!event || !event.start) return false;
                      return new Date(event.start).toDateString() === date.toDateString();
                    }
                  );
                  
                  const isToday = format(date, "yyyy-MM-dd") === format(new Date(), "yyyy-MM-dd");
                  
                  return (
                    <div
                      key={idx}
                      className={`p-1 ${isToday ? 'bg-indigo-50' : ''} rounded-full m-1 
                                 cursor-pointer hover:bg-indigo-100 transition-colors duration-200`}
                      onClick={() =>
                        onDayClick(format(date, "yyyy-MM-dd"))
                      }
                    >
                      <div className={`${isToday ? 'font-bold text-indigo-700' : ''}`}>{cell}</div>
                      {eventsForDay.length > 0 && (
                        <div className="flex justify-center space-x-1 mt-1">
                          {eventsForDay.slice(0, 3).map((event, idx) => (
                            <div
                              key={idx}
                              className="w-1.5 h-1.5 rounded-full"
                              style={{ backgroundColor: event.color }}
                            ></div>
                          ))}
                          {eventsForDay.length > 3 && (
                            <div className="w-1.5 h-1.5 rounded-full bg-gray-400"></div>
                          )}
                        </div>
                      )}
                    </div>
                  );
                }
              })}
            </div>
          </div>
        );
      })}
    </div>
  );
};

const CustomCalendar: React.FC<CustomCalendarProps> = ({
  events,
  calendars,
  onAddEvent,
}) => {
  const dispatch: AppDispatch = useDispatch();
  const authUser = useSelector((state: RootState) => state.auth.user);
  const { currentEvent, loading, error } = useSelector((state: RootState) => state.event);
  
  // Calendar view state
  const [currentView, setCurrentView] = useState<"day" | "week" | "month" | "year">("month");
  const [currentDate, setCurrentDate] = useState(new Date());
  const [currentYear, setCurrentYear] = useState(new Date().getFullYear());
  
  // Event state
  const [showEventModal, setShowEventModal] = useState(false);
  const [showEventDetailModal, setShowEventDetailModal] = useState(false);
  const [showParticipantModal, setShowParticipantModal] = useState(false);
  const [selectedEventId, setSelectedEventId] = useState<number | null>(null);
  const [participantEmail, setParticipantEmail] = useState("");
  const [isAddingParticipant, setIsAddingParticipant] = useState(false);

  const [formParticipants, setFormParticipants] = useState<{email: string, id?: number}[]>([]);
const [newParticipantEmail, setNewParticipantEmail] = useState("");
const [isSearchingUser, setIsSearchingUser] = useState(false);
const [activeTab, setActiveTab] = useState<'details' | 'participants'>('details');
const navigate = useNavigate();
// 2. Add this function to search for users by email
const searchUserByEmail = async (email: string) => {
  if (!email.trim()) return null;
  
  setIsSearchingUser(true);
  try {
    const users = await eventService.findUserByEmail(email);
    console.log('chtoto tut',users);
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

// 3. Add this function to add a participant to the form
const addFormParticipant = async () => {
  if (!newParticipantEmail.trim()) return;
  
  // Check if this email is already in the list
  if (formParticipants.some(p => p.email === newParticipantEmail.trim())) {
    alert("This email is already added to participants");
    return;
  }
  
  // Search for the user
  const user = await searchUserByEmail(newParticipantEmail);
  console.log('tyt teper', user);
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

// 4. Add this function to remove a participant from the form
const removeFormParticipant = (email: string) => {
  setFormParticipants(formParticipants.filter(p => p.email !== email));
};

  // Event form data
  const [eventFormData, setEventFormData] = useState<{
    id?: number;
    name: string;
    description: string;
    category: EventCategory;
    startedAt: string;
    endedAt: string;
    color: string;
    type: EventType;
    calendarId: number;
    priority?: TaskPriority;
    isCompleted?: boolean;
    isEditing: boolean;
  }>({
    name: "",
    description: "",
    category: EventCategory.HOME,
    startedAt: "",
    endedAt: "",
    color: "#4CAF50",
    type: EventType.TASK,
    calendarId: calendars && calendars.length > 0 ? parseInt(calendars[0].id) : 0,
    isEditing: false
  });

  // For tracking current time
  const [currentNow, setCurrentNow] = useState(new Date());
  
  // Effect for debug logging incoming events
  useEffect(() => {
    console.log("Events received in CustomCalendar:", events.length);
    
    // Log sample event to check structure
    if (events.length > 0) {
      console.log("Event sample:", events[0]);
    }
  }, [events]);
  
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentNow(new Date());
    }, 60000);
    return () => clearInterval(timer);
  }, []);

  // Fetch event details when selected
  useEffect(() => {
    if (selectedEventId) {
      dispatch(getEvent(selectedEventId));
    }
  }, [selectedEventId, dispatch]);

  // Time grid settings
  const startHour = 0;
  const endHour = 24;
  const hourHeight = 60;
  const allDayHeight = 50;

  // =================== MONTH VIEW ===================
  const monthStart = startOfMonth(currentDate);
  const monthEnd = endOfMonth(monthStart);
  const startDt = startOfWeek(monthStart, { weekStartsOn: 0 });
  const endDt = endOfWeek(monthEnd, { weekStartsOn: 0 });
  const dateFormat = "d";

  const monthRows: JSX.Element[] = [];
  let monthDays: JSX.Element[] = [];
  let day = startDt;
  let formattedDate = "";

  const weekdays = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

  // Render week days header
  const weekdaysHeader = (
    <div className="grid grid-cols-7 gap-1 mb-2">
      {weekdays.map((day) => (
        <div key={day} className="text-center font-medium text-slate-600 text-sm py-2">
          {day}
        </div>
      ))}
    </div>
  );

  // Build month view
  while (day <= endDt) {
    for (let i = 0; i < 7; i++) {
      formattedDate = format(day, dateFormat);
      const cloneDay = day;
      const dayString = format(cloneDay, "yyyy-MM-dd");
      
      // Filter valid events for this day
      const dayEvents = events.filter(
        (event) => {
          if (!event || !event.start) return false;
          return format(new Date(event.start), "yyyy-MM-dd") === dayString;
        }
      );
      
      const isToday = dayString === format(new Date(), "yyyy-MM-dd");
      const isCurrentMonth = day.getMonth() === currentDate.getMonth();
      
      monthDays.push(
        <div
          key={day.toString()}
          className={`border rounded-lg p-2 h-32 cursor-pointer transition-all duration-200 
                     ${isToday ? 'ring-2 ring-indigo-500 bg-indigo-50' : 'hover:bg-slate-50'}
                     ${isCurrentMonth ? 'bg-white' : 'bg-slate-50/50 text-slate-400'}`}
          onClick={() => {
            setCurrentDate(cloneDay);
            setCurrentView("day");
          }}
        >
          <div className={`text-xs font-semibold ${isToday ? 'text-indigo-700' : 'text-slate-700'} 
                           flex justify-between items-center`}>
            <span className={`${isToday ? 'bg-indigo-500 text-white h-6 w-6 rounded-full flex items-center justify-center' : ''}`}>
              {formattedDate}
            </span>
            {dayEvents.length > 0 && (
              <span className="text-xs text-indigo-600 font-medium">{dayEvents.length}</span>
            )}
          </div>
          {dayEvents.length > 0 && (
            <div className="mt-2 space-y-1.5 overflow-hidden">
              {dayEvents.slice(0, 3).map((event) => {
                const calendar = calendars.find(cal => cal.id === event.calendarId) || { color: event.color };
                const eventBgColor = event.color && event.color.trim() !== "" ? event.color : calendar.color;
                
                // Determine event type icon
                let typeIcon;
                switch(event.type) {
                  case 'arrangement':
                    typeIcon = '🗓️';
                    break;
                  case 'task':
                    typeIcon = '✓';
                    break;
                  case 'reminder':
                    typeIcon = '⏰';
                    break;
                  case 'holiday':
                    typeIcon = '🏖️';
                    break;
                  default:
                    typeIcon = '⏰';
                }
                       
                return (
                  <div
                    key={event.id}
                    className="flex items-center text-xs px-2 py-1 rounded-md"
                    style={{ 
                      backgroundColor: `${eventBgColor}15`,
                      borderLeft: `4px solid ${eventBgColor}` 
                    }}
                    onClick={(e) => {
                      e.stopPropagation();
                      setSelectedEventId(parseInt(event.id));
                      setShowEventDetailModal(true);
                    }}
                  >
                    <span className="text-xs mr-1">{typeIcon}</span>
                    <span className="truncate text-slate-700">{event.title}</span>
                  </div>
                );
              })}
              {/* {dayEvents.length > 3 && (
                <div className="text-xs text-slate-500 italic pl-2">
                  +{dayEvents.length - 3} more
                </div>
              )} */}
            </div>
          )}
        </div>
      );
      day = addDays(day, 1);
    }
    monthRows.push(
      <div className="grid grid-cols-7 gap-2" key={day.toString()}>
        {monthDays}
      </div>
    );
    monthDays = [];
  }

  // =================== WEEK VIEW ===================
  const renderWeekView = () => {
    const startWeek = startOfWeek(currentDate, { weekStartsOn: 0 });
    const weekDays = Array.from({ length: 7 }, (_, i) =>
      addDays(startWeek, i)
    );
    const hours: number[] = [];
    for (let h = startHour; h < endHour; h++) {
      hours.push(h);
    }
    const totalHeight = (endHour - startHour) * hourHeight;

    return (
      <div className="overflow-auto relative rounded-lg shadow-sm border border-slate-200 bg-white">
        {/* Header for days of the week and All Day area */}
        <div className="grid grid-cols-8 sticky top-0 z-10 bg-white">
          <div className="border-b border-r border-slate-200 bg-slate-50" style={{ height: allDayHeight }}></div>
          {weekDays.map((d, idx) => {
            const isToday = format(d, "yyyy-MM-dd") === format(new Date(), "yyyy-MM-dd");
            return (
              <div
                key={idx}
                className={`text-center font-medium border-b py-3 text-sm ${
                  isToday ? 'bg-indigo-50 text-indigo-700' : 'bg-slate-50 text-slate-700'
                }`}
              >
                <div className="font-bold">{format(d, "EEE")}</div>
                <div className={`${isToday ? 'bg-indigo-600 text-white rounded-full w-7 h-7 flex items-center justify-center mx-auto mt-1' : ''}`}>
                  {format(d, "dd")}
                </div>
              </div>
            );
          })}
        </div>
        
        {/* All Day events area */}
        <div className="grid grid-cols-8">
          <div className="border-r border-b border-slate-200 p-2 bg-slate-50">
            <div className="text-xs font-medium text-slate-600">All Day</div>
          </div>
          {weekDays.map((dayItem, idx) => {
            const dayStr = format(dayItem, "yyyy-MM-dd");
            const isToday = dayStr === format(new Date(), "yyyy-MM-dd");
            
            // Filter all-day events like holidays
            const allDayEvents = events.filter(
              (event) => {
                if (!event || !event.start) return false;
                return format(new Date(event.start), "yyyy-MM-dd") === dayStr &&
                       event.type === "holiday";
              }
            );
            
            return (
              <div
                key={idx}
                className={`border-r border-b border-slate-200 p-1 ${
                  isToday ? 'bg-indigo-50/30' : ''
                }`}
                style={{ height: allDayHeight }}
              >
                {allDayEvents.map((event) => (
                  <div
                    key={event.id}
                    className="text-xs rounded-md px-2 py-1 mb-1 truncate"
                    style={{ 
                      backgroundColor: `${event.color}20`,
                      borderLeft: `3px solid ${event.color}`,
                      color: '#333'
                    }}
                    title={event.title}
                  >
                    <span className="mr-1">🏖️</span>
                    {event.title}
                  </div>
                ))}
              </div>
            );
          })}
        </div>
        
        {/* Time grid */}
        <div className="grid grid-cols-8 relative">
          <div className="relative bg-slate-50">
            {hours.map((hour) => (
              <div
                key={hour}
                style={{ height: `${hourHeight}px` }}
                className="border-t border-slate-200 text-right pr-2 text-xs text-slate-500 flex items-start justify-end pt-1"
              >
                {hour === 0 ? '12 AM' : hour < 12 ? `${hour} AM` : hour === 12 ? '12 PM' : `${hour-12} PM`}
              </div>
            ))}
          </div>
          {weekDays.map((dayItem, idx) => {
            const dayStr = format(dayItem, "yyyy-MM-dd");
            const isToday = dayStr === format(new Date(), "yyyy-MM-dd");
            
            // Filter valid events for this day (excluding holidays)
            const dayEvents = events.filter(
              (event) => {
                if (!event || !event.start) return false;
                return format(new Date(event.start), "yyyy-MM-dd") === dayStr &&
                       event.type !== "holiday";
              }
            );
            
            console.log(`Found ${dayEvents.length} events for week day ${dayStr}`);
            
            // Calculate event positions for rendering
            const layouts = calculateEventPositions(
              dayEvents.filter(event => event && event.start),
              startHour,
              hourHeight
            );
            
            return (
              <div
                key={idx}
                className={`relative border-l border-slate-200 ${isToday ? 'bg-indigo-50/30' : ''}`}
                style={{ height: `${totalHeight}px` }}
                onDoubleClick={(e) => handleWeekViewDoubleClick(e, dayItem)}
              >
                {hours.map((hour, i) => (
                  <div
                    key={i}
                    style={{ height: `${hourHeight}px` }}
                    className="border-t border-slate-200"
                  ></div>
                ))}
                
                {/* Current time line */}
                {isToday && (() => {
                  const currentMinutes =
                    currentNow.getHours() * 60 + currentNow.getMinutes();
                  const lineTop =
                    ((currentMinutes - startHour * 60) / 60) * hourHeight;
                  return (
                    <div
                      className="absolute left-0 right-0 z-20"
                      style={{ top: lineTop }}
                    >
                      <div className="relative">
                        <div className="absolute -left-1 w-2 h-2 rounded-full bg-red-500"></div>
                        <div className="border-t-2 border-red-500 border-dashed w-full"></div>
                      </div>
                    </div>
                  );
                })()}
                
                {layouts.map((layout) => {
                  // Find the calendar this event belongs to
                  const calendar = calendars.find(cal => cal.id === layout.event.calendarId);
                  
                  if (!calendar) {
                    console.warn(`No calendar found for event ${layout.event.id} with calendarId ${layout.event.calendarId}`);
                  }
                  
                  const calendarColor = calendar?.color || "#3B82F6";
                  const eventBgColor =
                    layout.event.color && layout.event.color.trim() !== ""
                      ? layout.event.color
                      : calendarColor;
                      
                  // Get event time for display
                  const eventStart = new Date(layout.event.start);
                  const startTime = format(eventStart, 'h:mm a');
                  
                  // Get the right icon for the event type
                  let typeIcon;
                  switch(layout.event.type) {
                    case 'arrangement':
                      typeIcon = '🗓️';
                      break;
                    case 'task':
                      typeIcon = '✓';
                      break;
                    case 'reminder':
                      typeIcon = '⏰';
                      break;
                    default:
                      typeIcon = '⏰';
                  }
                  
                  return (
                    <div
                      key={layout.event.id}
                      style={{
                        top: `${layout.top}px`,
                        height: `${layout.height}px`,
                        left: `${layout.left}%`,
                        width: `calc(${layout.width}% - 4px)`,
                        position: "absolute",
                        marginLeft: "2px",
                        padding: "4px",
                        backgroundColor: `${eventBgColor}15`,
                        borderLeft: `4px solid ${calendarColor}`,
                      }}
                      className="text-xs rounded-md shadow-sm overflow-hidden cursor-pointer transition-all duration-200 hover:shadow-md group"
                      title={layout.event.title}
                      onClick={() => {
                        setSelectedEventId(parseInt(layout.event.id));
                        setShowEventDetailModal(true);
                      }}
                    >
                      <div className="font-semibold text-slate-700 truncate flex items-center">
                        <span className="mr-1">{typeIcon}</span>
                        {layout.event.title}
                      </div>
                      <div className="text-slate-500 text-xs">{startTime}</div>
                    </div>
                  );
                })}
              </div>
            );
          })}
        </div>
      </div>
    );
  };

  // =================== DAY VIEW ===================
  const renderDayView = () => {
    const dayStr = format(currentDate, "yyyy-MM-dd");
    const isToday = dayStr === format(new Date(), "yyyy-MM-dd");
    
    // Filter all-day events like holidays
    const allDayEvents = events.filter(
      (event) => {
        if (!event || !event.start) return false;
        return format(new Date(event.start), "yyyy-MM-dd") === dayStr &&
               event.type === "holiday";
      }
    );
    
    // Filter regular timed events
    const timedEvents = events.filter(
      (event) => {
        if (!event || !event.start) return false;
        return format(new Date(event.start), "yyyy-MM-dd") === dayStr &&
               event.type !== "holiday";
      }
    );
    
    console.log(`Found ${timedEvents.length} timed events for day ${dayStr}`);
    
    const hours: number[] = [];
    for (let h = startHour; h < endHour; h++) {
      hours.push(h);
    }
    
    const totalHeight = (endHour - startHour) * hourHeight;
    
    // Calculate event positions for rendering
    const layouts = calculateEventPositions(
      timedEvents.filter(event => event && event.start),
      startHour,
      hourHeight
    );

    return (
      <div className="overflow-auto relative rounded-lg shadow-sm border border-slate-200 bg-white">
        {/* Day header */}
        <div className={`py-4 px-6 font-medium text-center border-b ${isToday ? 'bg-indigo-50' : 'bg-slate-50'}`}>
          <span className="text-lg font-bold mr-2 text-slate-800">
            {format(currentDate, "EEEE")}
          </span>
          <span className={`text-md ${isToday ? 'text-indigo-600' : 'text-slate-600'}`}>
            {format(currentDate, "MMMM d, yyyy")}
            {isToday && <span className="ml-2 bg-indigo-600 text-white text-xs py-0.5 px-2 rounded-full">Today</span>}
          </span>
        </div>
        
        {/* All day area */}
        <div className={`border-b border-slate-200 p-3 flex items-center ${isToday ? 'bg-indigo-50/30' : 'bg-slate-50/30'}`}>
          <div className="text-sm font-medium text-slate-700 min-w-[80px]">All Day</div>
          <div className="flex space-x-2 ml-4 flex-wrap gap-2">
            {allDayEvents.length > 0 ? allDayEvents.map((event) => (
              <div
                key={event.id}
                className="text-xs rounded-md px-3 py-1.5 flex items-center"
                style={{
                  backgroundColor: `${event.color}15`,
                  borderLeft: `3px solid ${event.color}`,
                  color: '#333'
                }}
                title={event.title}
              >
                <span className="mr-1">🏖️</span>
                {event.title}
              </div>
            )) : (
              <div className="text-xs text-slate-500 italic">No all-day events</div>
            )}
          </div>
        </div>

        {/* Time grid */}
        <div className="grid" style={{ gridTemplateColumns: "80px 1fr" }}>
          <div className="relative bg-slate-50">
            {hours.map((hour) => (
              <div
                key={hour}
                style={{ height: `${hourHeight}px` }}
                className="border-t border-slate-200 text-right pr-3 text-xs text-slate-500 flex items-start justify-end pt-2"
              >
                {hour === 0 ? '12 AM' : hour < 12 ? `${hour} AM` : hour === 12 ? '12 PM' : `${hour-12} PM`}
              </div>
            ))}
          </div>
          <div
            className={`relative border-l border-slate-200 ${isToday ? 'bg-indigo-50/20' : ''}`}
            style={{ height: `${totalHeight}px` }}
            onDoubleClick={handleDayViewDoubleClick}
          >
            {hours.map((hour, i) => (
              <div
                key={i}
                style={{ height: `${hourHeight}px` }}
                className="border-t border-slate-200"
              ></div>
            ))}
            
            {/* Current time line */}
            {isToday && (() => {
              const currentMinutes =
                currentNow.getHours() * 60 + currentNow.getMinutes();
              const lineTop =
                ((currentMinutes - startHour * 60) / 60) * hourHeight;
              return (
                <div
                  className="absolute left-0 right-0 z-20"
                  style={{ top: lineTop }}
                >
                  <div className="relative">
                    <div className="absolute -left-2 w-4 h-4 rounded-full bg-red-500 shadow"></div>
                    <div className="border-t-2 border-red-500 w-full"></div>
                  </div>
                </div>
              );
            })()}
            
            {layouts.map((layout) => {
              // Find the calendar this event belongs to
              const calendar = calendars.find(cal => cal.id === layout.event.calendarId);
              
              if (!calendar) {
                console.warn(`No calendar found for event ${layout.event.id} with calendarId ${layout.event.calendarId}`);
              }
              
              const calendarColor = calendar?.color || "#3B82F6";
              const eventBgColor =
                layout.event.color && layout.event.color.trim() !== ""
                  ? layout.event.color
                  : calendarColor;
                  
              // Get event time for display
              const eventStart = new Date(layout.event.start);
              const eventEnd = layout.event.end ? new Date(layout.event.end) : 
                              new Date(eventStart.getTime() + 30 * 60000);
              const timeRange = `${format(eventStart, 'h:mm')} - ${format(eventEnd, 'h:mm a')}`;
              
              // Get the right icon for the event type
              let typeIcon;
              switch(layout.event.type) {
                case 'arrangement':
                  typeIcon = '🗓️';
                  break;
                case 'task':
                  typeIcon = '✓';
                  break;
                case 'reminder':
                  typeIcon = '⏰';
                  break;
                default:
                  typeIcon = '⏰';
              }
              
              return (
                <div
                  key={layout.event.id}
                  style={{
                    top: `${layout.top}px`,
                    height: `${Math.max(layout.height, 30)}px`,
                    left: `${layout.left}%`,
                    width: `calc(${layout.width}% - 10px)`,
                    position: "absolute",
                    marginLeft: "5px",
                    padding: "6px 8px",
                    backgroundColor: `${eventBgColor}15`,
                    borderLeft: `4px solid ${calendarColor}`,
                  }}
                  className="rounded-md shadow-sm overflow-hidden cursor-pointer transition-all duration-200 hover:shadow-md group"
                  title={layout.event.title}
                  onClick={() => {
                    setSelectedEventId(parseInt(layout.event.id));
                    setShowEventDetailModal(true);
                  }}
                >
                  <div className="font-semibold text-slate-800 truncate flex items-center">
                    <span className="mr-1">{typeIcon}</span>
                    {layout.event.title}
                  </div>
                  <div className="text-slate-500 text-xs">{timeRange}</div>
                  {layout.height > 60 && layout.event.description && (
                    <div className="text-xs text-slate-600 mt-1 opacity-75 group-hover:opacity-100 line-clamp-2">
                      {layout.event.description}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </div>
    );
  };

  // =================== YEAR VIEW ===================
  const renderYearView = () => (
    <YearView
      year={currentYear}
      events={events}
      onDayClick={(dateStr: string) => {
        setCurrentDate(new Date(dateStr));
        setCurrentView("day");
      }}
    />
  );

  // ---------- Navigation handlers ----------
  const handlePrev = () => {
    if (currentView === "month") {
      setCurrentDate(subMonths(currentDate, 1));
    } else if (currentView === "week") {
      setCurrentDate(subWeeks(currentDate, 1));
    } else if (currentView === "day") {
      setCurrentDate(addDays(currentDate, -1));
    } else if (currentView === "year") {
      setCurrentYear((prev) => prev - 1);
    }
  };

  const handleNext = () => {
    if (currentView === "month") {
      setCurrentDate(addMonths(currentDate, 1));
    } else if (currentView === "week") {
      setCurrentDate(addWeeks(currentDate, 1));
    } else if (currentView === "day") {
      setCurrentDate(addDays(currentDate, 1));
    } else if (currentView === "year") {
      setCurrentYear((prev) => prev + 1);
    }
  };

  const handleToday = () => {
    if (currentView === "year") {
      setCurrentYear(new Date().getFullYear());
    } else {
      setCurrentDate(new Date());
    }
  };

  // ---------- Double-click handlers for creating events ----------
  const handleDayViewDoubleClick = (e: React.MouseEvent<HTMLDivElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const offsetY = e.clientY - rect.top;
    const hourFraction = offsetY / hourHeight;
    const clickedHour = startHour + hourFraction;
    const hoursPart = Math.floor(clickedHour);
    const minutes = Math.floor((clickedHour - hoursPart) * 60);
    
    const newStart = new Date(currentDate);
    newStart.setHours(hoursPart, minutes, 0, 0);
    
    const newEnd = new Date(newStart);
    newEnd.setMinutes(newEnd.getMinutes() + 30);
    
    const defaultCalendar = calendars && calendars.length > 0 ? 
  calendars.find(cal => cal.calendarType !== "holiday") || calendars[0] : null;

setEventFormData({
  ...eventFormData,
  startedAt: newStart.toISOString(),
  endedAt: newEnd.toISOString(),
  color: defaultCalendar?.color || "#4CAF50",
  calendarId: defaultCalendar ? parseInt(defaultCalendar.id) : 0,
  isEditing: false
});
    
    setShowEventModal(true);
  };

  const handleWeekViewDoubleClick = (e: React.MouseEvent<HTMLDivElement>, day: Date) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const offsetY = e.clientY - rect.top;
    const hourFraction = offsetY / hourHeight;
    const clickedHour = startHour + hourFraction;
    const hoursPart = Math.floor(clickedHour);
    const minutes = Math.floor((clickedHour - hoursPart) * 60);
    
    const newStart = new Date(day);
    newStart.setHours(hoursPart, minutes, 0, 0);
    
    const newEnd = new Date(newStart);
    newEnd.setMinutes(newEnd.getMinutes() + 30);
    
    const defaultCalendar = calendars && calendars.length > 0 ? 
  calendars.find(cal => cal.calendarType !== "holiday") || calendars[0] : null;

setEventFormData({
  ...eventFormData,
  startedAt: newStart.toISOString(),
  endedAt: newEnd.toISOString(),
  color: defaultCalendar?.color || "#4CAF50",
  calendarId: defaultCalendar ? parseInt(defaultCalendar.id) : 0,
  isEditing: false
});
    
    setShowEventModal(true);
  };

  // ---------- Event form handlers ----------
  const handleEventFormSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      if (eventFormData.isEditing && eventFormData.id) {
        // First, create the usual update payload WITHOUT the color
        const updatePayload: UpdateEventPayload = {
          name: eventFormData.name,
          description: eventFormData.description,
          category: eventFormData.category,
          startedAt: localToUTC(new Date(eventFormData.startedAt)),
          endedAt: localToUTC(new Date(eventFormData.endedAt)),
          // Remove color from here, we'll update it separately
        };
        
        // Add priority and isCompleted only for tasks
        if (currentEvent?.type === EventType.TASK) {
          updatePayload.priority = eventFormData.priority;
          updatePayload.isCompleted = eventFormData.isCompleted;
        }
        
        // 1. Update the main event data
        const updatedEvent = await dispatch(updateEvent(eventFormData.id, updatePayload));
        console.log("Event updated:", updatedEvent);
        
        // 2. Then update the color separately using your existing action
        // We need to find the calendarMemberId from the current event
        if (currentEvent?.participations && currentEvent.participations.length > 0) {
          // Get the calendarMemberId from the first participation
          const calendarMemberId = currentEvent.participations[0].calendarMemberId;
          
          if (calendarMemberId) {
            // Only update color if it's different from the current color
            const currentColor = currentEvent.participations[0].color;
            if (currentColor !== eventFormData.color) {
              console.log("Updating event color to:", eventFormData.color);
              // Call your existing action to update the color
              await dispatch(updateEventParticipant(
                eventFormData.id, 
                calendarMemberId, 
                { color: eventFormData.color }
              ));
            }
          }
        }
        
        // Update participants if it's an arrangement
        if (currentEvent?.type === EventType.ARRANGEMENT) {
          // Get the current participants
          const currentParticipantIds = currentEvent.participations
            ? currentEvent.participations.map(p => p.calendarMember?.user?.id).filter(Boolean)
            : [];
          
          // Get the new participants
          const newParticipantIds = formParticipants.map(p => p.id).filter(Boolean);
          
          // Get the calendar ID
          const calendarId = currentEvent.participations?.[0]?.calendarMember?.calendarId;
          
          if (calendarId) {
            // Remove participants that are not in the new list
            for (const p of currentEvent.participations || []) {
              if (p.calendarMember?.user?.id && !newParticipantIds.includes(p.calendarMember.user.id)) {
                await dispatch(removeEventParticipant(currentEvent.id, p.calendarMemberId));
              }
            }
            
            // Add new participants
            for (const participant of formParticipants) {
              if (participant.id && !currentParticipantIds.includes(participant.id)) {
                await dispatch(addEventParticipant(currentEvent.id, calendarId, participant.email));
              }
            }
          }
        }
        
        // Refresh calendar events after update
        if (currentEvent?.participations && currentEvent.participations.length > 0) {
          const calendarId = currentEvent.participations[0].calendarMember?.calendarId;
          if (calendarId && authUser?.id) {
            const updatedEvents = await dispatch(getCalendarEvents(calendarId, authUser.id));
            console.log("Updated events after edit:", updatedEvents);
            
            // Notify parent component about the update
            if (onAddEvent && typeof onAddEvent === 'function') {
              // Create a synthetic event object to notify parent
              const syntheticEvent = {
                id: String(updatedEvent.id),
                title: updatedEvent.name,
                start: updatedEvent.startedAt,
                calendarId: String(calendarId),
                type: updatedEvent.type,
                color: eventFormData.color
              };
              onAddEvent(syntheticEvent);
            }
          }
        }
      } else {
        // Create new event
        const createPayload: CreateEventPayload = {
          name: eventFormData.name,
          description: eventFormData.description,
          category: eventFormData.category,
          // Convert local date to UTC before sending to server
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
        
        const newEvent = await dispatch(createEvent(createPayload));
        console.log("New event created:", newEvent);
        
        // Refresh calendar events after creation
        if (authUser?.id) {
          const updatedEvents = await dispatch(getCalendarEvents(eventFormData.calendarId, authUser.id));
          console.log("Updated events after creation:", updatedEvents);
          
          // Notify parent component about the new event
          if (onAddEvent && typeof onAddEvent === 'function') {
            // Create a synthetic event object to notify parent
            const syntheticEvent = {
              id: String(newEvent.id),
              title: newEvent.name,
              start: newEvent.startedAt,
              calendarId: String(eventFormData.calendarId),
              type: newEvent.type,
              color: createPayload.color
            };
            onAddEvent(syntheticEvent);
          }
        }
      }
      
      setShowEventModal(false);
      resetEventForm();
    } catch (error) {
      console.error("Error saving event:", error);
    }
  };
// Add this helper function to format dates correctly
function formatToUTCString(date: Date): string {
  return date.toISOString(); // This returns the date in format like "2025-04-01T10:00:00.000Z"
}
const handleEditEvent = () => {
  if (!currentEvent) return;
  
  // Load existing participants if it's an arrangement
  const currentParticipants: {email: string, id?: number}[] = [];
  if (currentEvent.type === EventType.ARRANGEMENT && currentEvent.participations) {
    currentEvent.participations.forEach(p => {
      if (p.calendarMember && p.calendarMember.user) {
        currentParticipants.push({
          email: p.calendarMember.user.email,
          id: p.calendarMember.user.id
        });
      }
    });
  }
  
  // Get the event color or default to calendar color
  const eventColor = currentEvent.participations?.[0]?.color || 
                     calendars.find(cal => cal.id === String(currentEvent.participations?.[0]?.calendarMember?.calendarId))?.color || 
                     "#4CAF50";
  
  setFormParticipants(currentParticipants);
  
  setEventFormData({
    id: currentEvent.id,
    name: currentEvent.name,
    description: currentEvent.description,
    category: currentEvent.category,
    startedAt: currentEvent.startedAt,
    endedAt: currentEvent.endedAt,
    color: eventColor,
    type: currentEvent.type,
    calendarId: currentEvent.participations?.[0]?.calendarMember?.calendarId || 0,
    priority: currentEvent.task?.priority,
    isCompleted: currentEvent.task?.isCompleted,
    isEditing: true
  });
  
  setShowEventDetailModal(false);
  setShowEventModal(true);
};

const handleDeleteEvent = async () => {
  if (!currentEvent) return;
  
  try {
    await dispatch(deleteEvent(currentEvent.id));
    console.log("Event deleted:", currentEvent.id);
    
    // Get the calendar ID of the deleted event
    let calendarId: string | number | undefined;
    if (currentEvent.participations && currentEvent.participations.length > 0) {
      calendarId = currentEvent.participations[0].calendarMember?.calendarId;
    } else if (currentEvent.calendarId) {
      calendarId = currentEvent.calendarId;
    }
    
    // Notify parent component about the deletion
    if (calendarId && onAddEvent && typeof onAddEvent === 'function') {
      // Create a special notification with a deletion flag
      const deletionEvent = {
        id: String(currentEvent.id),
        calendarId: String(calendarId),
        deleted: true, // Special flag to indicate deletion
        title: currentEvent.name || "",
        start: currentEvent.startedAt || "",
        type: currentEvent.type || "task"
      };
      onAddEvent(deletionEvent);
    }
    
    setShowEventDetailModal(false);
  } catch (error) {
    console.error("Error deleting event:", error);
  }
};

  const resetEventForm = () => {
    // Find the default calendar
    const defaultCalendar = calendars && calendars.length > 0 ? 
      calendars.find(cal => cal.calendarType !== "holiday") || calendars[0] : null;
    
    setEventFormData({
      name: "",
      description: "",
      category: EventCategory.HOME,
      startedAt: "",
      endedAt: "",
      // Use the calendar's color or a fallback
      color: defaultCalendar?.color || "#4CAF50",
      type: EventType.TASK,
      calendarId: defaultCalendar ? parseInt(defaultCalendar.id) : 0,
      isEditing: false
    });
    setFormParticipants([]);
    setNewParticipantEmail("");
  };
  // ---------- Participant handlers ----------
  const handleAddParticipant = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedEventId || !participantEmail.trim()) return;
    
    setIsAddingParticipant(true);
    
    try {
      const calendarId = currentEvent?.participations?.[0]?.calendarMember?.calendarId;
      if (!calendarId) throw new Error("Calendar ID not found");
      
      const result = await dispatch(addEventParticipant(selectedEventId, calendarId, participantEmail));
      console.log("Added participant:", result);
      setParticipantEmail("");
      
      // Refresh event data
      await dispatch(getEvent(selectedEventId));
      
      // Also refresh calendar events
      if (authUser?.id) {
        const updatedEvents = await dispatch(getCalendarEvents(calendarId, authUser.id));
        console.log("Updated events after adding participant:", updatedEvents);
      }
    } catch (error) {
      console.error("Error adding participant:", error);
    } finally {
      setIsAddingParticipant(false);
    }
  };

  const handleUpdateParticipantStatus = async (calendarMemberId: number, status: string) => {
    if (!selectedEventId) return;
    
    try {
      const result = await dispatch(updateEventParticipant(selectedEventId, calendarMemberId, { responseStatus: status }));
      console.log("Updated participant status:", result);
      
      // Refresh event data
      await dispatch(getEvent(selectedEventId));
      
      // Also refresh calendar events
      if (currentEvent?.participations && currentEvent.participations.length > 0) {
        const calendarId = currentEvent.participations[0].calendarMember?.calendarId;
        if (calendarId && authUser?.id) {
          const updatedEvents = await dispatch(getCalendarEvents(calendarId, authUser.id));
          console.log("Updated events after status change:", updatedEvents);
        }
      }
    } catch (error) {
      console.error("Error updating participant status:", error);
    }
  };

  const handleRemoveParticipant = async (calendarMemberId: number) => {
    if (!selectedEventId) return;
    
    try {
      await dispatch(removeEventParticipant(selectedEventId, calendarMemberId));
      console.log("Removed participant:", calendarMemberId);
      
      // Refresh event data
      await dispatch(getEvent(selectedEventId));
      
      // Also refresh calendar events
      if (currentEvent?.participations && currentEvent.participations.length > 0) {
        const calendarId = currentEvent.participations[0].calendarMember?.calendarId;
        if (calendarId && authUser?.id) {
          const updatedEvents = await dispatch(getCalendarEvents(calendarId, authUser.id));
          console.log("Updated events after removing participant:", updatedEvents);
        }
      }
    } catch (error) {
      console.error("Error removing participant:", error);
    }
  };

  // Check if user can manage participants (only for arrangement type events)
  const canManageParticipants = useMemo(() => {
    if (!currentEvent) return false;
    
    // Only arrangement type events can have participants
    if (currentEvent.type !== EventType.ARRANGEMENT) return false;
    
    // Creator can manage participants
    if (currentEvent.creatorId === authUser?.id) return true;
    
    // Calendar owners and editors can manage participants
    const userRole = currentEvent.participations?.find(
      p => p.calendarMember?.userId === authUser?.id
    )?.calendarMember?.role;
    
    return userRole === 'owner' || userRole === 'editor';
  }, [currentEvent, authUser]);

  // Check if user can edit the event
  const canEditEvent = useMemo(() => {
    if (!currentEvent) return false;
    
    // Создатель события всегда может его редактировать
    if (currentEvent.creatorId === authUser?.id) return true;
    
    // Проверяем роль пользователя в календаре, которому принадлежит событие
    const userRole = currentEvent.participations?.find(
      p => p.calendarMember?.userId === authUser?.id
    )?.calendarMember?.role?.toLowerCase();
    
    // Owner и Editor могут редактировать любые события
    return userRole === 'owner' || userRole === 'editor';
  }, [currentEvent, authUser]);

  const canDeleteEvent = useMemo(() => {
    if (!currentEvent) return false;
    
    // Создатель события всегда может его удалить
    if (currentEvent.creatorId === authUser?.id) return true;
    
    // Проверяем роль пользователя в календаре
    const userRole = currentEvent.participations?.find(
      p => p.calendarMember?.userId === authUser?.id
    )?.calendarMember?.role?.toLowerCase();
    
    // Только Owner может удалять чужие события
    return userRole === 'owner';
  }, [currentEvent, authUser]);

  // Render modals
  // This is the new renderEventModal function with a modern design
// Replace your existing renderEventModal function with this code

const renderEventModal = () => {
  // Get the event color for styling
  const eventColor = eventFormData.color || "#4CAF50";
  
  // Get event type icon and color scheme
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
      typeLabel = eventFormData.isEditing ? "Edit Event" : "New Event";
  }
  
  // Find selected calendar
  const selectedCalendar = calendars.find(cal => cal.id === String(eventFormData.calendarId));
  
  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-2xl w-full max-w-2xl overflow-hidden flex flex-col">
        <form onSubmit={handleEventFormSubmit}>
          {/* Header with gradient background */}
          <div 
            className="px-6 py-5 relative overflow-hidden"
            style={{ 
              backgroundColor: eventColor,
              color: '#fff'
            }}
          >
            {/* Decorative circles in background */}
            <div className="absolute -right-12 -top-10 w-32 h-32 rounded-full bg-white opacity-10"></div>
            <div className="absolute -right-5 -bottom-20 w-40 h-40 rounded-full bg-white opacity-5"></div>
            
            <div className="flex justify-between items-start relative z-10">
              <div className="flex-1">
                {/* Event type badge */}
                <div className="flex items-center gap-2 mb-4">
                  <span className={`px-2.5 py-1 text-sm font-medium rounded-full ${typeBgColor} ${typeColor}`}>
                    {eventFormData.isEditing ? `Edit ${typeLabel}` : `New ${typeLabel}`}
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
              
              <button 
                type="button"
                onClick={() => setShowEventModal(false)}
                className="p-1 rounded-full hover:bg-white/10 transition-colors"
              >
                <X size={24} className="text-white" />
              </button>
            </div>
          </div>
          
          {/* Main form content */}
          <div className="p-6 overflow-y-auto max-h-[calc(100vh-250px)]">
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
                
                {!eventFormData.isEditing && (
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
                )}
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
              {(!eventFormData.isEditing || 
                (eventFormData.isEditing && currentEvent?.type === EventType.TASK)) && 
               eventFormData.type === EventType.TASK && (
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
                
                {eventFormData.isEditing && currentEvent?.type === EventType.TASK && (
                  <div className="bg-gray-50 rounded-lg p-3 flex items-center">
                    <input
                      type="checkbox"
                      id="isCompleted"
                      checked={eventFormData.isCompleted || false}
                      onChange={(e) => setEventFormData({ ...eventFormData, isCompleted: e.target.checked })}
                      className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
                    />
                    <label htmlFor="isCompleted" className="ml-2 block text-sm text-gray-900">
                      Mark as completed
                    </label>
                  </div>
                )}
                
                {!eventFormData.isEditing && (
  <>
    {/* Calendar selection - only show when creating new event */}
    <div className="space-y-2">
      <label className="block text-sm font-medium text-gray-700">
        Calendar
      </label>
      <div className="relative">
        <select
          value={eventFormData.calendarId}
          onChange={(e) => {
            const selectedCalendarId = parseInt(e.target.value);
            const selectedCalendar = calendars.find(cal => cal.id === String(selectedCalendarId));
            setEventFormData({ 
              ...eventFormData, 
              calendarId: selectedCalendarId,
              color: selectedCalendar?.color || eventFormData.color
            });
          }}
          className="w-full border border-gray-300 rounded-md px-3 py-2 pl-10 pr-10 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 appearance-none"
        >
          {calendars
            // Фильтруем календари, исключая календари с ролью viewer и holiday календари
            .filter(cal => 
              cal.calendarType !== "holiday" && 
              cal.role?.toLowerCase() !== "viewer"
            )
            .map((cal) => (
              <option key={cal.id} value={cal.id}>
                {cal.title}
              </option>
            ))
          }
        </select>
        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
          <div 
            className="w-4 h-4 rounded-full" 
            style={{ backgroundColor: selectedCalendar?.color || eventFormData.color }}
          ></div>
        </div>
        <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
          <ChevronRight size={16} className="text-gray-400" />
        </div>
      </div>
    </div>
  </>
)}

{/* Color picker - show for both creating and editing */}
<div className="space-y-2">
  <label className="block text-sm font-medium text-gray-700">
    Event Color
  </label>
  <div className="flex items-center">
    <div className="flex items-center gap-2 flex-wrap mr-3">
      {predefinedColors && predefinedColors.slice(0, 7).map(color => (
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
      {eventFormData.isEditing 
        ? "Change the event color" 
        : "If not selected, it will be the same as in the calendar"}
    </div>
  </div>
</div>
                  
              </div>
            </div>
            
            {/* Action buttons */}
            <div className="p-4 border-t border-gray-200 bg-gray-50 flex justify-end space-x-3">
              <button
                type="button"
                onClick={() => setShowEventModal(false)}
                className="px-4 py-2 bg-white border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50 transition-colors text-sm font-medium shadow-sm"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 transition-colors text-sm font-medium shadow-sm flex items-center"
              >
                {eventFormData.isEditing ? (
                  <>
                    <Check size={16} className="mr-1" />
                    Save Changes
                  </>
                ) : (
                  <>
                    <Plus size={16} className="mr-1" />
                    Create Event
                  </>
                )}
              </button>
            </div>
          </form>
        </div>
      </div>
    );
  };
  // This is the new renderEventDetailModal function with a modern design
// Replace your existing renderEventDetailModal function with this code

const renderEventDetailModal = () => {
  if (!currentEvent) return null;
  
  console.log("Rendering event details:", currentEvent);
  
  // Find the calendar this event belongs to
  const calendar = calendars.find(
    cal => cal.id === String(currentEvent.participations?.[0]?.calendarMember?.calendarId)
  );
  
  // If no calendar is found directly, try to get it from participation data
  const calendarFromParticipation = !calendar && currentEvent.participations && 
    currentEvent.participations.length > 0 ?
    calendars.find(cal => 
      cal.id === String(currentEvent.participations[0]?.calendarMember?.calendarId)
    ) : null;
  
  const eventCalendar = calendar || calendarFromParticipation;
  console.log("Event calendar:", eventCalendar);
  
  // Get event type icon and color scheme
  let typeIcon;
  let typeColor;
  let typeBgColor;
  let typeLabel;
  
  switch(currentEvent.type) {
    case EventType.ARRANGEMENT:
      typeIcon = <Calendar className="h-5 w-5" />;
      typeColor = "text-indigo-600";
      typeBgColor = "bg-indigo-50";
      typeLabel = "Arrangement";
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
      typeLabel = "Event";
  }
  
  // Format dates
  const startDate = new Date(currentEvent.startedAt);
  const endDate = new Date(currentEvent.endedAt);
  const formattedStartDate = format(startDate, "EEE, MMM d, yyyy");
  const formattedStartTime = format(startDate, "h:mm a");
  const formattedEndDate = format(endDate, "EEE, MMM d, yyyy");
  const formattedEndTime = format(endDate, "h:mm a");
  
  const isSameDay = format(startDate, "yyyy-MM-dd") === format(endDate, "yyyy-MM-dd");
  
  // Time display logic
  const timeDisplay = isSameDay 
    ? `${formattedStartTime} - ${formattedEndTime}` 
    : `${formattedStartTime}, ${formattedStartDate} - ${formattedEndTime}, ${formattedEndDate}`;
  
  // Create date range for header display
  const headerDateDisplay = isSameDay
    ? formattedStartDate
    : `${format(startDate, "MMM d")} - ${format(endDate, "MMM d, yyyy")}`;
  
  // Get event color for styling
  const eventColor = currentEvent.color || eventCalendar?.color || "#4CAF50";
  
  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-2xl w-full max-w-2xl overflow-hidden flex flex-col">
        {/* Header with gradient background */}
        <div 
          className="px-6 py-5 relative overflow-hidden"
          style={{ 
            backgroundColor: eventColor,
            color: '#fff'
          }}
        >
          {/* Decorative circles in background */}
          <div className="absolute -right-12 -top-10 w-32 h-32 rounded-full bg-white opacity-10"></div>
          <div className="absolute -right-5 -bottom-20 w-40 h-40 rounded-full bg-white opacity-5"></div>
          
          <div className="flex justify-between items-start relative z-10">
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-2">
                <span className={`px-2 py-1 text-xs font-medium rounded-full ${typeBgColor} ${typeColor}`}>
                  {typeLabel}
                </span>
                
                <span className="flex items-center space-x-1 text-xs text-white/70">
                  <span className="w-2 h-2 rounded-full bg-white inline-block"></span>
                  <span>{eventCalendar?.title || "Calendar"}</span>
                </span>
              </div>
              
              <h2 className="text-2xl font-bold text-white mb-1 pr-8 break-words">
                {currentEvent.name}
              </h2>
              
              <div className="flex items-center text-white/90 text-sm mt-3">
                <Clock size={16} className="mr-2" />
                <span>{timeDisplay}</span>
              </div>
            </div>
            
            <button 
              onClick={() => setShowEventDetailModal(false)}
              className="p-1 rounded-full hover:bg-white/10 transition-colors"
            >
              <X size={24} className="text-white" />
            </button>
          </div>
        </div>
        
        {/* Content area with tabs */}
        <div className="flex-1 overflow-y-auto">
          {/* Tab navigation */}
          <div className="flex border-b">
            <button
              onClick={() => setActiveTab('details')}
              className={`px-6 py-3 text-sm font-medium border-b-2 transition-colors ${
                activeTab === 'details' 
                  ? `border-${eventColor.replace('#', '')} text-gray-800` 
                  : 'border-transparent text-gray-500 hover:text-gray-700'
              }`}
              style={{ 
                borderBottomColor: activeTab === 'details' ? eventColor : 'transparent'
              }}
            >
              Details
            </button>
            
            {currentEvent.type === EventType.ARRANGEMENT && (
              <button
                onClick={() => setActiveTab('participants')}
                className={`px-6 py-3 text-sm font-medium border-b-2 transition-colors flex items-center ${
                  activeTab === 'participants' 
                    ? `border-${eventColor.replace('#', '')} text-gray-800` 
                    : 'border-transparent text-gray-500 hover:text-gray-700'
                }`}
                style={{ 
                  borderBottomColor: activeTab === 'participants' ? eventColor : 'transparent'
                }}
              >
                Participants
                {/* {currentEvent.participations && currentEvent.participations.filter(p => p.responseStatus !== null).length > 0 && (
                  <span className="ml-2 bg-gray-100 text-gray-700 rounded-full w-5 h-5 text-xs flex items-center justify-center">
                    {currentEvent.participations.filter(p => p.responseStatus !== null).length}
                  </span>
                )} */}
              </button>
            )}
          </div>
          
          {/* Details tab content */}
          {activeTab === 'details' && (
            <div className="p-6">
              {/* Description section */}
              {currentEvent.description ? (
                <div className="mb-6">
                  <h3 className="text-sm font-medium text-gray-500 mb-2">Description</h3>
                  <p className="text-gray-700 whitespace-pre-line">{currentEvent.description}</p>
                </div>
              ) : (
                <div className="mb-6 py-2 px-3 bg-gray-50 rounded-md text-gray-500 text-sm italic">
                  No description provided
                </div>
              )}
              
              {/* Additional event details */}
              <div className="space-y-4">
                {/* Category */}
                <div className="flex items-center">
                  <div className="w-8 flex items-center justify-center text-gray-400">
                    {currentEvent.category === EventCategory.HOME ? (
                      <span className="text-lg">🏠</span>
                    ) : (
                      <span className="text-lg">💼</span>
                    )}
                  </div>
                  <div className="ml-3">
                    <div className="text-sm font-medium text-gray-900">Category</div>
                    <div className="text-sm text-gray-500">
                      {currentEvent.category === EventCategory.HOME ? "Home" : "Work"}
                    </div>
                  </div>
                </div>
                
                {/* Task-specific details */}
                {currentEvent.type === EventType.TASK && currentEvent.task && (
                  <>
                    {/* Priority */}
                    <div className="flex items-center">
                      <div className="w-8 flex items-center justify-center text-gray-400">
                        <AlertCircle size={18} />
                      </div>
                      <div className="ml-3 flex items-center">
                        <div className="text-sm font-medium text-gray-900 mr-2">Priority:</div>
                        <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${
                          currentEvent.task.priority === TaskPriority.LOW 
                            ? 'bg-blue-100 text-blue-800' 
                            : currentEvent.task.priority === TaskPriority.MEDIUM 
                              ? 'bg-yellow-100 text-yellow-800' 
                              : 'bg-red-100 text-red-800'
                        }`}>
                          {currentEvent.task.priority ? (currentEvent.task.priority.charAt(0).toUpperCase() + currentEvent.task.priority.slice(1)) : "None"}
                        </span>
                      </div>
                    </div>
                    
                    {/* Status with toggle */}
                    <div className="flex items-center">
                      <div className="w-8 flex items-center justify-center text-gray-400">
                        <CheckSquare size={18} />
                      </div>
                      <div className="ml-3 flex items-center">
                        <div className="text-sm font-medium text-gray-900 mr-2">Status:</div>
                        {canEditEvent ? (
                          <button 
                            onClick={() => {
                              if (currentEvent.id && currentEvent.task) {
                                const updatedTask = {
                                  ...currentEvent.task,
                                  isCompleted: !currentEvent.task.isCompleted
                                };
                                
                                // Create a payload with only the status
                                const updatePayload: Partial<UpdateEventPayload> = {
                                  isCompleted: !currentEvent.task.isCompleted
                                };
                                
                                dispatch(updateEvent(currentEvent.id, updatePayload));
                              }
                            }}
                            className={`px-3 py-1 rounded-full text-xs font-medium flex items-center ${
                              currentEvent.task.isCompleted
                                ? 'bg-green-100 text-green-800'
                                : 'bg-gray-100 text-gray-800 hover:bg-gray-200'
                            }`}
                          >
                            {currentEvent.task.isCompleted ? (
                              <>
                                <Check size={14} className="mr-1" />
                                Completed
                              </>
                            ) : 'Mark as completed'}
                          </button>
                        ) : (
                          <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${
                            currentEvent.task.isCompleted
                              ? 'bg-green-100 text-green-800'
                              : 'bg-gray-100 text-gray-800'
                          }`}>
                            {currentEvent.task.isCompleted ? 'Completed' : 'Incomplete'}
                          </span>
                        )}
                      </div>
                    </div>
                  </>
                )}
              </div>
            </div>
          )}
          
          {/* Participants tab content */}
          {activeTab === 'participants' && currentEvent.type === EventType.ARRANGEMENT && (
  <div className="p-6">
    {/* Add participant button (if can manage) */}
    {canManageParticipants && (
      <button 
        onClick={() => setShowParticipantModal(true)}
        className="w-full mb-4 py-2 px-4 border border-dashed border-gray-300 rounded-lg text-indigo-600 font-medium text-sm hover:bg-indigo-50 transition-colors flex items-center justify-center"
      >
        <UserPlus size={16} className="mr-2" />
        Add participants
      </button>
    )}
    
    {/* Participants list */}
    <div className="space-y-1">
      <h3 className="text-sm font-medium text-gray-500 mb-3">Participants</h3>
      
      {currentEvent.participations && currentEvent.participations.length > 0 ? (
        <div className="rounded-lg border border-gray-200 overflow-hidden">
          {/* Фильтруем дубликаты участников по email */}
          {(() => {
            // Создаем Map для хранения уникальных участников
            const uniqueParticipants = new Map();
            
            // Перебираем всех участников
            currentEvent.participations
              .filter(participant => participant.responseStatus !== null)
              .forEach(participant => {
                const email = participant.calendarMember?.user?.email;
                const userId = participant.calendarMember?.user?.id;
                
                // Используем email как уникальный ключ
                const key = email || userId;
                
                if (key && !uniqueParticipants.has(key)) {
                  uniqueParticipants.set(key, participant);
                }
              });
            
            // Преобразуем Map обратно в массив
            return Array.from(uniqueParticipants.values()).map((participant, index, filteredArray) => (
              <div 
                key={participant.id} 
                className={`flex items-center justify-between p-3 ${
                  index < filteredArray.length - 1 ? 'border-b border-gray-200' : ''
                } hover:bg-gray-50`}
              >
                <div className="flex items-center">
                  <img 
                    src={`http://localhost:3000/uploads/avatars/${participant.calendarMember.user.profilePictureName}`}
                    alt="avatar"
                    className="w-8 h-8 rounded-full mr-3"
                  />
                  <div>
                    <div className="text-sm font-medium text-gray-900">
                      {participant.calendarMember.user.firstName} {participant.calendarMember.user.lastName}
                    </div>
                    <div className="text-xs text-gray-500">{participant.calendarMember.user.email}</div>
                  </div>
                </div>
                
                <div className="flex items-center">
                  {/* Status badge */}
                  <span className={`text-xs px-2 py-1 rounded-full ${
                    participant.responseStatus === ResponseStatus.ACCEPTED
                      ? 'bg-green-100 text-green-800'
                      : participant.responseStatus === ResponseStatus.DECLINED
                      ? 'bg-red-100 text-red-800'
                      : 'bg-gray-100 text-gray-800'
                  }`}>
                    {participant.responseStatus}
                  </span>
                  
                  {/* Action buttons */}
                  {participant.calendarMember.userId === authUser?.id && 
                    participant.responseStatus !== ResponseStatus.ACCEPTED && 
                    participant.responseStatus !== ResponseStatus.DECLINED && (
                    <div className="flex space-x-1 ml-2">
                      <button
                        onClick={() => handleUpdateParticipantStatus(
                          participant.calendarMemberId, 
                          ResponseStatus.ACCEPTED
                        )}
                        className="p-1 bg-green-100 text-green-600 rounded hover:bg-green-200"
                        title="Accept"
                      >
                        <Check size={14} />
                      </button>
                      <button
                        onClick={() => handleUpdateParticipantStatus(
                          participant.calendarMemberId, 
                          ResponseStatus.DECLINED
                        )}
                        className="p-1 bg-red-100 text-red-600 rounded hover:bg-red-200"
                        title="Decline"
                      >
                        <X size={14} />
                      </button>
                    </div>
                  )}
                  
                  {/* Remove participant button */}
                  {canManageParticipants && 
                    participant.calendarMember.userId !== authUser?.id && (
                    <button
                      onClick={() => handleRemoveParticipant(participant.calendarMemberId)}
                      className="ml-2 p-1 text-gray-400 hover:text-red-500 rounded-full hover:bg-gray-100"
                      title="Remove participant"
                    >
                      <Trash2 size={14} />
                    </button>
                  )}
                </div>
              </div>
            ));
          })()}
        </div>
      ) : (
        <div className="text-sm text-gray-500 italic p-4 bg-gray-50 rounded-lg">
          No participants
        </div>
      )}
    </div>
  </div>
)}
        </div>
        
        {/* Action buttons */}
        <div className="p-4 border-t border-gray-200 bg-gray-50 flex justify-between">
  <div>
    {/* Only show delete button if user can delete */}
    {canDeleteEvent && (
      <button
        onClick={handleDeleteEvent}
        className="px-4 py-2 text-red-600 bg-white border border-red-300 rounded-md hover:bg-red-50 transition-colors text-sm font-medium flex items-center shadow-sm"
      >
        <Trash2 size={16} className="mr-1" />
        Delete
      </button>
    )}
  </div>
  
  <div className="flex space-x-3">
    <button
      onClick={() => setShowEventDetailModal(false)}
      className="px-4 py-2 bg-white border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50 transition-colors text-sm font-medium shadow-sm"
    >
      Close
    </button>
    
    {/* Only show edit button if user can edit */}
    {canEditEvent && (
      <button
        onClick={handleEditEvent}
        className="px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 transition-colors text-sm font-medium flex items-center shadow-sm"
      >
        <Edit2 size={16} className="mr-1" />
        Edit
      </button>
    )}
  </div>
</div>
      </div>
    </div>
  );
};
  const renderParticipantModal = () => {
    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
        <div className="bg-white rounded-lg shadow-xl w-full max-w-md overflow-hidden">
          <div className="bg-indigo-600 text-white px-6 py-4 flex justify-between items-center">
            <h2 className="text-xl font-bold">Add Participant</h2>
            <button 
              onClick={() => setShowParticipantModal(false)}
              className="text-white hover:text-indigo-100"
            >
              <X size={24} />
            </button>
          </div>
          
          <form onSubmit={handleAddParticipant} className="p-6">
            <div className="mb-4">
              <label className="block text-sm font-medium text-slate-700 mb-1">
                Email
              </label>
              <input
                type="email"
                value={participantEmail}
                onChange={(e) => setParticipantEmail(e.target.value)}
                className="w-full border border-slate-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                placeholder="user@example.com"
                required
              />
            </div>
            
            <div className="flex justify-end space-x-3 pt-3 border-t">
              <button
                type="button"
                onClick={() => setShowParticipantModal(false)}
                className="px-4 py-2 bg-white border border-slate-300 text-slate-700 rounded-md hover:bg-slate-50 transition-colors"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 transition-colors"
                disabled={isAddingParticipant}
              >
                {isAddingParticipant ? "Adding..." : "Add Participant"}
              </button>
            </div>
          </form>
        </div>
      </div>
    );
  };

  return (
    <div className="p-6 bg-white rounded-xl shadow-lg relative">
      {/* Header and navigation */}
      <div className="mb-6">
        <div className="flex flex-col sm:flex-row justify-between items-center mb-6 gap-4">
          <h2 className="text-2xl font-bold text-slate-800 flex items-center">
            <span className="mr-2 text-indigo-600">
              {currentView === "day" ? "🗓️" : 
               currentView === "week" ? "🗓️" : 
               currentView === "month" ? "🗓️" : "🗓️"}
            </span>
            {(() => {
              switch (currentView) {
                case "month":
                  return format(currentDate, "MMMM yyyy");
                case "week": {
                  const startWeek = startOfWeek(currentDate, { weekStartsOn: 0 });
                  const endWeek = endOfWeek(currentDate, { weekStartsOn: 0 });
                  const weekNumber = getWeek(currentDate, { weekStartsOn: 0 });
                  return (
                    <div className="flex items-center">
                      <div>
                        <div className="text-xl font-bold">
                          Week {weekNumber}, {format(startWeek, "MMM d")} – {format(endWeek, "MMM d, yyyy")}
                        </div>
                      </div>
                    </div>
                  );
                }  
                case "day":
                  return format(currentDate, "EEEE, MMMM d, yyyy");
                case "year":
                  return currentYear.toString();
                default:
                  return "";
              }
            })()}
          </h2>
          
          <div className="flex items-center space-x-3">
            <button
              onClick={handleToday}
              className="px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 transition-colors font-medium text-sm"
            >
              Today
            </button>
            <div className="flex border rounded-md overflow-hidden">
              <button
                onClick={handlePrev}
                className="px-3 py-2 bg-white hover:bg-slate-100 text-slate-700 border-r"
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M12.707 5.293a1 1 0 010 1.414L9.414 10l3.293 3.293a1 1 0 01-1.414 1.414l-4-4a1 1 0 010-1.414l4-4a1 1 0 011.414 0z" clipRule="evenodd" />
                </svg>
              </button>
              <button
                onClick={handleNext}
                className="px-3 py-2 bg-white hover:bg-slate-100 text-slate-700"
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z" clipRule="evenodd" />
                </svg>
              </button>
            </div>
            <button
  onClick={() => navigate('/calendar/create-event')}
  className="px-4 py-2 bg-emerald-500 text-white rounded-md hover:bg-emerald-600 transition-colors font-medium text-sm flex items-center"
>
  <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1" viewBox="0 0 20 20" fill="currentColor">
    <path fillRule="evenodd" d="M10 3a1 1 0 011 1v5h5a1 1 0 110 2h-5v5a1 1 0 11-2 0v-5H4a1 1 0 110-2h5V4a1 1 0 011-1z" clipRule="evenodd" />
  </svg>
  Add Event
</button>
          </div>
        </div>
        
        {/* View toggles */}
        <div className="flex justify-center">
          <div className="inline-flex rounded-md shadow-sm bg-slate-100 p-1">
            <button
              onClick={() => setCurrentView("day")}
              className={`px-4 py-2 text-sm font-medium rounded-md transition-colors ${
                currentView === "day"
                  ? "bg-white text-indigo-700 shadow-sm"
                  : "text-slate-600 hover:bg-slate-200"
              }`}
            >
              Day
            </button>
            <button
              onClick={() => setCurrentView("week")}
              className={`px-4 py-2 text-sm font-medium rounded-md transition-colors ${
                currentView === "week"
                  ? "bg-white text-indigo-700 shadow-sm"
                  : "text-slate-600 hover:bg-slate-200"
              }`}
            >
              Week
            </button>
            <button
              onClick={() => setCurrentView("month")}
              className={`px-4 py-2 text-sm font-medium rounded-md transition-colors ${
                currentView === "month"
                  ? "bg-white text-indigo-700 shadow-sm"
                  : "text-slate-600 hover:bg-slate-200"
              }`}
            >
              Month
            </button>
            <button
              onClick={() => setCurrentView("year")}
              className={`px-4 py-2 text-sm font-medium rounded-md transition-colors ${
                currentView === "year"
                  ? "bg-white text-indigo-700 shadow-sm"
                  : "text-slate-600 hover:bg-slate-200"
              }`}
            >
              Year
            </button>
          </div>
        </div>
      </div>
      
      {/* Week days header for month view */}
      {currentView === "month" && weekdaysHeader}

      {/* Main calendar content */}
      <div className={`${currentView === "month" ? "space-y-2" : ""}`}>
        {currentView === "month" && monthRows}
        {currentView === "week" && renderWeekView()}
        {currentView === "day" && renderDayView()}
        {currentView === "year" && renderYearView()}
      </div>

      {/* Modals */}
      {showEventModal && renderEventModal()}
      {showEventDetailModal && renderEventDetailModal()}
      {showParticipantModal && renderParticipantModal()}
    </div>
  );
};

export default CustomCalendar;