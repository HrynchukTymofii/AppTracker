import React, { createContext, useContext, useState, useEffect, useCallback } from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useAuth } from "./AuthContext";
import { getTodayUsageStats } from "@/lib/usageTracking";

const GROUP_STORAGE_KEY = "@group_data";
const MEMBERS_STORAGE_KEY = "@group_members";

export interface GroupMember {
  id: string;
  name: string;
  avatar?: string;
  isPro: boolean;
  screenTime: number; // in milliseconds
  streak: number; // in days
  focusHours: number; // in hours
  lastUpdated: number;
}

export interface Group {
  id: string;
  name: string;
  inviteCode: string;
  createdAt: number;
  ownerId: string;
}

interface GroupContextType {
  currentGroup: Group | null;
  members: GroupMember[];
  loading: boolean;
  createGroup: (name: string) => Promise<Group>;
  joinGroup: (inviteCode: string) => Promise<boolean>;
  leaveGroup: () => Promise<void>;
  refreshGroup: () => Promise<void>;
  updateMyStats: () => Promise<void>;
}

const GroupContext = createContext<GroupContextType>({
  currentGroup: null,
  members: [],
  loading: true,
  createGroup: async () => ({} as Group),
  joinGroup: async () => false,
  leaveGroup: async () => {},
  refreshGroup: async () => {},
  updateMyStats: async () => {},
});

// Generate a random invite code
const generateInviteCode = (): string => {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  let code = "";
  for (let i = 0; i < 6; i++) {
    code += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return code;
};

// Generate simulated members for demo purposes
const generateSimulatedMembers = (currentUser: GroupMember): GroupMember[] => {
  const names = [
    { name: "Alex", isPro: true },
    { name: "Sally", isPro: false },
    { name: "Olivia98", isPro: true },
    { name: "Marcus", isPro: false },
    { name: "Emma", isPro: true },
    { name: "Jake", isPro: false },
    { name: "Sofia", isPro: true },
    { name: "Liam", isPro: false },
  ];

  const simulatedMembers: GroupMember[] = names.slice(0, 5).map((data, index) => ({
    id: `simulated_${index}`,
    name: data.name,
    isPro: data.isPro,
    screenTime: Math.floor(Math.random() * 4 * 60 * 60 * 1000) + 30 * 60 * 1000, // 30min - 4.5h
    streak: Math.floor(Math.random() * 30) + 1,
    focusHours: Math.round((Math.random() * 5 + 0.5) * 10) / 10, // 0.5 - 5.5h
    lastUpdated: Date.now(),
  }));

  return [currentUser, ...simulatedMembers];
};

export const GroupProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user } = useAuth();
  const [currentGroup, setCurrentGroup] = useState<Group | null>(null);
  const [members, setMembers] = useState<GroupMember[]>([]);
  const [loading, setLoading] = useState(true);

  // Load group data from storage
  const loadGroupData = useCallback(async () => {
    try {
      setLoading(true);
      const groupData = await AsyncStorage.getItem(GROUP_STORAGE_KEY);
      const membersData = await AsyncStorage.getItem(MEMBERS_STORAGE_KEY);

      if (groupData) {
        setCurrentGroup(JSON.parse(groupData));
      }

      if (membersData) {
        setMembers(JSON.parse(membersData));
      }
    } catch (error) {
      console.error("Error loading group data:", error);
    } finally {
      setLoading(false);
    }
  }, []);

  // Update current user's stats
  const updateMyStats = useCallback(async () => {
    if (!user) return;

    try {
      const usageStats = await getTodayUsageStats();

      const myMember: GroupMember = {
        id: user.email || "current_user",
        name: user.name || "Me",
        avatar: user.image,
        isPro: user.isPro,
        screenTime: usageStats.totalScreenTime,
        streak: 7, // TODO: Calculate from historical data
        focusHours: 2.5, // TODO: Calculate from detox sessions
        lastUpdated: Date.now(),
      };

      setMembers((prev) => {
        const filtered = prev.filter((m) => m.id !== myMember.id);
        const updated = [myMember, ...filtered];
        AsyncStorage.setItem(MEMBERS_STORAGE_KEY, JSON.stringify(updated));
        return updated;
      });
    } catch (error) {
      console.error("Error updating stats:", error);
    }
  }, [user]);

  // Create a new group
  const createGroup = useCallback(
    async (name: string): Promise<Group> => {
      const newGroup: Group = {
        id: `group_${Date.now()}`,
        name,
        inviteCode: generateInviteCode(),
        createdAt: Date.now(),
        ownerId: user?.email || "current_user",
      };

      await AsyncStorage.setItem(GROUP_STORAGE_KEY, JSON.stringify(newGroup));
      setCurrentGroup(newGroup);

      // Create current user as member
      const myMember: GroupMember = {
        id: user?.email || "current_user",
        name: user?.name || "Me",
        avatar: user?.image,
        isPro: user?.isPro || false,
        screenTime: 0,
        streak: 0,
        focusHours: 0,
        lastUpdated: Date.now(),
      };

      // Add simulated members for demo
      const allMembers = generateSimulatedMembers(myMember);
      await AsyncStorage.setItem(MEMBERS_STORAGE_KEY, JSON.stringify(allMembers));
      setMembers(allMembers);

      // Update with real stats
      await updateMyStats();

      return newGroup;
    },
    [user, updateMyStats]
  );

  // Join an existing group
  const joinGroup = useCallback(
    async (inviteCode: string): Promise<boolean> => {
      // In a real app, this would validate the code with a backend
      // For now, we'll simulate joining any group with a valid-looking code
      if (inviteCode.length !== 6) {
        return false;
      }

      const newGroup: Group = {
        id: `group_${Date.now()}`,
        name: "The Focused Few",
        inviteCode: inviteCode.toUpperCase(),
        createdAt: Date.now() - 7 * 24 * 60 * 60 * 1000, // Simulated: created 7 days ago
        ownerId: "other_user",
      };

      await AsyncStorage.setItem(GROUP_STORAGE_KEY, JSON.stringify(newGroup));
      setCurrentGroup(newGroup);

      // Create current user as member
      const myMember: GroupMember = {
        id: user?.email || "current_user",
        name: user?.name || "Me",
        avatar: user?.image,
        isPro: user?.isPro || false,
        screenTime: 0,
        streak: 0,
        focusHours: 0,
        lastUpdated: Date.now(),
      };

      // Add simulated members for demo
      const allMembers = generateSimulatedMembers(myMember);
      await AsyncStorage.setItem(MEMBERS_STORAGE_KEY, JSON.stringify(allMembers));
      setMembers(allMembers);

      // Update with real stats
      await updateMyStats();

      return true;
    },
    [user, updateMyStats]
  );

  // Leave current group
  const leaveGroup = useCallback(async () => {
    await AsyncStorage.removeItem(GROUP_STORAGE_KEY);
    await AsyncStorage.removeItem(MEMBERS_STORAGE_KEY);
    setCurrentGroup(null);
    setMembers([]);
  }, []);

  // Refresh group data
  const refreshGroup = useCallback(async () => {
    await updateMyStats();
    // In a real app, this would also fetch updated data from the backend
  }, [updateMyStats]);

  // Initial load
  useEffect(() => {
    loadGroupData();
  }, [loadGroupData]);

  // Update stats when user changes
  useEffect(() => {
    if (user && currentGroup) {
      updateMyStats();
    }
  }, [user, currentGroup, updateMyStats]);

  return (
    <GroupContext.Provider
      value={{
        currentGroup,
        members,
        loading,
        createGroup,
        joinGroup,
        leaveGroup,
        refreshGroup,
        updateMyStats,
      }}
    >
      {children}
    </GroupContext.Provider>
  );
};

export const useGroup = () => useContext(GroupContext);
