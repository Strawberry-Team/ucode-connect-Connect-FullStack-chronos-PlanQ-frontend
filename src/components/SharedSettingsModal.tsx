// SharedSettingsModal.tsx
import React, { useEffect, useState } from "react";
import axios from "axios";

interface User {
  id: number;
  firstName?: string;
  lastName?: string;
  email: string;
  profilePictureName?: string;
}

interface SharedUser {
  id: number;
  userId: number;
  calendarId: number;
  isMain: boolean;
  role: "owner" | "editor" | "viewer";
  color: string;
  isConfirmed: boolean;
  createdAt: string;
  updatedAt: string;
  user: User;
}

interface SharedSettingsModalProps {
  calendarId: number | string;
  onClose: () => void;
}

const SharedSettingsModal: React.FC<SharedSettingsModalProps> = ({
  calendarId,
  onClose,
}) => {
  const [userEmail, setUserEmail] = useState("");
  const [role, setRole] = useState<"owner" | "editor" | "viewer">("viewer");
  const [sharedUsers, setSharedUsers] = useState<SharedUser[]>([]);
  const [loading, setLoading] = useState(false);

  // Замените на ваш базовый URL API
  const baseUrl = "https://your-api-url.com";

  // Получение списка пользователей, имеющих доступ к календарю
  const fetchSharedUsers = async () => {
    try {
      const response = await axios.get(
        `${baseUrl}/calendars/${calendarId}/users`
      );
      setSharedUsers(response.data);
    } catch (error) {
      console.error("Ошибка получения пользователей календаря:", error);
    }
  };

  useEffect(() => {
    fetchSharedUsers();
  }, [calendarId]);

  const handleAddUser = async () => {
    try {
      setLoading(true);
      const payload = {
        userEmail,
        role,
      };
      await axios.post(`${baseUrl}/calendars/${calendarId}/users`, payload);
      setUserEmail("");
      setRole("viewer");
      fetchSharedUsers();
    } catch (error) {
      console.error("Ошибка добавления пользователя:", error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-50 z-50">
      <div className="bg-white rounded p-6 w-full max-w-md">
        <h2 className="text-xl font-bold mb-4">Shared Settings</h2>
        <div className="mb-4">
          <label className="block text-sm font-medium mb-1">Email</label>
          <input
            type="email"
            value={userEmail}
            onChange={(e) => setUserEmail(e.target.value)}
            className="w-full border rounded px-2 py-1"
            placeholder="user@example.com"
          />
        </div>
        <div className="mb-4">
          <label className="block text-sm font-medium mb-1">Role</label>
          <select
            value={role}
            onChange={(e) =>
              setRole(e.target.value as "owner" | "editor" | "viewer")
            }
            className="w-full border rounded px-2 py-1"
          >
            <option value="owner">Owner</option>
            <option value="editor">Editor</option>
            <option value="viewer">Viewer</option>
          </select>
        </div>
        <div className="flex justify-end mb-4">
          <button
            onClick={handleAddUser}
            className="bg-blue-600 text-white px-4 py-2 rounded"
            disabled={loading || !userEmail}
          >
            Add
          </button>
        </div>
        <h3 className="text-lg font-semibold mb-2">Shared Users</h3>
        <div className="max-h-40 overflow-y-auto border p-2">
          {sharedUsers.length === 0 ? (
            <p className="text-sm text-gray-500">No users have access.</p>
          ) : (
            sharedUsers.map((item) => (
              <div key={item.id} className="flex items-center mb-2">
                <img
                  src={`https://your-cdn.com/${item.user.profilePictureName}`}
                  alt="avatar"
                  className="w-8 h-8 rounded-full mr-2"
                />
                <div>
                  <div className="text-sm font-medium">
                    {item.user.firstName || ""} {item.user.lastName || ""}
                  </div>
                  <div className="text-xs text-gray-500">{item.user.email}</div>
                </div>
              </div>
            ))
          )}
        </div>
        <div className="flex justify-end mt-4">
          <button
            onClick={onClose}
            className="px-4 py-2 bg-gray-300 rounded"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};

export default SharedSettingsModal;
