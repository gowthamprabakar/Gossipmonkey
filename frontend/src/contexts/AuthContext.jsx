import { createContext, useContext, useEffect, useMemo, useState } from 'react';
import { createSession, getMe } from '../services/identityService';

const AuthContext = createContext(null);

const PERSONA_KEY = 'chat_monkey_persona';
const TOKEN_KEY = 'chat_monkey_token';

const migrateLegacyPersona = () => {
  const raw = localStorage.getItem(PERSONA_KEY);
  if (!raw) return null;

  try {
    const parsed = JSON.parse(raw);
    if (parsed.alias) return parsed;
    if (parsed.name) {
      const upgraded = {
        id: parsed.id,
        alias: parsed.name,
        avatar: parsed.avatar || 'https://api.dicebear.com/7.x/bottts/svg?seed=Monkey',
        score: parsed.score || 100
      };
      localStorage.setItem(PERSONA_KEY, JSON.stringify(upgraded));
      return upgraded;
    }
    return null;
  } catch {
    return null;
  }
};

export const AuthProvider = ({ children }) => {
  const [persona, setPersona] = useState(null);
  const [token, setToken] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const bootstrap = async () => {
      const storedToken = localStorage.getItem(TOKEN_KEY);
      const storedPersona = migrateLegacyPersona();

      if (!storedToken || !storedPersona) {
        setLoading(false);
        return;
      }

      setToken(storedToken);
      setPersona(storedPersona);

      const result = await getMe();
      if (result.success) {
        setPersona(result.data.persona);
        localStorage.setItem(PERSONA_KEY, JSON.stringify(result.data.persona));
      } else {
        localStorage.removeItem(TOKEN_KEY);
        localStorage.removeItem(PERSONA_KEY);
        setToken(null);
        setPersona(null);
      }

      setLoading(false);
    };

    bootstrap();
  }, []);

  const startSession = async ({ alias, avatar }) => {
    const result = await createSession({ alias, avatar });
    if (!result.success) return result;

    const { persona: nextPersona, token: nextToken } = result.data;
    localStorage.setItem(PERSONA_KEY, JSON.stringify(nextPersona));
    localStorage.setItem(TOKEN_KEY, nextToken);
    setPersona(nextPersona);
    setToken(nextToken);

    return { success: true, data: nextPersona };
  };

  const refreshPersona = async () => {
    const result = await getMe();
    if (!result.success) return result;

    setPersona(result.data.persona);
    localStorage.setItem(PERSONA_KEY, JSON.stringify(result.data.persona));
    return result;
  };

  const logout = () => {
    localStorage.removeItem(PERSONA_KEY);
    localStorage.removeItem(TOKEN_KEY);
    setPersona(null);
    setToken(null);
  };

  const value = useMemo(() => ({
    persona,
    token,
    loading,
    isAuthenticated: !!token && !!persona,
    startSession,
    refreshPersona,
    logout
  }), [persona, token, loading]);

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
};
