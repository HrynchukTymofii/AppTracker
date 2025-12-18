import React, { createContext, useContext, useState, useEffect } from "react";
import * as SecureStore from "expo-secure-store";

interface AuthContextType {
  token: string | null;
  setToken: (token: string | null) => void;
  user: UserType | null;
  setUser: (user: UserType | null) => void;
}

const AuthContext = createContext<AuthContextType>({
  token: null,
  setToken: () => {},
  user: { name: "", isPro: false, categories: "Beginner", points: 0, createdAt: '' },
  setUser: () => {},
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

  useEffect(() => {
    const loadAuthData = async () => {
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
        }
      }
    };
    loadAuthData();
  }, []);

  const setToken = async (newToken: string | null) => {
    setTokenState(newToken);
    if (newToken) {
      await SecureStore.setItemAsync("token", newToken);
    } else {
      await SecureStore.deleteItemAsync("token");
    }
  };

  const setUser = async (newUser: UserType | null) => {
    setUserState(newUser);
    if (newUser) {
      await SecureStore.setItemAsync("user", JSON.stringify(newUser));
    } else {
      await SecureStore.deleteItemAsync("user");
    }
  };

  return (
    <AuthContext.Provider value={{ token, setToken, user, setUser }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
