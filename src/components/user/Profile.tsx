import React, { useEffect, useState } from "react";
import { useSelector, useDispatch } from "react-redux";
import { RootState, AppDispatch } from "../../store";
import {
  getCurrentUser,
  uploadAvatar,
  updateCurrentUser,
} from "../../actions/userActions";
import { Button } from "../ui/button";
import { Input } from "../ui/input";
import { Card, CardContent } from "../ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "../ui/avatar";
import { Mail, Calendar, Save, Lock, Globe, Edit } from "lucide-react";
import { format } from "date-fns";
import axios from "axios";
import Select from "react-select";
import {
  FormField,
  FormItem,
  FormLabel,
  FormControl,
  FormMessage,
} from "../ui/form";
import { Eye, EyeOff } from "lucide-react";
interface CountryOption {
  label: string;
  value: string;
  flag: string;
}

const Profile: React.FC = () => {
  const dispatch = useDispatch<AppDispatch>();
  const authUser = useSelector((state: RootState) => state.auth.user);
  const [editMode, setEditMode] = useState(false);
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [country, setCountry] = useState("");
  const [countries, setCountries] = useState<CountryOption[]>([]);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [showOldPassword, setShowOldPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmNewPassword, setShowConfirmNewPassword] = useState(false);
  // Состояния для модального окна восстановления пароля
  const [showResetModal, setShowResetModal] = useState(false);
  // Выбор способа восстановления: "email" или "oldPassword"
  const [resetMethod, setResetMethod] = useState<"email" | "oldPassword">(
    "email"
  );
  // Поля для варианта восстановления через старый пароль
  const [oldPassword, setOldPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmNewPassword, setConfirmNewPassword] = useState("");

  useEffect(() => {
    if (authUser) {
      setFirstName(authUser.firstName);
      setLastName(authUser.lastName);
      setCountry(authUser.countryCode);
    }
  }, [authUser]);

  // Получение списка стран
  useEffect(() => {
    const fetchCountries = async () => {
      try {
        const response = await axios.get(
          "http://localhost:3000/api/countries"
        );
        // Сохраняем объекты со свойствами: label, value и flag
        const countryOptions: CountryOption[] = response.data.map(
          (country: any) => ({
            label: country.name,
            value: country.code,
            flag: country.flag,
          })
        );
        setCountries(countryOptions);
      } catch (err) {
        console.error("Failed to fetch countries:", err);
      }
    };

    fetchCountries();
  }, []);

  const handleSaveProfile = async () => {
    if (authUser) {
      try {
        const lastNameToSave = lastName.trim() === "" ? null : lastName;
        await dispatch(
          updateCurrentUser(
            { firstName, lastName: lastNameToSave, countryCode: country },
            authUser.id
          )
        );
        setSuccessMessage("Profile updated successfully.");
        setEditMode(false);
      } catch (err) {
        setErrorMessage("Failed to update profile.");
        console.error("Error updating profile:", err);
      }
    }
  };

  const handleAvatarChange = async (
    event: React.ChangeEvent<HTMLInputElement>
  ) => {
    if (event.target.files && event.target.files[0] && authUser) {
      const file = event.target.files[0];
      const formData = new FormData();
      formData.append("file", file);

      try {
        await dispatch(uploadAvatar(formData, authUser.id));
        setSuccessMessage("Avatar uploaded successfully.");
        dispatch(getCurrentUser(authUser.id)); // Обновляем данные пользователя
      } catch (err) {
        setErrorMessage("Failed to upload avatar.");
        console.error("Error uploading avatar:", err);
      }
    }
  };

  // Восстановление пароля по варианту через старый пароль
  const handleOldPasswordReset = async () => {
    // Проверяем, что новый пароль совпадает с подтверждением
    if (newPassword !== confirmNewPassword) {
      setErrorMessage("New password and confirmation do not match.");
      return;
    }
    if (authUser) {
      try {
        // Отправляем PATCH-запрос с полями oldPassword и newPassword
        await axios.patch(`http://localhost:3000/api/users/${authUser.id}`, {
          oldPassword,
          newPassword,
        });
        setSuccessMessage("Password updated successfully.");
        setShowResetModal(false);
        // При необходимости можно обновить данные пользователя:
        // dispatch(getCurrentUser(authUser.id));
      } catch (err: any) {
        setErrorMessage(
          "Failed to update password: " + (err.response?.data?.message || "")
        );
      }
    }
  };

  // Отправка запроса на восстановление по email
  const handleEmailReset = async () => {
    if (authUser) {
      try {
        await axios.post("http://localhost:3000/api/auth/reset-password", {
          email: authUser.email,
        });
        setSuccessMessage("Password reset link sent to your email.");
        setShowResetModal(false);
      } catch (err) {
        setErrorMessage("Failed to send password reset link.");
      }
    }
  };

  // Для отображения страны в профиле
  const selectedCountry = countries.find(
    (c) => c.value === authUser?.countryCode
  );
  if (!authUser) return <div>User not found</div>;

  return (
    <div className="min-h-screen bg-gray-100 py-12 px-4">
      <div className="max-w-4xl mx-auto">
        {/* Аватар и информация */}
        <div className="flex items-center gap-6 mb-8">
          <div className="relative group">
            <Avatar
              className="h-32 w-32 ring-4 ring-gray-200 shadow-lg cursor-pointer"
              onClick={() =>
                document.getElementById("avatarInput")?.click()
              }
            >
              <AvatarImage
                src={`http://localhost:3000/uploads/avatars/${authUser.profilePictureName}`}
                alt={`${authUser.firstName} ${authUser.lastName}`}
                className="object-cover"
              />
              <AvatarFallback className="bg-gray-200 text-gray-500 text-4xl">
                {authUser.firstName.charAt(0).toUpperCase()}
              </AvatarFallback>
            </Avatar>
            <Input
              id="avatarInput"
              type="file"
              onChange={handleAvatarChange}
              accept="image/*"
              className="hidden"
            />
          </div>
          <div>
            <h1 className="text-3xl font-bold">
              {authUser.firstName}
              {authUser.lastName ? ` ${authUser.lastName}` : ""}
            </h1>
            <p className="text-gray-500">{authUser.email}</p>
          </div>
        </div>

        {/* Основной контент */}
        <Card className="bg-white shadow-lg rounded-lg">
          <CardContent className="p-6">
            {successMessage && (
              <div className="mb-4 text-green-600">{successMessage}</div>
            )}
            {errorMessage && (
              <div className="mb-4 text-red-600">{errorMessage}</div>
            )}
            {editMode ? (
              <div className="space-y-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  First Name
                </label>
                <Input
                  value={firstName}
                  onChange={(e) => setFirstName(e.target.value)}
                  placeholder="First Name"
                  className="w-full"
                />
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Last Name
                </label>
                <Input
                  value={lastName}
                  onChange={(e) => setLastName(e.target.value)}
                  placeholder="Last Name"
                  className="w-full"
                />
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Country
                  </label>
                  <Select
                    options={countries}
                    value={countries.find((c) => c.value === country)}
                    onChange={(selectedOption) =>
                      setCountry(selectedOption?.value || "")
                    }
                    getOptionLabel={(option) => (
                      <div className="flex items-center">
                        <img
                          src={option.flag}
                          alt={option.label}
                          style={{
                            width: 20,
                            height: 15,
                            marginRight: 10,
                          }}
                        />
                        <span style={{ fontSize: "13px" }}>
                          {option.label}
                        </span>
                      </div>
                    )}
                    getOptionValue={(option) => option.value}
                    filterOption={(option, inputValue) =>
                      option.data.label
                        .toLowerCase()
                        .includes(inputValue.toLowerCase())
                    }
                    placeholder="Select your country"
                  />
                </div>
                <Button
                  onClick={handleSaveProfile}
                  className="w-full bg-blue-600 text-white hover:bg-blue-700"
                >
                  <Save className="h-4 w-4 mr-2" />
                  Save Profile
                </Button>
              </div>
            ) : (
              <div className="space-y-4">
                <div className="flex items-center gap-3">
                  <Mail className="w-5 h-5 text-blue-500" />
                  <div>
                    <p className="text-sm text-gray-500">Email</p>
                    <p className="font-medium">{authUser.email}</p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <Calendar className="w-5 h-5 text-green-500" />
                  <div>
                    <p className="text-sm text-gray-500">Member Since</p>
                    <p className="font-medium">
                      {format(new Date(authUser.createdAt), "MMMM d, yyyy")}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <Globe className="w-5 h-5 text-yellow-500" />
                  <div>
                    <p className="text-sm text-gray-500">Country</p>
                    <div className="flex items-center gap-2">
                      {selectedCountry && (
                        <img
                          src={selectedCountry.flag}
                          alt={selectedCountry.label}
                          style={{
                            width: 20,
                            height: 15,
                          }}
                          className="rounded-sm"
                        />
                      )}
                      <p className="font-medium">
                        {selectedCountry
                          ? selectedCountry.label
                          : authUser.countryCode}
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Кнопки */}
        <div className="flex justify-between mt-4">
          <Button
            onClick={() => setEditMode(!editMode)}
            className="bg-blue-600 text-white hover:bg-blue-700"
          >
            <Edit className="h-4 w-4 mr-2" />
            {editMode ? "Cancel Edit" : "Edit Profile"}
          </Button>
          <Button
            onClick={() => {
              setResetMethod("email"); // по умолчанию вариант email
              setShowResetModal(true);
            }}
            className="bg-red-600 text-white hover:bg-red-700"
          >
            <Lock className="h-4 w-4 mr-2" />
            Reset Password
          </Button>
        </div>
      </div>

      {/* Модальное окно восстановления пароля */}
      {showResetModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-xl font-bold">Reset Password</h3>
              <button
                onClick={() => setShowResetModal(false)}
                className="text-gray-500"
              >
                X
              </button>
            </div>
            <div className="mb-4">
              <p className="text-sm text-gray-700 mb-2">
                Select reset method:
              </p>
              <div className="flex space-x-4">
                <button
                  className={`px-4 py-2 border rounded ${
                    resetMethod === "email"
                      ? "bg-blue-600 text-white"
                      : "bg-white text-gray-600"
                  }`}
                  onClick={() => setResetMethod("email")}
                >
                  Via Email
                </button>
                <button
                  className={`px-4 py-2 border rounded ${
                    resetMethod === "oldPassword"
                      ? "bg-blue-600 text-white"
                      : "bg-white text-gray-600"
                  }`}
                  onClick={() => setResetMethod("oldPassword")}
                >
                  Via Old Password
                </button>
              </div>
            </div>
            {resetMethod === "email" ? (
              <div>
                <p className="mb-4 text-sm text-gray-700">
                  A reset link will be sent to your email address:{" "}
                  <span className="font-medium">{authUser.email}</span>
                </p>
                <Button
                  onClick={handleEmailReset}
                  className="w-full bg-blue-600 text-white hover:bg-blue-700"
                >
                  Send Reset Link
                </Button>
              </div>
            ) : (
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700">
                    Old Password
                  </label>
                  <Input
                    type="password"
                    value={oldPassword}
                    onChange={(e) => setOldPassword(e.target.value)}
                    placeholder="Enter old password"
                    className="w-full"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">
                    New Password
                  </label>
                  <Input
                    type="password"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    placeholder="Enter new password"
                    className="w-full"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">
                    Confirm New Password
                  </label>
                  <Input
                    type="password"
                    value={confirmNewPassword}
                    onChange={(e) => setConfirmNewPassword(e.target.value)}
                    placeholder="Confirm new password"
                    className="w-full"
                  />
                </div>
                <Button
                  onClick={handleOldPasswordReset}
                  className="w-full bg-blue-600 text-white hover:bg-blue-700"
                >
                  Update Password
                </Button>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default Profile;
