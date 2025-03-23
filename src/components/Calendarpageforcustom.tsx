// import React, { useState, useEffect } from 'react';
// import Sidebar from './Sidebar';
// import MainCalendar from './MainCalendar';
// import Header from './Header'; // Подключаем хедер
// import axios from 'axios';

// interface Calendar {
//   id: string;
//   title: string;
//   description?: string;
//   isVisible: boolean;
//   color: string;
//   events: any[];
// }

// interface CalendarPageProps {
//   user: {
//     id: string;
//     name: string;
//     country: string;
//   };
// }

// const CalendarPage: React.FC<CalendarPageProps> = ({ user }) => {
//   const [calendars, setCalendars] = useState<Calendar[]>([]);

//   // Инициализация календарей при загрузке страницы
//   useEffect(() => {
//     const initializeCalendars = async () => {
//       const mainCalendar: Calendar = {
//         id: 'main',
//         title: 'My Calendar',
//         description: 'Main personal calendar',
//         isVisible: true,
//         color: '#3b82f6', // Синий цвет по умолчанию
//         events: [],
//       };

//       const holidaysCalendar: Calendar = {
//         id: 'holidays',
//         title: 'Holidays',
//         description: `Holidays in ${user.country}`,
//         isVisible: true,
//         color: '#f59e0b', // Оранжевый цвет для праздников
//         events: [],
//       };

//       // Получаем праздники с API
//       try {
//         const currentYear = new Date().getFullYear();
//         const response = await axios.get(
//           `https://calendarific.com/api/v2/holidays?api_key=81uMkvugyS3zLvPyeu2MMBu363XI1tDx&country=${user.country}&year=${currentYear}`
//         );

//         // Удаляем дубликаты на основе `id` или `title`
//         const holidays = response.data.response.holidays
//           .map((holiday: any) => ({
//             id: holiday.name, // Используем `name` как уникальный идентификатор
//             title: holiday.name,
//             start: holiday.date.iso,
//             calendarId: 'holidays',
//             type: 'holiday',
//             color: holidaysCalendar.color, // Устанавливаем цвет события
//           }))
//           .filter(
//             (holiday: any, index: number, self: any[]) =>
//               index === self.findIndex((h) => h.id === holiday.id) // Удаляем дубликаты
//           );

//         console.log('Filtered Holidays:', holidays);
//         holidaysCalendar.events = holidays;
//       } catch (error) {
//         console.error('Error fetching holidays:', error);
//       }

//       setCalendars([mainCalendar, holidaysCalendar]);
//     };

//     initializeCalendars();
//   }, [user]);

//   // Обработчик для переключения видимости календаря
//   const handleToggleCalendar = (id: string) => {
//     setCalendars((prev) =>
//       prev.map((calendar) =>
//         calendar.id === id ? { ...calendar, isVisible: !calendar.isVisible } : calendar
//       )
//     );
//   };

//   // Обработчик для добавления нового календаря
//   const handleAddCalendar = (newCalendar: Calendar) => {
//     setCalendars([...calendars, newCalendar]);
//   };

//   return (
//     <div className="flex flex-col h-screen">


//       {/* Основной контент */}
//       <div className="flex flex-1 overflow-hidden">
//         {/* Боковая панель */}
//         <Sidebar
//           calendars={calendars}
//           onToggleCalendar={handleToggleCalendar}
//           onAddCalendar={handleAddCalendar}
//         />

//         {/* Основной календарь */}
//         <div className="flex-1 bg-gray-100 p-6 overflow-auto">
//           <MainCalendar
//             visibleCalendars={calendars.filter((cal) => cal.isVisible).map((cal) => cal.id)}
//             events={calendars
//               .filter((cal) => cal.isVisible)
//               .flatMap((cal) => cal.events)}
//             calendars={calendars}
//           />
//         </div>
//       </div>
//     </div>
//   );
// };

// export default CalendarPage;



///////////
// import React, { useEffect } from "react";
// import { useDispatch, useSelector } from "react-redux";
// import Header from "./Header";
// import Sidebar from "./Sidebar";
// import CustomCalendar, { CalendarData, CalendarEvent } from "./CustomCalendar";
// import { AppDispatch, RootState } from "../store";
// import {
//   getUserCalendars,
//   changeCalendarColor,
//   deleteCalendar,
//   editCalendar,
//   addCalendar,
// } from "../actions/calendarActions";

// const CalendarPage: React.FC = () => {
//   const dispatch: AppDispatch = useDispatch();

//   // Получаем текущего пользователя из auth-состояния
//   const authUser = useSelector((state: RootState) => state.auth.user);

//   // Извлекаем календари, состояние загрузки и ошибки из календарного редюсера
//   const { calendars, loading, error } = useSelector(
//     (state: RootState) => state.calendar
//   ) || { calendars: [], loading: false, error: null };

//   useEffect(() => {
//     // Если пользователь авторизован, диспатчим экшен для загрузки календарей
//     if (authUser && authUser.id) {
//       dispatch(getUserCalendars(String(authUser.id)));
//     }
//   }, [dispatch, authUser]);

//   // Преобразуем данные календарей – добавляем isMain
//   const formattedCalendars = calendars.map((item: any) => ({
//     id: item.calendarId || item.id,
//     title: item.calendar?.name || "Без названия",
//     description: item.calendar?.description || "",
//     isVisible: true,
//     color: item.color || "#10b981",
//     events: [],
//     isMain: item.isMain || (item.calendar && item.calendar.isMain) || false,
//   }));

//   // Собираем события из видимых календарей
//   const allEvents: CalendarEvent[] = formattedCalendars
//     .filter((cal) => cal.isVisible && cal.events)
//     .flatMap((cal) => cal.events || []);

//   // Локальные обработчики
//   const handleToggleCalendar = (id: string) => {
//     console.log("Toggle calendar with id:", id);
//   };

//   const handleAddCalendar = (newCalendar: { name: string; description: string; color: string }) => {
//     if (authUser && authUser.id) {
//       dispatch(addCalendar(newCalendar, authUser.id));
//     }
//   };

//   const handleChangeColor = (calendarId: string, color: string) => {
//     if (authUser && authUser.id) {
//       dispatch(changeCalendarColor(calendarId, authUser.id, color));
//     }
//   };

//   const handleDeleteCalendar = (calendarId: string) => {
//     console.log(calendarId);
//     dispatch(deleteCalendar(calendarId));
//   };

//   const handleEditCalendar = (calendarId: string, title: string, description: string) => {
//     if (authUser && authUser.id) {
//     dispatch(editCalendar(calendarId, title, description, authUser.id));
//     }
//   };

//   const handleAddEvent = (newEvent: CalendarEvent) => {
//     console.log("Add new event:", newEvent);
//   };

//   if (loading) return <div>Loading calendars...</div>;
//   if (error) return <div>Error: {error}</div>;

//   return (
//     <div className="flex flex-col h-screen">
//       <Header />
//       <div className="flex flex-1 overflow-hidden">
//         <Sidebar
//           calendars={formattedCalendars}
//           onToggleCalendar={handleToggleCalendar}
//           onAddCalendar={handleAddCalendar}
//           onChangeColor={handleChangeColor}
//           onDeleteCalendar={handleDeleteCalendar}
//           onEditCalendar={handleEditCalendar}
//         />
//         <div className="flex-1 bg-gray-100 p-6 overflow-auto">
//           <CustomCalendar
//             events={allEvents}
//             calendars={formattedCalendars}
//             onAddEvent={handleAddEvent}
//           />
//         </div>
//       </div>
//     </div>
//   );
// };

// export default CalendarPage;
