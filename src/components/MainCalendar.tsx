import React, { useState } from 'react';
import { Calendar as BigCalendar, dateFnsLocalizer } from 'react-big-calendar';
import format from 'date-fns/format';
import parse from 'date-fns/parse';
import startOfWeek from 'date-fns/startOfWeek';
import getDay from 'date-fns/getDay';
import enUS from 'date-fns/locale/en-US'; // Импорт локали date-fns
import 'react-big-calendar/lib/css/react-big-calendar.css';
import YearView from './YearView';

export interface CalendarEvent {
  id: string;
  title: string;
  start: string; // ожидаем строковое представление, которое позже преобразуется в Date
  end?: string;
  description?: string;
  calendarId: string;
  type: 'reminder' | 'meeting' | 'task' | 'holiday';
  color: string;
}

export interface CalendarData {
  id: string;
  title: string;
  color: string;
  events?: CalendarEvent[];
}

interface MainCalendarProps {
  visibleCalendars: string[];
  events: CalendarEvent[];
  calendars: CalendarData[];
}

const locales = {
  'en-US': enUS,
};

const localizer = dateFnsLocalizer({
  format,
  parse,
  startOfWeek,
  getDay,
  locales,
});

const MainCalendar: React.FC<MainCalendarProps> = ({ visibleCalendars, events, calendars }) => {
  const [currentView, setCurrentView] = useState<'day' | 'week' | 'month' | 'year'>('month');
  const [currentDate, setCurrentDate] = useState(new Date());
  const [currentYear, setCurrentYear] = useState(new Date().getFullYear());

  // Преобразование событий: строки -> Date
  const convertedEvents = events.map(ev => ({
    ...ev,
    start: new Date(ev.start),
    end: ev.end ? new Date(ev.end) : new Date(ev.start),
  }));

  const handleNavigate = (date: Date) => {
    setCurrentDate(date);
  };

  const renderCalendar = () => {
    if (currentView === 'year') {
      return (
        <YearView
          year={currentYear}
          events={convertedEvents}
          onDayClick={(dateStr: string) => {
            setCurrentDate(new Date(dateStr));
            setCurrentView('day');
          }}
        />
      );
    }
    return (
      <BigCalendar
        localizer={localizer}
        events={convertedEvents}
        date={currentDate}
        view={currentView}
        onNavigate={handleNavigate}
        views={{ day: true, week: true, month: true }}
        style={{ height: '80vh' }}
        eventPropGetter={(event) => ({
          style: {
            backgroundColor: event.color,
            borderRadius: '4px',
            opacity: 0.8,
            color: '#fff',
            border: 'none',
          },
        })}
      />
    );
  };

  return (
    <div>
      {/* Панель переключения представлений и навигации */}
      <div className="flex justify-between items-center mb-4">
        <div className="flex space-x-2">
          <button
            onClick={() => setCurrentView('day')}
            className={`px-4 py-2 rounded ${currentView === 'day' ? 'bg-blue-600 text-white' : 'bg-gray-200 text-gray-800'}`}
          >
            Day
          </button>
          <button
            onClick={() => setCurrentView('week')}
            className={`px-4 py-2 rounded ${currentView === 'week' ? 'bg-blue-600 text-white' : 'bg-gray-200 text-gray-800'}`}
          >
            Week
          </button>
          <button
            onClick={() => setCurrentView('month')}
            className={`px-4 py-2 rounded ${currentView === 'month' ? 'bg-blue-600 text-white' : 'bg-gray-200 text-gray-800'}`}
          >
            Month
          </button>
          <button
            onClick={() => setCurrentView('year')}
            className={`px-4 py-2 rounded ${currentView === 'year' ? 'bg-blue-600 text-white' : 'bg-gray-200 text-gray-800'}`}
          >
            Year
          </button>
        </div>
        {currentView === 'year' ? (
          <div className="flex items-center space-x-4">
            <button onClick={() => setCurrentYear(prev => prev - 1)} className="px-4 py-2 bg-gray-200 rounded">
              Previous
            </button>
            <span className="font-bold text-lg">{currentYear}</span>
            <button onClick={() => setCurrentYear(prev => prev + 1)} className="px-4 py-2 bg-gray-200 rounded">
              Next
            </button>
          </div>
        ) : (
          <div className="flex items-center space-x-2">
            <button onClick={() => setCurrentDate(new Date())} className="px-4 py-2 bg-gray-200 rounded">
              Today
            </button>
            <button
              onClick={() => handleNavigate(new Date(currentDate.getTime() - 86400000))}
              className="px-4 py-2 bg-gray-200 rounded"
            >
              Prev
            </button>
            <button
              onClick={() => handleNavigate(new Date(currentDate.getTime() + 86400000))}
              className="px-4 py-2 bg-gray-200 rounded"
            >
              Next
            </button>
          </div>
        )}
      </div>

      {renderCalendar()}
    </div>
  );
};

export default MainCalendar;
