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
        // Фильтруем события для данного месяца
        const monthEvents = events.filter((event) => {
          const eventDate = new Date(event.start);
          return eventDate.getFullYear() === year && eventDate.getMonth() === index;
        });

        // Количество дней в месяце
        const daysCount = new Date(year, index + 1, 0).getDate();
        // День недели, с которого начинается месяц (0 - Sunday, 1 - Monday, …)
        const firstDayIndex = new Date(year, index, 1).getDay();
        // Массив пустых ячеек перед первым днем
        const blanks = Array.from({ length: firstDayIndex }, () => null);
        // Массив номеров дней
        const days = Array.from({ length: daysCount }, (_, i) => i + 1);
        // Общее количество ячеек
        const totalCells = blanks.length + days.length;
        // Если общее число ячеек не кратно 7, добавить пустые ячейки в конце
        const remainder = totalCells % 7;
        const trailingBlanks = remainder ? Array.from({ length: 7 - remainder }, () => null) : [];
        // Объединяем: сначала пустые ячейки, потом номера дней, потом завершающие пустые ячейки
        const allCells = [...blanks, ...days, ...trailingBlanks];

        return (
          <div key={month} className="bg-white shadow rounded p-4">
            <h3 className="text-lg font-bold mb-2">{month}</h3>
            {/* Заголовок дней недели */}
            <div className="grid grid-cols-7 text-center text-sm text-gray-500 mb-1">
              <span>Su</span>
              <span>Mo</span>
              <span>Tu</span>
              <span>We</span>
              <span>Th</span>
              <span>Fr</span>
              <span>Sa</span>
            </div>
            {/* Ячейки месяца */}
            <div className="grid grid-cols-7 text-center text-sm">
              {allCells.map((cell, idx) => {
                if (cell === null) {
                  // Пустая ячейка
                  return <div key={idx} className="p-1"></div>;
                } else {
                  const date = new Date(year, index, cell);
                  const isEvent = monthEvents.some(
                    (event: any) =>
                      new Date(event.start).toDateString() === date.toDateString()
                  );
                  return (
                    <div
                      key={idx}
                      className={`p-1 rounded cursor-pointer hover:bg-blue-100 ${
                        isEvent ? 'bg-blue-500 text-white' : 'text-gray-700'
                      }`}
                      onClick={() =>
                        onDayClick(date.toISOString().split('T')[0])
                      }
                    >
                      {cell}
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

export default YearView;
