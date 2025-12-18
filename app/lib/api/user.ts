import api from "../axios";

export const getUserData = async (token: string) => {
  try {
    const res = await api.get("/user", {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });

    return { success: true, user: res.data };
  } catch (error: any) {
    console.error("❌ getUserData error:", error.response?.data || error.message);
    return {
      success: false,
      error: error.response?.data?.error || "Failed to fetch user data",
    };
  }
};

interface UpdateUserParams {
  name?: string;
  password?: string;
}

export const updateUser = async (token: string, data: UpdateUserParams) => {
  try {
    const res = await api.patch("/user/change-data", data, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });

    return { success: true, user: res.data };
  } catch (error: any) {
    console.error("❌ updateUser error:", error.response?.data || error.message);
    return {
      success: false,
      error: error.response?.data?.error || "Failed to update user",
    };
  }
};

export const upgradeToPro = async (token: string, plan: string) => {
  try {
    const res = await api.post(
      "/user/upgrade",
      { plan },
      {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      }
    );

    return { success: true, user: res.data };
  } catch (error: any) {
    console.error("❌ upgradeToPro error:", error.response?.data || error.message);
    return {
      success: false,
      error: error.response?.data?.error || "Failed to upgrade account",
    };
  }
};

export const removePro = async (token: string) => {
  try {
    const res = await api.patch(
      "/user/upgrade",
      {},
      {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      }
    );

    return { success: true, user: res.data };
  } catch (error: any) {
    console.error("❌ removePro error:", error.response?.data || error.message);
    return {
      success: false,
      error: error.response?.data?.error || "Failed to remove PRO status",
    };
  }
};




export const upgradeToSync = async (token: string) => {
  try {
    const res = await api.post(
      "/user/sync",
      {},
      {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      }
    );

    return { success: true, user: res.data };
  } catch (error: any) {
    console.error("❌ upgradeToSync error:", error.response?.data || error.message);
    return {
      success: false,
      error: error.response?.data?.error || "Failed to sync account",
    };
  }
};

export const sendMessage = async(token: string, topic: string, message: string) => {
  try {
    const res = await api.post(
      "/user/message",
      { topic, message },
      {
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      }
    );

    return true;
  } catch (error: any) {
    console.error("❌ Failed to send message:", error.response?.data || error.message);
    return false;
  }
}


export const deleteUserAccount = async (token: string) => {
  try {
    const res = await api.delete("/user", {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    })

    return { success: true }
  } catch (error: any) {
    console.error("❌ deleteUserAccount error:", error.response?.data || error.message)
    return {
      success: false,
      error: error.response?.data?.error || "Failed to delete account",
    }
  }
}