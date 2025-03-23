import axios from "axios";

const API_URL = "http://localhost:3000/api"; // измените на ваш актуальный URL

const calendarService = {
  // Получение календарей пользователя по его id
  getUserCalendars: async (userId: string) => {
    const response = await axios.get(`${API_URL}/users/${userId}/calendars`);
    console.log("calendars:", response);
    return response.data;
  },

  // Создание нового календаря
  addCalendar: async (calendarData: any) => {
    const response = await axios.post(`${API_URL}/calendars`, calendarData);
    console.log("calendar created:", response);
    return response.data;
  },

  // Изменение цвета календаря
  updateCalendarColor: async (
    calendarId: string,
    userId: string,
    color: string
  ) => {
    const response = await axios.patch(
      `${API_URL}/calendars/${calendarId}/members/${userId}`,
      { color }
    );
    return response.data;
  },

  // Удаление календаря
  deleteCalendar: async (calendarId: string) => {
    await axios.delete(`${API_URL}/calendars/${calendarId}`);
  },

  // Редактирование названия и описания календаря
  updateCalendar: async (
    calendarId: string,
    data: { title: string; description: string }
  ) => {
    const response = await axios.patch(`${API_URL}/calendars/${calendarId}`, data);
    return response.data;
  },

  // Получение списка праздников (holiday events)
  getHolidays: async () => {
    const response = await axios.get(`${API_URL}/calendars/holidays`);
    console.log("holiday from service:", response);
    return response.data;
  },

  // Получение списка пользователей, имеющих доступ к календарю
  getCalendarUsers: async (calendarId: string) => {
    const response = await axios.get(`${API_URL}/calendars/${calendarId}/members`);
    return response.data;
  },

  // Добавление нового пользователя к календарю
  addCalendarUser: async (calendarId: string, payload: any) => {
    const response = await axios.post(
      `${API_URL}/calendars/${calendarId}/members`,
      payload
    );
    return response.data;
  },
   // Переключение видимости календаря
   toggleCalendarVisibility: async (
    calendarId: string,
    userId: string,
    isVisible: boolean
  ) => {
    const response = await axios.patch(
      `${API_URL}/calendars/${calendarId}/members/${userId}`,
      { isVisible }
    );
    return response.data;
  },
  // Новая функция: Покинуть календарь (Leave Calendar)
  leaveCalendar: async (calendarId: string, userId: string) => {
    const response = await axios.delete(
      `${API_URL}/calendars/${calendarId}/members/${userId}`
    );
    return response.data;
  },

  // Новая функция: Обновление роли пользователя в календаре (Update User Role)
  updateUserRole: async (
    calendarId: string,
    userId: string,
    role: string
  ) => {
    const response = await axios.patch(
      `${API_URL}/calendars/${calendarId}/members/${userId}`,
      { role }
    );
    return response.data;
  },
  
  removeUserFromCalendar: async (calendarId: string, userId: string) => {
    const url = `${API_URL}/calendars/${calendarId}/members/${userId}`;
    return axios.delete(url);
  },

  confirmCalendar: async (token: string) => {
    const response = await axios.post(
      `${API_URL}/calendars/0/members/confirm-calendar/${token}`
    );
    return response.data;
  },

};

export default calendarService;
