import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  Modal,
  TextInput,
} from "react-native";
import {
  Calendar,
  Clock,
  MessageSquare,
  Building2,
  FileText,
  X,
  CheckCircle2,
  Trash2,
} from "lucide-react-native";
import { Colors } from "../../theme/colors";
import { Spacing, Radius, FontSize, FontFamily } from "../../theme/typography";
import ConsultationChatModal from "../../components/ConsultationChatModal";
import ThemedAlertModal from "../../components/ThemedAlertModal";
import { DOCTOR_ENCOUNTERS } from "../../data/mockData";
import { DEFAULT_CHAT_ROOM, DEMO_PATIENT_UHID } from "../../constants/patient";
import { Config } from "../../config";
import type { AuthDoctorProfile } from "../AuthScreen";

interface Visit {
  id: string;
  patient: string;
  time: string;
  date: string;
  type: "In-Clinic" | "Live Chat Consultation";
  status: string;
  complaint: string;
}

export default function DoctorVisits({ doctorProfile }: { doctorProfile: AuthDoctorProfile | null }) {
  const doctorId = doctorProfile?.id ?? "doc-001";
  const doctorName = doctorProfile?.name ?? "Dr. Taylor Reynolds";
  const [visits, setVisits] = useState<Visit[]>(DOCTOR_ENCOUNTERS);
  const [cancelConfirmVisit, setCancelConfirmVisit] = useState<Visit | null>(null);
  const [visitAlert, setVisitAlert] = useState<{
    visible: boolean;
    type?: "info" | "success" | "warning" | "error" | "ai" | "clinical";
    title: string;
    message?: string;
  }>({
    visible: false,
    title: "",
  });

  useEffect(() => {
    let isMounted = true;
    const fetchEncounters = async () => {
      try {
        const res = await fetch(Config.apiDoctorSchedule(doctorId));
        const data = await res.json();
        if (isMounted && Array.isArray(data)) {
          if (data.length > 0) {
            setVisits(
              data.map((item: any) => ({
                id: item.id,
                patient: item.name,
                time: item.time,
                date: item.date || "Today",
                type: item.type,
                status: item.status,
                complaint: item.complaint || "Clinical review",
              }))
            );
          } else if (doctorId === "doc-001" || doctorProfile?.email?.toLowerCase().includes("taylor")) {
            // Keep default demo encounters for Dr. Taylor Reynolds if no active appointments
          } else {
            setVisits([]);
          }
        }
      } catch {}
    };

    fetchEncounters();
    const interval = setInterval(fetchEncounters, 5000);
    return () => {
      isMounted = false;
      clearInterval(interval);
    };
  }, [doctorId]);

  const [activeVisit, setActiveVisit] = useState<Visit | null>(null);

  // Modals
  const [noteModalOpen, setNoteModalOpen] = useState(false);
  const [noteText, setNoteText] = useState("");
  const [noteSaved, setNoteSaved] = useState(false);

  // Real-time Chat Consultation Modal
  const [chatModalOpen, setChatModalOpen] = useState(false);

  const handleStartSession = (v: Visit) => {
    setActiveVisit(v);
    if (v.type === "Live Chat Consultation") {
      setChatModalOpen(true);
    } else {
      setNoteText(
        `Encounter Note for ${v.patient}:\nChief complaint: ${v.complaint}\nVitals verified. Treatment plan initiated.`
      );
      setNoteSaved(false);
      setNoteModalOpen(true);
    }
  };

  const handleOpenNote = (v: Visit) => {
    setActiveVisit(v);
    setNoteText(`Clinical Note: ${v.patient}\nDate: ${v.date} ${v.time}\nNotes: `);
    setNoteSaved(false);
    setNoteModalOpen(true);
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
      <Text style={styles.heading}>Patient Encounters</Text>
      {visits.map((v) => (
        <View key={v.id} style={styles.card}>
          <View style={styles.cardTop}>
            <View style={styles.iconBox}>
              {v.type === "Live Chat Consultation" ? (
                <MessageSquare size={20} color={Colors.tertiary} />
              ) : (
                <Building2 size={20} color={Colors.primary} />
              )}
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.patient}>{v.patient}</Text>
              <Text style={styles.complaint}>{v.complaint}</Text>
            </View>
            <View
              style={[
                styles.badge,
                {
                  backgroundColor:
                    v.status === "Confirmed"
                      ? Colors.secondaryContainer + "55"
                      : Colors.primaryFixed + "55",
                },
              ]}
            >
              <Text
                style={[
                  styles.badgeText,
                  { color: v.status === "Confirmed" ? Colors.secondary : Colors.primary },
                ]}
              >
                {v.status}
              </Text>
            </View>
          </View>
          <View style={styles.metaRow}>
            <View style={styles.metaItem}>
              <Calendar size={13} color={Colors.outline} />
              <Text style={styles.metaText}>{v.date}</Text>
            </View>
            <View style={styles.metaItem}>
              <Clock size={13} color={Colors.outline} />
              <Text style={styles.metaText}>{v.time}</Text>
            </View>
            <View style={styles.metaItem}>
              <Text style={[styles.metaText, { color: Colors.primary }]}>{v.type}</Text>
            </View>
          </View>
          <View style={styles.actions}>
            <TouchableOpacity style={styles.noteBtn} onPress={() => handleOpenNote(v)}>
              <FileText size={14} color={Colors.onSurface} />
              <Text style={styles.noteBtnText}>Note</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.startBtn} onPress={() => handleStartSession(v)}>
              <Text style={styles.startBtnText}>
                {v.type === "Live Chat Consultation" ? "Open Chat" : "Start"}
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.cancelBtn}
              onPress={() => setCancelConfirmVisit(v)}
              activeOpacity={0.7}
            >
              <Trash2 size={14} color="#DC2626" />
              <Text style={styles.cancelBtnText}>Cancel</Text>
            </TouchableOpacity>
          </View>
        </View>
      ))}

      {/* Note Modal */}
      <Modal visible={noteModalOpen} transparent animationType="slide" onRequestClose={() => setNoteModalOpen(false)}>
        <View style={styles.modalOverlay}>
          <View style={styles.modalCard}>
            <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center" }}>
              <Text style={styles.modalTitle}>Clinical Note: {activeVisit?.patient}</Text>
              <TouchableOpacity onPress={() => setNoteModalOpen(false)}>
                <X size={20} color={Colors.outline} />
              </TouchableOpacity>
            </View>
            <TextInput
              style={styles.noteInput}
              multiline
              numberOfLines={6}
              value={noteText}
              onChangeText={setNoteText}
              textAlignVertical="top"
            />
            {noteSaved ? (
              <View style={{ flexDirection: "row", alignItems: "center", gap: 6, marginVertical: 4 }}>
                <CheckCircle2 size={16} color={Colors.secondary} />
                <Text style={{ fontSize: 12, color: Colors.secondary, fontFamily: FontFamily.bodySemiBold }}>
                  Note archived to patient record
                </Text>
              </View>
            ) : null}

            <TouchableOpacity style={styles.saveBtn} onPress={() => setNoteSaved(true)}>
              <Text style={styles.saveBtnText}>Save Encounter Note</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* Real-Time WebSocket Consultation Chat Modal */}
      <ConsultationChatModal
        visible={chatModalOpen}
        onClose={() => setChatModalOpen(false)}
        room={DEFAULT_CHAT_ROOM}
        patientUhid={DEMO_PATIENT_UHID}
        doctorId={doctorId}
        doctorName={doctorName}
        currentUser={{
          name: doctorName,
          role: "doctor",
        }}
        otherParticipant={{
          name: activeVisit?.patient || "Sarah Jenkins",
          role: "patient",
          specialty: `Clinical Visit #${activeVisit?.id || "1"}`,
        }}
      />

      {/* Themed Doctor Encounter Cancellation Confirmation */}
      <ThemedAlertModal
        visible={!!cancelConfirmVisit}
        type="warning"
        title="Cancel Encounter?"
        message={`Are you sure you want to cancel the scheduled encounter for ${
          cancelConfirmVisit?.patient || "the patient"
        } on ${cancelConfirmVisit?.date || "today"} at ${cancelConfirmVisit?.time || ""}?`}
        onClose={() => setCancelConfirmVisit(null)}
        buttons={[
          {
            text: "Keep",
            style: "cancel",
            onPress: () => setCancelConfirmVisit(null),
          },
          {
            text: "Yes, Cancel",
            style: "destructive",
            onPress: async () => {
              const target = cancelConfirmVisit;
              setCancelConfirmVisit(null);
              if (!target) return;
              try {
                await fetch(Config.apiCancelAppointment(target.id), { method: "PATCH" });
                setVisits((prev) => prev.filter((v) => v.id !== target.id));
                setVisitAlert({
                  visible: true,
                  type: "success",
                  title: "Encounter Cancelled",
                  message: `The scheduled encounter for ${target.patient} has been cancelled.`,
                });
              } catch {
                setVisits((prev) => prev.filter((v) => v.id !== target.id));
              }
            },
          },
        ]}
      />

      {/* General Visit Alert Modal */}
      <ThemedAlertModal
        visible={visitAlert.visible}
        type={visitAlert.type || "info"}
        title={visitAlert.title}
        message={visitAlert.message}
        onClose={() => setVisitAlert((prev) => ({ ...prev, visible: false }))}
      />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.surface },
  content: { padding: Spacing.margin, gap: Spacing.sm, paddingBottom: 100 },
  heading: { fontSize: FontSize.headlineSm, color: Colors.onSurface, fontFamily: FontFamily.headlineSemiBold },
  card: {
    backgroundColor: Colors.surfaceContainerLowest,
    borderRadius: Radius.xl,
    padding: Spacing.sm,
    gap: Spacing.xs,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 8,
    elevation: 2,
  },
  cardTop: { flexDirection: "row", alignItems: "center", gap: Spacing.xs },
  iconBox: {
    width: 44,
    height: 44,
    borderRadius: 12,
    backgroundColor: Colors.surfaceContainerLow,
    justifyContent: "center",
    alignItems: "center",
  },
  patient: { fontSize: FontSize.labelLg, color: Colors.onSurface, fontFamily: FontFamily.bodySemiBold },
  complaint: { fontSize: FontSize.bodySm, color: Colors.onSurfaceVariant, fontFamily: FontFamily.bodyRegular },
  badge: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: Radius.full },
  badgeText: { fontSize: FontSize.dataMono, fontFamily: FontFamily.dataMonoBold },
  metaRow: {
    flexDirection: "row",
    gap: Spacing.sm,
    backgroundColor: Colors.surfaceContainerLow,
    borderRadius: Radius.md,
    padding: 8,
  },
  metaItem: { flexDirection: "row", alignItems: "center", gap: 4 },
  metaText: { fontSize: 11, color: Colors.outline, fontFamily: FontFamily.dataMono },
  actions: { flexDirection: "row", gap: Spacing.xs, marginTop: 4 },
  noteBtn: {
    flex: 1,
    height: 40,
    borderRadius: Radius.md,
    borderWidth: 1,
    borderColor: Colors.outlineVariant,
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    gap: 6,
  },
  noteBtnText: { fontSize: FontSize.bodySm, color: Colors.onSurface, fontFamily: FontFamily.bodyMedium },
  startBtn: {
    flex: 1,
    height: 40,
    borderRadius: Radius.md,
    backgroundColor: Colors.primary,
    justifyContent: "center",
    alignItems: "center",
  },
  startBtnText: { fontSize: FontSize.bodySm, color: Colors.onPrimary, fontFamily: FontFamily.bodySemiBold },
  cancelBtn: {
    paddingHorizontal: 12,
    height: 40,
    borderRadius: Radius.md,
    backgroundColor: "#FEF2F2",
    borderWidth: 1,
    borderColor: "#FECACA",
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    gap: 6,
  },
  cancelBtnText: {
    fontSize: FontSize.bodySm,
    color: "#DC2626",
    fontFamily: FontFamily.bodySemiBold,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.5)",
    justifyContent: "center",
    alignItems: "center",
    padding: Spacing.md,
  },
  modalCard: {
    width: "100%",
    maxWidth: 380,
    backgroundColor: Colors.surfaceContainerLowest,
    borderRadius: Radius.xxl,
    padding: Spacing.md,
    gap: Spacing.xs,
  },
  modalTitle: { fontSize: FontSize.headlineSm, color: Colors.onSurface, fontFamily: FontFamily.headlineSemiBold },
  noteInput: {
    height: 140,
    backgroundColor: Colors.surfaceContainerLow,
    borderRadius: Radius.md,
    padding: Spacing.xs,
    fontSize: FontSize.bodyMd,
    color: Colors.onSurface,
    fontFamily: FontFamily.bodyRegular,
    borderWidth: 1,
    borderColor: Colors.outlineVariant,
    marginVertical: 4,
  },
  saveBtn: {
    height: 44,
    backgroundColor: Colors.primary,
    borderRadius: Radius.lg,
    justifyContent: "center",
    alignItems: "center",
    marginTop: 6,
  },
  saveBtnText: { fontSize: FontSize.labelMd, color: Colors.onPrimary, fontFamily: FontFamily.bodySemiBold },
});
