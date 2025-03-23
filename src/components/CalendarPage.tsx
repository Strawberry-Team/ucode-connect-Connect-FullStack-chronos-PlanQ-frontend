import React, { useEffect, useMemo, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { CalendarClock, Plus, Menu, X, Check, Edit2, Trash2, Palette, UserPlus } from "lucide-react";
import Header from "./Header";
import CustomCalendar, { CalendarData, CalendarEvent } from "./CustomCalendar";
import { AppDispatch, RootState } from "../store";
import {
  getUserCalendars,
  toggleCalendarVisibility,
  changeCalendarColor,
  deleteCalendar,
  editCalendar,
  addCalendar,
  getCalendarUsers,
  addCalendarUser,
  getHolidays,
} from "../actions/calendarActions";
import calendarService from "../services/calendarService";
import Alert from "./Alert";
import Sidebar from "./Sidebar";

const predefinedColors = [
  "#4285F4", "#DB4437", "#F4B400", "#0F9D58", 
  "#AB47BC", "#00ACC1", "#FF7043", "#9E9D24",
  "#5C6BC0", "#26A69A", "#EC407A", "#FFA726",
];

// Modal data interface
interface ModalData {
  type: 'create' | 'edit' | 'color' | 'share' | 'delete' | null;
  calendarId?: string;
  calendarTitle?: string;
  calendarDescription?: string;
  calendarColor?: string;
  userId?: string;
  userRole?: string;
}

const CalendarPage: React.FC = () => {
  const dispatch: AppDispatch = useDispatch();
  const authUser = useSelector((state: RootState) => state.auth.user);
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [sharedCalendarId, setSharedCalendarId] = useState<string>("");
  const [sharedUsers, setSharedUsers] = useState<any[]>([]);
  const { calendars, loading, error } = useSelector(
    (state: RootState) => state.calendar
  ) || { calendars: [], loading: false, error: null };
  const [holidayEvents, setHolidayEvents] = useState<CalendarEvent[]>([]);
  const [alertMessage, setAlertMessage] = useState<string | null>(null);
  
  // Modal state
  const [modalData, setModalData] = useState<ModalData>({ type: null });

  // New calendar form state
  const [newCalendarTitle, setNewCalendarTitle] = useState("");
  const [newCalendarDescription, setNewCalendarDescription] = useState("");
  const [newCalendarColor, setNewCalendarColor] = useState("#4285F4");
  
  // Edit calendar form state
  const [editTitle, setEditTitle] = useState("");
  const [editDescription, setEditDescription] = useState("");
  
  // Color picker state
  const [customColor, setCustomColor] = useState("#4285F4");
  
  // Shared calendar state
  const [sharedUserEmail, setSharedUserEmail] = useState("");
  const [sharedRole, setSharedRole] = useState<"owner" | "editor" | "viewer">("viewer");
  const [isSharedLoading, setIsSharedLoading] = useState(false);
  const [editingUserId, setEditingUserId] = useState<string | null>(null);
  const [editedRole, setEditedRole] = useState<"owner" | "editor" | "viewer">("viewer");

  // Close all modals
  const closeModal = () => {
    setModalData({ type: null });
  };

  // Open modal with specific type and data
  const openModal = (data: ModalData) => {
    setModalData(data);
    
    // Initialize form values based on modal type
    if (data.type === 'edit' && data.calendarTitle && data.calendarDescription) {
      setEditTitle(data.calendarTitle);
      setEditDescription(data.calendarDescription || "");
    } else if (data.type === 'color' && data.calendarColor) {
      setCustomColor(data.calendarColor);
    } else if (data.type === 'share' && data.calendarId) {
      setSharedCalendarId(String(data.calendarId));

      fetchSharedUsers(data.calendarId);
    }
  };

  useEffect(() => {
    if (authUser && authUser.id) {
      dispatch(getUserCalendars(String(authUser.id)));
    }
  }, [dispatch, authUser]);

  useEffect(() => {
    const fetchHolidays = async () => {
      try {
        const data: any[] = await calendarService.getHolidays();
        const transformedHolidays: CalendarEvent[] = data.map((holiday) => {
          let startStr: string = holiday.startedAt;
          if (startStr && !startStr.includes("T")) {
            startStr = startStr + "T00:00";
          }
          return {
            id: holiday.title,
            title: holiday.title,
            start: startStr,
            calendarId: "holiday",
            type: "holiday",
            color: "#FF7043",
          };
        });
        
        setHolidayEvents(transformedHolidays);
      } catch (error) {
        console.error("Error fetching holidays:", error);
      }
    };
    fetchHolidays();
  }, []);

  const formattedCalendars: CalendarData[] = useMemo(() => {
    return calendars.map((item: any) => ({
      id: String(item.calendarId || item.id), // Явно преобразуем в строку
      title: item.calendar?.name || "Untitled",
      description: item.calendar?.description || "",
      isVisible: item.isVisible !== undefined ? item.isVisible : true,
      color: item.color || "#10b981",
      events: item.calendarType === "holiday" ? holidayEvents : item.events || [],
      isMain: item.isMain || (item.calendar && item.isMain) || false,
      creatorId: item.calendar?.creatorId ? String(item.calendar.creatorId) : undefined,
      calendarType: item.calendarType,
      createdAt: item.calendar?.createdAt,
      role: item.role,
    }));
  }, [calendars, holidayEvents]);
  

  const allEvents: CalendarEvent[] = formattedCalendars
    .filter((cal) => cal.isVisible && cal.events && cal.events.length > 0)
    .flatMap((cal) => cal.events || []);

  const handleToggleCalendar = (id: string) => {
    const calendar = formattedCalendars.find((cal) => cal.id === id);
    if (!calendar || !authUser || !authUser.id) return;
    dispatch(
      toggleCalendarVisibility(id, String(authUser.id), calendar.isVisible)
    );
  };

  const handleAddCalendar = () => { 
    try {
      if (authUser && authUser.id) {
        const trimmedName = newCalendarTitle.trim();
    if (trimmedName.length < 3 || trimmedName.length > 100) {
      setAlertMessage("Name must be between 3 and 100 characters");
      return;
    }

    // Проверяем, что описание не длиннее 255 символов
    const trimmedDescription = newCalendarDescription.trim();
    if (trimmedDescription.length > 255) {
      setAlertMessage("Description cannot exceed 255 characters");
      return;
    }
        
        const newCalendar = {
          name: trimmedName,
          description: trimmedDescription === "" ? null : trimmedDescription,
          color: newCalendarColor,
        };
        
        dispatch(addCalendar(newCalendar, authUser.id));
        setAlertMessage("Calendar created successfully");
        closeModal();
        
        // Reset form fields
        setNewCalendarTitle("");
        setNewCalendarDescription("");
        setNewCalendarColor("#4285F4");
      }
    } catch (error) {
      setAlertMessage("Failed to create calendar");
      console.error("Calendar creation error", error);
    }
  };

  const handleChangeColor = () => {
    try {
      if (!modalData.calendarId) return;
      
      if (authUser && authUser.id) {
        dispatch(changeCalendarColor(modalData.calendarId, authUser.id, customColor));
        setAlertMessage("Color updated successfully");
        closeModal();
      }
    } catch (error) {
      setAlertMessage("Failed to update color");
      console.error("Color change error", error);
    }
  };

  const handleDeleteCalendar = (calendarId: string, userId: string) => {
    console.log('deletIdCalendar', calendarId);
    dispatch(deleteCalendar(calendarId, userId));
    setAlertMessage("Calendar deleted successfully");
    closeModal();
  };

  const handleEditCalendar = () => { 
    try {
      if (!modalData.calendarId) return;
      
      if (authUser && authUser.id) {
        dispatch(editCalendar(modalData.calendarId, editTitle, editDescription, authUser.id));
        setAlertMessage("Calendar updated successfully");
        closeModal();
      }
    } catch (error) {
      setAlertMessage("Failed to update calendar");
      console.error("Edit error", error);
    }
  };

  const handleAddEvent = (newEvent: CalendarEvent) => {
    console.log("Add new event:", newEvent);
  };

  const fetchSharedUsers = async (calendarId: string) => {
    try {
      const data = await dispatch(getCalendarUsers(calendarId));
      setSharedUsers(data);
      return data;
    } catch (error) {
      console.error("Error fetching calendar users:", error);
      throw error;
    }
  };

  const handleAddSharedUser = async () => {
    if (!sharedUserEmail.trim() || !sharedCalendarId) return;
  
    try {
      //setIsSharedLoading(true);
      const payload = { userEmail: sharedUserEmail, role: sharedRole };
      const result = await dispatch(addCalendarUser(sharedCalendarId, payload));
      
      if (result && result.error) {
        // Если вернулся объект error, отображаем алерт с текстом ошибки
        setAlertMessage("Failed to add user: " + result.error);
      } else {
        setAlertMessage("User added successfully");
        fetchSharedUsers(sharedCalendarId);
        // Сброс формы:
        setSharedUserEmail("");
        setSharedRole("viewer");
      }
    } catch (error) {
      // Этот блок теперь маловероятно сработает, но оставляем его для безопасности
      setAlertMessage("Failed to add user");
      console.error("Error adding user:", error);
    } finally {
      setIsSharedLoading(false);
    }
  };
  
  

  const handleUserRoleSave = async (userId: string) => {
    if (!sharedCalendarId) return;
    try {
      await calendarService.updateUserRole(sharedCalendarId, userId, editedRole);
      const updatedUsers = await fetchSharedUsers(sharedCalendarId);
      setSharedUsers(updatedUsers);
      setAlertMessage("Role updated successfully");
      setEditingUserId(null);
    } catch (error) {
      setAlertMessage("Failed to update role");
      console.error("Error updating user role:", error);
    }
  };

  const handleRemoveUser = async (userId: string) => {
    if (!sharedCalendarId) return;
    try {
      await calendarService.removeUserFromCalendar(sharedCalendarId, userId);
      const updatedUsers = await fetchSharedUsers(sharedCalendarId);
      setSharedUsers(updatedUsers);
      setAlertMessage("User removed successfully");
    } catch (error) {
      setAlertMessage("Failed to remove user");
      console.error("Error removing user from calendar:", error);
    }
  };

  const handleLeaveCalendar = async (calendarId: string) => {
    if (!authUser || !authUser.id) return;
    try {
      await calendarService.leaveCalendar(calendarId, String(authUser.id));
      setAlertMessage("You have left the calendar");
      closeModal();
    } catch (error) {
      setAlertMessage("Error leaving calendar");
      console.error("Error leaving calendar:", error);
    }
  };

  // Get current calendar for shared settings
  const currentCalendar = useMemo(() => {
    return formattedCalendars.find(
      (cal: CalendarData) => String(cal.id) === String(sharedCalendarId)
    );
  }, [formattedCalendars, sharedCalendarId]);
  

  console.log('currentcalendar',currentCalendar);
  console.log('formattedCalendars',formattedCalendars);
  console.log('sharedCalendarId',sharedCalendarId);
  // Render modal content
  const renderModalContent = () => {
    switch (modalData.type) {
      case 'create':
        return (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-[1000]">
            <div className="bg-white rounded-lg shadow-xl max-w-md w-full">
              <div className="flex justify-between items-center px-6 py-4 border-b">
                <h2 className="text-lg font-semibold text-gray-800">Create new calendar</h2>
                <button 
                  onClick={closeModal}
                  className="text-gray-500 hover:text-gray-700"
                >
                  <X size={20} />
                </button>
              </div>
              
              <div className="p-6">
                <form onSubmit={(e) => { e.preventDefault(); handleAddCalendar(); }}>
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Name
                      </label>
                      <input
                        type="text"
                        value={newCalendarTitle}
                        onChange={(e) => setNewCalendarTitle(e.target.value)}
                        className="w-full rounded-md border border-gray-300 shadow-sm px-3 py-2 focus:outline-none focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500"
                        required
                      />
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Description
                      </label>
                      <textarea
                        value={newCalendarDescription}
                        onChange={(e) => setNewCalendarDescription(e.target.value)}
                        className="w-full rounded-md border border-gray-300 shadow-sm px-3 py-2 focus:outline-none focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500"
                        rows={3}
                      />
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Calendar color
                      </label>
                      <div className="flex items-center">
                        <div className="grid grid-cols-6 gap-2 flex-1">
                          {predefinedColors.slice(0, 6).map((color) => (
                            <button
                              key={color}
                              type="button"
                              onClick={() => setNewCalendarColor(color)}
                              className={`w-8 h-8 rounded-full transition-all ${
                                newCalendarColor === color ? 'ring-2 ring-offset-2 ring-indigo-500' : ''
                              }`}
                              style={{ backgroundColor: color }}
                            />
                          ))}
                        </div>
                        <div>
                          <input
                            type="color"
                            value={newCalendarColor}
                            onChange={(e) => setNewCalendarColor(e.target.value)}
                            className="p-0 w-10 h-10 border-0 rounded ml-2"
                          />
                        </div>
                      </div>
                    </div>
                  </div>
                  
                  <div className="flex justify-end mt-6 space-x-3">
                    <button
                      type="button"
                      onClick={closeModal}
                      className="px-4 py-2 text-sm text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200 focus:outline-none focus:ring-2 focus:ring-gray-300"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      className="px-4 py-2 text-sm text-white bg-indigo-600 rounded-md hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    >
                      Create
                    </button>
                  </div>
                </form>
              </div>
            </div>
          </div>
        );

      case 'edit':
        return (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-[1000]">
            <div className="bg-white rounded-lg shadow-xl max-w-md w-full">
              <div className=" flex justify-between items-center px-6 py-4 border-b">
                <h2 className="text-lg font-semibold text-gray-800">Edit calendar</h2>
                <button 
                  onClick={closeModal}
                  className="text-gray-500 hover:text-gray-700"
                >
                  <X size={20} />
                </button>
              </div>
              
              <div className="p-6">
                <form onSubmit={(e) => { e.preventDefault(); handleEditCalendar(); }}>
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Name
                      </label>
                      <input
                        type="text"
                        value={editTitle}
                        onChange={(e) => setEditTitle(e.target.value)}
                        className="w-full rounded-md border border-gray-300 shadow-sm px-3 py-2 focus:outline-none focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500"
                        required
                      />
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Description
                      </label>
                      <textarea
                        value={editDescription}
                        onChange={(e) => setEditDescription(e.target.value)}
                        className="w-full rounded-md border border-gray-300 shadow-sm px-3 py-2 focus:outline-none focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500"
                        rows={3}
                      />
                    </div>
                  </div>
                  
                  <div className="flex justify-end mt-6 space-x-3">
                    <button
                      type="button"
                      onClick={closeModal}
                      className="px-4 py-2 text-sm text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200 focus:outline-none focus:ring-2 focus:ring-gray-300"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      className="px-4 py-2 text-sm text-white bg-indigo-600 rounded-md hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    >
                      Save
                    </button>
                  </div>
                </form>
              </div>
            </div>
          </div>
        );

      case 'color':
        return (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-[1000]">
            <div className="bg-white rounded-lg shadow-xl max-w-md w-full">
              <div className="flex justify-between items-center px-6 py-4 border-b">
                <h2 className="text-lg font-semibold text-gray-800">Choose a color</h2>
                <button 
                  onClick={closeModal}
                  className="text-gray-500 hover:text-gray-700"
                >
                  <X size={20} />
                </button>
              </div>
              
              <div className="p-6">
                <div className="grid grid-cols-6 gap-3 mb-6">
                  {predefinedColors.map((color) => (
                    <button
                      key={color}
                      onClick={() => {
                        if (modalData.calendarId) {
                          dispatch(changeCalendarColor(modalData.calendarId, authUser?.id || "", color));
                          setAlertMessage("Color updated successfully");
                          closeModal();
                        }
                      }}
                      className={`w-10 h-10 rounded-full transition-all ${
                        customColor === color ? 'ring-2 ring-offset-2 ring-indigo-500' : ''
                      }`}
                      style={{ backgroundColor: color }}
                    />
                  ))}
                </div>
                
                <div className="mb-6">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Custom color
                  </label>
                  <div className="flex items-center">
                    <input
                      type="color"
                      value={customColor}
                      onChange={(e) => setCustomColor(e.target.value)}
                      className="p-0 w-12 h-12 border-0 rounded mr-3"
                    />
                    <div 
                      className="w-full h-10 rounded-md"
                      style={{ backgroundColor: customColor }}
                    ></div>
                  </div>
                </div>
                
                <div className="flex justify-end space-x-3">
                  <button
                    onClick={closeModal}
                    className="px-4 py-2 text-sm text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200 focus:outline-none focus:ring-2 focus:ring-gray-300"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleChangeColor}
                    className="px-4 py-2 text-sm text-white bg-indigo-600 rounded-md hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  >
                    Apply
                  </button>
                </div>
              </div>
            </div>
          </div>
        );

      case 'share':
        return (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-[1000]">
            <div className="bg-white rounded-lg shadow-xl max-w-md w-full">
              <div className="flex justify-between items-center px-6 py-4 border-b">
                <h2 className="text-lg font-semibold text-gray-800">Calendar sharing</h2>
                <button 
                  onClick={closeModal}
                  className="text-gray-500 hover:text-gray-700"
                >
                  <X size={20} />
                </button>
              </div>
              
              <div className="p-6">
                {currentCalendar &&
                (currentCalendar.creatorId === authUser?.id ||
                  currentCalendar.role === "owner") ? (
                  <div className="mb-6">
                    <div className="space-y-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Share with email
                        </label>
                        <input
                          type="email"
                          value={sharedUserEmail}
                          onChange={(e) => setSharedUserEmail(e.target.value)}
                          className="w-full rounded-md border border-gray-300 shadow-sm px-3 py-2 focus:outline-none focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500"
                          placeholder="user@example.com"
                        />
                      </div>
                      
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Permission
                        </label>
                        <select
                          value={sharedRole}
                          onChange={(e) =>
                            setSharedRole(e.target.value as "owner" | "editor" | "viewer")
                          }
                          className="w-full rounded-md border border-gray-300 shadow-sm px-3 py-2 focus:outline-none focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500"
                        >
                          <option value="owner">Owner</option>
                          <option value="editor">Editor</option>
                          <option value="viewer">Viewer</option>
                        </select>
                      </div>
                      
                      <div>
                        <button
                          onClick={handleAddSharedUser}
                          className="w-full py-2 px-4 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 transition-colors"
                          disabled={isSharedLoading || !sharedUserEmail.trim()}
                        >
                          {isSharedLoading ? "Adding..." : "Share"}
                        </button>
                      </div>
                    </div>
                  </div>
                ) : (
                  <p className="text-sm text-gray-500 mb-4">
                    You don't have permission to add users to this calendar
                  </p>
                )}
                
                <div className="mb-3">
                  <h3 className="text-md font-medium text-gray-700">People with access</h3>
                </div>
                
                <div className="max-h-60 overflow-y-auto border border-gray-200 rounded-md">
                  {sharedUsers.length === 0 ? (
                    <div className="p-4 text-center text-sm text-gray-500">
                      No users have access to this calendar
                    </div>
                  ) : (
                    <ul className="divide-y divide-gray-200">
                      {sharedUsers.map((item) => {
                        const displayRole =
                        currentCalendar && String(item.user.id) === String(currentCalendar.creatorId)
                          ? "creator"
                          : item.role;
                      
                        return (
                          <li key={item.id} className="p-3 hover:bg-gray-50">
                            <div className="flex items-center space-x-3">
                              <img
                                src={`http://localhost:3000/uploads/avatars/${item.user.profilePictureName}`}
                                alt="avatar"
                                className="w-10 h-10 rounded-full object-cover"
                              />
                              
                              <div className="flex-1 min-w-0">
                                <p className="text-sm font-medium text-gray-900 truncate">
                                  {item.user.firstName} {item.user.lastName}
                                  {!item.isConfirmed && (
                                    <span className="ml-2 text-xs text-gray-500">
                                      (Pending)
                                    </span>
                                  )}
                                </p>
                                <p className="text-xs text-gray-500 truncate">
                                  {item.user.email}
                                </p>
                              </div>
                              
                              <div className="flex items-center">
                                {editingUserId === String(item.user.id) ? (
                                  <div className="flex items-center">
                                    <select
                                      value={editedRole}
                                      onChange={(e) =>
                                        setEditedRole(
                                          e.target.value as "owner" | "editor" | "viewer"
                                        )
                                      }
                                      className="text-xs border rounded px-1 py-1"
                                    >
                                      <option value="owner">Owner</option>
                                      <option value="editor">Editor</option>
                                      <option value="viewer">Viewer</option>
                                    </select>
                                    <button
                                      onClick={() => handleUserRoleSave(String(item.user.id))}
                                      className="ml-1 p-1 text-green-600 hover:text-green-800"
                                    >
                                      <Check size={16} />
                                    </button>
                                  </div>
                                ) : (
                                  <>
                                    <span className="text-xs px-2 py-1 rounded-full bg-gray-100 text-gray-800">
                                      {displayRole}
                                    </span>
                                    
                                    {currentCalendar &&
  String(currentCalendar.creatorId) === String(authUser?.id) &&
  String(item.user.id) !== String(authUser?.id) && (
    <div className="flex ml-2">
      <button
        onClick={() => {
          setEditingUserId(String(item.user.id));
          setEditedRole(item.role);
        }}
        className="p-1 text-gray-600 hover:text-gray-800"
      >
        <Edit2 size={16} />
      </button>
      <button
        onClick={() => handleRemoveUser(item.user.id)}
        className="p-1 text-gray-600 hover:text-red-600"
      >
        <Trash2 size={16} />
      </button>
    </div>
  )}

                                  </>
                                )}
                              </div>
                            </div>
                          </li>
                        );
                      })}
                    </ul>
                  )}
                </div>
              </div>
            </div>
          </div>
        );

      case 'delete':
        return (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-[1000]">
            <div className="bg-white rounded-lg shadow-xl max-w-md w-full p-6">
              <h3 className="text-lg font-semibold text-gray-800 mb-4">Confirm deletion</h3>
              <p className="text-gray-600 mb-6">
                Are you sure you want to delete this calendar? This action cannot be undone.
              </p>
              <div className="flex justify-end space-x-3">
                <button
                  onClick={closeModal}
                  className="px-4 py-2 text-sm text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200"
                >
                  Cancel
                </button>
                <button
                  onClick={() => modalData.calendarId && handleDeleteCalendar(modalData.calendarId, authUser.id)}
                  className="px-4 py-2 text-sm text-white bg-red-600 rounded-md hover:bg-red-700"
                >
                  Delete
                </button>
              </div>
            </div>
          </div>
        );

      default:
        return null;
    }
  };

  if (loading) return (
    <div className="flex items-center justify-center h-screen bg-gray-50">
      <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-indigo-500"></div>
    </div>
  );
  
  // if (error) return (
  //   <div className="flex items-center justify-center h-screen bg-gray-50">
  //     <div className="p-6 bg-white rounded-lg shadow-lg text-red-500">
  //       <h2 className="text-xl font-bold mb-2">Error</h2>
  //       <p>{error}</p>
  //     </div>
  //   </div>
  // );

  return (
    <div className="h-screen flex flex-col">
  <div className="flex flex-1 overflow-hidden">
    {/* Mobile sidebar toggle */}
    <button 
      className="fixed bottom-4 right-4 z-50 md:hidden bg-indigo-600 text-white p-3 rounded-full shadow-lg"
      onClick={() => setSidebarOpen(!sidebarOpen)}
    >
      {sidebarOpen ? <X /> : <CalendarClock />}
    </button>
    
    {/* Redesigned Sidebar - now taking full left side */}
    <div className={`
      transition-all duration-300 ease-in-out
      md:relative md:block 
      ${sidebarOpen ? "fixed inset-y-0 left-0 w-72 z-40 shadow-xl md:shadow-none" : "hidden"}
      md:z-auto md:translate-x-0 bg-white border-r border-gray-200 md:w-72 lg:w-80 xl:w-80
    `}>
      <div className="h-full flex flex-col overflow-hidden">
        {/* Sidebar Header */}
        <div className="p-4 border-b border-gray-200 bg-white">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-bold text-gray-800 flex items-center">
            <CalendarClock className="mr-2 text-indigo-600" size={20} />
              <span>Calendars</span>
            </h2>
            <button 
              className="bg-indigo-600 text-white p-1.5 rounded-md hover:bg-indigo-700 transition-colors flex items-center text-sm"
              onClick={() => openModal({ type: 'create' })}
            >
              <Plus size={16} className="mr-1" />
              <span>New</span>
            </button>
          </div>
        </div>
        
        {/* Sidebar Content */}
        <div className="flex-1 overflow-y-auto p-4 bg-white">
          <Sidebar
            calendars={formattedCalendars}
            onToggleCalendar={handleToggleCalendar}
            onDeleteCalendar={(id) => openModal({ type: 'delete', calendarId: id })}
            openModal={openModal}
            authUser={authUser}
            handleLeaveCalendar={handleLeaveCalendar}
          />
        </div>
      </div>
    </div>
    
    {/* Main content area */}
    <div className="flex-1 overflow-auto bg-white border-l border-gray-200">
      <div className="p-4 md:p-6">
        <CustomCalendar
          events={allEvents}
          calendars={formattedCalendars}
          onAddEvent={handleAddEvent}
        />
      </div>
    </div>
  </div>
  
  {/* Alert component */}
  {alertMessage && (
    <Alert message={alertMessage} onClose={() => setAlertMessage(null)} />
  )}
  
  {/* Render modals at the root level */}
  {renderModalContent()}
</div>

  );
};

export default CalendarPage;
