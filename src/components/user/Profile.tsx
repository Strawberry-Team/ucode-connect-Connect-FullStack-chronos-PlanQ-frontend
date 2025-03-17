import React, { useEffect, useState } from "react";
import { useSelector, useDispatch } from "react-redux";
import { useForm, SubmitHandler } from "react-hook-form";
import { RootState, AppDispatch } from "../../store";
import {
  getCurrentUser,
  uploadAvatar,
  updateCurrentUser,
} from "../../actions/userActions";
import { Button } from "../ui/button";
import { Input } from "../ui/input";
import { Card, CardContent } from "../ui/card";
import {
  Avatar,
  AvatarFallback,
  AvatarImage,
} from "../ui/avatar";
import {
  Mail,
  Calendar,
  Save,
  Lock,
  Globe,
  Edit,
  Eye,
  EyeOff,
} from "lucide-react";
import { format } from "date-fns";
import axios from "axios";
import Select from "react-select";
import {
  FormField,
  FormItem,
  FormLabel,
  FormControl,
  FormMessage,
  Form,
} from "../ui/form";
import Alert from "../Alert";

interface CountryOption {
  label: string;
  value: string;
  flag: string;
}

interface ResetFormValues {
  oldPassword: string;
  newPassword: string;
  confirmNewPassword: string;
}

const Profile: React.FC = () => {
  const dispatch = useDispatch<AppDispatch>();
  const authUser = useSelector((state: RootState) => state.auth.user);

  // Основные состояния профиля
  const [editMode, setEditMode] = useState(false);
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [country, setCountry] = useState("");
  const [countries, setCountries] = useState<CountryOption[]>([]);
  // Будем использовать единое состояние для вывода сообщений пользователю
  const [alertMessage, setAlertMessage] = useState<string | null>(null);

  const [showOldPassword, setShowOldPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmNewPassword, setShowConfirmNewPassword] = useState(false);

  const [showResetModal, setShowResetModal] = useState(false);
  const [resetMethod, setResetMethod] = useState<"email" | "oldPassword">("email");

  // Создаём экземпляр формы для восстановления через старый пароль
  const resetForm = useForm<ResetFormValues>({
    defaultValues: {
      oldPassword: "",
      newPassword: "",
      confirmNewPassword: "",
    },
  });

  const onResetSubmit: SubmitHandler<ResetFormValues> = async (data) => {
    if (data.newPassword !== data.confirmNewPassword) {
      setAlertMessage("New password and confirmation do not match.");
      return;
    }
    if (authUser) {
      try {
        await dispatch(
          updateCurrentUser(
            {
              oldPassword: data.oldPassword,
              newPassword: data.newPassword,
            },
            authUser.id
          )
        );
        setAlertMessage("Password updated successfully.");
        setShowResetModal(false);
      } catch (err: any) {
        setAlertMessage(
          "Failed to update password: " +
            (err.response?.data?.message || "")
        );
      }
    }
  };

  useEffect(() => {
    if (authUser) {
      setFirstName(authUser.firstName);
      setLastName(authUser.lastName);
      setCountry(authUser.countryCode);
    }
  }, [authUser]);

  useEffect(() => {
    const fetchCountries = async () => {
      try {
        const response = await axios.get(
          "http://localhost:3000/api/countries"
        );
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
        setAlertMessage("Profile updated successfully.");
        setEditMode(false);
      } catch (err) {
        setAlertMessage("Failed to update profile.");
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
        setAlertMessage("Avatar uploaded successfully.");
        dispatch(getCurrentUser(authUser.id));
      } catch (err) {
        setAlertMessage("Failed to upload avatar.");
        console.error("Error uploading avatar:", err);
      }
    }
  };

  const handleEmailReset = async () => {
    if (authUser) {
      try {
        await axios.post("http://localhost:3000/api/auth/reset-password", {
          email: authUser.email,
        });
        setAlertMessage("Password reset link sent to your email.");
        setShowResetModal(false);
      } catch (err) {
        setAlertMessage("Failed to send password reset link.");
      }
    }
  };

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

        {/* Основной контент профиля */}
        <Card className="bg-white shadow-lg rounded-lg">
          <CardContent className="p-6">
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
                          style={{ width: 20, height: 15 }}
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

        {/* Кнопки профиля */}
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
              setResetMethod("email"); // По умолчанию вариант email
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
              <p className="text-sm text-gray-700 mb-2">Select reset method:</p>
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
              <Form {...resetForm}>
                <form
                  onSubmit={resetForm.handleSubmit(onResetSubmit)}
                  className="space-y-4"
                >
                  <FormField
                    control={resetForm.control}
                    name="oldPassword"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Old Password</FormLabel>
                        <FormControl>
                          <div className="relative">
                            <Lock className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground h-4 w-4" />
                            <Input
                              type={showOldPassword ? "text" : "password"}
                              placeholder="Enter old password"
                              className="pl-10 pr-10"
                              {...field}
                            />
                            <button
                              type="button"
                              onClick={() =>
                                setShowOldPassword(!showOldPassword)
                              }
                              className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                            >
                              {showOldPassword ? (
                                <EyeOff className="h-4 w-4" />
                              ) : (
                                <Eye className="h-4 w-4" />
                              )}
                            </button>
                          </div>
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={resetForm.control}
                    name="newPassword"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>New Password</FormLabel>
                        <FormControl>
                          <div className="relative">
                            <Lock className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground h-4 w-4" />
                            <Input
                              type={showNewPassword ? "text" : "password"}
                              placeholder="Enter new password"
                              className="pl-10 pr-10"
                              {...field}
                            />
                            <button
                              type="button"
                              onClick={() =>
                                setShowNewPassword(!showNewPassword)
                              }
                              className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                            >
                              {showNewPassword ? (
                                <EyeOff className="h-4 w-4" />
                              ) : (
                                <Eye className="h-4 w-4" />
                              )}
                            </button>
                          </div>
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={resetForm.control}
                    name="confirmNewPassword"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Confirm New Password</FormLabel>
                        <FormControl>
                          <div className="relative">
                            <Lock className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground h-4 w-4" />
                            <Input
                              type={showConfirmNewPassword ? "text" : "password"}
                              placeholder="Confirm new password"
                              className="pl-10 pr-10"
                              {...field}
                            />
                            <button
                              type="button"
                              onClick={() =>
                                setShowConfirmNewPassword(
                                  !showConfirmNewPassword
                                )
                              }
                              className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                            >
                              {showConfirmNewPassword ? (
                                <EyeOff className="h-4 w-4" />
                              ) : (
                                <Eye className="h-4 w-4" />
                              )}
                            </button>
                          </div>
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <Button
                    type="submit"
                    className="w-full bg-blue-600 text-white hover:bg-blue-700"
                  >
                    Update Password
                  </Button>
                </form>
              </Form>
            )}
          </div>
        </div>
      )}

      {/* Отображение Alert-компонента */}
      {alertMessage && (
        <Alert message={alertMessage} onClose={() => setAlertMessage(null)} />
      )}
    </div>
  );
};

export default Profile;
