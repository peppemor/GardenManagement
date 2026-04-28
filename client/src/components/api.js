const API_BASE = "http://localhost:4000/api";
const AUTH_STORAGE_KEY = "auth";
const AUTH_CHANGED_EVENT = "auth-changed";

function notifyAuthChanged() {
  window.dispatchEvent(new CustomEvent(AUTH_CHANGED_EVENT));
}

export function subscribeAuthChange(listener) {
  window.addEventListener(AUTH_CHANGED_EVENT, listener);
  window.addEventListener("storage", listener);

  return () => {
    window.removeEventListener(AUTH_CHANGED_EVENT, listener);
    window.removeEventListener("storage", listener);
  };
}

export function getAuth() {
  try {
    const raw = localStorage.getItem(AUTH_STORAGE_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch {
    // If browser storage contains invalid JSON, clear it to avoid app boot crash.
    localStorage.removeItem(AUTH_STORAGE_KEY);
    return null;
  }
}

export function setAuth(data) {
  try {
    localStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(data));
    notifyAuthChanged();
  } catch {
    // Ignore storage write errors (quota/privacy mode), app can still work in-memory.
  }
}

export function clearAuth() {
  try {
    localStorage.removeItem(AUTH_STORAGE_KEY);
    notifyAuthChanged();
  } catch {
    // Ignore storage clear errors to avoid breaking logout flow.
  }
}

export async function apiFetch(path, options = {}) {
  const auth = getAuth();
  const headers = {
    "Content-Type": "application/json",
    ...(options.headers || {})
  };

  if (auth?.token) {
    headers.Authorization = `Bearer ${auth.token}`;
  }

  const response = await fetch(`${API_BASE}${path}`, {
    ...options,
    headers
  });

  const contentType = response.headers.get("content-type") || "";
  const data = contentType.includes("application/json")
    ? await response.json()
    : await response.text();

  if (response.status === 401) {
    // Session expired only makes sense for authenticated requests.
    if (auth?.token) {
      clearAuth();
      window.location.href = "/login?sessionExpired=1";
      return;
    }

    throw new Error(data?.message || "Credenziali non valide");
  }

  if (!response.ok) {
    throw new Error(data?.message || `Errore API (${response.status})`);
  }

  return data;
}
