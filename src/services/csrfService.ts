// src/services/csrfService.ts
import axios from 'axios';

const API_URL = 'http://localhost:3000/api/auth';

class CsrfService {
    private csrfToken: string | null = null;

    async fetchCsrfToken(): Promise<string | null> {
        try {

            const response = await axios.get(`${API_URL}/csrf-token`, {
                withCredentials: true // Важно для работы с куки
            });

            // Токен может быть в заголовке или в теле ответа
            this.csrfToken = response.data.csrfToken;
            return this.csrfToken;
        } catch (error) {
            console.error('Ошибка при получении CSRF токена:', error);
            return null;
        }


    }

    getCsrfToken(): string | null {
        return this.csrfToken;
    }

    // Настройка axios для автоматического добавления токена
    setupAxiosInterceptors(): void {
        axios.interceptors.request.use(config => {
            // Добавляем токен только к небезопасным методам
            // this.fetchCsrfToken();
            if (
                this.csrfToken &&
                ['POST', 'PUT', 'PATCH', 'DELETE'].includes(config.method?.toUpperCase() || '')
            ) {
                config.withCredentials = true;
                config.headers['X-CSRF-Token'] = this.csrfToken;
            }
            return config;
        });
    }
}

export default new CsrfService();