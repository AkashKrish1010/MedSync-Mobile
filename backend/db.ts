import mongoose, { Schema, Document, Model } from "mongoose";
import bcrypt from "bcryptjs";

// ─── Interfaces ─────────────────────────────────────────────────────────────
export interface IUser extends Document {
  email: string;
  password: string;
  role: "patient" | "doctor" | "admin";
  name: string;
  phone?: string;
  uhid: string;
  specialty?: string;
  licenseId?: string;
  experience?: string;
  hospital?: string;
  avatar?: string;
  profilePhotoUrl?: string;
  rating?: number;
  reviewsCount?: number;
  availableToday?: boolean;
  emergencyContact?: string;
  height?: string;
  weight?: string;
  bloodType?: string;
  allergies?: string;
  createdAt: Date;
  comparePassword(candidate: string): Promise<boolean>;
}

export interface IAppointment extends Document {
  patientUhid: string;
  patientName: string;
  patientAge: number;
  doctorId: string;
  doctorName: string;
  specialty: string;
  date: string;
  time: string;
  slotLabel: string;
  type: "In-Clinic" | "Live Chat Consultation";
  status: string;
  initials: string;
  category: "upcoming" | "past" | "cancelled";
  complaint?: string;
  createdAt: Date;
}

export interface IMedication extends Document {
  patientUhid: string;
  doctorId?: string;
  doctorName?: string;
  name: string;
  dosage: string;
  instructions: string;
  timeSlot: string;
  purpose: string;
  taken: boolean;
  createdAt: Date;
}

export interface IMedicalRecord extends Document {
  patientUhid: string;
  title: string;
  type: string;
  date: string;
  doctorName: string;
  specialty: string;
  status: string;
  isOptimal: boolean;
  summary: string;
  biomarkers: Array<{
    name: string;
    value: string;
    status: string;
    reference: string;
  }>;
  recommendations: string;
  createdAt: Date;
}

export interface IChatMessage extends Document {
  room: string;
  senderName: string;
  senderRole: "patient" | "doctor" | "system";
  text: string;
  timestamp: string;
  createdAt: Date;
}

export interface IPatientInbox extends Document {
  patientUhid: string;
  unreadDoctorMessages: number;
  lastDoctorName?: string;
  lastMessagePreview?: string;
  lastMessageAt?: string;
}

// ─── Schemas ────────────────────────────────────────────────────────────────
const UserSchema = new Schema<IUser>({
  email: { type: String, required: true, unique: true, lowercase: true, trim: true },
  password: { type: String, required: true },
  role: { type: String, enum: ["patient", "doctor", "admin"], required: true, default: "patient" },
  name: { type: String, required: true },
  phone: { type: String, default: "" },
  uhid: { type: String, required: true },
  specialty: { type: String, default: "" },
  licenseId: { type: String, default: "" },
  experience: { type: String, default: "" },
  hospital: { type: String, default: "" },
  avatar: { type: String, default: "" },
  profilePhotoUrl: { type: String, default: "" },
  rating: { type: Number, default: 4.9 },
  reviewsCount: { type: Number, default: 120 },
  availableToday: { type: Boolean, default: true },
  emergencyContact: { type: String, default: "" },
  height: { type: String, default: "" },
  weight: { type: String, default: "" },
  bloodType: { type: String, default: "" },
  allergies: { type: String, default: "" },
  createdAt: { type: Date, default: Date.now },
});

UserSchema.methods.comparePassword = async function (candidate: string): Promise<boolean> {
  // Supports both bcrypt hashed password and plain fallback for seeded accounts
  if (this.password.startsWith("$2a$") || this.password.startsWith("$2b$")) {
    return bcrypt.compare(candidate, this.password);
  }
  return this.password === candidate;
};

const AppointmentSchema = new Schema<IAppointment>({
  patientUhid: { type: String, required: true, index: true },
  patientName: { type: String, default: "Sarah Jenkins" },
  patientAge: { type: Number, default: 34 },
  doctorId: { type: String, required: true, index: true },
  doctorName: { type: String, required: true },
  specialty: { type: String, default: "General Medicine" },
  date: { type: String, required: true },
  time: { type: String, required: true },
  slotLabel: { type: String, default: "" },
  type: { type: String, enum: ["In-Clinic", "Live Chat Consultation"], default: "Live Chat Consultation" },
  status: { type: String, default: "Confirmed" },
  initials: { type: String, default: "MD" },
  category: { type: String, enum: ["upcoming", "past", "cancelled"], default: "upcoming" },
  complaint: { type: String, default: "Clinical follow-up" },
  createdAt: { type: Date, default: Date.now },
});

const MedicationSchema = new Schema<IMedication>({
  patientUhid: { type: String, required: true, index: true },
  doctorId: { type: String, default: "" },
  doctorName: { type: String, default: "Physician" },
  name: { type: String, required: true },
  dosage: { type: String, required: true },
  instructions: { type: String, default: "As directed" },
  timeSlot: { type: String, default: "9:00 PM" },
  purpose: { type: String, default: "Therapy" },
  taken: { type: Boolean, default: false },
  createdAt: { type: Date, default: Date.now },
});

const MedicalRecordSchema = new Schema<IMedicalRecord>({
  patientUhid: { type: String, required: true, index: true },
  title: { type: String, required: true },
  type: { type: String, default: "Diagnostic Report" },
  date: { type: String, default: () => new Date().toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" }) },
  doctorName: { type: String, default: "MedSync Clinical AI" },
  specialty: { type: String, default: "Diagnostic Pathology" },
  status: { type: String, default: "Verified" },
  isOptimal: { type: Boolean, default: true },
  summary: { type: String, default: "" },
  biomarkers: { type: [Schema.Types.Mixed] as any, default: [] },
  recommendations: { type: String, default: "" },
  createdAt: { type: Date, default: Date.now },
});

const ChatMessageSchema = new Schema<IChatMessage>({
  room: { type: String, required: true, index: true },
  senderName: { type: String, required: true },
  senderRole: { type: String, enum: ["patient", "doctor", "system"], default: "patient" },
  text: { type: String, required: true },
  timestamp: { type: String, default: () => new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }) },
  createdAt: { type: Date, default: Date.now },
});

const PatientInboxSchema = new Schema<IPatientInbox>({
  patientUhid: { type: String, required: true, unique: true },
  unreadDoctorMessages: { type: Number, default: 0 },
  lastDoctorName: { type: String },
  lastMessagePreview: { type: String },
  lastMessageAt: { type: String },
});

// ─── Models ─────────────────────────────────────────────────────────────────
export const UserModel: Model<IUser> = mongoose.models.User || mongoose.model<IUser>("User", UserSchema);
export const AppointmentModel: Model<IAppointment> =
  mongoose.models.Appointment || mongoose.model<IAppointment>("Appointment", AppointmentSchema);
export const MedicationModel: Model<IMedication> =
  mongoose.models.Medication || mongoose.model<IMedication>("Medication", MedicationSchema);
export const MedicalRecordModel: Model<IMedicalRecord> =
  mongoose.models.MedicalRecord || mongoose.model<IMedicalRecord>("MedicalRecord", MedicalRecordSchema);
export const ChatMessageModel: Model<IChatMessage> =
  mongoose.models.ChatMessage || mongoose.model<IChatMessage>("ChatMessage", ChatMessageSchema);
export const PatientInboxModel: Model<IPatientInbox> =
  mongoose.models.PatientInbox || mongoose.model<IPatientInbox>("PatientInbox", PatientInboxSchema);

// ─── Connection & Seed Management ───────────────────────────────────────────
let isConnected = false;

export function getIsMongoConnected(): boolean {
  return isConnected;
}

export async function connectMongoDB(): Promise<boolean> {
  const uri = process.env.MONGODB_URI;
  if (!uri || uri.trim() === "" || uri.includes("your_mongodb_connection_string")) {
    console.log("ℹ️ [MongoDB] MONGODB_URI is not set in backend/.env.");
    console.log("             You can add MONGODB_URI in backend/.env anytime; the app supports both live Mongo and dynamic in-memory store!");
    return false;
  }

  try {
    mongoose.set("strictQuery", false);
    await mongoose.connect(uri, {
      serverSelectionTimeoutMS: 5000,
    });
    isConnected = true;
    console.log(`✅ [MongoDB] Connected successfully to: ${mongoose.connection.host}/${mongoose.connection.name}`);
    await seedInitialDataIfEmpty();
    return true;
  } catch (err: any) {
    console.error("⚠️ [MongoDB] Connection error:", err.message);
    console.log("             Falling back to dynamic memory store until MongoDB connection is available.");
    isConnected = false;
    return false;
  }
}

// ─── Initial Seed Data (Applied to MongoDB or Fallback) ───────────────────────
export const SEED_PATIENT_UHID = "P-4821";

export async function seedInitialDataIfEmpty() {
  if (!isConnected) return;

  try {
    const userCount = await UserModel.countDocuments();
    if (userCount === 0) {
      console.log("🌱 [MongoDB] Seeding initial users and clinical records...");
      
      const salt = await bcrypt.genSalt(10);
      const hashedSarah = await bcrypt.hash("SecurePass123!#", salt);
      const hashedDoctor = await bcrypt.hash("Doctor@123", salt);
      const hashedAdmin = await bcrypt.hash("Admin@123", salt);

      // Seed Users
      await UserModel.create([
        {
          email: "sarah.jenkins@medsync.io",
          password: hashedSarah,
          role: "patient",
          name: "Sarah Jenkins",
          phone: "+1 (555) 382-9102",
          uhid: SEED_PATIENT_UHID,
          createdAt: new Date(),
        },
        {
          email: "dr.taylor@medsync.clinic",
          password: hashedDoctor,
          role: "doctor",
          name: "Dr. Taylor Reynolds",
          specialty: "Cardiology & Electrophysiology",
          licenseId: "MED-CA-984210",
          experience: "12 Years",
          hospital: "MedSync Heart Center",
          avatar: "TR",
          rating: 4.9,
          reviewsCount: 248,
          availableToday: true,
          uhid: "DOC-001",
          createdAt: new Date(),
        },
        {
          email: "dr.priya@medsync.clinic",
          password: hashedDoctor,
          role: "doctor",
          name: "Dr. Priya Sharma",
          specialty: "Endocrinology & Metabolism",
          licenseId: "MED-NY-112043",
          experience: "8 Years",
          hospital: "MedSync Metabolic Clinic",
          avatar: "PS",
          rating: 4.7,
          reviewsCount: 184,
          availableToday: true,
          uhid: "DOC-002",
          createdAt: new Date(),
        },
        {
          email: "ops.lead@medsync.io",
          password: hashedAdmin,
          role: "admin",
          name: "Alexander Wright",
          phone: "+1 (555) 900-1122",
          uhid: "ADM-001",
          createdAt: new Date(),
        },
      ]);

      // Seed Medications
      await MedicationModel.create([
        {
          patientUhid: SEED_PATIENT_UHID,
          doctorId: "doc-001",
          doctorName: "Dr. Taylor Reynolds",
          name: "Atorvastatin Calcium",
          dosage: "20 mg",
          instructions: "Take 1 tablet at bedtime",
          timeSlot: "9:00 PM",
          purpose: "Lipid & Plaque Stabilization",
          taken: false,
        },
        {
          patientUhid: SEED_PATIENT_UHID,
          doctorId: "doc-001",
          doctorName: "Dr. Taylor Reynolds",
          name: "Metformin HCl",
          dosage: "500 mg",
          instructions: "Take 1 tablet with meal",
          timeSlot: "Taken · 8:30 AM",
          purpose: "Glycemic Stability",
          taken: true,
        },
      ]);

      // Seed Appointments
      await AppointmentModel.create([
        {
          patientUhid: SEED_PATIENT_UHID,
          patientName: "Sarah Jenkins",
          patientAge: 34,
          doctorId: "doc-001",
          doctorName: "Dr. Taylor Reynolds",
          specialty: "Cardiology & Electrophysiology",
          date: "Today",
          time: "3:00 PM",
          slotLabel: "Today 3:00 PM",
          type: "Live Chat Consultation",
          status: "Confirmed",
          initials: "TR",
          category: "upcoming",
          complaint: "Elevated LDL & metabolic panel review",
        },
        {
          patientUhid: SEED_PATIENT_UHID,
          patientName: "Sarah Jenkins",
          patientAge: 34,
          doctorId: "doc-002",
          doctorName: "Dr. Priya Sharma",
          specialty: "Endocrinology & Metabolism",
          date: "Thu, Sep 26",
          time: "10:30 AM",
          slotLabel: "Thu, Sep 26 10:30 AM",
          type: "Live Chat Consultation",
          status: "Pending Approval",
          initials: "PS",
          category: "upcoming",
          complaint: "BP regulation & dosage review",
        },
        {
          patientUhid: SEED_PATIENT_UHID,
          patientName: "Sarah Jenkins",
          patientAge: 34,
          doctorId: "doc-001",
          doctorName: "Dr. Taylor Reynolds",
          specialty: "Cardiology & Electrophysiology",
          date: "Aug 28",
          time: "11:00 AM",
          slotLabel: "Aug 28 11:00 AM",
          type: "In-Clinic",
          status: "Confirmed",
          initials: "TR",
          category: "past",
          complaint: "Routine cardiology check",
        },
      ]);

      // Seed Medical Records
      await MedicalRecordModel.create([
        {
          patientUhid: SEED_PATIENT_UHID,
          title: "Complete Blood Count & Metabolic Panel",
          type: "Lab Report",
          date: "Sep 18, 2026",
          doctorName: "Dr. Taylor Reynolds",
          specialty: "Cardiology",
          status: "Processed",
          isOptimal: false,
          summary: "Mild lipid elevation coupled with acute Vitamin D3 insufficiency. Bone density and general cardiovascular performance will benefit from focused interventions.",
          biomarkers: [
            { name: "Hemoglobin", value: "14.2 g/dL", status: "Optimal", reference: "13.5–17.5 g/dL" },
            { name: "Total Cholesterol", value: "218 mg/dL", status: "Borderline High", reference: "< 200 mg/dL" },
            { name: "Fasting Blood Glucose", value: "92 mg/dL", status: "Optimal", reference: "70–99 mg/dL" },
            { name: "Vitamin D3", value: "18 ng/mL", status: "Deficient", reference: "30–100 ng/mL" },
          ],
          recommendations: "1. Introduce daily Vitamin D3 (2000 IU) supplementation.\n2. Restrict sodium and dietary saturated fats.\n3. Re-test lipid panel in 30 days.",
        },
      ]);

      console.log("✅ [MongoDB] Initial clinical data seeded successfully!");
    }
  } catch (err: any) {
    console.error("⚠️ [MongoDB] Seed error:", err.message);
  }
}
