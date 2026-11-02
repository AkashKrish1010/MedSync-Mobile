import { useCallback, useState } from "react";
import { Config } from "../config";
import { DEMO_PATIENT_UHID } from "../constants/patient";

export interface ApiMedication {
  id: string;
  name: string;
  dosage: string;
  instructions: string;
  timeSlot: string;
  taken: boolean;
  purpose: string;
  doctorName?: string;
}

export interface ApiAppointment {
  id: string;
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
}

export interface PatientInbox {
  unreadDoctorMessages: number;
  lastDoctorName?: string;
  lastMessagePreview?: string;
  lastMessageAt?: string;
}

export function usePatientClinical(uhid: string = DEMO_PATIENT_UHID) {
  const [meds, setMeds] = useState<ApiMedication[]>([]);
  const [nextAppointment, setNextAppointment] = useState<ApiAppointment | null>(null);
  const [inbox, setInbox] = useState<PatientInbox>({ unreadDoctorMessages: 0 });
  const [loading, setLoading] = useState(false);

  const refresh = useCallback(async () => {
    setLoading(true);
    try {
      const [medRes, nextRes, inboxRes] = await Promise.all([
        fetch(Config.apiPatientMedications(uhid)),
        fetch(Config.apiPatientNextAppointment(uhid)),
        fetch(Config.apiPatientNotifications(uhid)),
      ]);
      if (medRes.ok) {
        const medData = await medRes.json();
        setMeds(Array.isArray(medData) ? medData : []);
      }
      if (nextRes.ok) {
        const nextData = await nextRes.json();
        setNextAppointment(nextData.appointment ?? null);
      }
      if (inboxRes.ok) {
        setInbox(await inboxRes.json());
      }
    } catch {
      // keep last known state
    } finally {
      setLoading(false);
    }
  }, [uhid]);

  const toggleMedTaken = useCallback(
    async (medId: string, taken: boolean) => {
      try {
        const res = await fetch(Config.apiPatientMedicationTaken(uhid, medId), {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ taken }),
        });
        if (res.ok) {
          const data = await res.json();
          setMeds((prev) => prev.map((m) => (m.id === medId ? data.medication : m)));
        }
      } catch {
        await refresh();
      }
    },
    [uhid, refresh]
  );

  const markInboxRead = useCallback(async () => {
    try {
      await fetch(Config.apiPatientNotificationsRead(uhid), { method: "POST" });
      setInbox({ unreadDoctorMessages: 0 });
    } catch {
      /* ignore */
    }
  }, [uhid]);

  const bookAppointment = useCallback(
    async (doctorId: string, slotLabel: string, type: "In-Clinic" | "Live Chat Consultation" = "Live Chat Consultation") => {
      const res = await fetch(Config.apiPatientAppointments(uhid), {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ doctorId, slotLabel, type }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Unable to schedule appointment. Please try again.");
      await refresh();
      return data.appointment as ApiAppointment;
    },
    [uhid, refresh]
  );

  const cancelAppointment = useCallback(
    async (appointmentId?: string) => {
      const apptId = appointmentId || nextAppointment?.id || "next";
      try {
        const res = await fetch(Config.apiPatientCancelAppointment(uhid, apptId), {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
        });
        const data = await res.json();
        setNextAppointment((prev) => (prev && (prev.id === apptId || apptId === "next") ? null : prev));
        await refresh();
        return data;
      } catch (err) {
        setNextAppointment(null);
        await refresh();
        throw err;
      }
    },
    [uhid, nextAppointment, refresh]
  );

  return {
    meds,
    nextAppointment,
    inbox,
    loading,
    refresh,
    toggleMedTaken,
    markInboxRead,
    bookAppointment,
    cancelAppointment,
  };
}
