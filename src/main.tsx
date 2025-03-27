import ReactDOM from 'react-dom/client'
import {Provider} from 'react-redux'
import App from './App'
import store from './store'
import userService from './services/userService'
import csrfService from './services/csrfService'
import './index.css'

const initApp = async () => {
  const accessToken = sessionStorage.getItem('accessToken')
  if (accessToken) {
      userService.setAuthToken(accessToken)
  }
  
  await csrfService.fetchCsrfToken();
  csrfService.setupAxiosInterceptors();
  
  ReactDOM.createRoot(document.getElementById('root') as HTMLElement).render(
      <Provider store={store}>
          <App/>
      </Provider>
  )
}

initApp();
