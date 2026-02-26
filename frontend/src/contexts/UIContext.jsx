import { createContext, useContext, useMemo, useState } from 'react';

const UIContext = createContext(null);

export const UIProvider = ({ children }) => {
  const [toasts, setToasts] = useState([]);
  const [notificationsOpen, setNotificationsOpen] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);
  const [adminOverlayOpen, setAdminOverlayOpen] = useState(false);
  const [userListOpen, setUserListOpen] = useState(false);

  const pushToast = (toast) => {
    const id = `${Date.now()}-${Math.random()}`;
    const next = { id, type: 'info', ...toast };
    setToasts((prev) => [...prev, next]);
    setTimeout(() => {
      setToasts((prev) => prev.filter((item) => item.id !== id));
    }, 3500);
  };

  const value = useMemo(() => ({
    toasts,
    pushToast,
    notificationsOpen,
    setNotificationsOpen,
    profileOpen,
    setProfileOpen,
    adminOverlayOpen,
    setAdminOverlayOpen,
    userListOpen,
    setUserListOpen
  }), [toasts, notificationsOpen, profileOpen, adminOverlayOpen, userListOpen]);

  return <UIContext.Provider value={value}>{children}</UIContext.Provider>;
};

export const useUI = () => {
  const ctx = useContext(UIContext);
  if (!ctx) throw new Error('useUI must be used within UIProvider');
  return ctx;
};
