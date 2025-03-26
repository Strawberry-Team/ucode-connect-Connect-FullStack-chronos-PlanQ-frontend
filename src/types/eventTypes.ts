export enum EventCategory {
    HOME = 'home',
    WORK = 'work'
  }
  
  export enum EventType {
    TASK = 'task',
    REMINDER = 'reminder',
    ARRANGEMENT = 'arrangement'
  }
  
  export enum TaskPriority {
    LOW = 'low',
    MEDIUM = 'medium',
    HIGH = 'high'
  }
  
  export enum ResponseStatus {
    INVITED = 'invited',
    PENDING = 'pending',
    ACCEPTED = 'accepted',
    DECLINED = 'declined'
  }
  
  export interface EventParticipation {
    id: number;
    calendarMemberId: number;
    eventId: number;
    color: string;
    responseStatus: ResponseStatus;
    createdAt: string;
    updatedAt: string;
    calendarMember: {
      id: number;
      userId: number;
      calendarId: number;
      calendarType: string;
      isVisible: boolean;
      role: string;
      color: string;
      isConfirmed: boolean;
      createdAt: string;
      updatedAt: string;
      user: {
        id: number;
        firstName: string;
        lastName: string;
        email: string;
        profilePictureName: string;
        countryCode: string;
        createdAt: string;
        updatedAt: string;
      };
    };
  }
  
  export interface Event {
    id: number;
    creatorId: number;
    name: string;
    description: string;
    category: EventCategory;
    startedAt: string;
    endedAt: string;
    type: EventType;
    createdAt: string;
    updatedAt: string;
    creator: {
      id: number;
      firstName: string;
      lastName: string;
      email: string;
      profilePictureName: string;
      countryCode: string;
      createdAt: string;
      updatedAt: string;
    };
    task?: {
      id: number;
      eventId: number;
      priority: TaskPriority;
      isCompleted: boolean;
      createdAt: string;
      updatedAt: string;
    };
    participations: EventParticipation[];
  }
  
  export interface CreateEventPayload {
    name: string;
    description: string;
    category: EventCategory;
    startedAt: string;
    endedAt: string;
    color?: string;
    type: EventType;
    calendarId: number;
    participantIds?: number[];
    priority?: TaskPriority;
  }
  
  export interface UpdateEventPayload {
    name?: string;
    description?: string;
    category?: EventCategory;
    startedAt?: string;
    endedAt?: string;
    priority?: TaskPriority;
    isCompleted?: boolean;
    color?: string;
  }
  