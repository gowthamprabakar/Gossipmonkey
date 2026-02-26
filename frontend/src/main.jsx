import { createRoot } from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import './index.css';
import App from './App.jsx';
import { AuthProvider } from './contexts/AuthContext';
import { RoomProvider } from './contexts/RoomContext';
import { UIProvider } from './contexts/UIContext';

createRoot(document.getElementById('root')).render(
  <AuthProvider>
    <UIProvider>
      <BrowserRouter>
        <RoomProvider>
          <App />
        </RoomProvider>
      </BrowserRouter>
    </UIProvider>
  </AuthProvider>
);
