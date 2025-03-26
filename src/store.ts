import {configureStore} from '@reduxjs/toolkit'
import authReducer from './reducers/authReducer'
import userReducer from './reducers/userReducer'
import calendarReducer from './reducers/calendarReducer'
import eventReducer from './reducers/eventReducer';
import categoryReducer from './reducers/categoryReducer'
import postReducer from './reducers/postReducer'
import commentReducer from './reducers/commentReducer'

const store = configureStore({
    reducer: {
        auth: authReducer,
        users: userReducer,
        calendar: calendarReducer,
        event: eventReducer
    },
})

export type RootState = ReturnType<typeof store.getState>
export type AppDispatch = typeof store.dispatch

export default store
