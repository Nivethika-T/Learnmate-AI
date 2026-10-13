const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || "http://localhost:8000/api";

function getAuthHeaders() {
  const token = localStorage.getItem("learnmate_token");
  return {
    "Content-Type": "application/json",
    ...(token ? { Authorization: `Bearer ${token}` } : {})
  };
}

export const api = {
  // Auth
  async login(username, password) {
    const res = await fetch(`${API_BASE_URL}/auth/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ username, password })
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({ detail: "Login failed" }));
      throw new Error(err.detail || "Invalid credentials");
    }
    return res.json();
  },

  async register(username, email, password, full_name) {
    const res = await fetch(`${API_BASE_URL}/auth/register`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ username, email, password, full_name })
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({ detail: "Registration failed" }));
      throw new Error(err.detail || "Registration failed");
    }
    return res.json();
  },

  async demoLogin() {
    const res = await fetch(`${API_BASE_URL}/auth/demo`, {
      method: "POST"
    });
    if (!res.ok) throw new Error("Demo login failed");
    return res.json();
  },

  async getMe() {
    const res = await fetch(`${API_BASE_URL}/auth/me`, {
      headers: getAuthHeaders()
    });
    if (!res.ok) throw new Error("Session expired");
    return res.json();
  },

  // Resources
  async getResources() {
    const res = await fetch(`${API_BASE_URL}/resources`, {
      headers: getAuthHeaders()
    });
    if (!res.ok) throw new Error("Failed to fetch resources");
    return res.json();
  },

  async uploadResource(file, title) {
    const token = localStorage.getItem("learnmate_token");
    const formData = new FormData();
    formData.append("file", file);
    if (title) formData.append("title", title);

    const res = await fetch(`${API_BASE_URL}/resources/upload`, {
      method: "POST",
      headers: {
        ...(token ? { Authorization: `Bearer ${token}` } : {})
      },
      body: formData
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({ detail: "Upload failed" }));
      throw new Error(err.detail || "Upload failed");
    }
    return res.json();
  },

  async addYouTubeResource(url, title, manual_transcript) {
    const res = await fetch(`${API_BASE_URL}/resources/youtube`, {
      method: "POST",
      headers: getAuthHeaders(),
      body: JSON.stringify({ url, title, manual_transcript })
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({ detail: "YouTube processing failed" }));
      throw new Error(err.detail || "Failed to process video");
    }
    return res.json();
  },

  async getResourceChunks(resourceId) {
    const res = await fetch(`${API_BASE_URL}/resources/${resourceId}/chunks`, {
      headers: getAuthHeaders()
    });
    if (!res.ok) throw new Error("Failed to fetch resource chunks");
    return res.json();
  },

  async deleteResource(resourceId) {
    const res = await fetch(`${API_BASE_URL}/resources/${resourceId}`, {
      method: "DELETE",
      headers: getAuthHeaders()
    });
    if (!res.ok) throw new Error("Failed to delete resource");
    return res.json();
  },

  // Chat
  async getConversations() {
    const res = await fetch(`${API_BASE_URL}/chat/conversations`, {
      headers: getAuthHeaders()
    });
    if (!res.ok) throw new Error("Failed to fetch conversations");
    return res.json();
  },

  async getConversation(id) {
    const res = await fetch(`${API_BASE_URL}/chat/conversations/${id}`, {
      headers: getAuthHeaders()
    });
    if (!res.ok) throw new Error("Failed to fetch conversation");
    return res.json();
  },

  async sendMessage(message, conversationId = null, resourceId = null, mode = "study_tutor", requestHintOnly = false) {
    const res = await fetch(`${API_BASE_URL}/chat`, {
      method: "POST",
      headers: getAuthHeaders(),
      body: JSON.stringify({
        message,
        conversation_id: conversationId,
        resource_id: resourceId,
        mode,
        request_hint_only: requestHintOnly
      })
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({ detail: "Message failed" }));
      throw new Error(err.detail || "Failed to send message");
    }
    return res.json();
  },

  // Quizzes
  async generateQuiz(topic, difficulty, questionCount = 5, resourceId = null) {
    const res = await fetch(`${API_BASE_URL}/quizzes/generate`, {
      method: "POST",
      headers: getAuthHeaders(),
      body: JSON.stringify({
        topic,
        difficulty,
        question_count: questionCount,
        resource_id: resourceId
      })
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({ detail: "Quiz generation failed" }));
      throw new Error(err.detail || "Failed to generate quiz");
    }
    return res.json();
  },

  async getQuiz(id) {
    const res = await fetch(`${API_BASE_URL}/quizzes/${id}`, {
      headers: getAuthHeaders()
    });
    if (!res.ok) throw new Error("Failed to fetch quiz");
    return res.json();
  },

  async submitQuizAnswer(quizId, questionId, selectedOptionIndex, timeTakenSeconds = 10) {
    const res = await fetch(`${API_BASE_URL}/quizzes/${quizId}/submit`, {
      method: "POST",
      headers: getAuthHeaders(),
      body: JSON.stringify({
        question_id: questionId,
        selected_option_index: selectedOptionIndex,
        time_taken_seconds: timeTakenSeconds
      })
    });
    if (!res.ok) throw new Error("Failed to submit answer");
    return res.json();
  },

  async getQuizHistory() {
    const res = await fetch(`${API_BASE_URL}/quizzes/history`, {
      headers: getAuthHeaders()
    });
    if (!res.ok) throw new Error("Failed to fetch quiz history");
    return res.json();
  },

  // Dashboard & Learning Path
  async getDashboard() {
    const res = await fetch(`${API_BASE_URL}/dashboard`, {
      headers: getAuthHeaders()
    });
    if (!res.ok) throw new Error("Failed to load dashboard");
    return res.json();
  },

  async getLearningPath() {
    const res = await fetch(`${API_BASE_URL}/learning-path`, {
      headers: getAuthHeaders()
    });
    if (!res.ok) throw new Error("Failed to load learning path");
    return res.json();
  },

  async completeRecommendation(recId) {
    const res = await fetch(`${API_BASE_URL}/learning-path/recommendations/${recId}/complete`, {
      method: "POST",
      headers: getAuthHeaders()
    });
    if (!res.ok) throw new Error("Failed to complete recommendation");
    return res.json();
  }
};
