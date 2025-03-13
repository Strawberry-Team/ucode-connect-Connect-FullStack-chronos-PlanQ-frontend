import React, { useState } from 'react';

interface EventModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (eventData: {
    title: string;
    type: 'reminder' | 'meeting' | 'task';
    start: string;
    end?: string;
    description?: string;
    calendarId: string;
    color: string;
  }) => void;
  initialDate: string;
  calendars: { id: string; title: string; color: string }[];
}

const EventModal: React.FC<EventModalProps> = ({ isOpen, onClose, onSave, initialDate, calendars }) => {
  const [title, setTitle] = useState('');
  const [type, setType] = useState<'reminder' | 'meeting' | 'task'>('reminder');
  const [start, setStart] = useState(initialDate);
  const [end, setEnd] = useState('');
  const [description, setDescription] = useState('');
  const [calendarId, setCalendarId] = useState(calendars[0]?.id || '');
  const [color, setColor] = useState(calendars[0]?.color || '#000000');

  const handleSave = () => {
    if (!title) {
      alert('Title is required');
      return;
    }

    const eventData = {
      title,
      type,
      start,
      end: type !== 'reminder' ? end : undefined,
      description,
      calendarId,
      color,
    };

    onSave(eventData);
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white p-6 rounded-lg shadow-lg w-96">
        <h2 className="text-lg font-bold mb-4">Create Event</h2>
        <div className="mb-4">
          <label className="block text-sm font-medium mb-1">Title</label>
          <input
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            className="w-full p-2 border rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
        <div className="mb-4">
          <label className="block text-sm font-medium mb-1">Type</label>
          <select
            value={type}
            onChange={(e) => setType(e.target.value as 'reminder' | 'meeting' | 'task')}
            className="w-full p-2 border rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="reminder">Reminder</option>
            <option value="meeting">Meeting</option>
            <option value="task">Task</option>
          </select>
        </div>
        <div className="mb-4">
          <label className="block text-sm font-medium mb-1">Start Time</label>
          <input
            type="datetime-local"
            value={start}
            onChange={(e) => setStart(e.target.value)}
            className="w-full p-2 border rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
        {type !== 'reminder' && (
          <div className="mb-4">
            <label className="block text-sm font-medium mb-1">End Time</label>
            <input
              type="datetime-local"
              value={end}
              onChange={(e) => setEnd(e.target.value)}
              className="w-full p-2 border rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
        )}
        <div className="mb-4">
          <label className="block text-sm font-medium mb-1">Calendar</label>
          <select
            value={calendarId}
            onChange={(e) => {
              const selectedCalendar = calendars.find((cal) => cal.id === e.target.value);
              setCalendarId(e.target.value);
              setColor(selectedCalendar?.color || '#000000');
            }}
            className="w-full p-2 border rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            {calendars.map((calendar) => (
              <option key={calendar.id} value={calendar.id}>
                {calendar.title}
              </option>
            ))}
          </select>
        </div>
        <div className="mb-4">
          <label className="block text-sm font-medium mb-1">Event Color</label>
          <input
            type="color"
            value={color}
            onChange={(e) => setColor(e.target.value)}
            className="w-full p-2 border rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
        <div className="flex justify-end space-x-2">
          <button
            onClick={onClose}
            className="px-4 py-2 bg-gray-300 rounded hover:bg-gray-400 transition"
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 transition"
          >
            Save
          </button>
        </div>
      </div>
    </div>
  );
};

export default EventModal;
