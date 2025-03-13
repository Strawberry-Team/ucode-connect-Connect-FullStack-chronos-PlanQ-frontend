import React, { useEffect, useState } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { RootState, AppDispatch } from '../../store';
import { getCurrentUser, uploadAvatar, updateCurrentUser } from '../../actions/userActions';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Card, CardContent } from '../ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '../ui/avatar';
import { Mail, Calendar, Upload, Save, X, Lock } from 'lucide-react';
import { format } from 'date-fns';
import { useNavigate } from 'react-router-dom';

const Profile: React.FC = () => {
  const dispatch = useDispatch<AppDispatch>();
  const navigate = useNavigate();
  const authUser = useSelector((state: RootState) => state.auth.user);
  const [editMode, setEditMode] = useState(false);
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [avatarFile, setAvatarFile] = useState<File | null>(null);
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  useEffect(() => {
    if (authUser) {
      setFirstName(authUser.firstName);
      setLastName(authUser.lastName);
    }
  }, [authUser]);

  const handleSaveProfile = async () => {
    if (authUser) {
      try {
        await dispatch(
          updateCurrentUser(
            { firstName, lastName },
            authUser.id
          )
        );
        setSuccessMessage('Profile updated successfully.');
        setEditMode(false);
      } catch (err) {
        console.error('Error updating profile:', err);
      }
    }
  };

  const handleAvatarChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    if (event.target.files && event.target.files[0]) {
      const file = event.target.files[0];
      setAvatarFile(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setAvatarPreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleUploadAvatar = async () => {
    if (avatarFile && authUser) {
      const formData = new FormData();
      formData.append('photo', avatarFile);
      try {
        await dispatch(uploadAvatar(formData, authUser.id));
        setSuccessMessage('Avatar uploaded successfully.');
        setAvatarFile(null);
        setAvatarPreview(null);
        dispatch(getCurrentUser(authUser.id));
      } catch (err) {
        console.error('Error uploading avatar:', err);
      }
    }
  };

  const handleResetPassword = () => {
    navigate('/reset-password');
  };

  if (!authUser) return <div>User not found</div>;

  return (
    <div className="min-h-screen bg-gray-100 py-12 px-4">
      <div className="max-w-4xl mx-auto">
        {/* Аватар и информация */}
        <div className="flex items-center gap-6 mb-8">
          <div className="relative group">
            <Avatar
              className="h-32 w-32 ring-4 ring-gray-200 shadow-lg cursor-pointer"
              onClick={() => document.getElementById('avatarInput')?.click()} // Клик на аватар открывает выбор файла
            >
              <AvatarImage
                src={avatarPreview || `http://localhost:3001/uploads/avatars/${authUser.profilePictureName}`}
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
            <h1 className="text-3xl font-bold">{`${authUser.firstName} ${authUser.lastName}`}</h1>
            <p className="text-gray-500">{authUser.email}</p>
          </div>
        </div>

        {/* Основной контент */}
        <Card className="bg-white shadow-lg rounded-lg">
          <CardContent className="p-6">
            {successMessage && (
              <div className="mb-4 text-green-600">{successMessage}</div>
            )}
            {editMode ? (
              <div className="space-y-4">
                <Input
                  value={firstName}
                  onChange={(e) => setFirstName(e.target.value)}
                  placeholder="First Name"
                  className="w-full"
                />
                <Input
                  value={lastName}
                  onChange={(e) => setLastName(e.target.value)}
                  placeholder="Last Name"
                  className="w-full"
                />
                <Button
                  onClick={handleSaveProfile}
                  className="w-full bg-blue-600 text-white hover:bg-blue-700"
                >
                  <Save className="h-4 w-4 mr-2" />
                  Save Profile
                </Button>
                {avatarPreview && (
                  <Button
                    onClick={handleUploadAvatar}
                    className="w-full bg-blue-600 text-white hover:bg-blue-700"
                  >
                    <Upload className="h-4 w-4 mr-2" />
                    Upload Avatar
                  </Button>
                )}
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
                      {format(new Date(authUser.createdAt), 'MMMM d, yyyy')}
                    </p>
                  </div>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Кнопки */}
        <div className="flex justify-between mt-4">
          {editMode && (
            <Button
              onClick={() => setEditMode(false)}
              className="bg-gray-200 text-gray-600 hover:bg-gray-300"
            >
              <X className="h-4 w-4 mr-2" />
              Cancel
            </Button>
          )}
          <Button
            onClick={handleResetPassword}
            className="bg-red-600 text-white hover:bg-red-700"
          >
            <Lock className="h-4 w-4 mr-2" />
            Reset Password
          </Button>
        </div>
      </div>
    </div>
  );
};

export default Profile;
