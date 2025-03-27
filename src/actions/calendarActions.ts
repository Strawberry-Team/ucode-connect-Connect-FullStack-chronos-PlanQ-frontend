import { AppDispatch } from "../store";
import calendarService from "../services/calendarService";
import {
  getCalendarsRequest,
  getCalendarsSuccess,
  getCalendarsFailure,
  updateCalendarRequest,
  toggleCalendarVisibilitySuccess,
  updateCalendarSuccess,
  updateCalendarFailure,
  deleteCalendarRequest,
  deleteCalendarSuccess,
  deleteCalendarFailure,
  addCalendarRequest,
  addCalendarSuccess,
  addCalendarFailure,
  getHolidaysRequest,
  getHolidaysSuccess,
  getHolidaysFailure,
  getCalendarUsersRequest,
  getCalendarUsersSuccess,
  getCalendarUsersFailure,
  addCalendarUserRequest,
  addCalendarUserSuccess,
  addCalendarUserFailure,
} from "../reducers/calendarReducer";

export const getUserCalendars = (userId: string) => async (dispatch: AppDispatch) => {
  try {
    dispatch(getCalendarsRequest());
    const data = await calendarService.getUserCalendars(userId);
    console.log('userCalendars', data);
    dispatch(getCalendarsSuccess(data));
  } catch (error: any) {
    dispatch(getCalendarsFailure(error.response?.data?.message || "Failed to get calendars"));
  }
};

export const toggleCalendarVisibility = (
  calendarId: string,
  userId: string,
  currentVisibility: boolean
) => async (dispatch: AppDispatch) => {
  try {
    dispatch(updateCalendarRequest());
    const updatedCalendar = await calendarService.toggleCalendarVisibility(
      calendarId,
      userId,
      !currentVisibility
    );
    console.log('updatedCalendar', updatedCalendar);
    dispatch(
      toggleCalendarVisibilitySuccess({
        calendarId,
        isVisible: !currentVisibility,
      })
    );
   dispatch(getUserCalendars(userId));
  } catch (error: any) {
    dispatch(
      updateCalendarFailure(
        error.response?.data?.message || "Failed to toggle calendar visibility"
      )
    );
  }
};

export const updateCalendar = (calendarId: string, calendarData: any) => async (dispatch: AppDispatch) => {
  try {
    dispatch(updateCalendarRequest());
    const data = await calendarService.updateCalendar(calendarId, calendarData);
    dispatch(updateCalendarSuccess(data));
  } catch (error: any) {
    dispatch(updateCalendarFailure(error.response?.data?.message || "Failed to update calendar"));
  }
};

export const addCalendar = (
  calendarData: { name: string; description: string; color: string },
  userId: string
) => async (dispatch: AppDispatch) => {
  try {
    dispatch(addCalendarRequest());
    const data = await calendarService.addCalendar(calendarData);
    dispatch(addCalendarSuccess(data));
    dispatch(getUserCalendars(userId));
  } catch (error: any) {
    dispatch(addCalendarFailure(error.response?.data?.message || "Не удалось создать календарь"));
  }
};

export const changeCalendarColor = (calendarId: string, userId: string, color: string) => async (dispatch: AppDispatch) => {
  try {
    dispatch(updateCalendarRequest());
    const updatedCalendar = await calendarService.updateCalendarColor(calendarId, userId, color);
    dispatch(updateCalendarSuccess(updatedCalendar));
    dispatch(getUserCalendars(userId));
  } catch (error: any) {
    dispatch(updateCalendarFailure(error.message));
  }
};

export const deleteCalendar = (calendarId: string, userId: string) => async (dispatch: AppDispatch) => {
  try {
    dispatch(deleteCalendarRequest());
    await calendarService.deleteCalendar(calendarId);
    dispatch(deleteCalendarSuccess(calendarId));
    dispatch(getUserCalendars(userId));
  } catch (error: any) {
    dispatch(deleteCalendarFailure(error.message));
  }
};

export const editCalendar = (calendarId: string, title: string, description: string, userId: string) => async (dispatch: AppDispatch) => {
  try {
    dispatch(updateCalendarRequest());
    const updatedCalendar = await calendarService.updateCalendar(calendarId, { name: title, description });
    dispatch(updateCalendarSuccess(updatedCalendar));
    dispatch(getUserCalendars(userId));
  } catch (error: any) {
    dispatch(updateCalendarFailure(error.message));
  }
};

export const getHolidays = () => async (dispatch: AppDispatch) => {
  try {
    dispatch(getHolidaysRequest());
    const data = await calendarService.getHolidays();
    dispatch(getHolidaysSuccess(data));
  } catch (error: any) {
    dispatch(getHolidaysFailure(error.response?.data?.message || "Failed to get holidays"));
  }
};

export const getCalendarUsers = (calendarId: string) => async (dispatch: AppDispatch) => {
  try {
    dispatch(getCalendarUsersRequest());
    const data = await calendarService.getCalendarUsers(calendarId);
    dispatch(getCalendarUsersSuccess(data));
    return data;
  } catch (error: any) {
    const errorMessage = error.response?.data?.message || "Failed to get calendar users";
    dispatch(getCalendarUsersFailure(errorMessage));
    throw new Error(errorMessage);
  }
};

export const addCalendarUser = (
  calendarId: string,
  payload: { userEmail: string; role: string }
) => async (dispatch: AppDispatch) => {
  try {
    dispatch(addCalendarUserRequest());
    const data = await calendarService.addCalendarUser(calendarId, payload);
    dispatch(addCalendarUserSuccess(data));
    const updatedUsers = await calendarService.getCalendarUsers(calendarId);
    dispatch(getCalendarUsersSuccess(updatedUsers));
    return data;
  } catch (error: any) {
    const errorMessage =
      error.response?.data?.message || "Failed to add calendar user";
    dispatch(addCalendarUserFailure(errorMessage));
    return { error: errorMessage };
  }
};


export const confirmCalendar = (
  token: string
) => async (dispatch: AppDispatch) => {
  try {
    const data = await calendarService.confirmCalendar(token);
    return data;
  } catch (error: any) {
    throw error;
  }
};

