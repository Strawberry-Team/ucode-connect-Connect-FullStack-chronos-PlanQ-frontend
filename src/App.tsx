import { BrowserRouter as Router, Route, Routes } from 'react-router-dom';
import { Provider } from 'react-redux';
import store from './store';
import Header from './components/Header';
import Home from './components/Home';
import Login from '@/components/auth/Login';
import Register from '@/components/auth/Register';
import ResetPassword from '@/components/auth/ResetPassword';
import ConfirmNewPassword from '@/components/auth/ConfirmNewPassword';
import Profile from './components/user/Profile.tsx';
import UserProfile from './components/user/UserProfile.tsx';
import PrivateRoute from './components/PrivateRoute';
import ConfirmEmail from '@/components/auth/ConfirmEmail.tsx';
import ScrollToTop from '@/components/ScrollToTop.tsx';
import Footer from '@/components/Footer.tsx';
import CalendarPage from './components/CalendarPage';
import ConfirmCalendar from './components/ConfirmCalendar';
import EventCreatePage from "./components/EventCreatePage";
import ConfirmEventParticipation from "./components/ConfirmEventParticipation";
import React, { useEffect, useState } from 'react';
import './App.css';
import csrfService from "@/services/csrfService.ts";

function App() {
  const [user, setUser] = useState<{
    id: string;
    name: string;
    country: string;
    isLoggedIn: boolean;
  }>({
    id: '123',
    name: 'John Doe',
    country: 'UA',
    isLoggedIn: true,
  });


  return (
    <Provider store={store}>
      <Router>
        <div className="flex flex-col min-h-screen bg-gray-100 text-gray-900">
          <ScrollToTop />
          <Header />
          <main className="flex-1 container mx-auto px-4 py-8 pt-20">
            <Routes>
              <Route path="/" element={<Home />} />
              <Route path="/calendar" element={
                <PrivateRoute>
                  <CalendarPage user={user} />
                </PrivateRoute>
              } />
              <Route path="/login" element={<Login />} />
              <Route path="/register" element={<Register />} />
              <Route path="/reset-password" element={<ResetPassword />} />
              <Route path="/auth/reset-password/:token" element={<ConfirmNewPassword />} />
              <Route path="auth/confirm-email/:token" element={<ConfirmEmail />} />
              <Route path="calendars/:eventId/confirm-calendar/:token" element={<ConfirmCalendar />} />
              <Route path="/calendar/create-event" element={<EventCreatePage />} />
              <Route path="/events/:eventId/calendar-members/:calendarMemberId/confirm-participation/:token" element={<ConfirmEventParticipation />} />
              <Route
                path="/profile"
                element={
                  <PrivateRoute>
                    <Profile />
                  </PrivateRoute>
                }
              />
            </Routes>
          </main>
          {/* Футер */}
          <Footer />
        </div>
      </Router>
    </Provider>
  );
}

export default App;

