const API_URL = import.meta.env.VITE_API_URL || "http://localhost:4000/api";

export async function api(path, options = {}) {
  const response = await fetch(`${API_URL}${path}`, {
    ...options,
    credentials: "include",
    headers: {
      ...(options.body ? { "Content-Type": "application/json" } : {}),
      ...options.headers
    }
  });
  const data = response.status === 204 ? {} : await response.json();
  if (!response.ok) {
    const error = new Error(data.message || "No fue posible completar la solicitud.");
    error.status = response.status;
    throw error;
  }
  return data;
}
