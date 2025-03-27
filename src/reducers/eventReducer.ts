import { Event } from "../types/eventTypes";

interface EventState {
  events: Event[];
  currentEvent: Event | null;
  loading: boolean;
  error: string | null;
}

const initialState: EventState = {
  events: [],
  currentEvent: null,
  loading: false,
  error: null
};

export enum EventActionTypes {
  FETCH_EVENTS_REQUEST = 'FETCH_EVENTS_REQUEST',
  FETCH_EVENTS_SUCCESS = 'FETCH_EVENTS_SUCCESS',
  FETCH_EVENTS_FAILURE = 'FETCH_EVENTS_FAILURE',
  FETCH_EVENT_REQUEST = 'FETCH_EVENT_REQUEST',
  FETCH_EVENT_SUCCESS = 'FETCH_EVENT_SUCCESS',
  FETCH_EVENT_FAILURE = 'FETCH_EVENT_FAILURE',
  CREATE_EVENT_REQUEST = 'CREATE_EVENT_REQUEST',
  CREATE_EVENT_SUCCESS = 'CREATE_EVENT_SUCCESS',
  CREATE_EVENT_FAILURE = 'CREATE_EVENT_FAILURE',
  UPDATE_EVENT_REQUEST = 'UPDATE_EVENT_REQUEST',
  UPDATE_EVENT_SUCCESS = 'UPDATE_EVENT_SUCCESS',
  UPDATE_EVENT_FAILURE = 'UPDATE_EVENT_FAILURE',
  DELETE_EVENT_REQUEST = 'DELETE_EVENT_REQUEST',
  DELETE_EVENT_SUCCESS = 'DELETE_EVENT_SUCCESS',
  DELETE_EVENT_FAILURE = 'DELETE_EVENT_FAILURE',
  CLEAR_EVENT_ERROR = 'CLEAR_EVENT_ERROR'
}

interface FetchEventsRequestAction {
  type: EventActionTypes.FETCH_EVENTS_REQUEST;
}

interface FetchEventsSuccessAction {
  type: EventActionTypes.FETCH_EVENTS_SUCCESS;
  payload: Event[];
}

interface FetchEventsFailureAction {
  type: EventActionTypes.FETCH_EVENTS_FAILURE;
  payload: string;
}

interface FetchEventRequestAction {
  type: EventActionTypes.FETCH_EVENT_REQUEST;
}

interface FetchEventSuccessAction {
  type: EventActionTypes.FETCH_EVENT_SUCCESS;
  payload: Event;
}

interface FetchEventFailureAction {
  type: EventActionTypes.FETCH_EVENT_FAILURE;
  payload: string;
}

interface CreateEventRequestAction {
  type: EventActionTypes.CREATE_EVENT_REQUEST;
}

interface CreateEventSuccessAction {
  type: EventActionTypes.CREATE_EVENT_SUCCESS;
  payload: Event;
}

interface CreateEventFailureAction {
  type: EventActionTypes.CREATE_EVENT_FAILURE;
  payload: string;
}

interface UpdateEventRequestAction {
  type: EventActionTypes.UPDATE_EVENT_REQUEST;
}

interface UpdateEventSuccessAction {
  type: EventActionTypes.UPDATE_EVENT_SUCCESS;
  payload: Event;
}

interface UpdateEventFailureAction {
  type: EventActionTypes.UPDATE_EVENT_FAILURE;
  payload: string;
}

interface DeleteEventRequestAction {
  type: EventActionTypes.DELETE_EVENT_REQUEST;
}

interface DeleteEventSuccessAction {
  type: EventActionTypes.DELETE_EVENT_SUCCESS;
  payload: number;
}

interface DeleteEventFailureAction {
  type: EventActionTypes.DELETE_EVENT_FAILURE;
  payload: string;
}

interface ClearEventErrorAction {
  type: EventActionTypes.CLEAR_EVENT_ERROR;
}

type EventAction =
  | FetchEventsRequestAction
  | FetchEventsSuccessAction
  | FetchEventsFailureAction
  | FetchEventRequestAction
  | FetchEventSuccessAction
  | FetchEventFailureAction
  | CreateEventRequestAction
  | CreateEventSuccessAction
  | CreateEventFailureAction
  | UpdateEventRequestAction
  | UpdateEventSuccessAction
  | UpdateEventFailureAction
  | DeleteEventRequestAction
  | DeleteEventSuccessAction
  | DeleteEventFailureAction
  | ClearEventErrorAction;

const eventReducer = (state = initialState, action: EventAction): EventState => {
  switch (action.type) {
    case EventActionTypes.FETCH_EVENTS_REQUEST:
    case EventActionTypes.FETCH_EVENT_REQUEST:
    case EventActionTypes.CREATE_EVENT_REQUEST:
    case EventActionTypes.UPDATE_EVENT_REQUEST:
    case EventActionTypes.DELETE_EVENT_REQUEST:
      return {
        ...state,
        loading: true,
        error: null
      };

    case EventActionTypes.FETCH_EVENTS_SUCCESS:
      return {
        ...state,
        events: action.payload,
        loading: false
      };

    case EventActionTypes.FETCH_EVENT_SUCCESS:
      return {
        ...state,
        currentEvent: action.payload,
        loading: false
      };

    case EventActionTypes.CREATE_EVENT_SUCCESS:
      return {
        ...state,
        events: [...state.events, action.payload],
        currentEvent: action.payload,
        loading: false
      };

    case EventActionTypes.UPDATE_EVENT_SUCCESS:
      return {
        ...state,
        events: state.events.map(event => 
          event.id === action.payload.id ? action.payload : event
        ),
        currentEvent: action.payload,
        loading: false
      };

    case EventActionTypes.DELETE_EVENT_SUCCESS:
      return {
        ...state,
        events: state.events.filter(event => event.id !== action.payload),
        currentEvent: null,
        loading: false
      };

    case EventActionTypes.FETCH_EVENTS_FAILURE:
    case EventActionTypes.FETCH_EVENT_FAILURE:
    case EventActionTypes.CREATE_EVENT_FAILURE:
    case EventActionTypes.UPDATE_EVENT_FAILURE:
    case EventActionTypes.DELETE_EVENT_FAILURE:
      return {
        ...state,
        loading: false,
        error: action.payload
      };

    case EventActionTypes.CLEAR_EVENT_ERROR:
      return {
        ...state,
        error: null
      };

    default:
      return state;
  }
};

export default eventReducer;

