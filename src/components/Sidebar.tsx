import React, { useState } from "react";
import { 
  Edit2, Trash2, Palette, Share2, LogOut, 
  Plus, ChevronRight, ChevronDown, MoreHorizontal,
  UserPlus
} from "lucide-react";

export interface CalendarData {
  id: string;
  title: string;
  description?: string;
  isVisible: boolean;
  color: string;
  events?: any[];
  isMain?: boolean;
  creatorId?: string;
  calendarType?: string;
  role?: string;
}

// Modified props interface
interface SidebarProps {
  calendars: CalendarData[];
  onToggleCalendar: (id: string) => void;
  onDeleteCalendar: (calendarId: string) => void;
  openModal: (data: any) => void;
  authUser: any;
  handleLeaveCalendar: (calendarId: string) => void;
}

const Sidebar: React.FC<SidebarProps> = ({
  calendars,
  onToggleCalendar,
  onDeleteCalendar,
  openModal,
  authUser,
  handleLeaveCalendar
}) => {
  // Split calendars into "My Calendars" and "Other Calendars"
  const myCalendars = calendars.filter(
    (calendar) => String(calendar.creatorId) === String(authUser?.id)
  );
  const otherCalendars = calendars.filter(
    (calendar) => String(calendar.creatorId) !== String(authUser?.id)
  );

  // UI state
  const [isMyCalendarsExpanded, setIsMyCalendarsExpanded] = useState(true);
  const [isOtherCalendarsExpanded, setIsOtherCalendarsExpanded] = useState(true);
  const [activeMenu, setActiveMenu] = useState<string | null>(null);

  // Menu handlers
  const handleOpenMenu = (calendarId: string, event: React.MouseEvent) => {
    event.stopPropagation();
    setActiveMenu(calendarId === activeMenu ? null : calendarId);
  };

  // Menu options renderer
  const renderMenuOptions = (calendar: CalendarData) => {
    const role = calendar.role?.toLowerCase();
  
    return (
      <div className="absolute right-0 top-0 z-10 mt-10 w-56 bg-white rounded-md shadow-lg ring-1 ring-black ring-opacity-5 divide-y divide-gray-100">
        <div className="px-4 py-3 border-b">
          <h3 className="text-sm font-medium text-gray-700 truncate">
            {calendar.title || "Untitled"}
          </h3>
          <p className="text-xs text-gray-500 mt-1 truncate">
            {calendar.description || "No description"}
          </p>
        </div>
        
        <div className="py-1">
          {String(calendar.creatorId) === String(authUser?.id) ? (
            // Current user is the creator
            <>
              <button
                onClick={() => {
                  setActiveMenu(null);
                  openModal({
                    type: 'edit',
                    calendarId: calendar.id,
                    calendarTitle: calendar.title,
                    calendarDescription: calendar.description
                  });
                }}
                className="flex items-center w-full px-4 py-2 text-sm text-gray-700 hover:bg-gray-50"
              >
                <Edit2 className="mr-2" size={16} />
                <span>Edit details</span>
              </button>
              <button
                onClick={() => {
                  setActiveMenu(null);
                  openModal({
                    type: 'color',
                    calendarId: calendar.id,
                    calendarColor: calendar.color
                  });
                }}
                className="flex items-center w-full px-4 py-2 text-sm text-gray-700 hover:bg-gray-50"
              >
                <Palette className="mr-2" size={16} />
                <span>Change color</span>
              </button>
              <button
                onClick={() => {
                  setActiveMenu(null);
                  openModal({
                    type: 'share',
                    calendarId: calendar.id
                  });
                }}
                className="flex items-center w-full px-4 py-2 text-sm text-gray-700 hover:bg-gray-50"
              >
                <UserPlus className="mr-2" size={16} />
                <span>Sharing</span>
              </button>
              <button
                onClick={() => {
                  setActiveMenu(null);
                  onDeleteCalendar(calendar.id);
                }}
                className="flex items-center w-full px-4 py-2 text-sm text-red-600 hover:bg-gray-50"
              >
                <Trash2 className="mr-2" size={16} />
                <span>Delete</span>
              </button>
            </>
          ) : role === "owner" ? (
            <>
              <button
                onClick={() => {
                  setActiveMenu(null);
                  openModal({
                    type: 'edit',
                    calendarId: calendar.id,
                    calendarTitle: calendar.title,
                    calendarDescription: calendar.description
                  });
                }}
                className="flex items-center w-full px-4 py-2 text-sm text-gray-700 hover:bg-gray-50"
              >
                <Edit2 className="mr-2" size={16} />
                <span>Edit details</span>
              </button>
              <button
                onClick={() => {
                  setActiveMenu(null);
                  openModal({
                    type: 'color',
                    calendarId: calendar.id,
                    calendarColor: calendar.color
                  });
                }}
                className="flex items-center w-full px-4 py-2 text-sm text-gray-700 hover:bg-gray-50"
              >
                <Palette className="mr-2" size={16} />
                <span>Change color</span>
              </button>
              <button
                onClick={() => {
                  setActiveMenu(null);
                  openModal({
                    type: 'share',
                    calendarId: calendar.id
                  });
                }}
                className="flex items-center w-full px-4 py-2 text-sm text-gray-700 hover:bg-gray-50"
              >
                <UserPlus className="mr-2" size={16} />
                <span>Sharing</span>
              </button>
              <button
                onClick={() => {
                  setActiveMenu(null);
                  handleLeaveCalendar(calendar.id);
                }}
                className="flex items-center w-full px-4 py-2 text-sm text-red-600 hover:bg-gray-50"
              >
                <LogOut className="mr-2" size={16} />
                <span>Leave</span>
              </button>
            </>
          ) : (role === "editor" || role === "viewer") ? (
            <>
              <button
                onClick={() => {
                  setActiveMenu(null);
                  openModal({
                    type: 'color',
                    calendarId: calendar.id,
                    calendarColor: calendar.color
                  });
                }}
                className="flex items-center w-full px-4 py-2 text-sm text-gray-700 hover:bg-gray-50"
              >
                <Palette className="mr-2" size={16} />
                <span>Change color</span>
              </button>
              <button
                onClick={() => {
                  setActiveMenu(null);
                  openModal({
                    type: 'share',
                    calendarId: calendar.id
                  });
                }}
                className="flex items-center w-full px-4 py-2 text-sm text-gray-700 hover:bg-gray-50"
              >
                <UserPlus className="mr-2" size={16} />
                <span>Sharing</span>
              </button>
              <button
                onClick={() => {
                  setActiveMenu(null);
                  handleLeaveCalendar(calendar.id);
                }}
                className="flex items-center w-full px-4 py-2 text-sm text-red-600 hover:bg-gray-50"
              >
                <LogOut className="mr-2" size={16} />
                <span>Leave</span>
              </button>
            </>
          ) : (
            <>
              <button
                onClick={() => {
                  setActiveMenu(null);
                  openModal({
                    type: 'color',
                    calendarId: calendar.id,
                    calendarColor: calendar.color
                  });
                }}
                className="flex items-center w-full px-4 py-2 text-sm text-gray-700 hover:bg-gray-50"
              >
                <Palette className="mr-2" size={16} />
                <span>Change color</span>
              </button>
              <button
                onClick={() => {
                  setActiveMenu(null);
                  openModal({
                    type: 'share',
                    calendarId: calendar.id
                  });
                }}
                className="flex items-center w-full px-4 py-2 text-sm text-gray-700 hover:bg-gray-50"
              >
                <UserPlus className="mr-2" size={16} />
                <span>Sharing</span>
              </button>
            </>
          )}
        </div>
      </div>
    );
  };

  // Calendar item renderer
  const renderCalendarItem = (calendar: CalendarData) => (
    <li
      key={calendar.id}
      className="group relative"
    >
      <div className="flex items-center py-2 px-1 rounded-md hover:bg-gray-50 group transition-colors">
        <div className="flex items-center flex-1">
          <button 
            className="w-4 h-4 rounded-sm mr-3 border border-gray-300 flex-shrink-0 transition-colors"
            style={{
              backgroundColor: calendar.isVisible ? calendar.color : "transparent",
              borderColor: calendar.color,
            }}
            onClick={() => onToggleCalendar(calendar.id)}
          />
          <span className="text-sm text-gray-800 truncate">
            {calendar.title || "Untitled"}
          </span>
        </div>
        
        <button
          onClick={(e) => handleOpenMenu(calendar.id, e)}
          className="opacity-0 group-hover:opacity-100 p-1 rounded-full hover:bg-gray-200 transition-all"
        >
          <MoreHorizontal size={16} className="text-gray-500" />
        </button>
        
        {activeMenu === calendar.id && renderMenuOptions(calendar)}
      </div>
    </li>
  );

  return (
    <div className="space-y-6">
      {/* My Calendars Section */}
      {myCalendars.length > 0 && (
        <div>
          <button 
            className="flex items-center justify-between w-full mb-2 text-sm font-medium text-gray-700 hover:bg-gray-50 p-1 rounded-md"
            onClick={() => setIsMyCalendarsExpanded(!isMyCalendarsExpanded)}
          >
            <div className="flex items-center">
              {isMyCalendarsExpanded ? <ChevronDown size={16} /> : <ChevronRight size={16} />}
              <span className="ml-1">My Calendars</span>
            </div>
          </button>
          
          {isMyCalendarsExpanded && (
            <ul className="space-y-1 ml-6">
              {myCalendars.map(renderCalendarItem)}
            </ul>
          )}
        </div>
      )}

      {/* Other Calendars Section */}
      {otherCalendars.length > 0 && (
        <div>
          <button 
            className="flex items-center justify-between w-full mb-2 text-sm font-medium text-gray-700 hover:bg-gray-50 p-1 rounded-md"
            onClick={() => setIsOtherCalendarsExpanded(!isOtherCalendarsExpanded)}
          >
            <div className="flex items-center">
              {isOtherCalendarsExpanded ? <ChevronDown size={16} /> : <ChevronRight size={16} />}
              <span className="ml-1">Other Calendars</span>
            </div>
          </button>
          
          {isOtherCalendarsExpanded && (
            <ul className="space-y-1 ml-6">
              {otherCalendars.map(renderCalendarItem)}
            </ul>
          )}
        </div>
      )}

      {/* Create Calendar Button */}
      {/* <div className="pt-2">
        <button
          onClick={() => openModal({ type: 'create' })}
          className="flex items-center text-sm text-indigo-600 font-medium hover:text-indigo-700 transition-colors"
        >
          <Plus size={16} className="mr-1" />
          Create new calendar
        </button>
      </div> */}
    </div>
  );
};

export default Sidebar;
