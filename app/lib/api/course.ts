import api from "../axios";

export const fetchCourse = async () => {
  try {
    const res = await api.get("/course");

    return { success: true, data: res.data };
  } catch (error: any) {
    console.error("❌ Failed to fetch course:", error.response?.data || error.message);
    return {
      success: false,
      error: error.response?.data?.error || "Something went wrong",
    };
  }
};

export const fetchCourseWithProgress = async (token: string) => {
  try {
    const res = await api.get("/user/course", {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });

    return { success: true, data: res.data };
  } catch (error: any) {
    console.error("❌ Failed to fetch course:", error.response?.data || error.message);
    return {
      success: false,
      error: error.response?.data?.error || "Something went wrong",
    };
  }
};


export const fetchQuizWithResults = async (quizId: string, token: string) => {
  try {
    const res = await api.get(`/user/course/quiz/${quizId}/quizResult`, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });

    return { success: true, data: res.data };
  } catch (error: any) {
    console.error("❌ Failed to fetch quiz:", error.response?.data || error.message);
    return {
      success: false,
      error: error.response?.data?.error || "Something went wrong",
    };
  }
};
