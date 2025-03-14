import axios from 'axios'
import authService from './authService'

const API_URL = 'http://localhost:3000/api'

const userService = {
    setAuthToken: (token: string) => {
        axios.defaults.headers.common['Authorization'] = `Bearer ${token}`
    },
    clearAuthToken: () => {
        delete axios.defaults.headers.common['Authorization']
    },
    refreshToken: async () => {
        const refreshToken = localStorage.getItem('refreshToken')
        if (!refreshToken) {
            throw new Error('No refresh token available')
        }
        const response = await axios.post(`${API_URL}/auth/access-token/refresh`, {refreshToken})
        return response.data
    },
    getCurrentUser: async (userId: string) => {
        const response = await axios.get(`${API_URL}/users/${userId}`)
        return response.data
    },
    updateCurrentUser: async (userData: any, userId: string) => {
        const response = await axios.patch(`${API_URL}/users/${userId}`, userData)
        return response.data
    },
    getUserById: async (userId: string) => {
        const response = await axios.get(`${API_URL}/users/${userId}`)
        return response.data
    },
    uploadAvatar: async (formData: FormData) => {
        const response = await axios.post(`${API_URL}/users/upload-avatar`, formData, {
            headers: {
                'Content-Type': 'multipart/form-data',
            },
        })
        return response.data
    },
}

axios.interceptors.response.use(
    (response) => response,
    async (error) => {
        const originalRequest = error.config
        if (
            error.response &&
            (error.response.status === 401 || error.response.status === 403) &&
            !originalRequest._retry &&
            !originalRequest.url.includes('/auth/login') &&
            !originalRequest.url.includes('/auth/register')
        ) {
            originalRequest._retry = true
            try {
                const refreshedTokenData = await authService.refreshToken()
                if (refreshedTokenData.newRefreshToken) {
                    localStorage.setItem("refreshToken", refreshedTokenData.newRefreshToken);
                }
                originalRequest.headers['Authorization'] = `Bearer ${refreshedTokenData.accessToken}`
                sessionStorage.setItem('accessToken', refreshedTokenData.accessToken)
                userService.setAuthToken(refreshedTokenData.accessToken)
                return axios(originalRequest)
            } catch (refreshError) {
                await authService.logout()
                return Promise.reject(refreshError)
            }
        }
        return Promise.reject(error)
    }
)

export default userService
