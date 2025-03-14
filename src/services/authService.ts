import axios from 'axios';
import userService from './userService';

const API_URL = 'http://localhost:3000/api/auth';

interface RegisterData {
  firstName: string;
  lastName: string;
  email: string;
  password: string;
  countryCode: string;
}

interface LoginData {
  email: string;
  password: string;
}

interface User {
  id: number;
  firstName: string;
  lastName: string;
  email: string;
  profilePictureName: string;
  countryCode: string;
  createdAt: string;
  updatedAt: string;
}

interface AuthResponse {
  user: User;
  accessToken: string;
  refreshToken: string;
}

const authService = {
  register: async (userData: RegisterData) => {
    const response = await axios.post(`${API_URL}/register`, userData);
    return response.data;
  },

  login: async (loginData: LoginData) => {
    try {
      const response = await axios.post<AuthResponse>(`${API_URL}/login`, loginData);

      // Сохраняем токены и данные пользователя
      if (response.data.accessToken) {
        const { user, accessToken, refreshToken } = response.data;

        // Генерируем URL для аватара пользователя
        const userWithProfileUrl = {
          ...user,
          profilePictureUrl: `http://localhost:3000/uploads/avatars/${user.profilePictureName}`,
        };

        // Сохраняем токены и данные пользователя в localStorage/sessionStorage
        sessionStorage.setItem('accessToken', accessToken);
        localStorage.setItem('refreshToken', refreshToken);
        localStorage.setItem('user', JSON.stringify(userWithProfileUrl));

        // Устанавливаем токен для последующих запросов
        userService.setAuthToken(accessToken);

        return { user: userWithProfileUrl, accessToken, refreshToken };
      }

      return response.data;
    } catch (error: any) {
      console.log('Login error:', error.response);
      throw error;
    }
  },

  logout: async () => {
    const refreshToken = localStorage.getItem('refreshToken');
    if (!refreshToken) {
      throw new Error('No refresh token found');
    }
    try {
      await axios.post(`${API_URL}/logout`, { refreshToken });
    } catch (error) {
      console.error('Logout error:', error);
      throw error;
    } finally {
      sessionStorage.removeItem('accessToken');
      localStorage.removeItem('refreshToken');
      localStorage.removeItem('user');
      userService.clearAuthToken();
    }
  },

  refreshToken: async () => {
    const refreshToken = localStorage.getItem('refreshToken');
    if (!refreshToken) {
      throw new Error('No refresh token available');
    }
    try {
      const response = await axios.post<AuthResponse>(`${API_URL}/access-token/refresh`, { refreshToken });
      if (response.data.accessToken) {
        sessionStorage.setItem('accessToken', response.data.accessToken);
        userService.setAuthToken(response.data.accessToken);
      }
      return response.data;
    } catch (error: any) {
      console.log('Refresh token error:', error.response);
      throw error;
    }
  },

  verifyEmail: async (token: string) => {
    const response = await axios.get(`${API_URL}/verify-email/${token}`);
    return response.data;
  },

  sendPasswordResetLink: async (email: string) => {
    const response = await axios.post(`${API_URL}/password-reset`, { email });
    return response.data;
  },

  resetPassword: async (token: string, newPassword: string) => {
    const response = await axios.post(`${API_URL}/password-reset/${token}`, { newPassword });
    return response.data;
  },
};

export default authService;
