import axios from "axios";
import { CreateEventPayload, Event, UpdateEventPayload } from "../types/eventTypes";

const API_URL = 'http://localhost:3000/api';

const confirmEventParticipation = async (eventId: string, calendarMemberId: string, token: string) => {
  const response = await axios.post(
    `${API_URL}/events/${eventId}/calendar-members/${calendarMemberId}/confirm-participation/${token}`
  );
  return response.data;
};

const eventService = {
  // Get all events for a calendar
  getCalendarEvents: async (calendarId: number, userId: number): Promise<Event[]> => {
    const response = await axios.get(`${API_URL}/calendars/${calendarId}/members/${userId}/events`);
    return response.data;
  },

  // Get a specific event
  getEvent: async (eventId: number): Promise<Event> => {
    const response = await axios.get(`${API_URL}/events/${eventId}`);
    return response.data;
  },

  // Create a new event
  createEvent: async (eventData: CreateEventPayload): Promise<Event> => {
    console.log('create event data', eventData);
    const response = await axios.post(`${API_URL}/events/`, eventData);
    return response.data;
  },

  // Update an event
  updateEvent: async (eventId: number, eventData: UpdateEventPayload): Promise<Event> => {
    const response = await axios.patch(`${API_URL}/events/${eventId}`, eventData);
    return response.data;
  },

  // Delete an event
  deleteEvent: async (eventId: number): Promise<void> => {
    await axios.delete(`${API_URL}/events/${eventId}`);
  },

  // Add participant to event
  addParticipant: async (eventId: number, calendarId: number, userId: number): Promise<any> => {
    const response = await axios.post(`${API_URL}/events/${eventId}/calendar-members`, {
      calendarId,
      userId
    });
    return response.data;
  },

  // Update participant status or color
  updateParticipant: async (eventId: number, calendarMemberId: number, data: { responseStatus?: string, color?: string }): Promise<any> => {
    const response = await axios.patch(`${API_URL}/events/${eventId}/calendar-members/${calendarMemberId}`, data);
    return response.data;
  },

  // Remove participant from event
  removeParticipant: async (eventId: number, calendarMemberId: number): Promise<void> => {
    await axios.delete(`${API_URL}/events/${eventId}/calendar-members/${calendarMemberId}`);
  },

  // Find user by email (for adding participants)
  findUserByEmail: async (email: string): Promise<any> => {
    const response = await axios.get(`${API_URL}/users?email=${email}`);
    console.log('email fucking user', response);
    return response.data;
  },

  confirmEventParticipation,
  
};

export default eventService;
