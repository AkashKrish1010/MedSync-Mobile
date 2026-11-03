// ─── API Configuration ────────────────────────────────────────────────────────
// Override with EXPO_PUBLIC_BACKEND_URL in .env (required for some physical devices).
// Otherwise we infer your dev machine IP from Expo, or use Android emulator host.

import { Platform } from "react-native";

function inferDevHost(): string | null {
  try {
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    const Constants = require("expo-constants");
    const c = Constants?.default || Constants;
    const hostUri = c?.expoConfig?.hostUri ?? c?.expoGoConfig?.debuggerHost ?? null;
    if (!hostUri || typeof hostUri !== "string") return null;
    const host = hostUri.split(":")[0];
    if (!host || host === "localhost" || host === "127.0.0.1") return null;
    return host;
  } catch {
    return null;
  }
}

function resolveBackendUrl(): string {
  const fromEnv = process.env.EXPO_PUBLIC_BACKEND_URL?.replace(/\/$/, "");
  if (fromEnv) return fromEnv;

  const devHost = inferDevHost();
  if (devHost) return `http://${devHost}:3001`;

  if (Platform.OS === "android") {
    return "http://10.0.2.2:3001";
  }

  return "http://localhost:3001";
}

const BACKEND_URL = resolveBackendUrl();
const WS_URL = BACKEND_URL.replace(/^http/, "ws") + "/ws/chat";

export const Config = {
  backendUrl: BACKEND_URL,
  wsChatUrl: WS_URL,
  apiChatRoom: (room: string) => `${BACKEND_URL}/api/chat/${encodeURIComponent(room)}`,
  apiAnalyze: `${BACKEND_URL}/api/analyze`,
  apiAnalyzeFile: `${BACKEND_URL}/api/analyze-file`,
  apiHealth: `${BACKEND_URL}/api/health`,
  apiLogin: `${BACKEND_URL}/api/auth/login`,
  apiRegister: `${BACKEND_URL}/api/auth/register`,
  apiAuthMe: `${BACKEND_URL}/api/auth/me`,
  apiDoctors: `${BACKEND_URL}/api/doctors`,
  apiDoctorPhoto: (id: string) => `${BACKEND_URL}/api/doctors/${encodeURIComponent(id)}/photo`,
  apiDoctorProfile: (id: string) => `${BACKEND_URL}/api/doctors/${encodeURIComponent(id)}/profile`,
  apiDoctorSchedule: (doctorId: string) => `${BACKEND_URL}/api/doctors/${encodeURIComponent(doctorId)}/schedule`,
  apiDoctorPatients: (doctorId: string) => `${BACKEND_URL}/api/doctors/${encodeURIComponent(doctorId)}/patients`,
  apiAdminAddDoctor: `${BACKEND_URL}/api/admin/doctors`,
  apiAdminDeleteDoctor: (id: string) => `${BACKEND_URL}/api/admin/doctors/${id}`,
  apiAdminOverview: `${BACKEND_URL}/api/admin/overview`,
  apiAdminProfile: `${BACKEND_URL}/api/admin/profile`,
  apiAdminChangePassword: `${BACKEND_URL}/api/admin/change-password`,
  apiPatientMedications: (uhid: string) =>
    `${BACKEND_URL}/api/patients/${encodeURIComponent(uhid)}/medications`,
  apiPatientMedicationTaken: (uhid: string, medId: string) =>
    `${BACKEND_URL}/api/patients/${encodeURIComponent(uhid)}/medications/${encodeURIComponent(medId)}`,
  apiPatientAppointments: (uhid: string) =>
    `${BACKEND_URL}/api/patients/${encodeURIComponent(uhid)}/appointments`,
  apiPatientNextAppointment: (uhid: string) =>
    `${BACKEND_URL}/api/patients/${encodeURIComponent(uhid)}/appointments/next`,
  apiPatientCancelAppointment: (uhid: string, appointmentId: string) =>
    `${BACKEND_URL}/api/patients/${encodeURIComponent(uhid)}/appointments/${encodeURIComponent(appointmentId)}/cancel`,
  apiCancelAppointment: (appointmentId: string) =>
    `${BACKEND_URL}/api/appointments/${encodeURIComponent(appointmentId)}/cancel`,
  apiPatientRecords: (uhid: string) =>
    `${BACKEND_URL}/api/patients/${encodeURIComponent(uhid)}/records`,
  apiPatientProfile: (uhid: string) =>
    `${BACKEND_URL}/api/patients/${encodeURIComponent(uhid)}/profile`,
  apiExplainRecord: `${BACKEND_URL}/api/records/explain`,
  apiPatientNotifications: (uhid: string) =>
    `${BACKEND_URL}/api/patients/${encodeURIComponent(uhid)}/notifications`,
  apiPatientNotificationsRead: (uhid: string) =>
    `${BACKEND_URL}/api/patients/${encodeURIComponent(uhid)}/notifications/read`,
} as const;
