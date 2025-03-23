import { createSlice, PayloadAction } from "@reduxjs/toolkit";
import { CalendarEvent } from "@/components/CustomCalendar"; // при необходимости обновите путь

export interface CalendarData {
  id: string;
  title: string;
  description: string;
  isVisible: boolean;
  color: string;
  events?: CalendarEvent[];
  isMain?: boolean;
  createdAt?: string;
}

interface CalendarState {
  calendars: CalendarData[];
  holidays: CalendarEvent[];
  calendarUsers: any[];
  loading: boolean;
  error: string | null;
}

const initialState: CalendarState = {
  calendars: [],
  holidays: [],
  calendarUsers: [],
  loading: false,
  error: null,
};

const calendarSlice = createSlice({
  name: "calendar",
  initialState,
  reducers: {
    // Запрос календарей
    getCalendarsRequest: (state) => {
      state.loading = false;
      state.error = null;
    },
    getCalendarsSuccess: (state, action: PayloadAction<CalendarData[]>) => {
      state.calendars = action.payload.sort(
        (a, b) =>
          new Date(a.createdAt!).getTime() - new Date(b.createdAt!).getTime()
      );
      state.loading = false;
    },
    getCalendarsFailure: (state, action: PayloadAction<string>) => {
      state.loading = false;
      state.error = action.payload;
    },
    // Обновление календаря (в том числе изменение isVisible)
    updateCalendarRequest: (state) => {
      state.loading = false;//утута было true и изза этого анимация загрузки появлялась которая вообще не нужна 
      state.error = null;
    },
    // Новый экшен: обновление видимости календаря
    toggleCalendarVisibilitySuccess: (
      state,
      action: PayloadAction<{ calendarId: string; isVisible: boolean }>
    ) => {
      state.calendars = state.calendars.map((cal) =>
        cal.id === action.payload.calendarId
          ? { ...cal, isVisible: action.payload.isVisible }
          : cal
      );
      state.loading = false;
    },
    updateCalendarSuccess: (state, action: PayloadAction<CalendarData>) => {
      const updatedCalendar = action.payload;
      state.calendars = state.calendars.map((cal) =>
        cal.id === updatedCalendar.id ? updatedCalendar : cal
      );
      state.loading = false;
    },
    updateCalendarFailure: (state, action: PayloadAction<string>) => {
      state.loading = false;
      state.error = action.payload;
    },
    // Добавление календаря
    addCalendarRequest: (state) => {
      state.loading = false;
      state.error = null;
    },
    addCalendarSuccess: (state, action: PayloadAction<CalendarData>) => {
      state.calendars.push(action.payload);
      state.calendars.sort(
        (a, b) =>
          new Date(a.createdAt!).getTime() - new Date(b.createdAt!).getTime()
      );
      state.loading = false;
    },
    addCalendarFailure: (state, action: PayloadAction<string>) => {
      state.loading = false;
      state.error = action.payload;
    },
    // Удаление календаря
    deleteCalendarRequest: (state) => {
      state.loading = false;
      state.error = null;
    },
    deleteCalendarSuccess: (state, action: PayloadAction<string>) => {
      const calendarId = action.payload;
      state.calendars = state.calendars.filter((cal) => cal.id !== calendarId);
      state.loading = false;
    },
    deleteCalendarFailure: (state, action: PayloadAction<string>) => {
      state.loading = false;
      state.error = action.payload;
    },
    // Получение праздников
    getHolidaysRequest: (state) => {
      state.loading = false;
      state.error = null;
    },
    getHolidaysSuccess: (state, action: PayloadAction<CalendarEvent[]>) => {
      state.holidays = action.payload;
      state.loading = false;
    },
    getHolidaysFailure: (state, action: PayloadAction<string>) => {
      state.loading = false;
      state.error = action.payload;
    },
    // Получение пользователей календаря
    getCalendarUsersRequest: (state) => {
      state.loading = false;
      state.error = null;
    },
    getCalendarUsersSuccess: (state, action: PayloadAction<any[]>) => {
      state.calendarUsers = action.payload;
      state.loading = false;
    },
    getCalendarUsersFailure: (state, action: PayloadAction<string>) => {
      state.loading = false;
      state.error = action.payload;
    },
    // Добавление пользователя к календарю
    addCalendarUserRequest: (state) => {
      state.loading = true;
      state.error = null;
    },
    addCalendarUserSuccess: (state, action: PayloadAction<any>) => {
      state.loading = false;
    },
    addCalendarUserFailure: (state, action: PayloadAction<string>) => {
      state.loading = false;
      state.error = action.payload;
    },
  },
});

export const {
  getCalendarsRequest,
  getCalendarsSuccess,
  getCalendarsFailure,
  updateCalendarRequest,
  toggleCalendarVisibilitySuccess,
  updateCalendarSuccess,
  updateCalendarFailure,
  addCalendarRequest,
  addCalendarSuccess,
  addCalendarFailure,
  deleteCalendarRequest,
  deleteCalendarSuccess,
  deleteCalendarFailure,
  getHolidaysRequest,
  getHolidaysSuccess,
  getHolidaysFailure,
  getCalendarUsersRequest,
  getCalendarUsersSuccess,
  getCalendarUsersFailure,
  addCalendarUserRequest,
  addCalendarUserSuccess,
  addCalendarUserFailure,
} = calendarSlice.actions;

export default calendarSlice.reducer;
