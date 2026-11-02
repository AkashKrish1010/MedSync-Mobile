/** Demo seed data — doctors come from the backend API; schedules & samples live here. */

export const BOOKING_TIME_SLOTS = [
  "Tomorrow 10:00 AM",
  "Tomorrow 2:30 PM",
  "Thu 11:00 AM",
];

export const SEED_MEDICATIONS = [
  {
    id: "med-1",
    name: "Atorvastatin Calcium",
    dosage: "20 mg",
    instructions: "Take 1 tablet at bedtime",
    timeSlot: "9:00 PM",
    taken: false,
    purpose: "Lipid & Plaque Stabilization",
  },
  {
    id: "med-2",
    name: "Metformin HCl",
    dosage: "500 mg",
    instructions: "Take 1 tablet with meal",
    timeSlot: "Taken · 8:30 AM",
    taken: true,
    purpose: "Glycemic Stability",
  },
];

export interface DoctorDayAppointment {
  id: string;
  name: string;
  age: number;
  time: string;
  type: "In-Clinic" | "Live Chat Consultation";
  status: string;
  initials: string;
  complaint: string;
}

export const DOCTOR_DAY_SCHEDULE: DoctorDayAppointment[] = [
  {
    id: "1",
    name: "Sarah Jenkins",
    age: 34,
    time: "10:00 AM",
    type: "In-Clinic",
    status: "Confirmed",
    initials: "SJ",
    complaint: "Elevated LDL & metabolic panel review",
  },
  {
    id: "2",
    name: "Michael Torres",
    age: 52,
    time: "11:30 AM",
    type: "Live Chat Consultation",
    status: "Confirmed",
    initials: "MT",
    complaint: "BP regulation & dosage review",
  },
];

export const DOCTOR_ENCOUNTERS = DOCTOR_DAY_SCHEDULE.map((a) => ({
  id: a.id,
  patient: a.name,
  time: a.time,
  date: "Today",
  type: a.type,
  status: a.status,
  complaint: a.complaint,
}));

export interface PatientAppointmentItem {
  id: string;
  doctorName: string;
  specialty: string;
  date: string;
  time: string;
  type: "In-Clinic" | "Live Chat Consultation";
  status: string;
  initials: string;
}

export const PATIENT_APPOINTMENTS: Record<
  "upcoming" | "past" | "cancelled",
  PatientAppointmentItem[]
> = {
  upcoming: [
    {
      id: "1",
      doctorName: "Dr. Taylor Reynolds",
      specialty: "Cardiologist",
      date: "Today",
      time: "3:00 PM",
      type: "Live Chat Consultation",
      status: "Confirmed",
      initials: "TR",
    },
    {
      id: "2",
      doctorName: "Dr. Priya Sharma",
      specialty: "Endocrinologist",
      date: "Thu, Sep 26",
      time: "10:30 AM",
      type: "Live Chat Consultation",
      status: "Pending Approval",
      initials: "PS",
    },
  ],
  past: [
    {
      id: "3",
      doctorName: "Dr. Taylor Reynolds",
      specialty: "Cardiologist",
      date: "Aug 28",
      time: "11:00 AM",
      type: "In-Clinic",
      status: "Confirmed",
      initials: "TR",
    },
  ],
  cancelled: [],
};

export const ADMIN_SCHEDULED_VISITS = [
  {
    id: "1",
    doctor: "Dr. Taylor Reynolds",
    patient: "Sarah Jenkins",
    date: "Today 3:00 PM",
    type: "Live Chat",
    status: "Confirmed",
    room: "consultation-general",
  },
  {
    id: "2",
    doctor: "Dr. Priya Sharma",
    patient: "Michael Torres",
    date: "Today 2:30 PM",
    type: "Live Chat",
    status: "Active",
    room: "consultation-general",
  },
];

export const ADMIN_PATIENTS = [
  {
    id: "1",
    name: "Sarah Jenkins",
    uhid: "P-4821",
    status: "AI Flagged",
    doctor: "Dr. Reynolds",
    notes: "Lipid panel borderline; review planned",
  },
  {
    id: "2",
    name: "Michael Torres",
    uhid: "P-3302",
    status: "Active",
    doctor: "Dr. Reynolds",
    notes: "Hypertension follow-up",
  },
];

export const DOCTOR_PATIENT_REGISTRY = [
  {
    id: "1",
    name: "Sarah Jenkins",
    uhid: "P-4821",
    age: 34,
    status: "AI Flagged" as const,
    lastVisit: "Sep 12",
    condition: "Lipid Profile Abnormality",
    allergies: "Penicillin (Moderate)",
    activeRx: "Atorvastatin 20mg, Metformin 500mg",
  },
  {
    id: "2",
    name: "Michael Torres",
    uhid: "P-3302",
    age: 52,
    status: "Active" as const,
    lastVisit: "Sep 8",
    condition: "Hypertension Monitoring",
    allergies: "NKDA",
    activeRx: "Amlodipine 5mg",
  },
];

export const ADMIN_REGISTERED_USERS = [
  {
    id: "u1",
    name: "Sarah Jenkins",
    uhid: "P-4821",
    email: "sarah.j@medsync.io",
    phone: "+1 (555) 234-8901",
    status: "Active",
    doctor: "Dr. Taylor Reynolds",
  },
  {
    id: "u2",
    name: "Michael Torres",
    uhid: "P-3302",
    email: "m.torres@gmail.com",
    phone: "+1 (555) 492-1109",
    status: "Active",
    doctor: "Dr. Taylor Reynolds",
  },
];

export interface HealthRecordSeed {
  id: string;
  title: string;
  date: string;
  doctor: string;
  type: string;
  iconType: "flask" | "activity" | "pill" | "file";
  status: "Reviewed" | "Flagged";
  summary: string;
  biomarkers: { name: string; value: string; status: "Normal" | "Elevated" | "Low" }[];
}

export const HEALTH_RECORDS: HealthRecordSeed[] = [
  {
    id: "1",
    title: "Complete Blood Count",
    date: "Sep 12, 2026",
    doctor: "Dr. Taylor Reynolds",
    type: "Lab Report",
    iconType: "flask",
    status: "Reviewed",
    summary:
      "Routine complete blood cell count. Red and white blood cell levels are balanced with stable platelets.",
    biomarkers: [
      { name: "Hemoglobin", value: "14.2 g/dL", status: "Normal" },
      { name: "White Blood Cells", value: "6,800 /uL", status: "Normal" },
    ],
  },
  {
    id: "2",
    title: "Lipid Panel & Cholesterol",
    date: "Aug 28, 2026",
    doctor: "Dr. Taylor Reynolds",
    type: "Lab Report",
    iconType: "flask",
    status: "Flagged",
    summary:
      "LDL cholesterol is moderately elevated compared to baseline. Low saturated fat diet recommended.",
    biomarkers: [
      { name: "Total Cholesterol", value: "218 mg/dL", status: "Elevated" },
      { name: "LDL (Bad)", value: "142 mg/dL", status: "Elevated" },
      { name: "HDL (Good)", value: "54 mg/dL", status: "Normal" },
    ],
  },
];
