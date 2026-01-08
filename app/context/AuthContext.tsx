import React, { createContext, useContext, useState, useEffect } from "react";
import * as SecureStore from "expo-secure-store";

interface AuthContextType {
  token: string | null;
  setToken: (token: string | null) => Promise<void>;
  user: UserType | null;
  setUser: (user: UserType | null) => Promise<void>;
  isLoading: boolean;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType>({
  token: null,
  setToken: async () => {},
  user: { name: "", isPro: false, categories: "Beginner", points: 0, createdAt: '' },
  setUser: async () => {},
  isLoading: true,
  logout: async () => {},
});

export interface UserType {
  name: string;
  isPro: boolean;
  categories: string;
  email?: string;
  image?: string;
  points: number;
  createdAt: string;
}

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [token, setTokenState] = useState<string | null>(null);
  const [user, setUserState] = useState<UserType | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const loadAuthData = async () => {
      try {
        const storedToken = await SecureStore.getItemAsync("token");
        const storedUser = await SecureStore.getItemAsync("user");

        if (storedToken) {
          setTokenState(storedToken);
        }
        if (storedUser) {
          try {
            setUserState(JSON.parse(storedUser));
          } catch (err) {
            console.error("Failed to parse stored user", err);
            // Clear corrupted user data
            await SecureStore.deleteItemAsync("user");
          }
        }
      } catch (error) {
        console.error("Failed to load auth data from SecureStore:", error);
        // SecureStore might fail in release builds - gracefully handle
      } finally {
        setIsLoading(false);
      }
    };
    loadAuthData();
  }, []);

  const setToken = async (newToken: string | null): Promise<void> => {
    try {
      setTokenState(newToken);
      if (newToken) {
        await SecureStore.setItemAsync("token", newToken);
      } else {
        await SecureStore.deleteItemAsync("token");
      }
    } catch (error) {
      console.error("Failed to save token to SecureStore:", error);
      // Still update state even if storage fails
    }
  };

  const setUser = async (newUser: UserType | null): Promise<void> => {
    try {
      setUserState(newUser);
      if (newUser) {
        await SecureStore.setItemAsync("user", JSON.stringify(newUser));
      } else {
        await SecureStore.deleteItemAsync("user");
      }
    } catch (error) {
      console.error("Failed to save user to SecureStore:", error);
      // Still update state even if storage fails
    }
  };

  // Proper logout function that clears everything
  const logout = async (): Promise<void> => {
    try {
      setTokenState(null);
      setUserState(null);
      await SecureStore.deleteItemAsync("token");
      await SecureStore.deleteItemAsync("user");
    } catch (error) {
      console.error("Failed to clear auth data:", error);
    }
  };

  return (
    <AuthContext.Provider value={{ token, setToken, user, setUser, isLoading, logout }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
