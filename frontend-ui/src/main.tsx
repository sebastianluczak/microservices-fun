import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.tsx'
import { WsConnectionProvider } from './context/WsConnectionContext.tsx'
import { UserProvider } from './context/UserContext.tsx'

createRoot(document.getElementById('root')!).render(
  <UserProvider>
    <WsConnectionProvider>
      <App />
    </WsConnectionProvider>
  </UserProvider>
)
