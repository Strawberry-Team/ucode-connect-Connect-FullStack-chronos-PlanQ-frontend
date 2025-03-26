// import React, { useState, useEffect, useMemo } from "react";
// import { useDispatch, useSelector } from "react-redux";
// import {
//   format,
//   startOfMonth,
//   endOfMonth,
//   startOfWeek,
//   endOfWeek,
//   addDays,
//   addMonths,
//   subMonths,
//   addWeeks,
//   subWeeks,
//   getWeek,
//   parseISO,
//   isSameDay,
// } from "date-fns";
// import { 
//   createEvent, 
//   updateEvent, 
//   deleteEvent, 
//   getEvent,
//   getCalendarEvents,
//   addEventParticipant,
//   updateEventParticipant,
//   removeEventParticipant
// } from "../actions/eventActions";
// import { AppDispatch, RootState } from "../store";
// import { 
//   EventCategory, 
//   EventType, 
//   TaskPriority, 
//   ResponseStatus,
//   CreateEventPayload,
//   UpdateEventPayload,
//   Event
// } from "../types/eventTypes";
// import { Check, Edit2, Trash2, UserPlus, AlertCircle, X, Calendar, CheckSquare, Clock } from "lucide-react";

// export interface CalendarEvent {
//   id: string;
//   title: string;
//   start: string;
//   end?: string;
//   description?: string;
//   calendarId: string;
//   type: "task" | "reminder" | "arrangement" | "holiday";
//   color: string;
//   category?: "home" | "work";
//   priority?: "low" | "medium" | "high";
//   isCompleted?: boolean;
//   creatorId?: number;
//   participations?: any[];
// }

// export interface CalendarData {
//   id: string;
//   title: string;
//   description: string;
//   isVisible: boolean;
//   color: string;
//   calendarType: string;
//   events?: CalendarEvent[];
//   creatorId?: string;
//   role?: string;
// }

// interface CustomCalendarProps {
//   events: CalendarEvent[];
//   calendars: CalendarData[];
//   onAddEvent: (event: CalendarEvent) => void;
// }

// /*
//   Function to calculate event positions
// */
// const calculateEventPositions = (
//   events: CalendarEvent[],
//   startHour: number,
//   hourHeight: number
// ) => {
//   const sortedEvents = events
//     .slice()
//     .sort(
//       (a, b) =>
//         new Date(a.start).getTime() - new Date(b.start).getTime()
//     );

//   const groups: CalendarEvent[][] = [];
//   let currentGroup: CalendarEvent[] = [];

//   sortedEvents.forEach((event) => {
//     const eventStart = new Date(event.start).getTime();
//     const eventEnd = event.end
//       ? new Date(event.end).getTime()
//       : new Date(event.start).getTime() + 30 * 60000;
//     if (currentGroup.length === 0) {
//       currentGroup.push(event);
//     } else {
//       const overlap = currentGroup.some((ev) => {
//         const evStart = new Date(ev.start).getTime();
//         const evEnd = ev.end
//           ? new Date(ev.end).getTime()
//           : new Date(ev.start).getTime() + 30 * 60000;
//         return eventStart < evEnd && eventEnd > evStart;
//       });
//       if (overlap) {
//         currentGroup.push(event);
//       } else {
//         groups.push(currentGroup);
//         currentGroup = [event];
//       }
//     }
//   });
//   if (currentGroup.length) {
//     groups.push(currentGroup);
//   }

//   const layouts: { event: CalendarEvent; column: number; total: number }[] =
//     [];
//   groups.forEach((group) => {
//     const columns: CalendarEvent[] = [];
//     group.forEach((event) => {
//       const eventStart = new Date(event.start).getTime();
//       const eventEnd = event.end
//         ? new Date(event.end).getTime()
//         : new Date(event.start).getTime() + 30 * 60000;
//       let placed = false;
//       for (let i = 0; i < columns.length; i++) {
//         const lastEvent = columns[i];
//         const lastEnd = lastEvent.end
//           ? new Date(lastEvent.end).getTime()
//           : new Date(lastEvent.start).getTime() + 30 * 60000;
//         if (eventStart >= lastEnd) {
//           columns[i] = event;
//           layouts.push({ event, column: i, total: 0 });
//           placed = true;
//           break;
//         }
//       }
//       if (!placed) {
//         columns.push(event);
//         layouts.push({ event, column: columns.length - 1, total: 0 });
//       }
//     });
//     group.forEach((event) => {
//       const layout = layouts.find((l) => l.event.id === event.id);
//       if (layout) {
//         layout.total = columns.length;
//       }
//     });
//   });

//   return layouts.map((item) => {
//     const eventStart = new Date(item.event.start);
//     const eventEnd = item.event.end
//       ? new Date(item.event.end)
//       : new Date(eventStart.getTime() + 30 * 60000);
//     const startMinutes =
//       eventStart.getHours() * 60 + eventStart.getMinutes();
//     const endMinutes = eventEnd.getHours() * 60 + eventEnd.getMinutes();
//     const top = ((startMinutes - startHour * 60) / 60) * hourHeight;
//     const height = ((endMinutes - startMinutes) / 60) * hourHeight;

//     const widthPercentage = 100 / item.total;
//     const leftPercentage = item.column * widthPercentage;
//     return {
//       event: item.event,
//       top,
//       height,
//       left: leftPercentage,
//       width: widthPercentage,
//     };
//   });
// };

// /*
//   Year View Component
// */
// interface YearViewProps {
//   year: number;
//   events: CalendarEvent[];
//   onDayClick: (date: string) => void;
// }

// const YearView: React.FC<YearViewProps> = ({ year, events, onDayClick }) => {
//   const months = [
//     "January", "February", "March", "April", "May", "June",
//     "July", "August", "September", "October", "November", "December"
//   ];
//   return (
//     <div className="grid grid-cols-4 gap-6 p-6 bg-slate-50 rounded-lg">
//       {months.map((month, index) => {
//         const monthEvents = events.filter((event) => {
//           const eventDate = new Date(event.start);
//           return (
//             eventDate.getFullYear() === year &&
//             eventDate.getMonth() === index
//           );
//         });
//         const daysCount = new Date(year, index + 1, 0).getDate();
//         const firstDayIndex = new Date(year, index, 1).getDay();
//         const blanks = Array.from({ length: firstDayIndex }, () => null);
//         const days = Array.from({ length: daysCount }, (_, i) => i + 1);
//         const totalCells = blanks.length + days.length;
//         const remainder = totalCells % 7;
//         const trailingBlanks = remainder
//           ? Array.from({ length: 7 - remainder }, () => null)
//           : [];
//         const allCells = [...blanks, ...days, ...trailingBlanks];
//         return (
//           <div key={month} className="bg-white shadow-sm rounded-lg overflow-hidden">
//             <h3 className="text-lg font-semibold px-4 py-3 bg-indigo-50 text-indigo-800 border-b border-indigo-100">
//               {month}
//             </h3>
//             <div className="grid grid-cols-7 text-center text-xs font-medium text-slate-500 bg-slate-50">
//               <span className="py-1">Su</span>
//               <span className="py-1">Mo</span>
//               <span className="py-1">Tu</span>
//               <span className="py-1">We</span>
//               <span className="py-1">Th</span>
//               <span className="py-1">Fr</span>
//               <span className="py-1">Sa</span>
//             </div>
//             <div className="grid grid-cols-7 text-center text-sm">
//               {allCells.map((cell, idx) => {
//                 if (cell === null) {
//                   return <div key={idx} className="p-1"></div>;
//                 } else {
//                   const date = new Date(year, index, cell);
//                   const eventsForDay = monthEvents.filter(
//                     (event) =>
//                       new Date(event.start).toDateString() ===
//                       date.toDateString()
//                   );
//                   const isToday = format(date, "yyyy-MM-dd") === format(new Date(), "yyyy-MM-dd");
                  
//                   return (
//                     <div
//                       key={idx}
//                       className={`p-1 ${isToday ? 'bg-indigo-50' : ''} rounded-full m-1 
//                                  cursor-pointer hover:bg-indigo-100 transition-colors duration-200`}
//                       onClick={() =>
//                         onDayClick(format(date, "yyyy-MM-dd"))
//                       }
//                     >
//                       <div className={`${isToday ? 'font-bold text-indigo-700' : ''}`}>{cell}</div>
//                       {eventsForDay.length > 0 && (
//                         <div className="flex justify-center space-x-1 mt-1">
//                           {eventsForDay.slice(0, 3).map((event, idx) => (
//                             <div
//                               key={idx}
//                               className="w-1.5 h-1.5 rounded-full"
//                               style={{ backgroundColor: event.color }}
//                             ></div>
//                           ))}
//                           {eventsForDay.length > 3 && (
//                             <div className="w-1.5 h-1.5 rounded-full bg-gray-400"></div>
//                           )}
//                         </div>
//                       )}
//                     </div>
//                   );
//                 }
//               })}
//             </div>
//           </div>
//         );
//       })}
//     </div>
//   );
// };

// const CustomCalendar: React.FC<CustomCalendarProps> = ({
//   events: initialEvents,
//   calendars,
//   onAddEvent,
// }) => {
//   const dispatch: AppDispatch = useDispatch();
//   const authUser = useSelector((state: RootState) => state.auth.user);
//   const { currentEvent, loading, error } = useSelector((state: RootState) => state.event);
  
//   // Состояние для хранения событий
//   const [events, setEvents] = useState<CalendarEvent[]>(initialEvents || []);
//   const [isLoadingEvents, setIsLoadingEvents] = useState<boolean>(true);
  
//   // Calendar view state
//   const [currentView, setCurrentView] = useState<"day" | "week" | "month" | "year">("month");
//   const [currentDate, setCurrentDate] = useState(new Date());
//   const [currentYear, setCurrentYear] = useState(new Date().getFullYear());
  
//   // Event state
//   const [showEventModal, setShowEventModal] = useState(false);
//   const [showEventDetailModal, setShowEventDetailModal] = useState(false);
//   const [showParticipantModal, setShowParticipantModal] = useState(false);
//   const [selectedEventId, setSelectedEventId] = useState<number | null>(null);
//   const [participantEmail, setParticipantEmail] = useState("");
//   const [isAddingParticipant, setIsAddingParticipant] = useState(false);
  
//   // Event form data
//   const [eventFormData, setEventFormData] = useState<{
//     id?: number;
//     name: string;
//     description: string;
//     category: EventCategory;
//     startedAt: string;
//     endedAt: string;
//     color: string;
//     type: EventType;
//     calendarId: number;
//     priority?: TaskPriority;
//     isCompleted?: boolean;
//     isEditing: boolean;
//   }>({
//     name: "",
//     description: "",
//     category: EventCategory.HOME,
//     startedAt: "",
//     endedAt: "",
//     color: "#4CAF50",
//     type: EventType.TASK,
//     calendarId: calendars && calendars.length > 0 ? parseInt(calendars[0].id) : 0,
//     isEditing: false
//   });

//   // For tracking current time
//   const [currentNow, setCurrentNow] = useState(new Date());
  
//   // Загрузка событий из базы данных при монтировании компонента
//   useEffect(() => {
//     const fetchCalendarEvents = async () => {
//       setIsLoadingEvents(true);
//       try {
//         // Если есть календари, загрузить события для всех календарей
//         if (calendars && calendars.length > 0) {
//           const allEvents: CalendarEvent[] = [];
          
//           for (const calendar of calendars) {
//             // Получаем ID пользователя и календаря
//             const calendarId = parseInt(calendar.id);
//             const userId = authUser?.id;
            
//             if (userId) {
//               // Получаем события для текущего календаря
//               const calendarEvents = await dispatch(getCalendarEvents(calendarId, userId));
              
//               // Преобразуем события из API в формат CalendarEvent
//               if (calendarEvents) {
//                 const formattedEvents = calendarEvents.map((eventData: any) => {
//                   const eventDetails = eventData.event;
//                   return {
//                     id: eventData.eventId.toString(),
//                     title: eventDetails.name,
//                     start: eventDetails.startedAt,
//                     end: eventDetails.endedAt,
//                     description: eventDetails.description || "",
//                     calendarId: calendar.id,
//                     type: eventDetails.type,
//                     color: eventData.color || calendar.color,
//                     category: eventDetails.category,
//                     priority: eventDetails.task?.priority,
//                     isCompleted: eventDetails.task?.isCompleted,
//                     creatorId: eventDetails.creatorId
//                   };
//                 });
                
//                 allEvents.push(...formattedEvents);
//               }
//             }
//           }
          
//           // Обновляем состояние с загруженными событиями
//           setEvents(allEvents);
//         }
//       } catch (error) {
//         console.error("Failed to fetch calendar events:", error);
//       } finally {
//         setIsLoadingEvents(false);
//       }
//     };
    
//     fetchCalendarEvents();
//   }, [dispatch, calendars, authUser]);
  
//   useEffect(() => {
//     const timer = setInterval(() => {
//       setCurrentNow(new Date());
//     }, 60000);
//     return () => clearInterval(timer);
//   }, []);

//   // Fetch event details when selected
//   useEffect(() => {
//     if (selectedEventId) {
//       dispatch(getEvent(selectedEventId));
//     }
//   }, [selectedEventId, dispatch]);

//   // Вспомогательная функция для преобразования событий API в формат CalendarEvent
//   const mapApiEventsToCalendarEvents = (apiEvents: any[], calendarsList: CalendarData[]): CalendarEvent[] => {
//     return apiEvents.map((eventData: any) => {
//       const eventDetails = eventData.event;
//       const calendar = calendarsList.find(cal => cal.id === String(eventData.calendarMemberId)) || calendarsList[0];
      
//       return {
//         id: eventData.eventId.toString(),
//         title: eventDetails.name,
//         start: eventDetails.startedAt,
//         end: eventDetails.endedAt,
//         description: eventDetails.description || "",
//         calendarId: calendar.id,
//         type: eventDetails.type,
//         color: eventData.color || calendar.color,
//         category: eventDetails.category,
//         priority: eventDetails.task?.priority,
//         isCompleted: eventDetails.task?.isCompleted,
//         creatorId: eventDetails.creatorId
//       };
//     });
//   };

//   // Time grid settings
//   const startHour = 0;
//   const endHour = 24;
//   const hourHeight = 60;
//   const allDayHeight = 50;

//   // =================== MONTH VIEW ===================
//   const monthStart = startOfMonth(currentDate);
//   const monthEnd = endOfMonth(monthStart);
//   const startDt = startOfWeek(monthStart, { weekStartsOn: 0 });
//   const endDt = endOfWeek(monthEnd, { weekStartsOn: 0 });
//   const dateFormat = "d";

//   const monthRows: JSX.Element[] = [];
//   let monthDays: JSX.Element[] = [];
//   let day = startDt;
//   let formattedDate = "";

//   const weekdays = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

//   // Render week days header
//   const weekdaysHeader = (
//     <div className="grid grid-cols-7 gap-1 mb-2">
//       {weekdays.map((day) => (
//         <div key={day} className="text-center font-medium text-slate-600 text-sm py-2">
//           {day}
//         </div>
//       ))}
//     </div>
//   );

//   // Build month view
//   while (day <= endDt) {
//     for (let i = 0; i < 7; i++) {
//       formattedDate = format(day, dateFormat);
//       const cloneDay = day;
//       const dayString = format(cloneDay, "yyyy-MM-dd");
//       const dayEvents = events.filter(
//         (event) =>
//           format(new Date(event.start), "yyyy-MM-dd") === dayString
//       );
      
//       const isToday = dayString === format(new Date(), "yyyy-MM-dd");
//       const isCurrentMonth = day.getMonth() === currentDate.getMonth();
      
//       monthDays.push(
//         <div
//           key={day.toString()}
//           className={`border rounded-lg p-2 h-32 cursor-pointer transition-all duration-200 
//                      ${isToday ? 'ring-2 ring-indigo-500 bg-indigo-50' : 'hover:bg-slate-50'}
//                      ${isCurrentMonth ? 'bg-white' : 'bg-slate-50/50 text-slate-400'}`}
//           onClick={() => {
//             setCurrentDate(cloneDay);
//             setCurrentView("day");
//           }}
//         >
//           <div className={`text-xs font-semibold ${isToday ? 'text-indigo-700' : 'text-slate-700'} 
//                            flex justify-between items-center`}>
//             <span className={`${isToday ? 'bg-indigo-500 text-white h-6 w-6 rounded-full flex items-center justify-center' : ''}`}>
//               {formattedDate}
//             </span>
//             {dayEvents.length > 0 && (
//               <span className="text-xs text-indigo-600 font-medium">{dayEvents.length}</span>
//             )}
//           </div>
//           {dayEvents.length > 0 && (
//             <div className="mt-2 space-y-1.5 overflow-hidden">
//               {dayEvents.slice(0, 3).map((event) => {
//                 const calendar = calendars.find(cal => cal.id === event.calendarId) || { color: event.color };
//                 const eventBgColor = event.color && event.color.trim() !== "" ? event.color : calendar.color;
                
//                 // Determine event type icon
//                 let typeIcon;
//                 switch(event.type) {
//                   case 'arrangement':
//                     typeIcon = '🗓️';
//                     break;
//                   case 'task':
//                     typeIcon = '✓';
//                     break;
//                   case 'reminder':
//                     typeIcon = '⏰';
//                     break;
//                   case 'holiday':
//                     typeIcon = '🏖️';
//                     break;
//                   default:
//                     typeIcon = '⏰';
//                 }
                       
//                 return (
//                   <div
//                     key={event.id}
//                     className="flex items-center text-xs px-2 py-1 rounded-md"
//                     style={{ 
//                       backgroundColor: `${eventBgColor}15`,
//                       borderLeft: `4px solid ${eventBgColor}` 
//                     }}
//                     onClick={(e) => {
//                       e.stopPropagation();
//                       setSelectedEventId(parseInt(event.id));
//                       setShowEventDetailModal(true);
//                     }}
//                   >
//                     <span className="text-xs mr-1">{typeIcon}</span>
//                     <span className="truncate text-slate-700">{event.title}</span>
//                   </div>
//                 );
//               })}
//               {dayEvents.length > 3 && (
//                 <div className="text-xs text-slate-500 italic pl-2">
//                   +{dayEvents.length - 3} more
//                 </div>
//               )}
//             </div>
//           )}
//         </div>
//       );
//       day = addDays(day, 1);
//     }
//     monthRows.push(
//       <div className="grid grid-cols-7 gap-2" key={day.toString()}>
//         {monthDays}
//       </div>
//     );
//     monthDays = [];
//   }

//   // =================== WEEK VIEW ===================
//   const renderWeekView = () => {
//     const startWeek = startOfWeek(currentDate, { weekStartsOn: 0 });
//     const weekDays = Array.from({ length: 7 }, (_, i) =>
//       addDays(startWeek, i)
//     );
//     const hours: number[] = [];
//     for (let h = startHour; h < endHour; h++) {
//       hours.push(h);
//     }
//     const totalHeight = (endHour - startHour) * hourHeight;

//     return (
//       <div className="overflow-auto relative rounded-lg shadow-sm border border-slate-200 bg-white">
//         {/* Header for days of the week and All Day area */}
//         <div className="grid grid-cols-8 sticky top-0 z-10 bg-white">
//           <div className="border-b border-r border-slate-200 bg-slate-50" style={{ height: allDayHeight }}></div>
//           {weekDays.map((d, idx) => {
//             const isToday = format(d, "yyyy-MM-dd") === format(new Date(), "yyyy-MM-dd");
//             return (
//               <div
//                 key={idx}
//                 className={`text-center font-medium border-b py-3 text-sm ${
//                   isToday ? 'bg-indigo-50 text-indigo-700' : 'bg-slate-50 text-slate-700'
//                 }`}
//               >
//                 <div className="font-bold">{format(d, "EEE")}</div>
//                 <div className={`${isToday ? 'bg-indigo-600 text-white rounded-full w-7 h-7 flex items-center justify-center mx-auto mt-1' : ''}`}>
//                   {format(d, "dd")}
//                 </div>
//               </div>
//             );
//           })}
//         </div>
        
//         {/* All Day events area */}
//         <div className="grid grid-cols-8">
//           <div className="border-r border-b border-slate-200 p-2 bg-slate-50">
//             <div className="text-xs font-medium text-slate-600">All Day</div>
//           </div>
//           {weekDays.map((dayItem, idx) => {
//             const dayStr = format(dayItem, "yyyy-MM-dd");
//             const isToday = dayStr === format(new Date(), "yyyy-MM-dd");
//             const allDayEvents = events.filter(
//               (event) =>
//                 format(new Date(event.start), "yyyy-MM-dd") === dayStr &&
//                 event.type === "holiday"
//             );
//             return (
//               <div
//                 key={idx}
//                 className={`border-r border-b border-slate-200 p-1 ${
//                   isToday ? 'bg-indigo-50/30' : ''
//                 }`}
//                 style={{ height: allDayHeight }}
//               >
//                 {allDayEvents.map((event) => (
//                   <div
//                     key={event.id}
//                     className="text-xs rounded-md px-2 py-1 mb-1 truncate"
//                     style={{ 
//                       backgroundColor: `${event.color}20`,
//                       borderLeft: `3px solid ${event.color}`,
//                       color: '#333'
//                     }}
//                     title={event.title}
//                   >
//                     <span className="mr-1">🏖️</span>
//                     {event.title}
//                   </div>
//                 ))}
//               </div>
//             );
//           })}
//         </div>
        
//         {/* Time grid */}
//         <div className="grid grid-cols-8 relative">
//           <div className="relative bg-slate-50">
//             {hours.map((hour) => (
//               <div
//                 key={hour}
//                 style={{ height: `${hourHeight}px` }}
//                 className="border-t border-slate-200 text-right pr-2 text-xs text-slate-500 flex items-start justify-end pt-1"
//               >
//                 {hour === 0 ? '12 AM' : hour < 12 ? `${hour} AM` : hour === 12 ? '12 PM' : `${hour-12} PM`}
//               </div>
//             ))}
//           </div>
//           {weekDays.map((dayItem, idx) => {
//             const dayStr = format(dayItem, "yyyy-MM-dd");
//             const isToday = dayStr === format(new Date(), "yyyy-MM-dd");
//             const dayEvents = events.filter(
//               (event) =>
//                 format(new Date(event.start), "yyyy-MM-dd") === dayStr &&
//                 event.type !== "holiday"
//             );
//             const layouts = calculateEventPositions(
//               dayEvents,
//               startHour,
//               hourHeight
//             );
//             return (
//               <div
//                 key={idx}
//                 className={`relative border-l border-slate-200 ${isToday ? 'bg-indigo-50/30' : ''}`}
//                 style={{ height: `${totalHeight}px` }}
//                 onDoubleClick={(e) => handleWeekViewDoubleClick(e, dayItem)}
//               >
//                 {hours.map((hour, i) => (
//                   <div
//                     key={i}
//                     style={{ height: `${hourHeight}px` }}
//                     className="border-t border-slate-200"
//                   ></div>
//                 ))}
                
//                 {/* Current time line */}
//                 {isToday && (() => {
//                   const currentMinutes =
//                     currentNow.getHours() * 60 + currentNow.getMinutes();
//                   const lineTop =
//                     ((currentMinutes - startHour * 60) / 60) * hourHeight;
//                   return (
//                     <div
//                       className="absolute left-0 right-0 z-20"
//                       style={{ top: lineTop }}
//                     >
//                       <div className="relative">
//                         <div className="absolute -left-1 w-2 h-2 rounded-full bg-red-500"></div>
//                         <div className="border-t-2 border-red-500 border-dashed w-full"></div>
//                       </div>
//                     </div>
//                   );
//                 })()}
                
//                 {layouts.map((layout) => {
//                   const calendar =
//                     calendars.find(
//                       (cal) => cal.id === layout.event.calendarId
//                     ) || { color: "#3B82F6" };
//                   const calendarColor = calendar.color;
//                   const eventBgColor =
//                     layout.event.color && layout.event.color.trim() !== ""
//                       ? layout.event.color
//                       : calendarColor;
                      
//                   // Get event time for display
//                   const eventStart = new Date(layout.event.start);
//                   const startTime = format(eventStart, 'h:mm a');
                  
//                   // Get the right icon for the event type
//                   let typeIcon;
//                   switch(layout.event.type) {
//                     case 'arrangement':
//                       typeIcon = '🗓️';
//                       break;
//                     case 'task':
//                       typeIcon = '✓';
//                       break;
//                     case 'reminder':
//                       typeIcon = '⏰';
//                       break;
//                     default:
//                       typeIcon = '⏰';
//                   }
                  
//                   return (
//                     <div
//                       key={layout.event.id}
//                       style={{
//                         top: `${layout.top}px`,
//                         height: `${layout.height}px`,
//                         left: `${layout.left}%`,
//                         width: `calc(${layout.width}% - 4px)`,
//                         position: "absolute",
//                         marginLeft: "2px",
//                         padding: "4px",
//                         backgroundColor: `${eventBgColor}15`,
//                         borderLeft: `4px solid ${calendarColor}`,
//                       }}
//                       className="text-xs rounded-md shadow-sm overflow-hidden cursor-pointer transition-all duration-200 hover:shadow-md group"
//                       title={layout.event.title}
//                       onClick={() => {
//                         setSelectedEventId(parseInt(layout.event.id));
//                         setShowEventDetailModal(true);
//                       }}
//                     >
//                       <div className="font-semibold text-slate-700 truncate flex items-center">
//                         <span className="mr-1">{typeIcon}</span>
//                         {layout.event.title}
//                       </div>
//                       <div className="text-slate-500 text-xs">{startTime}</div>
//                     </div>
//                   );
//                 })}
//               </div>
//             );
//           })}
//         </div>
//       </div>
//     );
//   };

//   // =================== DAY VIEW ===================
//   const renderDayView = () => {
//     const dayStr = format(currentDate, "yyyy-MM-dd");
//     const isToday = dayStr === format(new Date(), "yyyy-MM-dd");
//     const allDayEvents = events.filter(
//       (event) =>
//         format(new Date(event.start), "yyyy-MM-dd") === dayStr &&
//         event.type === "holiday"
//     );
//     const timedEvents = events.filter(
//       (event) =>
//         format(new Date(event.start), "yyyy-MM-dd") === dayStr &&
//         event.type !== "holiday"
//     );
//     const hours: number[] = [];
//     for (let h = startHour; h < endHour; h++) {
//       hours.push(h);
//     }
//     const totalHeight = (endHour - startHour) * hourHeight;
//     const layouts = calculateEventPositions(timedEvents, startHour, hourHeight);

//     return (
//       <div className="overflow-auto relative rounded-lg shadow-sm border border-slate-200 bg-white">
//         {/* Day header */}
//         <div className={`py-4 px-6 font-medium text-center border-b ${isToday ? 'bg-indigo-50' : 'bg-slate-50'}`}>
//           <span className="text-lg font-bold mr-2 text-slate-800">
//             {format(currentDate, "EEEE")}
//           </span>
//           <span className={`text-md ${isToday ? 'text-indigo-600' : 'text-slate-600'}`}>
//             {format(currentDate, "MMMM d, yyyy")}
//             {isToday && <span className="ml-2 bg-indigo-600 text-white text-xs py-0.5 px-2 rounded-full">Today</span>}
//           </span>
//         </div>
        
//         {/* All day area */}
//         <div className={`border-b border-slate-200 p-3 flex items-center ${isToday ? 'bg-indigo-50/30' : 'bg-slate-50/30'}`}>
//           <div className="text-sm font-medium text-slate-700 min-w-[80px]">All Day</div>
//           <div className="flex space-x-2 ml-4 flex-wrap gap-2">
//             {allDayEvents.length > 0 ? allDayEvents.map((event) => (
//               <div
//                 key={event.id}
//                 className="text-xs rounded-md px-3 py-1.5 flex items-center"
//                 style={{
//                   backgroundColor: `${event.color}15`,
//                   borderLeft: `3px solid ${event.color}`,
//                   color: '#333'
//                 }}
//                 title={event.title}
//               >
//                 <span className="mr-1">🏖️</span>
//                 {event.title}
//               </div>
//             )) : (
//               <div className="text-xs text-slate-500 italic">No all-day events</div>
//             )}
//           </div>
//         </div>

//         {/* Time grid */}
//         <div className="grid" style={{ gridTemplateColumns: "80px 1fr" }}>
//           <div className="relative bg-slate-50">
//             {hours.map((hour) => (
//               <div
//                 key={hour}
//                 style={{ height: `${hourHeight}px` }}
//                 className="border-t border-slate-200 text-right pr-3 text-xs text-slate-500 flex items-start justify-end pt-2"
//               >
//                 {hour === 0 ? '12 AM' : hour < 12 ? `${hour} AM` : hour === 12 ? '12 PM' : `${hour-12} PM`}
//               </div>
//             ))}
//           </div>
//           <div
//             className={`relative border-l border-slate-200 ${isToday ? 'bg-indigo-50/20' : ''}`}
//             style={{ height: `${totalHeight}px` }}
//             onDoubleClick={handleDayViewDoubleClick}
//           >
//             {hours.map((hour, i) => (
//               <div
//                 key={i}
//                 style={{ height: `${hourHeight}px` }}
//                 className="border-t border-slate-200"
//               ></div>
//             ))}
            
//             {/* Current time line */}
//             {isToday && (() => {
//               const currentMinutes =
//                 currentNow.getHours() * 60 + currentNow.getMinutes();
//               const lineTop =
//                 ((currentMinutes - startHour * 60) / 60) * hourHeight;
//               return (
//                 <div
//                   className="absolute left-0 right-0 z-20"
//                   style={{ top: lineTop }}
//                 >
//                   <div className="relative">
//                     <div className="absolute -left-2 w-4 h-4 rounded-full bg-red-500 shadow"></div>
//                     <div className="border-t-2 border-red-500 w-full"></div>
//                   </div>
//                 </div>
//               );
//             })()}
            
//             {layouts.map((layout) => {
//               const calendar =
//                 calendars.find(
//                   (cal) => cal.id === layout.event.calendarId
//                 ) || { color: "#3B82F6" };
//               const calendarColor = calendar.color;
//               const eventBgColor =
//                 layout.event.color && layout.event.color.trim() !== ""
//                   ? layout.event.color
//                   : calendarColor;
                  
//               // Get event time for display
//               const eventStart = new Date(layout.event.start);
//               const eventEnd = layout.event.end ? new Date(layout.event.end) : 
//                               new Date(eventStart.getTime() + 30 * 60000);
//               const timeRange = `${format(eventStart, 'h:mm')} - ${format(eventEnd, 'h:mm a')}`;
              
//               // Get the right icon for the event type
//               let typeIcon;
//               switch(layout.event.type) {
//                 case 'arrangement':
//                   typeIcon = '🗓️';
//                   break;
//                 case 'task':
//                   typeIcon = '✓';
//                   break;
//                 case 'reminder':
//                   typeIcon = '⏰';
//                   break;
//                 default:
//                   typeIcon = '⏰';
//               }
              
//               return (
//                 <div
//                   key={layout.event.id}
//                   style={{
//                     top: `${layout.top}px`,
//                     height: `${Math.max(layout.height, 30)}px`,
//                     left: `${layout.left}%`,
//                     width: `calc(${layout.width}% - 10px)`,
//                     position: "absolute",
//                     marginLeft: "5px",
//                     padding: "6px 8px",
//                     backgroundColor: `${eventBgColor}15`,
//                     borderLeft: `4px solid ${calendarColor}`,
//                   }}
//                   className="rounded-md shadow-sm overflow-hidden cursor-pointer transition-all duration-200 hover:shadow-md group"
//                   title={layout.event.title}
//                   onClick={() => {
//                     setSelectedEventId(parseInt(layout.event.id));
//                     setShowEventDetailModal(true);
//                   }}
//                 >
//                   <div className="font-semibold text-slate-800 truncate flex items-center">
//                     <span className="mr-1">{typeIcon}</span>
//                     {layout.event.title}
//                   </div>
//                   <div className="text-slate-500 text-xs">{timeRange}</div>
//                   {layout.height > 60 && layout.event.description && (
//                     <div className="text-xs text-slate-600 mt-1 opacity-75 group-hover:opacity-100 line-clamp-2">
//                       {layout.event.description}
//                     </div>
//                   )}
//                 </div>
//               );
//             })}
//           </div>
//         </div>
//       </div>
//     );
//   };

//   // =================== YEAR VIEW ===================
//   const renderYearView = () => (
//     <YearView
//       year={currentYear}
//       events={events}
//       onDayClick={(dateStr: string) => {
//         setCurrentDate(new Date(dateStr));
//         setCurrentView("day");
//       }}
//     />
//   );

//   // ---------- Navigation handlers ----------
//   const handlePrev = () => {
//     if (currentView === "month") {
//       setCurrentDate(subMonths(currentDate, 1));
//     } else if (currentView === "week") {
//       setCurrentDate(subWeeks(currentDate, 1));
//     } else if (currentView === "day") {
//       setCurrentDate(addDays(currentDate, -1));
//     } else if (currentView === "year") {
//       setCurrentYear((prev) => prev - 1);
//     }
//   };

//   const handleNext = () => {
//     if (currentView === "month") {
//       setCurrentDate(addMonths(currentDate, 1));
//     } else if (currentView === "week") {
//       setCurrentDate(addWeeks(currentDate, 1));
//     } else if (currentView === "day") {
//       setCurrentDate(addDays(currentDate, 1));
//     } else if (currentView === "year") {
//       setCurrentYear((prev) => prev + 1);
//     }
//   };

//   const handleToday = () => {
//     if (currentView === "year") {
//       setCurrentYear(new Date().getFullYear());
//     } else {
//       setCurrentDate(new Date());
//     }
//   };

//   // ---------- Double-click handlers for creating events ----------
//   const handleDayViewDoubleClick = (e: React.MouseEvent<HTMLDivElement>) => {
//     const rect = e.currentTarget.getBoundingClientRect();
//     const offsetY = e.clientY - rect.top;
//     const hourFraction = offsetY / hourHeight;
//     const clickedHour = startHour + hourFraction;
//     const hoursPart = Math.floor(clickedHour);
//     const minutes = Math.floor((clickedHour - hoursPart) * 60);
    
//     const newStart = new Date(currentDate);
//     newStart.setHours(hoursPart, minutes, 0, 0);
    
//     const newEnd = new Date(newStart);
//     newEnd.setMinutes(newEnd.getMinutes() + 30);
    
//     setEventFormData({
//       ...eventFormData,
//       startedAt: format(newStart, "yyyy-MM-dd'T'HH:mm:ss'Z'"),
//       endedAt: format(newEnd, "yyyy-MM-dd'T'HH:mm:ss'Z'"),
//       isEditing: false
//     });
    
//     setShowEventModal(true);
//   };

//   const handleWeekViewDoubleClick = (e: React.MouseEvent<HTMLDivElement>, day: Date) => {
//     const rect = e.currentTarget.getBoundingClientRect();
//     const offsetY = e.clientY - rect.top;
//     const hourFraction = offsetY / hourHeight;
//     const clickedHour = startHour + hourFraction;
//     const hoursPart = Math.floor(clickedHour);
//     const minutes = Math.floor((clickedHour - hoursPart) * 60);
    
//     const newStart = new Date(day);
//     newStart.setHours(hoursPart, minutes, 0, 0);
    
//     const newEnd = new Date(newStart);
//     newEnd.setMinutes(newEnd.getMinutes() + 30);
    
//     setEventFormData({
//       ...eventFormData,
//       startedAt: format(newStart, "yyyy-MM-dd'T'HH:mm:ss'Z'"),
//       endedAt: format(newEnd, "yyyy-MM-dd'T'HH:mm:ss'Z'"),
//       isEditing: false
//     });
    
//     setShowEventModal(true);
//   };

//   // ---------- Event form handlers ----------
//   const handleEventFormSubmit = async (e: React.FormEvent) => {
//     e.preventDefault();
    
//     try {
//       if (eventFormData.isEditing && eventFormData.id) {
//         // Update existing event
//         const updatePayload: UpdateEventPayload = {
//           name: eventFormData.name,
//           description: eventFormData.description,
//           category: eventFormData.category,
//           startedAt: eventFormData.startedAt,
//           endedAt: eventFormData.endedAt
//         };
        
//         // Add priority and isCompleted only for tasks
//         if (currentEvent?.type === EventType.TASK) {
//           updatePayload.priority = eventFormData.priority;
//           updatePayload.isCompleted = eventFormData.isCompleted;
//         }
        
//         await dispatch(updateEvent(eventFormData.id, updatePayload));
        
//         // Refresh calendar events after update
//         if (currentEvent?.calendarId) {
//           const calendarId = parseInt(String(currentEvent.calendarId));
//           const updatedEvents = await dispatch(getCalendarEvents(calendarId, authUser.id));
          
//           // Обновляем события в состоянии компонента
//           if (updatedEvents) {
//             const formattedEvents = updatedEvents.map((eventData: any) => {
//               const eventDetails = eventData.event;
//               const calendar = calendars.find(cal => cal.id === String(calendarId));
              
//               return {
//                 id: eventData.eventId.toString(),
//                 title: eventDetails.name,
//                 start: eventDetails.startedAt,
//                 end: eventDetails.endedAt,
//                 description: eventDetails.description || "",
//                 calendarId: String(calendarId),
//                 type: eventDetails.type,
//                 color: eventData.color || (calendar ? calendar.color : "#4CAF50"),
//                 category: eventDetails.category,
//                 priority: eventDetails.task?.priority,
//                 isCompleted: eventDetails.task?.isCompleted,
//                 creatorId: eventDetails.creatorId
//               };
//             });
            
//             // Обновляем состояние, заменяя события этого календаря
//             setEvents(prev => {
//               const otherCalendarEvents = prev.filter(e => e.calendarId !== String(calendarId));
//               return [...otherCalendarEvents, ...formattedEvents];
//             });
//           }
//         }
//       } else {
//         // Create new event
//         const createPayload: CreateEventPayload = {
//           name: eventFormData.name,
//           description: eventFormData.description,
//           category: eventFormData.category,
//           startedAt: eventFormData.startedAt,
//           endedAt: eventFormData.endedAt,
//           color: eventFormData.color,
//           type: eventFormData.type,
//           calendarId: eventFormData.calendarId
//         };
        
//         // Add priority for task type
//         if (eventFormData.type === EventType.TASK && eventFormData.priority) {
//           createPayload.priority = eventFormData.priority;
//         }
        
//         const newEvent = await dispatch(createEvent(createPayload));
        
//         // Refresh calendar events after creation
//         const updatedEvents = await dispatch(getCalendarEvents(eventFormData.calendarId, authUser.id));
        
//         // Обновляем состояние с новыми событиями
//         if (updatedEvents) {
//           const formattedEvents = updatedEvents.map((eventData: any) => {
//             const eventDetails = eventData.event;
//             const calendar = calendars.find(cal => cal.id === String(eventFormData.calendarId));
            
//             return {
//               id: eventData.eventId.toString(),
//               title: eventDetails.name,
//               start: eventDetails.startedAt,
//               end: eventDetails.endedAt,
//               description: eventDetails.description || "",
//               calendarId: String(eventFormData.calendarId),
//               type: eventDetails.type,
//               color: eventData.color || (calendar ? calendar.color : "#4CAF50"),
//               category: eventDetails.category,
//               priority: eventDetails.task?.priority,
//               isCompleted: eventDetails.task?.isCompleted,
//               creatorId: eventDetails.creatorId
//             };
//           });
          
//           // Обновляем состояние, заменяя события этого календаря
//           setEvents(prev => {
//             const otherCalendarEvents = prev.filter(e => e.calendarId !== String(eventFormData.calendarId));
//             return [...otherCalendarEvents, ...formattedEvents];
//           });
//         }
//       }
      
//       setShowEventModal(false);
//       resetEventForm();
//     } catch (error) {
//       console.error("Error saving event:", error);
//     }
//   };

//   const handleEditEvent = () => {
//     if (!currentEvent) return;
    
//     setEventFormData({
//       id: currentEvent.id,
//       name: currentEvent.name,
//       description: currentEvent.description,
//       category: currentEvent.category,
//       startedAt: currentEvent.startedAt,
//       endedAt: currentEvent.endedAt,
//       color: currentEvent.participations?.[0]?.color || "#4CAF50",
//       type: currentEvent.type,
//       calendarId: currentEvent.participations?.[0]?.calendarMember?.calendarId || 0,
//       priority: currentEvent.task?.priority,
//       isCompleted: currentEvent.task?.isCompleted,
//       isEditing: true
//     });
    
//     setShowEventDetailModal(false);
//     setShowEventModal(true);
//   };

//   const handleDeleteEvent = async () => {
//     if (!currentEvent) return;
    
//     try {
//       await dispatch(deleteEvent(currentEvent.id));
      
//       // Удаляем событие из локального состояния
//       setEvents(prev => prev.filter(event => event.id !== String(currentEvent.id)));
      
//       setShowEventDetailModal(false);
//     } catch (error) {
//       console.error("Error deleting event:", error);
//     }
//   };

//   const resetEventForm = () => {
//     setEventFormData({
//       name: "",
//       description: "",
//       category: EventCategory.HOME,
//       startedAt: "",
//       endedAt: "",
//       color: "#4CAF50",
//       type: EventType.TASK,
//       calendarId: calendars && calendars.length > 0 ? parseInt(calendars[0].id) : 0,
//       isEditing: false
//     });
//   };

//   // ---------- Participant handlers ----------
//   const handleAddParticipant = async (e: React.FormEvent) => {
//     e.preventDefault();
//     if (!selectedEventId || !participantEmail.trim()) return;
    
//     setIsAddingParticipant(true);
    
//     try {
//       const calendarId = currentEvent?.participations?.[0]?.calendarMember?.calendarId;
//       if (!calendarId) throw new Error("Calendar ID not found");
      
//       await dispatch(addEventParticipant(selectedEventId, calendarId, participantEmail));
//       setParticipantEmail("");
      
//       // Refresh event data
//       dispatch(getEvent(selectedEventId));
//     } catch (error) {
//       console.error("Error adding participant:", error);
//     } finally {
//       setIsAddingParticipant(false);
//     }
//   };

//   const handleUpdateParticipantStatus = async (calendarMemberId: number, status: string) => {
//     if (!selectedEventId) return;
    
//     try {
//       await dispatch(updateEventParticipant(selectedEventId, calendarMemberId, { responseStatus: status }));
      
//       // Refresh event data
//       dispatch(getEvent(selectedEventId));
//     } catch (error) {
//       console.error("Error updating participant status:", error);
//     }
//   };

//   const handleRemoveParticipant = async (calendarMemberId: number) => {
//     if (!selectedEventId) return;
    
//     try {
//       await dispatch(removeEventParticipant(selectedEventId, calendarMemberId));
      
//       // Refresh event data
//       dispatch(getEvent(selectedEventId));
//     } catch (error) {
//       console.error("Error removing participant:", error);
//     }
//   };

//   // Check if user can manage participants (only for arrangement type events)
//   const canManageParticipants = useMemo(() => {
//     if (!currentEvent) return false;
    
//     // Only arrangement type events can have participants
//     if (currentEvent.type !== EventType.ARRANGEMENT) return false;
    
//     // Creator can manage participants
//     if (currentEvent.creatorId === authUser?.id) return true;
    
//     // Calendar owners and editors can manage participants
//     const userRole = currentEvent.participations?.find(
//       p => p.calendarMember?.userId === authUser?.id
//     )?.calendarMember?.role;
    
//     return userRole === 'owner' || userRole === 'editor';
//   }, [currentEvent, authUser]);

//   // Check if user can edit the event
//   const canEditEvent = useMemo(() => {
//     if (!currentEvent) return false;
    
//     // Creator can edit
//     if (currentEvent.creatorId === authUser?.id) return true;
    
//     // Calendar owners and editors can edit
//     const userRole = currentEvent.participations?.find(
//       p => p.calendarMember?.userId === authUser?.id
//     )?.calendarMember?.role;
    
//     return userRole === 'owner' || userRole === 'editor';
//   }, [currentEvent, authUser]);

//   // Render loading indicator
//   if (isLoadingEvents) {
//     return (
//       <div className="p-6 bg-white rounded-xl shadow-lg">
//         <div className="flex justify-center items-center h-64">
//           <div className="inline-flex items-center">
//             <svg className="animate-spin -ml-1 mr-3 h-8 w-8 text-indigo-500" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
//               <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
//               <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
//             </svg>
//             <span className="text-lg text-indigo-600 font-medium">Loading calendar events...</span>
//           </div>
//         </div>
//       </div>
//     );
//   }

//   // Render modals
//   const renderEventModal = () => {
//     return (
//       <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
//         <div className="bg-white rounded-lg shadow-xl w-full max-w-md overflow-hidden">
//           <div className="bg-indigo-600 text-white px-6 py-4 flex justify-between items-center">
//             <h2 className="text-xl font-bold">
//               {eventFormData.isEditing ? "Edit Event" : "Create New Event"}
//             </h2>
//             <button 
//               onClick={() => setShowEventModal(false)}
//               className="text-white hover:text-indigo-100"
//             >
//               <X size={24} />
//             </button>
//           </div>
          
//           <form onSubmit={handleEventFormSubmit} className="p-6 space-y-5">
//             <div>
//               <label className="block text-sm font-medium text-slate-700 mb-1">
//                 Title
//               </label>
//               <input
//                 type="text"
//                 value={eventFormData.name}
//                 onChange={(e) => setEventFormData({ ...eventFormData, name: e.target.value })}
//                 className="w-full border border-slate-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
//                 placeholder="Event title"
//                 required
//               />
//             </div>
            
//             <div className="grid grid-cols-2 gap-4">
//               <div>
//                 <label className="block text-sm font-medium text-slate-700 mb-1">
//                   Start Date & Time
//                 </label>
//                 <input
//                   type="datetime-local"
//                   value={eventFormData.startedAt ? new Date(eventFormData.startedAt).toISOString().slice(0, 16) : ""}
//                   onChange={(e) => {
//                     const date = new Date(e.target.value);
//                     setEventFormData({ 
//                       ...eventFormData, 
//                       startedAt: format(date, "yyyy-MM-dd'T'HH:mm:ss'Z'")
//                     });
//                   }}
//                   className="w-full border border-slate-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
//                   required
//                 />
//               </div>
//               <div>
//                 <label className="block text-sm font-medium text-slate-700 mb-1">
//                   End Date & Time
//                 </label>
//                 <input
//                   type="datetime-local"
//                   value={eventFormData.endedAt ? new Date(eventFormData.endedAt).toISOString().slice(0, 16) : ""}
//                   onChange={(e) => {
//                     const date = new Date(e.target.value);
//                     setEventFormData({ 
//                       ...eventFormData, 
//                       endedAt: format(date, "yyyy-MM-dd'T'HH:mm:ss'Z'")
//                     });
//                   }}
//                   className="w-full border border-slate-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
//                   required
//                 />
//               </div>
//             </div>
            
//             <div>
//               <label className="block text-sm font-medium text-slate-700 mb-1">
//                 Description
//               </label>
//               <textarea
//                 value={eventFormData.description}
//                 onChange={(e) => setEventFormData({ ...eventFormData, description: e.target.value })}
//                 className="w-full border border-slate-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
//                 rows={3}
//                 placeholder="Add a description (optional)"
//               ></textarea>
//             </div>
            
//             <div className="grid grid-cols-2 gap-4">
//               <div>
//                 <label className="block text-sm font-medium text-slate-700 mb-1">
//                   Category
//                 </label>
//                 <select
//                   value={eventFormData.category}
//                   onChange={(e) => setEventFormData({ 
//                     ...eventFormData, 
//                     category: e.target.value as EventCategory 
//                   })}
//                   className="w-full border border-slate-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
//                 >
//                   <option value={EventCategory.HOME}>Home</option>
//                   <option value={EventCategory.WORK}>Work</option>
//                 </select>
//               </div>
              
//               {!eventFormData.isEditing && (
//                 <div>
//                   <label className="block text-sm font-medium text-slate-700 mb-1">
//                     Event Type
//                   </label>
//                   <select
//                     value={eventFormData.type}
//                     onChange={(e) => setEventFormData({ 
//                       ...eventFormData, 
//                       type: e.target.value as EventType 
//                     })}
//                     className="w-full border border-slate-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
//                   >
//                     <option value={EventType.TASK}>Task</option>
//                     <option value={EventType.REMINDER}>Reminder</option>
//                     <option value={EventType.ARRANGEMENT}>Arrangement</option>
//                   </select>
//                 </div>
//               )}
//             </div>
            
//             {(!eventFormData.isEditing || 
//               (eventFormData.isEditing && currentEvent?.type === EventType.TASK)) && 
//              eventFormData.type === EventType.TASK && (
//               <div>
//                 <label className="block text-sm font-medium text-slate-700 mb-1">
//                   Priority
//                 </label>
//                 <select
//                   value={eventFormData.priority}
//                   onChange={(e) => setEventFormData({ 
//                     ...eventFormData, 
//                     priority: e.target.value as TaskPriority 
//                   })}
//                   className="w-full border border-slate-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
//                 >
//                   <option value={TaskPriority.LOW}>Low</option>
//                   <option value={TaskPriority.MEDIUM}>Medium</option>
//                   <option value={TaskPriority.HIGH}>High</option>
//                 </select>
//               </div>
//             )}
            
//             {eventFormData.isEditing && currentEvent?.type === EventType.TASK && (
//               <div className="flex items-center">
//                 <input
//                   type="checkbox"
//                   id="isCompleted"
//                   checked={eventFormData.isCompleted || false}
//                   onChange={(e) => setEventFormData({ ...eventFormData, isCompleted: e.target.checked })}
//                   className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
//                 />
//                 <label htmlFor="isCompleted" className="ml-2 block text-sm text-gray-900">
//                   Mark as completed
//                 </label>
//               </div>
//             )}
            
//             {!eventFormData.isEditing && (
//               <>
//                 <div>
//                   <label className="block text-sm font-medium text-slate-700 mb-1">
//                     Calendar
//                   </label>
//                   <select
//                     value={eventFormData.calendarId}
//                     onChange={(e) => setEventFormData({ 
//                       ...eventFormData, 
//                       calendarId: parseInt(e.target.value) 
//                     })}
//                     className="w-full border border-slate-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
//                   >
//                     {calendars.map((cal) => (
//                       <option key={cal.id} value={cal.id}>
//                         {cal.title}
//                       </option>
//                     ))}
//                   </select>
//                 </div>
                
//                 <div>
//                   <label className="block text-sm font-medium text-slate-700 mb-1">
//                     Event Color
//                   </label>
//                   <div className="flex items-center">
//                     <input
//                       type="color"
//                       value={eventFormData.color}
//                       onChange={(e) => setEventFormData({ ...eventFormData, color: e.target.value })}
//                       className="h-10 w-10 border-0 p-0 rounded mr-2"
//                     />
//                     <div className="text-xs text-slate-500">
//                       Event color indicator
//                     </div>
//                   </div>
//                 </div>
//               </>
//             )}
            
//             <div className="flex justify-end space-x-3 pt-3 border-t">
//               <button
//                 type="button"
//                 onClick={() => setShowEventModal(false)}
//                 className="px-4 py-2 bg-white border border-slate-300 text-slate-700 rounded-md hover:bg-slate-50 transition-colors"
//               >
//                 Cancel
//               </button>
//               <button
//                 type="submit"
//                 className="px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 transition-colors"
//               >
//                 {eventFormData.isEditing ? "Save Changes" : "Create Event"}
//               </button>
//             </div>
//           </form>
//         </div>
//       </div>
//     );
//   };

//   const renderEventDetailModal = () => {
//     if (!currentEvent) return null;
    
//     const calendar = calendars.find(
//       cal => cal.id === String(currentEvent.participations?.[0]?.calendarMember?.calendarId)
//     );
    
//     // Get event type icon
//     let typeIcon;
//     switch(currentEvent.type) {
//       case EventType.ARRANGEMENT:
//         typeIcon = <Calendar className="h-5 w-5 text-indigo-500" />;
//         break;
//       case EventType.TASK:
//         typeIcon = <CheckSquare className="h-5 w-5 text-emerald-500" />;
//         break;
//       case EventType.REMINDER:
//         typeIcon = <Clock className="h-5 w-5 text-amber-500" />;
//         break;
//       default:
//         typeIcon = <Clock className="h-5 w-5 text-amber-500" />;
//     }
    
//     const startTime = format(new Date(currentEvent.startedAt), "EEE, MMM d, yyyy h:mm a");
//     const endTime = format(new Date(currentEvent.endedAt), "EEE, MMM d, yyyy h:mm a");
//     const isSameDay = format(new Date(currentEvent.startedAt), "yyyy-MM-dd") === 
//                       format(new Date(currentEvent.endedAt), "yyyy-MM-dd");
    
//     return (
//       <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
//         <div className="bg-white rounded-lg shadow-xl w-full max-w-md overflow-hidden">
//           <div className="bg-indigo-600 text-white px-6 py-4 flex justify-between items-center">
//             <div className="flex items-center">
//               {typeIcon}
//               <h2 className="text-xl font-bold ml-2">Event Details</h2>
//             </div>
//             <button 
//               onClick={() => setShowEventDetailModal(false)}
//               className="text-white hover:text-indigo-100"
//             >
//               <X size={24} />
//             </button>
//           </div>
          
//           <div className="p-6">
//             <div className="mb-6">
//               <h3 className="text-xl font-bold text-slate-800 mb-1">{currentEvent.name}</h3>
//               {calendar && (
//                 <div className="flex items-center text-sm text-slate-500 mb-2">
//                   <span className="w-3 h-3 rounded-full mr-2" style={{ backgroundColor: calendar.color }}></span>
//                   <span>{calendar.title}</span>
//                 </div>
//               )}
              
//               {currentEvent.description && (
//                 <p className="text-slate-600 mt-3">{currentEvent.description}</p>
//               )}
//             </div>
            
//             <div className="space-y-3 mb-6">
//               <div className="flex items-start">
//                 <div className="flex-shrink-0 mt-0.5 mr-3 text-slate-400">
//                   <Clock size={18} />
//                 </div>
//                 <div>
//                   <div className="font-medium text-slate-700">{startTime}</div>
//                   {!isSameDay && <div className="text-slate-500 text-sm">to</div>}
//                   <div className="font-medium text-slate-700">{isSameDay ? format(new Date(currentEvent.endedAt), "h:mm a") : endTime}</div>
//                 </div>
//               </div>
              
//               <div className="flex items-center">
//                 <div className="flex-shrink-0 mr-3 text-slate-400">
//                   {currentEvent.category === EventCategory.HOME ? (
//                     <span>🏠</span>
//                   ) : (
//                     <span>💼</span>
//                   )}
//                 </div>
//                 <div className="text-slate-700">
//                   {currentEvent.category === EventCategory.HOME ? "Home" : "Work"}
//                 </div>
//               </div>
              
//               {currentEvent.type === EventType.TASK && currentEvent.task && (
//                 <>
//                   <div className="flex items-center">
//                     <div className="flex-shrink-0 mr-3 text-slate-400">
//                       <AlertCircle size={18} />
//                     </div>
//                     <div className="text-slate-700">
//                       Priority: 
//                       <span className={`ml-1 px-2 py-0.5 rounded text-xs font-medium ${
//                         currentEvent.task.priority === TaskPriority.LOW 
//                           ? 'bg-blue-100 text-blue-800' 
//                           : currentEvent.task.priority === TaskPriority.MEDIUM 
//                             ? 'bg-yellow-100 text-yellow-800' 
//                             : 'bg-red-100 text-red-800'
//                       }`}>
//                         {currentEvent.task.priority.charAt(0).toUpperCase() + currentEvent.task.priority.slice(1)}
//                       </span>
//                     </div>
//                   </div>
                  
//                   <div className="flex items-center">
//                     <div className="flex-shrink-0 mr-3 text-slate-400">
//                       <CheckSquare size={18} />
//                     </div>
//                     <div className="text-slate-700">
//                       Status: 
//                       <span className={`ml-1 ${currentEvent.task.isCompleted ? 'text-green-600' : 'text-slate-600'}`}>
//                         {currentEvent.task.isCompleted ? 'Completed' : 'Incomplete'}
//                       </span>
//                     </div>
//                   </div>
//                 </>
//               )}
              
//               {currentEvent.type === EventType.ARRANGEMENT && (
//                 <div className="border-t pt-3 mt-3">
//                   <div className="flex justify-between items-center mb-3">
//                     <h4 className="font-medium text-slate-800">Participants</h4>
//                     {canManageParticipants && (
//                       <button 
//                         onClick={() => setShowParticipantModal(true)}
//                         className="text-indigo-600 hover:text-indigo-800 text-sm flex items-center"
//                       >
//                         <UserPlus size={16} className="mr-1" />
//                         Add
//                       </button>
//                     )}
//                   </div>
                  
//                   {currentEvent.participations && currentEvent.participations.length > 0 ? (
//                     <div className="space-y-2 max-h-40 overflow-y-auto">
//                       {currentEvent.participations.map(participant => (
//                         <div key={participant.id} className="flex items-center justify-between">
//                           <div className="flex items-center">
//                             <img 
//                               src={`http://localhost:3000/uploads/avatars/${participant.calendarMember.user.profilePictureName}`}
//                               alt="avatar"
//                               className="w-7 h-7 rounded-full mr-2"
//                             />
//                             <div>
//                               <div className="text-sm font-medium">
//                                 {participant.calendarMember.user.firstName} {participant.calendarMember.user.lastName}
//                               </div>
//                               <div className="text-xs text-slate-500">{participant.responseStatus}</div>
//                             </div>
//                           </div>
                          
//                           {canManageParticipants && 
//                            participant.calendarMember.userId !== authUser?.id && (
//                             <button
//                               onClick={() => handleRemoveParticipant(participant.calendarMemberId)}
//                               className="text-red-500 hover:text-red-700"
//                             >
//                               <Trash2 size={16} />
//                             </button>
//                           )}
                          
//                           {participant.calendarMember.userId === authUser?.id && 
//                            participant.responseStatus !== ResponseStatus.ACCEPTED && 
//                            participant.responseStatus !== ResponseStatus.DECLINED && (
//                             <div className="flex space-x-1">
//                               <button
//                                 onClick={() => handleUpdateParticipantStatus(
//                                   participant.calendarMemberId, 
//                                   ResponseStatus.ACCEPTED
//                                 )}
//                                 className="p-1 bg-green-100 text-green-600 rounded hover:bg-green-200"
//                               >
//                                 <Check size={14} />
//                               </button>
//                               <button
//                                 onClick={() => handleUpdateParticipantStatus(
//                                   participant.calendarMemberId, 
//                                   ResponseStatus.DECLINED
//                                 )}
//                                 className="p-1 bg-red-100 text-red-600 rounded hover:bg-red-200"
//                               >
//                                 <X size={14} />
//                               </button>
//                             </div>
//                           )}
//                         </div>
//                       ))}
//                     </div>
//                   ) : (
//                     <div className="text-sm text-slate-500 italic">No participants</div>
//                   )}
//                 </div>
//               )}
//             </div>
            
//             {/* Action buttons */}
//             <div className="flex justify-end space-x-3 pt-3 border-t">
//               {canEditEvent && (
//                 <>
//                   <button
//                     onClick={handleEditEvent}
//                     className="px-4 py-2 bg-white border border-slate-300 text-slate-700 rounded-md hover:bg-slate-50 transition-colors flex items-center"
//                   >
//                     <Edit2 size={16} className="mr-1" />
//                     Edit
//                   </button>
//                   <button
//                     onClick={handleDeleteEvent}
//                     className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 transition-colors flex items-center"
//                   >
//                     <Trash2 size={16} className="mr-1" />
//                     Delete
//                   </button>
//                 </>
//               )}
//               <button
//                 onClick={() => setShowEventDetailModal(false)}
//                 className="px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 transition-colors"
//               >
//                 Close
//               </button>
//             </div>
//           </div>
//         </div>
//       </div>
//     );
//   };

//   const renderParticipantModal = () => {
//     return (
//       <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
//         <div className="bg-white rounded-lg shadow-xl w-full max-w-md overflow-hidden">
//           <div className="bg-indigo-600 text-white px-6 py-4 flex justify-between items-center">
//             <h2 className="text-xl font-bold">Add Participant</h2>
//             <button 
//               onClick={() => setShowParticipantModal(false)}
//               className="text-white hover:text-indigo-100"
//             >
//               <X size={24} />
//             </button>
//           </div>
          
//           <form onSubmit={handleAddParticipant} className="p-6">
//             <div className="mb-4">
//               <label className="block text-sm font-medium text-slate-700 mb-1">
//                 Email
//               </label>
//               <input
//                 type="email"
//                 value={participantEmail}
//                 onChange={(e) => setParticipantEmail(e.target.value)}
//                 className="w-full border border-slate-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
//                 placeholder="user@example.com"
//                 required
//               />
//             </div>
            
//             <div className="flex justify-end space-x-3 pt-3 border-t">
//               <button
//                 type="button"
//                 onClick={() => setShowParticipantModal(false)}
//                 className="px-4 py-2 bg-white border border-slate-300 text-slate-700 rounded-md hover:bg-slate-50 transition-colors"
//               >
//                 Cancel
//               </button>
//               <button
//                 type="submit"
//                 className="px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 transition-colors"
//                 disabled={isAddingParticipant}
//               >
//                 {isAddingParticipant ? "Adding..." : "Add Participant"}
//               </button>
//             </div>
//           </form>
//         </div>
//       </div>
//     );
//   };

//   return (
//     <div className="p-6 bg-white rounded-xl shadow-lg relative">
//       {/* Header and navigation */}
//       <div className="mb-6">
//         <div className="flex flex-col sm:flex-row justify-between items-center mb-6 gap-4">
//           <h2 className="text-2xl font-bold text-slate-800 flex items-center">
//             <span className="mr-2 text-indigo-600">
//               {currentView === "day" ? "🗓️" : 
//                currentView === "week" ? "🗓️" : 
//                currentView === "month" ? "🗓️" : "🗓️"}
//             </span>
//             {(() => {
//               switch (currentView) {
//                 case "month":
//                   return format(currentDate, "MMMM yyyy");
//                 case "week": {
//                   const startWeek = startOfWeek(currentDate, { weekStartsOn: 0 });
//                   const endWeek = endOfWeek(currentDate, { weekStartsOn: 0 });
//                   const weekNumber = getWeek(currentDate, { weekStartsOn: 0 });
//                   return (
//                     <div className="flex items-center">
//                       <div>
//                         <div className="text-xl font-bold">
//                           Week {weekNumber}, {format(startWeek, "MMM d")} – {format(endWeek, "MMM d, yyyy")}
//                         </div>
//                       </div>
//                     </div>
//                   );
//                 }  
//                 case "day":
//                   return format(currentDate, "EEEE, MMMM d, yyyy");
//                 case "year":
//                   return currentYear.toString();
//                 default:
//                   return "";
//               }
//             })()}
//           </h2>
          
//           <div className="flex items-center space-x-3">
//             <button
//               onClick={handleToday}
//               className="px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 transition-colors font-medium text-sm"
//             >
//               Today
//             </button>
//             <div className="flex border rounded-md overflow-hidden">
//               <button
//                 onClick={handlePrev}
//                 className="px-3 py-2 bg-white hover:bg-slate-100 text-slate-700 border-r"
//               >
//                 <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
//                   <path fillRule="evenodd" d="M12.707 5.293a1 1 0 010 1.414L9.414 10l3.293 3.293a1 1 0 01-1.414 1.414l-4-4a1 1 0 010-1.414l4-4a1 1 0 011.414 0z" clipRule="evenodd" />
//                 </svg>
//               </button>
//               <button
//                 onClick={handleNext}
//                 className="px-3 py-2 bg-white hover:bg-slate-100 text-slate-700"
//               >
//                 <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
//                   <path fillRule="evenodd" d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z" clipRule="evenodd" />
//                 </svg>
//               </button>
//             </div>
//             <button
//               onClick={() => {
//                 const now = new Date();
//                 const later = new Date(now);
//                 later.setMinutes(now.getMinutes() + 30);
                
//                 setEventFormData({
//                   ...eventFormData,
//                   startedAt: format(now, "yyyy-MM-dd'T'HH:mm:ss'Z'"),
//                   endedAt: format(later, "yyyy-MM-dd'T'HH:mm:ss'Z'"),
//                   isEditing: false
//                 });
                
//                 setShowEventModal(true);
//               }}
//               className="px-4 py-2 bg-emerald-500 text-white rounded-md hover:bg-emerald-600 transition-colors font-medium text-sm flex items-center"
//             >
//               <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1" viewBox="0 0 20 20" fill="currentColor">
//                 <path fillRule="evenodd" d="M10 3a1 1 0 011 1v5h5a1 1 0 110 2h-5v5a1 1 0 11-2 0v-5H4a1 1 0 110-2h5V4a1 1 0 011-1z" clipRule="evenodd" />
//               </svg>
//               Add Event
//             </button>
//           </div>
//         </div>
        
//         {/* View toggles */}
//         <div className="flex justify-center">
//           <div className="inline-flex rounded-md shadow-sm bg-slate-100 p-1">
//             <button
//               onClick={() => setCurrentView("day")}
//               className={`px-4 py-2 text-sm font-medium rounded-md transition-colors ${
//                 currentView === "day"
//                   ? "bg-white text-indigo-700 shadow-sm"
//                   : "text-slate-600 hover:bg-slate-200"
//               }`}
//             >
//               Day
//             </button>
//             <button
//               onClick={() => setCurrentView("week")}
//               className={`px-4 py-2 text-sm font-medium rounded-md transition-colors ${
//                 currentView === "week"
//                   ? "bg-white text-indigo-700 shadow-sm"
//                   : "text-slate-600 hover:bg-slate-200"
//               }`}
//             >
//               Week
//             </button>
//             <button
//               onClick={() => setCurrentView("month")}
//               className={`px-4 py-2 text-sm font-medium rounded-md transition-colors ${
//                 currentView === "month"
//                   ? "bg-white text-indigo-700 shadow-sm"
//                   : "text-slate-600 hover:bg-slate-200"
//               }`}
//             >
//               Month
//             </button>
//             <button
//               onClick={() => setCurrentView("year")}
//               className={`px-4 py-2 text-sm font-medium rounded-md transition-colors ${
//                 currentView === "year"
//                   ? "bg-white text-indigo-700 shadow-sm"
//                   : "text-slate-600 hover:bg-slate-200"
//               }`}
//             >
//               Year
//             </button>
//           </div>
//         </div>
//       </div>
      
//       {/* Week days header for month view */}
//       {currentView === "month" && weekdaysHeader}

//       {/* Main calendar content */}
//       <div className={`${currentView === "month" ? "space-y-2" : ""}`}>
//         {currentView === "month" && monthRows}
//         {currentView === "week" && renderWeekView()}
//         {currentView === "day" && renderDayView()}
//         {currentView === "year" && renderYearView()}
//       </div>

//       {/* Modals */}
//       {showEventModal && renderEventModal()}
//       {showEventDetailModal && renderEventDetailModal()}
//       {showParticipantModal && renderParticipantModal()}
//     </div>
//   );
// };

// export default CustomCalendar;
