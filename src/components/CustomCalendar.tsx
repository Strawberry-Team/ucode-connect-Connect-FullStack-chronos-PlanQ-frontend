import React, { useState, useEffect } from "react";
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
} from "date-fns";

export interface CalendarEvent {
  id: string;
  title: string;
  start: string; // строка вида "yyyy-MM-dd'T'HH:mm" (локальное время)
  end?: string;
  description?: string;
  calendarId: string;
  type: "reminder" | "meeting" | "task" | "holiday";
  color: string; // если не выбран, берётся цвет календаря
}

export interface CalendarData {
  id: string;
  title: string;
  description: string;
  isVisible: boolean;
  color: string;
  calendarType: string;
  events?: CalendarEvent[];
}

interface CustomCalendarProps {
  events: CalendarEvent[];
  calendars: CalendarData[];
  onAddEvent: (event: CalendarEvent) => void;
}

/*
  Функция calculateEventPositions рассчитывает позиции для временных (не all‑day)
  событий в пределах одного дня или колонки недели. Если несколько событий пересекаются,
  то они распределяются по колонкам с небольшим отступом между ними.
*/
const calculateEventPositions = (
  events: CalendarEvent[],
  startHour: number,
  hourHeight: number
) => {
  const sortedEvents = events
    .slice()
    .sort(
      (a, b) =>
        new Date(a.start).getTime() - new Date(b.start).getTime()
    );

  const groups: CalendarEvent[][] = [];
  let currentGroup: CalendarEvent[] = [];

  sortedEvents.forEach((event) => {
    const eventStart = new Date(event.start).getTime();
    const eventEnd = event.end
      ? new Date(event.end).getTime()
      : new Date(event.start).getTime() + 30 * 60000;
    if (currentGroup.length === 0) {
      currentGroup.push(event);
    } else {
      const overlap = currentGroup.some((ev) => {
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

  const layouts: { event: CalendarEvent; column: number; total: number }[] =
    [];
  groups.forEach((group) => {
    const columns: CalendarEvent[] = [];
    group.forEach((event) => {
      const eventStart = new Date(event.start).getTime();
      const eventEnd = event.end
        ? new Date(event.end).getTime()
        : new Date(event.start).getTime() + 30 * 60000;
      let placed = false;
      for (let i = 0; i < columns.length; i++) {
        const lastEvent = columns[i];
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
      const layout = layouts.find((l) => l.event.id === event.id);
      if (layout) {
        layout.total = columns.length;
      }
    });
  });

  return layouts.map((item) => {
    const eventStart = new Date(item.event.start);
    const eventEnd = item.event.end
      ? new Date(item.event.end)
      : new Date(eventStart.getTime() + 30 * 60000);
    const startMinutes =
      eventStart.getHours() * 60 + eventStart.getMinutes();
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
  });
};

/*
  Встроенное годовое представление (YearView).
  Для каждого месяца отображается календарь с пустыми ячейками в начале/конце недели.
  Если на определённый день есть события, под цифрой выводятся маленькие кружочки с цветом события.
  При клике по дню вызывается onDayClick с датой в формате "yyyy-MM-dd".
  Исправлено, чтобы не было смещения на день – используется `format(date, "yyyy-MM-dd")`.
*/
interface YearViewProps {
  year: number;
  events: CalendarEvent[];
  onDayClick: (date: string) => void;
}

const YearView: React.FC<YearViewProps> = ({ year, events, onDayClick }) => {
  const months = [
    "January",
    "February",
    "March",
    "April",
    "May",
    "June",
    "July",
    "August",
    "September",
    "October",
    "November",
    "December",
  ];
  return (
    <div className="grid grid-cols-4 gap-6 p-6 bg-slate-50 rounded-lg">
      {months.map((month, index) => {
        const monthEvents = events.filter((event) => {
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
                    (event) =>
                      new Date(event.start).toDateString() ===
                      date.toDateString()
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
  // Представления: "day" | "week" | "month" | "year"
  const [currentView, setCurrentView] = useState<
    "day" | "week" | "month" | "year"
  >("month");
  const [currentDate, setCurrentDate] = useState(new Date());
  const [currentYear, setCurrentYear] = useState(new Date().getFullYear());
  const [showEventModal, setShowEventModal] = useState(false);
  const [newEvent, setNewEvent] = useState<Partial<CalendarEvent>>({
    title: "",
    start: "",
    end: "",
    description: "",
    calendarId:
      calendars && calendars.length > 0 ? calendars[0].id : "main",
    type: "reminder",
    color: "",
  });

  // Для линии текущего времени в day view
  const [currentNow, setCurrentNow] = useState(new Date());
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentNow(new Date());
    }, 60000);
    return () => clearInterval(timer);
  }, []);

  // Временная сетка на 24 часа (с 00:00 до 24:00)
  const startHour = 0;
  const endHour = 24;
  const hourHeight = 60;
  const allDayHeight = 50; // высота области "All Day"

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

  while (day <= endDt) {
    for (let i = 0; i < 7; i++) {
      formattedDate = format(day, dateFormat);
      const cloneDay = day;
      const dayString = format(cloneDay, "yyyy-MM-dd");
      const dayEvents = events.filter(
        (event) =>
          format(new Date(event.start), "yyyy-MM-dd") === dayString
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
      // Find the calendar for this event
      const calendar = calendars.find(
        (cal) => cal.id === event.calendarId
      ) || { color: event.color };
      
      // Get the calendar color
      const calendarColor = calendar.color;
      
      // Get the event color (use event color if specified, otherwise use calendar color)
      const eventBgColor = 
        event.color && event.color.trim() !== ""
          ? event.color
          : calendarColor;
      
      // Determine event type icon
      const eventType = event.type;
      const typeIcon = eventType === 'meeting' ? '🗓️' : 
                       eventType === 'task' ? '✓' : 
                       eventType === 'holiday' ? '🏖️' : '⏰';
                       
      return (
        <div
          key={event.id}
          className="flex items-center text-xs px-2 py-1 rounded-md"
          style={{ 
            backgroundColor: `${eventBgColor}15`,
            borderLeft: `4px solid ${calendarColor}` 
          }}
        >
          <span className="text-xs mr-1">{typeIcon}</span>
          <span className="truncate text-slate-700">{event.title}</span>
        </div>
      );
    })}
    {dayEvents.length > 3 && (
      <div className="text-xs text-slate-500 italic pl-2">
        +{dayEvents.length - 3} more
      </div>
    )}
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
        {/* Заголовок дней недели вместе с областью All Day */}
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
        
        {/* Область All Day */}
        <div className="grid grid-cols-8">
          <div className="border-r border-b border-slate-200 p-2 bg-slate-50">
            <div className="text-xs font-medium text-slate-600">All Day</div>
          </div>
          {weekDays.map((dayItem, idx) => {
            const dayStr = format(dayItem, "yyyy-MM-dd");
            const isToday = dayStr === format(new Date(), "yyyy-MM-dd");
            const allDayEvents = events.filter(
              (event) =>
                format(new Date(event.start), "yyyy-MM-dd") === dayStr &&
                event.type === "holiday"
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
        
        {/* Область временной сетки */}
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
            const dayEvents = events.filter(
              (event) =>
                format(new Date(event.start), "yyyy-MM-dd") === dayStr &&
                event.type !== "holiday"
            );
            const layouts = calculateEventPositions(
              dayEvents,
              startHour,
              hourHeight
            );
            return (
              <div
                key={idx}
                className={`relative border-l border-slate-200 ${isToday ? 'bg-indigo-50/30' : ''}`}
                style={{ height: `${totalHeight}px` }}
                onDoubleClick={(e) =>
                  handleWeekViewDoubleClick(e, dayItem)
                }
              >
                {hours.map((hour, i) => (
                  <div
                    key={i}
                    style={{ height: `${hourHeight}px` }}
                    className="border-t border-slate-200"
                  ></div>
                ))}
                
                {/* Линия текущего времени */}
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
                  const calendar =
                    calendars.find(
                      (cal) => cal.id === layout.event.calendarId
                    ) || { color: "#3B82F6" };
                  const calendarColor = calendar.color;
                  const eventBgColor =
                    layout.event.color && layout.event.color.trim() !== ""
                      ? layout.event.color
                      : calendarColor;
                      
                  // Get event time for display
                  const eventStart = new Date(layout.event.start);
                  const startTime = format(eventStart, 'h:mm a');
                  const eventType = layout.event.type;
                  const typeIcon = eventType === 'meeting' ? '🗓️' : 
                                   eventType === 'task' ? '✓' : 
                                   eventType === 'holiday' ? '🏖️' : '⏰';
                  
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
    const allDayEvents = events.filter(
      (event) =>
        format(new Date(event.start), "yyyy-MM-dd") === dayStr &&
        event.type === "holiday"
    );
    const timedEvents = events.filter(
      (event) =>
        format(new Date(event.start), "yyyy-MM-dd") === dayStr &&
        event.type !== "holiday"
    );
    const hours: number[] = [];
    for (let h = startHour; h < endHour; h++) {
      hours.push(h);
    }
    const totalHeight = (endHour - startHour) * hourHeight;
    const layouts = calculateEventPositions(timedEvents, startHour, hourHeight);

    return (
      <div className="overflow-auto relative rounded-lg shadow-sm border border-slate-200 bg-white">
        {/* Header for the day */}
        <div className={`py-4 px-6 font-medium text-center border-b ${isToday ? 'bg-indigo-50' : 'bg-slate-50'}`}>
          <span className="text-lg font-bold mr-2 text-slate-800">
            {format(currentDate, "EEEE")}
          </span>
          <span className={`text-md ${isToday ? 'text-indigo-600' : 'text-slate-600'}`}>
            {format(currentDate, "MMMM d, yyyy")}
            {isToday && <span className="ml-2 bg-indigo-600 text-white text-xs py-0.5 px-2 rounded-full">Today</span>}
          </span>
        </div>
        
        {/* Область All Day */}
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

        {/* Область временной сетки */}
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
            
            {/* Линия текущего времени */}
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
              const calendar =
                calendars.find(
                  (cal) => cal.id === layout.event.calendarId
                ) || { color: "#3B82F6" };
              const calendarColor = calendar.color;
              const eventBgColor =
                layout.event.color && layout.event.color.trim() !== ""
                  ? layout.event.color
                  : calendarColor;
                  
              // Get event time for display
              const eventStart = new Date(layout.event.start);
              const eventEnd = layout.event.end ? new Date(layout.event.end) : 
                              new Date(eventStart.getTime() + 30 * 60000);
              const timeRange = `${format(eventStart, 'h:mm')} - ${format(eventEnd, 'h:mm a')}`;
              
              const eventType = layout.event.type;
              const typeIcon = eventType === 'meeting' ? '🗓️' : 
                               eventType === 'task' ? '✓' : 
                               eventType === 'holiday' ? '🏖️' : '⏰';
              
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
        // Используем локальное форматирование, чтобы не было смещения
        setCurrentDate(new Date(dateStr));
        setCurrentView("day");
      }}
    />
  );

  // ---------- Обработчики навигации ----------
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

  // ---------- Обработка двойного клика для создания события ----------
  const handleDayViewDoubleClick = (
    e: React.MouseEvent<HTMLDivElement>
  ) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const offsetY = e.clientY - rect.top;
    const hourFraction = offsetY / hourHeight;
    const clickedHour = startHour + hourFraction;
    const hoursPart = Math.floor(clickedHour);
    const minutes = Math.floor((clickedHour - hoursPart) * 60);
    const newStart = new Date(currentDate);
    newStart.setHours(hoursPart, minutes, 0, 0);
    setNewEvent((prev) => ({
      ...prev,
      start: format(newStart, "yyyy-MM-dd'T'HH:mm"),
    }));
    setShowEventModal(true);
  };

  const handleWeekViewDoubleClick = (
    e: React.MouseEvent<HTMLDivElement>,
    day: Date
  ) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const offsetY = e.clientY - rect.top;
    const hourFraction = offsetY / hourHeight;
    const clickedHour = startHour + hourFraction;
    const hoursPart = Math.floor(clickedHour);
    const minutes = Math.floor((clickedHour - hoursPart) * 60);
    const newStart = new Date(day);
    newStart.setHours(hoursPart, minutes, 0, 0);
    setNewEvent((prev) => ({
      ...prev,
      start: format(newStart, "yyyy-MM-dd'T'HH:mm"),
    }));
    setShowEventModal(true);
  };

  // ---------- Обработка отправки формы события ----------
  const handleEventSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newEvent.title || !newEvent.start) {
      alert("Введите название и дату/время начала");
      return;
    }
    const calendar =
      calendars.find((cal) => cal.id === newEvent.calendarId) || {
        color: "#3B82F6",
      };
    const eventColor =
      newEvent.color && newEvent.color.trim() !== ""
        ? newEvent.color
        : calendar.color;
    // Если не задано время окончания, по умолчанию 30 минут от старта
    const computedEnd =
      newEvent.end ||
      format(
        new Date(new Date(newEvent.start).getTime() + 30 * 60000),
        "yyyy-MM-dd'T'HH:mm"
      );
    const newEventObj: CalendarEvent = {
      id: Date.now().toString(),
      title: newEvent.title,
      start: newEvent.start, // сохраняем в локальном формате
      end: computedEnd,
      description: newEvent.description || "",
      calendarId:
        newEvent.calendarId ||
        (calendars.length > 0 ? calendars[0].id : "main"),
      type: newEvent.type as "reminder" | "meeting" | "task" | "holiday",
      color: eventColor,
    };
    onAddEvent(newEventObj);
    setShowEventModal(false);
    setNewEvent({
      title: "",
      start: "",
      end: "",
      description: "",
      calendarId:
        calendars && calendars.length > 0 ? calendars[0].id : "main",
      type: "reminder",
      color: "",
    });
  };

  return (
    <div className="p-6 bg-white rounded-xl shadow-lg relative">
      {/* Заголовок и навигационная панель */}
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
                          Week {weekNumber},{format(startWeek, "MMM d")} – {format(endWeek, "MMM d, yyyy")}
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
              onClick={() => {
                const now = new Date();
                now.setMinutes(Math.floor(now.getMinutes() / 5) * 5, 0, 0);
                setNewEvent((prev) => ({
                  ...prev,
                  start: format(now, "yyyy-MM-dd'T'HH:mm"),
                }));
                setShowEventModal(true);
              }}
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


      {/* Модальное окно для создания события */}
      {showEventModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-md overflow-hidden">
            <div className="bg-indigo-600 text-white px-6 py-4 flex justify-between items-center">
              <h2 className="text-xl font-bold">Create New Event</h2>
              <button 
                onClick={() => setShowEventModal(false)}
                className="text-white hover:text-indigo-100"
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            
            <form onSubmit={handleEventSubmit} className="p-6 space-y-5">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">
                  Title
                </label>
                <input
                  type="text"
                  value={newEvent.title}
                  onChange={(e) =>
                    setNewEvent({ ...newEvent, title: e.target.value })
                  }
                  className="w-full border border-slate-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                  placeholder="Event title"
                  required
                />
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">
                    Start Date & Time
                  </label>
                  <input
                    type="datetime-local"
                    value={newEvent.start || ""}
                    onChange={(e) =>
                      setNewEvent({ ...newEvent, start: e.target.value })
                    }
                    className="w-full border border-slate-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">
                    End Date & Time
                  </label>
                  <input
                    type="datetime-local"
                    value={newEvent.end || ""}
                    onChange={(e) =>
                      setNewEvent({ ...newEvent, end: e.target.value })
                    }
                    className="w-full border border-slate-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                  />
                </div>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">
                  Description
                </label>
                <textarea
                  value={newEvent.description || ""}
                  onChange={(e) =>
                    setNewEvent({
                      ...newEvent,
                      description: e.target.value,
                    })
                  }
                  className="w-full border border-slate-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                  rows={3}
                  placeholder="Add a description (optional)"
                ></textarea>
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">
                    Event Type
                  </label>
                  <select
                    value={newEvent.type}
                    onChange={(e) =>
                      setNewEvent({
                        ...newEvent,
                        type: e.target.value as
                          | "reminder"
                          | "meeting"
                          | "task"
                          | "holiday",
                      })
                    }
                    className="w-full border border-slate-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                  >
                    <option value="reminder">Reminder</option>
                    <option value="meeting">Meeting</option>
                    <option value="task">Task</option>
                    <option value="holiday">Holiday</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">
                    Calendar
                  </label>
                  <select
                    value={newEvent.calendarId}
                    onChange={(e) =>
                      setNewEvent({
                        ...newEvent,
                        calendarId: e.target.value,
                      })
                    }
                    className="w-full border border-slate-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                  >
                    {calendars.map((cal) => (
                      <option key={cal.id} value={cal.id}>
                        {cal.title}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
              
              {/* Поле выбора цвета события */}
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">
                  Event Color
                </label>
                <div className="flex items-center">
                  <input
                    type="color"
                    value={newEvent.color || "#3B82F6"}
                    onChange={(e) =>
                      setNewEvent({ ...newEvent, color: e.target.value })
                    }
                    className="h-10 w-10 border-0 p-0 rounded mr-2"
                  />
                  <div className="text-xs text-slate-500">
                    If not selected, the calendar color will be used
                  </div>
                </div>
              </div>
              
              <div className="flex justify-end space-x-3 pt-3 border-t">
                <button
                  type="button"
                  onClick={() => setShowEventModal(false)}
                  className="px-4 py-2 bg-white border border-slate-300 text-slate-700 rounded-md hover:bg-slate-50 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 transition-colors"
                >
                  Create Event
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default CustomCalendar;
