import React, { useState, useEffect } from 'react';
import Sidebar from './Sidebar';
import MainCalendar from './MainCalendar';
import axios from 'axios';

interface Calendar {
  id: string;
  title: string;
  description?: string;
  isVisible: boolean;
  color: string;
  events: any[];
}

interface CalendarPageProps {
  user: {
    id: string;
    name: string;
    country: string;
  };
}

const CalendarPage: React.FC<CalendarPageProps> = ({ user }) => {
  const [calendars, setCalendars] = useState<Calendar[]>([]);

  // Инициализация календарей при загрузке страницы
  useEffect(() => {
    const initializeCalendars = async () => {
      const mainCalendar: Calendar = {
        id: 'main',
        title: 'My Calendar',
        description: 'Main personal calendar',
        isVisible: true,
        color: '#3b82f6', // Синий цвет по умолчанию
        events: [],
      };

      const holidaysCalendar: Calendar = {
        id: 'holidays',
        title: 'Holidays',
        description: `Holidays in ${user.country}`,
        isVisible: true,
        color: '#f59e0b', // Оранжевый цвет для праздников
        events: [],
      };

      // Получаем праздники с API
      try {
        const currentYear = new Date().getFullYear();
        const response = await axios.get(
          `https://calendarific.com/api/v2/holidays?api_key=81uMkvugyS3zLvPyeu2MMBu363XI1tDx&country=${user.country}&year=${currentYear}`
        );

        // Удаляем дубликаты на основе `id` или `title`
        const holidays = response.data.response.holidays
          .map((holiday: any) => ({
            id: holiday.name, // Используем `name` как уникальный идентификатор
            title: holiday.name,
            start: holiday.date.iso,
            calendarId: 'holidays',
            type: 'holiday',
            color: holidaysCalendar.color, // Устанавливаем цвет события
          }))
          .filter(
            (holiday: any, index: number, self: any[]) =>
              index === self.findIndex((h) => h.id === holiday.id) // Удаляем дубликаты
          );

        console.log('Filtered Holidays:', holidays);
        holidaysCalendar.events = holidays;
      } catch (error) {
        console.error('Error fetching holidays:', error);
      }

      setCalendars([mainCalendar, holidaysCalendar]);
    };

    initializeCalendars();
  }, [user]);

  // Обработчик для переключения видимости календаря
  const handleToggleCalendar = (id: string) => {
    setCalendars((prev) =>
      prev.map((calendar) =>
        calendar.id === id ? { ...calendar, isVisible: !calendar.isVisible } : calendar
      )
    );
  };

  // Обработчик для добавления нового календаря
  const handleAddCalendar = (newCalendar: Calendar) => {
    setCalendars([...calendars, newCalendar]);
  };

  return (
    <div className="flex h-screen">
      <Sidebar
        calendars={calendars}
        onToggleCalendar={handleToggleCalendar}
        onAddCalendar={handleAddCalendar}
      />
      <div className="flex-1 bg-gray-100 p-6">
        <MainCalendar
          visibleCalendars={calendars.filter((cal) => cal.isVisible).map((cal) => cal.id)}
          events={calendars
            .filter((cal) => cal.isVisible)
            .flatMap((cal) => cal.events)}
          calendars={calendars}
        />
      </div>
    </div>
  );
  
};

export default CalendarPage;
