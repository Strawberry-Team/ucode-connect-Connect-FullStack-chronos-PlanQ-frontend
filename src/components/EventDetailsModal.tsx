import React from 'react';

interface Event {
  id: string;
  title: string;
  start: string;
  end?: string;
  description?: string;
  calendarId: string;
  type: 'reminder' | 'meeting' | 'task';
}

interface EventDetailsModalProps {
  event: Event;
  onClose: () => void;
  position: { x: number; y: number };
}

const EventDetailsModal: React.FC<EventDetailsModalProps> = ({
  event,
  onClose,
  position,
}) => {
  return (
    <div
      className="absolute bg-white p-4 rounded shadow-lg"
      style={{
        top: position.y,
        left: position.x,
        transform: 'translate(-50%, -50%)',
        zIndex: 1000,
      }}
    >
      <h2 className="text-lg font-bold mb-2">{event.title}</h2>
      <p className="text-sm text-gray-600 mb-1">
        <strong>Type:</strong> {event.type.charAt(0).toUpperCase() + event.type.slice(1)}
      </p>
      <p className="text-sm text-gray-600 mb-1">
        <strong>Start:</strong> {new Date(event.start).toLocaleString()}
      </p>
      {event.end && (
        <p className="text-sm text-gray-600 mb-1">
          <strong>End:</strong> {new Date(event.end).toLocaleString()}
        </p>
      )}
      {event.description && (
        <p className="text-sm text-gray-600 mb-2">
          <strong>Description:</strong> {event.description}
        </p>
      )}
      <button
        onClick={onClose}
        className="px-4 py-2 bg-gray-300 rounded mt-2"
      >
        Close
      </button>
    </div>
  );
};

export default EventDetailsModal;
