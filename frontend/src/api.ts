// API client for NammaRoad
import AsyncStorage from "@react-native-async-storage/async-storage";

const BASE = process.env.EXPO_PUBLIC_BACKEND_URL;

export type User = {
  id: string;
  name: string;
  phone: string;
  role: "citizen" | "engineer" | "admin";
  token: string;
  created_at: string;
};

export type Pothole = {
  id: string;
  reported_by: string;
  reporter_name?: string;
  photo_base64: string;
  after_photo_base64?: string | null;
  latitude: number;
  longitude: number;
  address: string;
  zone: string;
  ward_name: string;
  road_name: string;
  landmark: string;
  severity: "low" | "medium" | "high" | "critical";
  description: string;
  status: "reported" | "verified" | "assigned" | "work_started" | "fixed";
  upvotes: number;
  upvoted_by: string[];
  assigned_to?: string | null;
  created_at: string;
  updated_at: string;
  is_duplicate_of?: string | null;
};

export type StatusUpdate = {
  id: string;
  pothole_id: string;
  updated_by: string;
  updated_by_name: string;
  old_status: string | null;
  new_status: string;
  comment: string;
  after_photo_base64?: string | null;
  timestamp: string;
};

async function getToken(): Promise<string | null> {
  return AsyncStorage.getItem("nr_token");
}

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const token = await getToken();
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    ...((init?.headers as Record<string, string>) || {}),
  };
  if (token) headers["Authorization"] = `Bearer ${token}`;
  const res = await fetch(`${BASE}/api${path}`, { ...init, headers });
  if (!res.ok) {
    const t = await res.text();
    throw new Error(`API ${res.status}: ${t}`);
  }
  return res.json() as Promise<T>;
}

export const api = {
  login: (name: string, phone: string, role: string) =>
    request<User>("/auth/login", {
      method: "POST",
      body: JSON.stringify({ name, phone, role }),
    }),
  me: () => request<User>("/auth/me"),
  listPotholes: (params?: { status?: string; zone?: string; mine?: boolean }) => {
    const qp = new URLSearchParams();
    if (params?.status) qp.set("status", params.status);
    if (params?.zone) qp.set("zone", params.zone);
    if (params?.mine) qp.set("mine", "true");
    const q = qp.toString();
    return request<Pothole[]>(`/potholes${q ? `?${q}` : ""}`);
  },
  getPothole: (id: string) => request<Pothole>(`/potholes/${id}`),
  createPothole: (body: Partial<Pothole> & { photo_base64: string }) =>
    request<Pothole>("/potholes", { method: "POST", body: JSON.stringify(body) }),
  updateStatus: (id: string, payload: { new_status: string; comment?: string; after_photo_base64?: string }) =>
    request<Pothole>(`/potholes/${id}/status`, { method: "PATCH", body: JSON.stringify(payload) }),
  statusHistory: (id: string) => request<StatusUpdate[]>(`/potholes/${id}/status-history`),
  upvote: (id: string) => request<{ upvotes: number; already: boolean }>(`/potholes/${id}/upvote`, { method: "POST" }),
  analytics: () =>
    request<{
      total: number;
      fixed: number;
      pending: number;
      fix_rate: number;
      by_status: Record<string, number>;
      zone_stats: { zone: string; total: number; fixed: number; pending: number }[];
    }>("/analytics"),
  seed: () => request<any>("/seed", { method: "POST" }),
};

export const auth = {
  saveSession: async (user: User) => {
    await AsyncStorage.setItem("nr_token", user.token);
    await AsyncStorage.setItem("nr_user", JSON.stringify(user));
  },
  getUser: async (): Promise<User | null> => {
    const raw = await AsyncStorage.getItem("nr_user");
    return raw ? JSON.parse(raw) : null;
  },
  signOut: async () => {
    await AsyncStorage.multiRemove(["nr_token", "nr_user"]);
  },
};
