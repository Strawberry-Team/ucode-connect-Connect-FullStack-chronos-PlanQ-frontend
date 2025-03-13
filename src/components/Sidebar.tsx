import React, { useState } from 'react';

interface Calendar {
  id: string;
  title: string;
  description?: string;
  isVisible: boolean;
  color: string;
}

interface SidebarProps {
  calendars: Calendar[];
  onToggleCalendar: (id: string) => void;
  onAddCalendar: (newCalendar: Calendar) => void;
}

const Sidebar: React.FC<SidebarProps> = ({ calendars, onToggleCalendar, onAddCalendar }) => {
  const [newCalendarTitle, setNewCalendarTitle] = useState('');
  const [newCalendarDescription, setNewCalendarDescription] = useState('');

  const handleAddCalendar = () => {
    if (!newCalendarTitle) {
      alert('Title is required');
      return;
    }

    const newCalendar: Calendar = {
      id: Date.now().toString(),
      title: newCalendarTitle,
      description: newCalendarDescription,
      isVisible: true,
      color: '#10b981', // Зеленый цвет по умолчанию
      events: [],
    };

    onAddCalendar(newCalendar);
    setNewCalendarTitle('');
    setNewCalendarDescription('');
  };

  return (
    <div className="w-64 bg-gray-50 p-6 border-r border-gray-200">
      <h2 className="text-lg font-bold mb-4 text-gray-700">My Calendars</h2>
      <ul className="mb-6">
        {calendars.map((calendar) => (
          <li key={calendar.id} className="flex items-center mb-2">
            {/* Кастомный чекбокс */}
            <div className="relative flex items-center">
              <input
                type="checkbox"
                checked={calendar.isVisible}
                onChange={() => onToggleCalendar(calendar.id)}
                className="appearance-none h-4 w-4 border border-gray-300 rounded-sm checked:bg-current checked:border-transparent focus:outline-none"
                style={{ backgroundColor: calendar.isVisible ? calendar.color : 'transparent' }}
              />
            </div>
            {/* Название календаря */}
            <span className="ml-2 text-sm font-medium text-gray-800">{calendar.title}</span>
          </li>
        ))}
      </ul>
      <div>
        <h3 className="text-sm font-bold mb-2 text-gray-600">Add New Calendar</h3>
        <input
          type="text"
          placeholder="Title"
          value={newCalendarTitle}
          onChange={(e) => setNewCalendarTitle(e.target.value)}
          className="w-full mb-2 p-2 border rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
        <textarea
          placeholder="Description (optional)"
          value={newCalendarDescription}
          onChange={(e) => setNewCalendarDescription(e.target.value)}
          className="w-full mb-2 p-2 border rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
        <button
          onClick={handleAddCalendar}
          className="w-full bg-blue-500 text-white py-2 rounded hover:bg-blue-600 transition"
        >
          Add Calendar
        </button>
      </div>
    </div>
  );
};

export default Sidebar;
