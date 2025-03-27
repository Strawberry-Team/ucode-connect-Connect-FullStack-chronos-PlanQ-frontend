import React from 'react';
import { Link } from 'react-router-dom';
import { useSelector } from 'react-redux';
import { RootState } from '../store';
import { CalendarClock, Calendar, UsersRound, Clock, CheckSquare } from 'lucide-react';

const Home = () => {
  const authUser = useSelector((state: RootState) => state.auth.user);

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-100 to-gray-100">
      <div className="container mx-auto px-4 py-12 max-w-7xl">
        <div className="text-center mb-16">
          <div className="flex justify-center mb-6">
            <CalendarClock className="h-20 w-20 text-indigo-600" />
          </div>
          <h1 className="text-4xl md:text-6xl font-bold mb-6 bg-gradient-to-r from-indigo-600 to-blue-500 bg-clip-text text-transparent">
            Welcome to PlanQ
          </h1>
          <p className="text-xl text-gray-600 mb-8 max-w-2xl mx-auto">
            Your complete solution for efficient time management, event planning, and team coordination.
          </p>
          <div className="flex justify-center gap-4">
            {authUser ? (
              <Link to="/calendar">
                <button className="bg-indigo-600 text-white py-3 px-6 rounded-lg font-medium hover:bg-indigo-700 transition-colors flex items-center gap-2">
                  Go to Calendar <Calendar className="w-5 h-5" />
                </button>
              </Link>
            ) : (
              <Link to="/login">
                <button className="bg-indigo-600 text-white py-3 px-6 rounded-lg font-medium hover:bg-indigo-700 transition-colors flex items-center gap-2">
                  Sign In <Calendar className="w-5 h-5" />
                </button>
              </Link>
            )}
            
            {!authUser && (
              <Link to="/register">
                <button className="bg-white text-indigo-600 border border-indigo-600 py-3 px-6 rounded-lg font-medium hover:bg-indigo-50 transition-colors">
                  Create Account
                </button>
              </Link>
            )}
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-16">
          {[
            {
              title: 'Smart Scheduling',
              icon: Clock,
              description: 'Organize your time'
            },
            {
              title: 'Team Collaboration',
              icon: UsersRound,
              description: 'Share calendars and coordinate events seamlessly with your team'
            },
            {
              title: 'Task Management',
              icon: CheckSquare,
              description: 'Manage tasks efficiently with priority levels and completion tracking'
            },
          ].map((feature, index) => (
            <div key={index} className="bg-white rounded-xl p-6 shadow-md border border-gray-100 hover:shadow-lg transition-shadow">
              <feature.icon className="w-12 h-12 text-indigo-600 mb-4" />
              <h3 className="text-xl font-semibold mb-2">{feature.title}</h3>
              <p className="text-gray-600">{feature.description}</p>
            </div>
          ))}
        </div>

        <div className="text-center">
          <p className="text-lg text-gray-600 mb-6">
            Start organizing your schedule today and boost your productivity.
          </p>
          {authUser ? (
            <Link to="/calendar">
              <button className="bg-indigo-600 text-white py-3 px-8 rounded-lg font-medium hover:bg-indigo-700 transition-colors">
                Open Calendar
              </button>
            </Link>
          ) : (
            <Link to="/register">
              <button className="bg-indigo-600 text-white py-3 px-8 rounded-lg font-medium hover:bg-indigo-700 transition-colors">
                Get Started
              </button>
            </Link>
          )}
        </div>
      </div>
    </div>
  );
};

export default Home;

