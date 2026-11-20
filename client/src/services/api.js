const API_URL = import.meta.env.VITE_API_URL || "http://localhost:5001/api";

const apiRequest = async (endpoint, options = {}) => {
  const { method = "GET", body, token } = options;

  const headers = { "Content-Type": "application/json" };

  if (token) {
    headers.Authorization = `Bearer ${token}`;
  }

  const response = await fetch(`${API_URL}${endpoint}`, {
    method,
    headers,
    ...(body !== undefined && {
      body: JSON.stringify(body)
    })
  });

  const data = await response.json().catch(() => ({}));

  if (!response.ok) {
    throw new Error(data.message || "Something went wrong. Please try again.");
  }
  return data;
};

export default apiRequest;