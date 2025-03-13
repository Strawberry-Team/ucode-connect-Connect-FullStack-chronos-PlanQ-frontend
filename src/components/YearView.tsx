import React from 'react';

interface YearViewProps {
  year: number;
  events: any[];
  onDayClick: (date: string) => void; // Обработчик клика по дню
}

const YearView: React.FC<YearViewProps> = ({ year, events, onDayClick }) => {
  const months = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December',
  ];

  return (
    <div className="grid grid-cols-4 gap-4 p-4">
      {months.map((month, index) => {
        const monthEvents = events.filter((event) => {
          const eventDate = new Date(event.start);
          return eventDate.getFullYear() === year && eventDate.getMonth() === index;
        });

        return (
          <div key={month} className="bg-white shadow rounded p-4">
            <h3 className="text-lg font-bold mb-2">{month}</h3>
            <div className="grid grid-cols-7 text-center text-sm text-gray-500">
              <span>Su</span>
              <span>Mo</span>
              <span>Tu</span>
              <span>We</span>
              <span>Th</span>
              <span>Fr</span>
              <span>Sa</span>
            </div>
            <div className="grid grid-cols-7 text-center text-sm">
              {Array.from({ length: new Date(year, index + 1, 0).getDate() }, (_, day) => {
                const date = new Date(year, index, day + 1);
                const isEvent = monthEvents.some(
                  (event) => new Date(event.start).toDateString() === date.toDateString()
                );

                return (
                  <div
                    key={day}
                    className={`p-1 rounded cursor-pointer ${isEvent ? 'bg-blue-500 text-white' : ''}`}
                    onClick={() => onDayClick(date.toISOString().split('T')[0])} // Передаем дату
                  >
                    {day + 1}
                  </div>
                );
              })}
            </div>
          </div>
        );
      })}
    </div>
  );
};

export default YearView;
