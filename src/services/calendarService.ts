import axios from "axios";

const API_URL = "http://localhost:3000/api";

const calendarService = {
  getUserCalendars: async (userId: string) => {
    const response = await axios.get(`${API_URL}/users/${userId}/calendars`);
    return response.data;
  },

  addCalendar: async (calendarData: any) => {
    const response = await axios.post(`${API_URL}/calendars`, calendarData);
    return response.data;
  },

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

  deleteCalendar: async (calendarId: string) => {
    await axios.delete(`${API_URL}/calendars/${calendarId}`);
  },

  updateCalendar: async (
    calendarId: string,
    data: { title: string; description: string }
  ) => {
    const response = await axios.patch(`${API_URL}/calendars/${calendarId}`, data);
    return response.data;
  },

  getHolidays: async () => {
    const response = await axios.get(`${API_URL}/calendars/holidays`);
    return response.data;
  },

  getCalendarUsers: async (calendarId: string) => {
    const response = await axios.get(`${API_URL}/calendars/${calendarId}/members`);
    return response.data;
  },

  addCalendarUser: async (calendarId: string, payload: any) => {
    const response = await axios.post(
      `${API_URL}/calendars/${calendarId}/members`,
      payload
    );
    return response.data;
  },
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
  leaveCalendar: async (calendarId: string, userId: string) => {
    const response = await axios.delete(
      `${API_URL}/calendars/${calendarId}/members/${userId}`
    );
    return response.data;
  },

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
