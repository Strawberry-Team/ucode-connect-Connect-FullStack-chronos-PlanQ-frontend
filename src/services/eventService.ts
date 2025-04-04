import axios from "axios";
import { CreateEventPayload, Event, UpdateEventPayload } from "../types/eventTypes";

const API_URL = 'http://localhost:3000/api';

const confirmEventParticipation = async (eventId: string, calendarMemberId: string, token: string) => {
  const response = await axios.post(
    `${API_URL}/events/${eventId}/calendar-members/${calendarMemberId}/confirm-participation/${token}`
  );
  return response.data;
};
interface SearchEventsParams {
  startedAt?: string;
  endedAt?: string;
  name?: string;
  after?: {
    createdAt: string;
    id: number;
  };
  limit?: number;
}

export interface SearchEventResult {
  id: number;
  name: string;
  description: string;
  category: string;
  startedAt: string;
  endedAt: string;
  type: string;
  createdAt: string;
  updatedAt: string;
  creatorId: number;
  calendarMemberId: number;
  calendarId: number;
}

export interface SearchEventsResult {
  events: SearchEventResult[];
  nextCursor: {
    createdAt: string;
    id: number;
  } | null;
  hasMore: boolean;
  total: number;
  after: {
    createdAt: string;
    id: number;
  } | null;
  limit: number;
  remaining: number;
}

const searchEvents = async (userId: number, params: SearchEventsParams): Promise<SearchEventsResult> => {
  let url = `${API_URL}/users/${userId}/events?`;
  
  if (params.startedAt) {
    url += `startedAt=${encodeURIComponent(params.startedAt)}&`;
  }
  
  if (params.endedAt) {
    url += `endedAt=${encodeURIComponent(params.endedAt)}&`;
  }
  
  if (params.name && params.name.length >= 3) {
    url += `name=${encodeURIComponent(params.name)}&`;
  }
  
  if (params.after) {
    url += `after[createdAt]=${encodeURIComponent(params.after.createdAt)}&`;
    url += `after[id]=${params.after.id}&`;
  }
  
  if (params.limit) {
    url += `limit=${params.limit}`;
  }
  
  const response = await axios.get(url);
  return response.data;
};

const eventService = {
  getCalendarEvents: async (calendarId: number, userId: number): Promise<Event[]> => {
    const response = await axios.get(`${API_URL}/calendars/${calendarId}/members/${userId}/events`);
    return response.data;
  },

  getEvent: async (eventId: number): Promise<Event> => {
    const response = await axios.get(`${API_URL}/events/${eventId}`);
    return response.data;
  },

  createEvent: async (eventData: CreateEventPayload): Promise<Event> => {
    const response = await axios.post(`${API_URL}/events/`, eventData);
    return response.data;
  },

  updateEvent: async (eventId: number, eventData: UpdateEventPayload): Promise<Event> => {
    const response = await axios.patch(`${API_URL}/events/${eventId}`, eventData);
    return response.data;
  },

  deleteEvent: async (eventId: number): Promise<void> => {
    await axios.delete(`${API_URL}/events/${eventId}`);
  },

  addParticipant: async (eventId: number, calendarId: number, userId: number): Promise<any> => {
    const response = await axios.post(`${API_URL}/events/${eventId}/calendar-members`, {
      calendarId,
      userId
    });
    return response.data;
  },

  updateParticipant: async (eventId: number, calendarMemberId: number, data: { responseStatus?: string, color?: string }): Promise<any> => {
    const response = await axios.patch(`${API_URL}/events/${eventId}/calendar-members/${calendarMemberId}`, data);
    return response.data;
  },

  removeParticipant: async (eventId: number, calendarMemberId: number): Promise<void> => {
    await axios.delete(`${API_URL}/events/${eventId}/calendar-members/${calendarMemberId}`);
  },

  findUserByEmail: async (email: string): Promise<any> => {
    const response = await axios.get(`${API_URL}/users?email=${email}`);
    return response.data;
  },

  confirmEventParticipation,
  searchEvents, 
  
};

export default eventService;

