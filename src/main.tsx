import ReactDOM from 'react-dom/client'
import {Provider} from 'react-redux'
import App from './App'
import store from './store'
import userService from './services/userService'
import csrfService from './services/csrfService'
import './index.css'

// Инициализация приложения
const initApp = async () => {
  // Проверка и установка токена авторизации
  const accessToken = sessionStorage.getItem('accessToken')
  if (accessToken) {
      userService.setAuthToken(accessToken)
  }
  
  // Получение CSRF-токена и настройка интерсепторов
  await csrfService.fetchCsrfToken();
  csrfService.setupAxiosInterceptors();
  
  // Рендеринг приложения после инициализации
  ReactDOM.createRoot(document.getElementById('root') as HTMLElement).render(
      <Provider store={store}>
          <App/>
      </Provider>
  )
}

// Запуск процесса инициализации
initApp();
