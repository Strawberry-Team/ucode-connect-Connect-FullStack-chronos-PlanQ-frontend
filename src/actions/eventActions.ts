import { Dispatch } from 'redux';
import { EventActionTypes } from '../reducers/eventReducer';
import eventService from '../services/eventService';
import { CreateEventPayload, UpdateEventPayload } from '../types/eventTypes';
import { AppDispatch } from "../store";

export const getCalendarEvents = (calendarId: number, userId: number) => async (dispatch: Dispatch) => {
  try {
    dispatch({ type: EventActionTypes.FETCH_EVENTS_REQUEST });
    
    console.log(`Fetching events for calendar ${calendarId} and user ${userId}`);
    const events = await eventService.getCalendarEvents(calendarId, userId);
    console.log(`Received ${events.length} events from API:`, events);
    
    dispatch({
      type: EventActionTypes.FETCH_EVENTS_SUCCESS,
      payload: events
    });
    
    return events;
  } catch (error: any) {
    console.error(`Error fetching events for calendar ${calendarId}:`, error);
    dispatch({
      type: EventActionTypes.FETCH_EVENTS_FAILURE,
      payload: error.response?.data?.message || 'Failed to fetch events'
    });
    throw error;
  }
};

export const getEvent = (eventId: number) => async (dispatch: Dispatch) => {
  try {
    dispatch({ type: EventActionTypes.FETCH_EVENT_REQUEST });
    
    console.log(`Fetching event details for event ${eventId}`);
    const event = await eventService.getEvent(eventId);
    console.log(`Received event details:`, event);
    
    dispatch({
      type: EventActionTypes.FETCH_EVENT_SUCCESS,
      payload: event
    });
    
    return event;
  } catch (error: any) {
    console.error(`Error fetching event ${eventId}:`, error);
    dispatch({
      type: EventActionTypes.FETCH_EVENT_FAILURE,
      payload: error.response?.data?.message || 'Failed to fetch event'
    });
    throw error;
  }
};

export const createEvent = (eventData: CreateEventPayload) => async (dispatch: Dispatch) => {
  try {
    dispatch({ type: EventActionTypes.CREATE_EVENT_REQUEST });
    
    console.log('Creating new event with data:', eventData);
    const event = await eventService.createEvent(eventData);
    console.log('Created event:', event);
    
    dispatch({
      type: EventActionTypes.CREATE_EVENT_SUCCESS,
      payload: event
    });
    
    return event;
  } catch (error: any) {
    console.error('Error creating event:', error);
    dispatch({
      type: EventActionTypes.CREATE_EVENT_FAILURE,
      payload: error.response?.data?.message || 'Failed to create event'
    });
    throw error;
  }
};

export const updateEvent = (eventId: number, eventData: UpdateEventPayload) => async (dispatch: Dispatch) => {
  try {
    dispatch({ type: EventActionTypes.UPDATE_EVENT_REQUEST });
    
    console.log(`Updating event ${eventId} with data:`, eventData);
    const event = await eventService.updateEvent(eventId, eventData);
    console.log('Updated event:', event);
    
    dispatch({
      type: EventActionTypes.UPDATE_EVENT_SUCCESS,
      payload: event
    });
    
    return event;
  } catch (error: any) {
    console.error(`Error updating event ${eventId}:`, error);
    dispatch({
      type: EventActionTypes.UPDATE_EVENT_FAILURE,
      payload: error.response?.data?.message || 'Failed to update event'
    });
    throw error;
  }
};

export const deleteEvent = (eventId: number) => async (dispatch: Dispatch) => {
  try {
    dispatch({ type: EventActionTypes.DELETE_EVENT_REQUEST });
    
    console.log(`Deleting event ${eventId}`);
    await eventService.deleteEvent(eventId);
    console.log(`Event ${eventId} deleted successfully`);
    
    dispatch({
      type: EventActionTypes.DELETE_EVENT_SUCCESS,
      payload: eventId
    });
    
    return true;
  } catch (error: any) {
    console.error(`Error deleting event ${eventId}:`, error);
    dispatch({
      type: EventActionTypes.DELETE_EVENT_FAILURE,
      payload: error.response?.data?.message || 'Failed to delete event'
    });
    throw error;
  }
};

export const addEventParticipant = (eventId: number, calendarId: number, email: string) => async (dispatch: Dispatch) => {
  try {
    console.log(`Finding user with email ${email}`);
    const users = await eventService.findUserByEmail(email);
    if (!users || users.length === 0) {
      console.error('User not found for email:', email);
      throw new Error('User not found');
    }
    console.log('hyeta11', users);
    const userId = users.id;
    console.log(`Found user ${userId}, adding as participant to event ${eventId}`);
    
    const result = await eventService.addParticipant(eventId, calendarId, userId);
    console.log('Participant added successfully:', result);
    
    dispatch(getEvent(eventId));
    
    return result;
  } catch (error: any) {
    console.error(`Error adding participant to event ${eventId}:`, error);
    throw error;
  }
};

export const updateEventParticipant = (eventId: number, calendarMemberId: number, data: { responseStatus?: string, color?: string }) => async (dispatch: Dispatch) => {
  try {
    console.log(`Updating participant ${calendarMemberId} for event ${eventId} with data:`, data);
    const result = await eventService.updateParticipant(eventId, calendarMemberId, data);
    console.log('Participant updated successfully:', result);
    
    dispatch(getEvent(eventId));
    
    return result;
  } catch (error: any) {
    console.error(`Error updating participant ${calendarMemberId} for event ${eventId}:`, error);
    throw error;
  }
};

export const removeEventParticipant = (eventId: number, calendarMemberId: number) => async (dispatch: Dispatch) => {
  try {
    console.log(`Removing participant ${calendarMemberId} from event ${eventId}`);
    await eventService.removeParticipant(eventId, calendarMemberId);
    console.log('Participant removed successfully');
    
    dispatch(getEvent(eventId));
    
    return true;
  } catch (error: any) {
    console.error(`Error removing participant ${calendarMemberId} from event ${eventId}:`, error);
    throw error;
  }
};
export const confirmEventParticipation = (
  eventId: string,
  calendarMemberId: string, 
  token: string
) => async (dispatch: AppDispatch) => {
  try {
    // dispatch(setLoading(true));
    const data = await eventService.confirmEventParticipation(eventId, calendarMemberId, token);
    // dispatch(setLoading(false));
    return data;
  } catch (error: any) {
   
    throw error;
  }
};