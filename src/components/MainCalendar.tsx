import React, { useState } from 'react';
import FullCalendar from '@fullcalendar/react';
import dayGridPlugin from '@fullcalendar/daygrid';
import timeGridPlugin from '@fullcalendar/timegrid';
import interactionPlugin from '@fullcalendar/interaction';
import EventModal from './EventModal';
import EventDetailsModal from './EventDetailsModal';
import YearView from './YearView';

interface Event {
  id: string;
  title: string;
  start: string;
  end?: string;
  description?: string;
  calendarId: string;
  type: 'reminder' | 'meeting' | 'task';
  color: string;
}

interface Calendar {
  id: string;
  title: string;
  color: string;
}

interface MainCalendarProps {
  visibleCalendars: string[];
  events: Event[];
  calendars: Calendar[];
}

const MainCalendar: React.FC<MainCalendarProps> = ({ visibleCalendars, events, calendars }) => {
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]); // Текущая дата
  const [selectedEvent, setSelectedEvent] = useState<Event | null>(null);
  const [modalPosition, setModalPosition] = useState({ x: 0, y: 0 });
  const [currentView, setCurrentView] = useState<'day' | 'week' | 'month' | 'year'>('month');
  const [currentYear, setCurrentYear] = useState(new Date().getFullYear());

  const handleDateClick = (info: any) => {
    setSelectedDate(info.dateStr);
    setIsCreateModalOpen(true);
  };

  const handleSaveEvent = (eventData: {
    title: string;
    type: 'reminder' | 'meeting' | 'task';
    start: string;
    end?: string;
    description?: string;
    calendarId: string;
    color: string;
  }) => {
    const newEvent: Event = {
      id: Date.now().toString(),
      ...eventData,
    };

    const calendar = calendars.find((cal) => cal.id === eventData.calendarId);
    if (calendar) {
      calendar.events.push(newEvent);
    }

    setIsCreateModalOpen(false);
  };

  const handleEventClick = (info: any) => {
    const clickedEvent = events.find((event) => event.id === info.event.id);
    if (clickedEvent) {
      setSelectedEvent(clickedEvent);
      setModalPosition({ x: info.jsEvent.pageX, y: info.jsEvent.pageY });
    }
  };

  // Обработчик клика по дню в YearView
  const handleDayClickInYearView = (date: string) => {
    setSelectedDate(date); // Устанавливаем выбранную дату
    setCurrentView('day'); // Переключаемся на дневное представление
  };

  return (
    <div>
      <div className="flex justify-between items-center mb-4">
        <div>
          <button
            onClick={() => setCurrentView('day')}
            className={`px-4 py-2 rounded ${currentView === 'day' ? 'bg-blue-500 text-white' : 'bg-gray-200'}`}
          >
            Day
          </button>
          <button
            onClick={() => setCurrentView('week')}
            className={`px-4 py-2 rounded ${currentView === 'week' ? 'bg-blue-500 text-white' : 'bg-gray-200'}`}
          >
            Week
          </button>
          <button
            onClick={() => setCurrentView('month')}
            className={`px-4 py-2 rounded ${currentView === 'month' ? 'bg-blue-500 text-white' : 'bg-gray-200'}`}
          >
            Month
          </button>
          <button
            onClick={() => setCurrentView('year')}
            className={`px-4 py-2 rounded ${currentView === 'year' ? 'bg-blue-500 text-white' : 'bg-gray-200'}`}
          >
            Year
          </button>
        </div>
        {currentView === 'year' && (
          <div>
            <button onClick={() => setCurrentYear((prev) => prev - 1)} className="px-4 py-2 bg-gray-200 rounded">
              Previous
            </button>
            <span className="mx-4 font-bold">{currentYear}</span>
            <button onClick={() => setCurrentYear((prev) => prev + 1)} className="px-4 py-2 bg-gray-200 rounded">
              Next
            </button>
          </div>
        )}
      </div>

      {currentView === 'year' ? (
        <YearView year={currentYear} events={events} onDayClick={handleDayClickInYearView} />
      ) : (
        <FullCalendar
          plugins={[dayGridPlugin, timeGridPlugin, interactionPlugin]}
          initialView={currentView === 'day' ? 'timeGridDay' : currentView === 'week' ? 'timeGridWeek' : 'dayGridMonth'}
          events={events}
          dateClick={handleDateClick}
          eventClick={handleEventClick}
          headerToolbar={false}
          initialDate={selectedDate} // Устанавливаем выбранную дату
        />
      )}

      <EventModal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        onSave={handleSaveEvent}
        initialDate={selectedDate}
        calendars={calendars}
      />
      {selectedEvent && (
        <EventDetailsModal
          event={selectedEvent}
          onClose={() => setSelectedEvent(null)}
          position={modalPosition}
        />
      )}
    </div>
  );
};

export default MainCalendar;
