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

// Helper: SecureStore operation with timeout (prevents hanging)
const secureStoreWithTimeout = async <T,>(
  operation: () => Promise<T>,
  timeoutMs: number = 3000
): Promise<T | null> => {
  return Promise.race([
    operation(),
    new Promise<null>((resolve) => {
      setTimeout(() => {
        console.warn('[AuthContext] SecureStore operation timed out');
        resolve(null);
      }, timeoutMs);
    }),
  ]);
};

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [token, setTokenState] = useState<string | null>(null);
  const [user, setUserState] = useState<UserType | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const loadAuthData = async () => {
      try {
        // Use timeout to prevent hanging on SecureStore read
        const [storedToken, storedUser] = await Promise.all([
          secureStoreWithTimeout(() => SecureStore.getItemAsync("token")),
          secureStoreWithTimeout(() => SecureStore.getItemAsync("user")),
        ]);

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
      } catch (error) {
        console.error("Failed to load auth data from SecureStore:", error);
      } finally {
        setIsLoading(false);
      }
    };
    loadAuthData();
  }, []);

  const setToken = async (newToken: string | null): Promise<void> => {
    // IMPORTANT: Set state FIRST (this is what the app uses immediately)
    console.log('[AuthContext] setToken called, setting state immediately...');
    setTokenState(newToken);
    console.log('[AuthContext] state set, token is now available to app');

    // Save to SecureStore in background (non-blocking)
    // This ensures the app continues even if SecureStore is slow/broken
    (async () => {
      try {
        if (newToken) {
          await secureStoreWithTimeout(() => SecureStore.setItemAsync("token", newToken));
          console.log('[AuthContext] token saved to SecureStore (background)');
        } else {
          await secureStoreWithTimeout(() => SecureStore.deleteItemAsync("token"));
          console.log('[AuthContext] token deleted from SecureStore (background)');
        }
      } catch (error) {
        console.error("[AuthContext] Failed to save token to SecureStore:", error);
      }
    })();
  };

  const setUser = async (newUser: UserType | null): Promise<void> => {
    // Set state FIRST
    setUserState(newUser);

    // Save to SecureStore in background (non-blocking)
    (async () => {
      try {
        if (newUser) {
          await secureStoreWithTimeout(() => SecureStore.setItemAsync("user", JSON.stringify(newUser)));
        } else {
          await secureStoreWithTimeout(() => SecureStore.deleteItemAsync("user"));
        }
      } catch (error) {
        console.error("Failed to save user to SecureStore:", error);
      }
    })();
  };

  // Proper logout function that clears everything
  const logout = async (): Promise<void> => {
    // Clear state FIRST
    setTokenState(null);
    setUserState(null);

    // Clear SecureStore in background
    (async () => {
      try {
        await secureStoreWithTimeout(() => SecureStore.deleteItemAsync("token"));
        await secureStoreWithTimeout(() => SecureStore.deleteItemAsync("user"));
      } catch (error) {
        console.error("Failed to clear auth data:", error);
      }
    })();
  };

  return (
    <AuthContext.Provider value={{ token, setToken, user, setUser, isLoading, logout }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
