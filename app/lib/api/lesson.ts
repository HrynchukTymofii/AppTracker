import api from "../axios";

export const markLessonAsDone = async (token: string, lessonId: string) => {
  try {
    const res = await api.post(`/user/course/lesson/${lessonId}/mark-done`, {}, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });

    return {
      success: true,
      data: res.data,
    };
  } catch (error: any) {
    console.error(
      "❌ Failed to mark lesson as done:",
      error.response?.data || error.message
    );
    return {
      success: false,
      error: error.response?.data?.error || "Something went wrong",
    };
  }
};

export const fetchLessonComments = async (lessonId: string) => {
  try {
    const res = await api.get(`/user/course/lesson/${lessonId}/comments`);
    return { success: true, data: res.data };
  } catch (error: any) {
    console.error("❌ Failed to fetch comments:", error.response?.data || error.message);
    return { success: false, error: error.response?.data?.error || "Something went wrong" };
  }
};

export const postLessonComment = async (
  token: string,
  lessonId: string,
  content: string,
  parentId?: string
) => {
  try {
    const res = await api.post(
      `/user/course/lesson/${lessonId}/comments`,
      { content, parentId },
      { headers: { Authorization: `Bearer ${token}` } }
    );
    return { success: true, data: res.data };
  } catch (error: any) {
    console.error("❌ Failed to post comment:", error.response?.data || error.message);
    return { success: false, error: error.response?.data?.error || "Something went wrong" };
  }
};
