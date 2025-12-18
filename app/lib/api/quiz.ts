import api from "../axios";

export const fetchQuizzesByTopic = async (token: string) => {
  try {
    const res = await api.get("/user/course/quiz", {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });

    return { success: true, quizzes: res.data };
  } catch (error: any) {
    console.error("❌ Failed to fetch quizzes:", error.response?.data || error.message);
    return {
      success: false,
      error: error.response?.data?.error || "Something went wrong",
    };
  }
};

export const fetchQuizById = async (quizId: string, token: string) => {
  try {
    const res = await api.get(`/user/course/quiz/${quizId}/quizResult`, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });

    return {
      success: true,
      quiz: res.data.quiz,
      latestResult: res.data.latestResult ?? null,
      nextTopicUrl: res.data.nextTopicUrl ?? null
    };
  } catch (error: any) {
    console.error("❌ Failed to fetch quiz:", error.response?.data || error.message);
    return {
      success: false,
      error: error.response?.data?.error || "Something went wrong",
    };
  }
};

export async function fetchWrongQuizzes(token: string) {
  try {
    const res = await api.get(`user/course/quiz/wrong`, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });

    return res.data;
  } catch (error: any) {
    console.error("❌ Failed to fetch quizzes:", error.response?.data || error.message);
    return {
      success: false,
      error: error.response?.data?.error || "Something went wrong",
    };
  }
}

export async function fetchSavedQuizzes(token: string) {
  try {
    const res = await api.get(`user/course/quiz/saved`, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });

    return res.data;
  } catch (error: any) {
    console.error("❌ Failed to fetch saved quizzes:", error.response?.data || error.message);
    return {
      success: false,
      error: error.response?.data?.error || "Something went wrong",
    };
  }
}


export async function fetchExamQuestions() {
  try {
    const res = await api.get('user/course/quiz/exam'); 

    return res.data;
  } catch (error: any) {
    console.error("❌ Failed to fetch exam questions:", error.response?.data || error.message);
    return {
      success: false,
      error: error.response?.data?.error || "Something went wrong",
    };
  }
}

export async function fetchWrongQuestions(token: string, quizId: string) {
  try {
    const res = await api.get(`/user/course/quiz/wrong/${quizId}`, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });

    return res.data;
  } catch (error: any) {
    console.error("❌ Failed to fetch wrong questions:", error.response?.data || error.message);
    return {
      success: false,
      error: error.response?.data?.error || "Something went wrong",
    };
  }
}

export async function fetchSavedQuestions(token: string, quizId: string) {
  try {
    const res = await api.get(`/user/course/quiz/saved/${quizId}`, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });

    return res.data;
  } catch (error: any) {
    console.error("❌ Failed to fetch saved questions:", error.response?.data || error.message);
    return {
      success: false,
      error: error.response?.data?.error || "Something went wrong",
    };
  }
}


export async function submitQuizAnswers(
  token: string,
  quizId: string,
  answers: Record<string, string[]>,
  method: "POST" | "PATCH" = "POST"
) {
  try {
    const res = await api({
      url: "/user/course/quiz",
      method,
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
      data: {
        quizId,
        answers,
      },
    });

    return res.data;
  } catch (error: any) {
    console.error("❌ Failed to submit quiz answers:", error.response?.data || error.message);
    return {
      success: false,
      error: error.response?.data?.error || "Something went wrong",
    };
  }
}

export async function saveQuestion(token: string, questionId: string) {
  try {
    const res = await api.post(
      "/user/course/quiz/question/save",
      { questionId },
      {
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      }
    );

    return res.data.saved;
  } catch (error: any) {
    console.error("❌ Failed to toggle save question:", error.response?.data || error.message);
    return null;
  }
}


export async function resetQuiz(token: string, quizId: string) {
  try {
    const res = await api.delete(`user/course/quiz`, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
      data: {
        quizId,
      },
    });

    return res.data;
  } catch (error: any) {
    console.error("❌ Failed to reset quiz:", error.response?.data || error.message);
    return {
      success: false,
      error: error.response?.data?.error || "Something went wrong",
    };
  }
}

export async function updateUserPoints(token: string, totalPoints: number): Promise<boolean> {
  try {
    await api.post(
      "/user/update-points",
      { points: totalPoints },
      {
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      }
    );

    return true;
  } catch (error: any) {
    console.error("❌ Failed to update user points:", error.response?.data || error.message);
    return false;
  }
}

export async function checkForQuizUpdates(token: string, localUpdatedAt: Record<string, string>) {
  try {
    const res = await api.post("/user/course/quiz/updates", 
      { localUpdatedAt }, 
      {
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
    });

    return res.data;
  } catch (error: any) {
    console.error("❌ Failed to check for quiz updates:", error.response?.data || error.message);
    return null;
  }
}

export async function checkAppNeedSync() {
  try {
    const res = await api.get(`/apps`);

    return res.data; // { app: { name, needSync } }
  } catch (error: any) {
    console.error(
      "❌ Failed to fetch app needSync status:",
      error.response?.data || error.message
    );
    return null;
  }
}



