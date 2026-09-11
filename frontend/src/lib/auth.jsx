import {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useState
} from 'react';

import { api } from './api';

const AuthContext =
  createContext(null);

function readStoredUser() {
  try {
    return JSON.parse(
      localStorage.getItem(
        'engageai_user'
      ) || 'null'
    );
  } catch {
    return null;
  }
}

export function AuthProvider({
  children
}) {

  const [user, setUser] =
    useState(readStoredUser);

  const [loading, setLoading] =
    useState(true);

  useEffect(() => {

    const token =
      localStorage.getItem(
        'engageai_token'
      );

    if (!token) {
      setLoading(false);
      return;
    }

    api.get('/auth/me')

      .then(({ data }) => {

        if (data?.user) {

          localStorage.setItem(
            'engageai_user',
            JSON.stringify(data.user)
          );

          setUser(data.user);
        }

      })

      .catch(() => {

        localStorage.removeItem(
          'engageai_token'
        );

        localStorage.removeItem(
          'engageai_user'
        );

        setUser(null);

      })

      .finally(() =>
        setLoading(false)
      );

  }, []);

  const login =
    async (email, password) => {

      const { data } =
        await api.post(
          '/auth/login',
          {
            email,
            password
          }
        );

      if (
        !data?.token ||
        !data?.user
      ) {
        throw new Error(
          data?.message ||
          'Login failed'
        );
      }

      localStorage.setItem(
        'engageai_token',
        data.token
      );

      localStorage.setItem(
        'engageai_user',
        JSON.stringify(data.user)
      );

      setUser(data.user);
    };

  const updateUser =
    (updatedUser) => {

      setUser(updatedUser);

      localStorage.setItem(
        'engageai_user',
        JSON.stringify(updatedUser)
      );
    };

  const logout = () => {

    localStorage.removeItem(
      'engageai_token'
    );

    localStorage.removeItem(
      'engageai_user'
    );

    setUser(null);
  };

  const value =
    useMemo(
      () => ({
        user,
        loading,
        login,
        logout,
        updateUser
      }),
      [
        user,
        loading
      ]
    );

  return (
    <AuthContext.Provider
      value={value}
    >
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth =
  () => useContext(AuthContext);