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
  // Новые экшены для пользователей календаря:
  getCalendarUsersRequest,
  getCalendarUsersSuccess,
  getCalendarUsersFailure,
  addCalendarUserRequest,
  addCalendarUserSuccess,
  addCalendarUserFailure,
} from "../reducers/calendarReducer";

// Получение календарей пользователя по userId
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
// Новая операция для изменения видимости календаря через БД.
// При вызове происходит отправка PATCH запроса с телом { isVisible: НЕ_текущее_значение }
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
    // Обновляем список календарей (при необходимости)
   dispatch(getUserCalendars(userId));
  } catch (error: any) {
    dispatch(
      updateCalendarFailure(
        error.response?.data?.message || "Failed to toggle calendar visibility"
      )
    );
  }
};
// Обновление календаря
export const updateCalendar = (calendarId: string, calendarData: any) => async (dispatch: AppDispatch) => {
  try {
    dispatch(updateCalendarRequest());
    const data = await calendarService.updateCalendar(calendarId, calendarData);
    dispatch(updateCalendarSuccess(data));
  } catch (error: any) {
    dispatch(updateCalendarFailure(error.response?.data?.message || "Failed to update calendar"));
  }
};

// Добавление нового календаря
export const addCalendar = (
  calendarData: { name: string; description: string; color: string },
  userId: string
) => async (dispatch: AppDispatch) => {
  try {
    dispatch(addCalendarRequest());
    const data = await calendarService.addCalendar(calendarData);
    dispatch(addCalendarSuccess(data));
    // После успешного создания календаря обновляем список
    dispatch(getUserCalendars(userId));
  } catch (error: any) {
    dispatch(addCalendarFailure(error.response?.data?.message || "Не удалось создать календарь"));
  }
};

// Изменение цвета календаря
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

// Удаление календаря
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

// Редактирование календаря
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

// Получение праздников
export const getHolidays = () => async (dispatch: AppDispatch) => {
  try {
    dispatch(getHolidaysRequest());
    const data = await calendarService.getHolidays();
    dispatch(getHolidaysSuccess(data));
  } catch (error: any) {
    dispatch(getHolidaysFailure(error.response?.data?.message || "Failed to get holidays"));
  }
};

// Новая операция: получение списка пользователей календаря
// Получение списка пользователей календаря
export const getCalendarUsers = (calendarId: string) => async (dispatch: AppDispatch) => {
  try {
    dispatch(getCalendarUsersRequest());
    const data = await calendarService.getCalendarUsers(calendarId);
    dispatch(getCalendarUsersSuccess(data));
    return data; // Возвращаем данные
  } catch (error: any) {
    const errorMessage = error.response?.data?.message || "Failed to get calendar users";
    dispatch(getCalendarUsersFailure(errorMessage));
    throw new Error(errorMessage); // Пробрасываем ошибку
  }
};

// Добавление нового пользователя к календарю
export const addCalendarUser = (
  calendarId: string,
  payload: { userEmail: string; role: string }
) => async (dispatch: AppDispatch) => {
  try {
    dispatch(addCalendarUserRequest());
    const data = await calendarService.addCalendarUser(calendarId, payload);
    dispatch(addCalendarUserSuccess(data));
    // После добавления обновляем список пользователей
    const updatedUsers = await calendarService.getCalendarUsers(calendarId);
    dispatch(getCalendarUsersSuccess(updatedUsers));
    return data; // Возвращаем данные в случае успеха
  } catch (error: any) {
    const errorMessage =
      error.response?.data?.message || "Failed to add calendar user";
    dispatch(addCalendarUserFailure(errorMessage));
    // Возвращаем объект с ошибкой вместо выброса исключения
    return { error: errorMessage };
  }
};


export const confirmCalendar = (
  token: string
) => async (dispatch: AppDispatch) => {
  try {
    //dispatch(setLoading(true));
    const data = await calendarService.confirmCalendar(token);
    //dispatch(setLoading(false));
    return data;
  } catch (error: any) {
    // dispatch(
    //   setError(
    //     error.response?.data?.message || "Calendar confirmation failed"
    //   )
    // );
    throw error;
  }
};

