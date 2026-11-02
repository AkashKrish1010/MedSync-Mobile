export type UserRole = "patient" | "doctor" | "admin" | "onboarding" | "auth";

export type PatientTab = "home" | "visits" | "records" | "profile";
export type DoctorTab = "home" | "visits" | "patients" | "profile";
export type AdminTab = "home" | "doctors" | "visits" | "patients" | "profile";

export interface BiomarkerDetail {
  name: string;
  value: string;
  status: string;
  reference: string;
}

export interface Doctor {
  id: string;
  name: string;
  specialty: string;
  avatar: string;
  rating: number;
  reviewsCount: number;
  licenseId: string;
  experience?: string;
  email?: string;
  hospital?: string;
  availableToday?: boolean;
}

export interface Patient {
  id: string;
  uhid: string;
  name: string;
  email: string;
  phone: string;
  avatar: string;
  status: "Active" | "AI Flagged" | "Inactive";
  height: string;
  weight: string;
  allergies: string;
}

export interface Appointment {
  id: string;
  doctorName: string;
  doctorSpecialty: string;
  doctorAvatar: string;
  patientName: string;
  patientAvatar: string;
  time: string;
  date: string;
  status: "Confirmed" | "Pending Approval" | "Live Chat" | "Cancelled";
  location?: string;
  type?: "In-Clinic" | "Live Chat" | "Telehealth";
}

export interface SystemLog {
  id: string;
  type: "success" | "warning" | "info" | "error";
  message: string;
  time: string;
  icon: string;
}

export interface AnalysisResult {
  title: string;
  isOptimal: boolean;
  biomarkers: { name: string; value: string; status: string; reference: string }[];
  summary: string;
  recommendations: string;
}

export interface AuthUserProfile {
  id: string;
  name: string;
  email: string;
  role: "patient" | "doctor" | "admin";
  uhid: string;
  phone?: string;
  avatar?: string;
  emergencyContact?: string;
  height?: string;
  weight?: string;
  bloodType?: string;
  allergies?: string;
  createdAt?: string;
  specialty?: string;
  profilePhotoUrl?: string;
  hospital?: string;
  licenseId?: string;
  experience?: string;
  rating?: number;
  reviewsCount?: number;
}
