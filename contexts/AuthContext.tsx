import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

interface AuthUser {
  id: string;
  _id: string;
  email: string;
  name?: string;
  userType: 'Icar' | 'Irepair';
}

interface AuthContextType {
  user: AuthUser | null;
  token: string | null;
  isLoading: boolean;
  login: (token: string, user: AuthUser) => Promise<void>;
  logout: () => Promise<void>;
  updateUser: (user: AuthUser) => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const TOKEN_KEY = '@auth_token';
const USER_KEY = 'auth_user';

interface AuthProviderProps {
  children: ReactNode;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Load stored auth data on app start
  useEffect(() => {
    loadStoredAuth();
  }, []);

  const loadStoredAuth = async () => {
    try {
      const [storedToken, storedUser] = await Promise.all([
        AsyncStorage.getItem(TOKEN_KEY),
        AsyncStorage.getItem(USER_KEY),
      ]);

      if (storedToken && storedUser) {
        setToken(storedToken);
        const parsedUser = JSON.parse(storedUser);
        // Ensure both id and _id fields are set for backward compatibility
        if (parsedUser && !parsedUser.id && parsedUser._id) {
          parsedUser.id = parsedUser._id;
        }
        if (parsedUser && !parsedUser._id && parsedUser.id) {
          parsedUser._id = parsedUser.id;
        }
        setUser(parsedUser);
      } else if (storedToken) {
        // Token exists but no user data - try to fetch user profile
        setToken(storedToken);
        try {
          // Try to fetch user profile with existing token
          const headers = {
            'Authorization': `Bearer ${storedToken}`,
            'Content-Type': 'application/json',
          };
          
          // Try to get user profile from the auth service
          fetch('http://192.168.100.14:8888/api/auth/me', { headers })
            .then(response => response.json())
            .then(userData => {
              if (userData && userData.email) {
                const normalizedUser: AuthUser = {
                  id: userData._id || userData.id || 'unknown',
                  _id: userData._id || userData.id || 'unknown',
                  email: userData.email,
                  name: userData.firstName || userData.name,
                  userType: (userData.userType === 'icar' ? 'Icar' : 'Irepair') as 'Icar' | 'Irepair',
                };
                setUser(normalizedUser);
                AsyncStorage.setItem(USER_KEY, JSON.stringify(normalizedUser));
              } else {
                // Fallback if profile fetch fails
                setUser({
                  id: 'unknown',
                  _id: 'unknown',
                  email: 'unknown',
                  userType: 'Icar',
                });
              }
            })
            .catch(() => {
              // Fallback if profile fetch fails
              setUser({
                id: 'unknown',
                _id: 'unknown',
                email: 'unknown',
                userType: 'Icar',
              });
            });
        } catch {
          // Fallback if profile fetch fails
          setUser({
            id: 'unknown',
            _id: 'unknown',
            email: 'unknown',
            userType: 'Icar',
          });
        }
      }
    } catch (error) {
      console.error('Error loading stored auth:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const login = async (newToken: string, newUser: AuthUser) => {
    try {
      await Promise.all([
        AsyncStorage.setItem(TOKEN_KEY, newToken),
        AsyncStorage.setItem(USER_KEY, JSON.stringify(newUser)),
      ]);
      
      setToken(newToken);
      setUser(newUser);
    } catch (error) {
      console.error('Error storing auth data:', error);
      throw error;
    }
  };

  const logout = async () => {
    try {
      await Promise.all([
        AsyncStorage.removeItem(TOKEN_KEY),
        AsyncStorage.removeItem(USER_KEY),
      ]);
      
      setToken(null);
      setUser(null);
    } catch (error) {
      console.error('Error removing auth data:', error);
      throw error;
    }
  };

  const updateUser = async (updatedUser: AuthUser) => {
    try {
      await AsyncStorage.setItem(USER_KEY, JSON.stringify(updatedUser));
      setUser(updatedUser);
    } catch (error) {
      console.error('Error updating user data:', error);
      throw error;
    }
  };

  const value: AuthContextType = {
    user,
    token,
    isLoading,
    login,
    logout,
    updateUser,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
