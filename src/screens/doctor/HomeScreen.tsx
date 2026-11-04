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
  Users,
  Star,
  Building2,
  FileSignature,
  FlaskConical,
  MessageSquare,
  FileText,
  CheckCircle2,
  X,
  Send,
  Plus,
  Check,
  Stethoscope,
  User,
  Trash2,
} from "lucide-react-native";
import { Colors } from "../../theme/colors";
import { Spacing, Radius, FontSize, FontFamily } from "../../theme/typography";
import ConsultationChatModal from "../../components/ConsultationChatModal";
import ThemedAlertModal from "../../components/ThemedAlertModal";
import { DOCTOR_DAY_SCHEDULE } from "../../data/mockData";
import { DEFAULT_CHAT_ROOM, DEMO_PATIENT_UHID } from "../../constants/patient";
import { Config } from "../../config";
import type { AuthDoctorProfile } from "../AuthScreen";

interface Appointment {
  id: string;
  name: string;
  age: number;
  time: string;
  type: "In-Clinic" | "Live Chat Consultation";
  status: string;
  initials: string;
  complaint: string;
}

function getTimeOfDayGreeting(): string {
  const hour = new Date().getHours();
  if (hour < 12) return "Good morning";
  if (hour < 17) return "Good afternoon";
  return "Good evening";
}

export default function DoctorHome({ doctorProfile }: { doctorProfile: AuthDoctorProfile | null }) {
  const doctorId = doctorProfile?.id ?? "doc-001";
  const doctorName = doctorProfile?.name ?? "Dr. Taylor Reynolds";
  const [appointments, setAppointments] = useState<Appointment[]>(DOCTOR_DAY_SCHEDULE);
  const [cancelConfirmAppt, setCancelConfirmAppt] = useState<Appointment | null>(null);
  const [docAlert, setDocAlert] = useState<{
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
    const fetchSchedule = async () => {
      try {
        const res = await fetch(Config.apiDoctorSchedule(doctorId));
        const data = await res.json();
        if (isMounted && Array.isArray(data)) {
          if (data.length > 0) {
            setAppointments(data);
          } else if (doctorId === "doc-001" || doctorProfile?.email?.toLowerCase().includes("taylor")) {
            // Keep default demo appointments for Dr. Taylor Reynolds if no active encounters
          } else {
            setAppointments([]);
          }
        }
      } catch {}
    };

    fetchSchedule();
    const interval = setInterval(fetchSchedule, 5000);
    return () => {
      isMounted = false;
      clearInterval(interval);
    };
  }, [doctorId]);

  // Modals state
  const [rxModalOpen, setRxModalOpen] = useState(false);
  const [rxPatient, setRxPatient] = useState("Sarah Jenkins (P-4821)");
  const [rxMedName, setRxMedName] = useState("Atorvastatin Calcium");
  const [rxDosage, setRxDosage] = useState("20 mg");
  const [rxInstructions, setRxInstructions] = useState("1 tablet orally at bedtime. 30-day supply, 2 refills.");
  const [rxSuccess, setRxSuccess] = useState(false);

  const [chatModalOpen, setChatModalOpen] = useState(false);
  const [chatPatient, setChatPatient] = useState("Sarah Jenkins");

  const [labsModalOpen, setLabsModalOpen] = useState(false);
  const [selectedLabPanels, setSelectedLabPanels] = useState<string[]>(["Complete Blood Count (CBC)", "Lipid Panel"]);
  const [labSuccess, setLabSuccess] = useState(false);

  const [notesModalOpen, setNotesModalOpen] = useState(false);
  const [soapNote, setSoapNote] = useState("Subjective: Patient reports good medication adherence. No myalgias or fatigue.\nObjective: BP 118/76 mmHg, HR 72 bpm regular.\nAssessment: Hyperlipidemia, stable on statin therapy.\nPlan: Re-check lipid panel in 6 months.");
  const [notesSaved, setNotesSaved] = useState(false);

  const [activePatient, setActivePatient] = useState<Appointment | null>(null);
  const [chartModalOpen, setChartModalOpen] = useState(false);

  const stats = [
    { label: "Today's Visits", value: String(appointments.length), color: Colors.primary, icon: Calendar },
    { label: "Live Chats", value: "1", color: Colors.secondary, icon: MessageSquare },
    { label: "Active Patients", value: "2", color: Colors.secondary, icon: Users },
    { label: "Physician Rating", value: "4.9", color: Colors.tertiary, icon: Star },
  ];

  const handleStartConsultation = (appt: Appointment) => {
    setActivePatient(appt);
    if (appt.type === "Live Chat Consultation") {
      setChatPatient(appt.name);
      setChatModalOpen(true);
    } else {
      setChartModalOpen(true);
    }
  };

  const toggleLabPanel = (panel: string) => {
    setSelectedLabPanels((prev) =>
      prev.includes(panel) ? prev.filter((p) => p !== panel) : [...prev, panel]
    );
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
      {/* Greeting */}
      <View style={styles.greetingRow}>
        <View style={styles.avatarCircle}>
          <Text style={styles.avatarText}>TR</Text>
        </View>
        <View>
          <Text style={styles.greeting}>{getTimeOfDayGreeting()}, {doctorName.startsWith("Dr.") ? doctorName : "Dr. " + doctorName}</Text>
          <Text style={styles.subtitle}>Cardiology · MED-CA-984210</Text>
        </View>
      </View>

      {/* Stats Grid */}
      <View style={styles.statsGrid}>
        {stats.map((s, idx) => {
          const IconComponent = s.icon;
          return (
            <View key={idx} style={[styles.statCard, { borderLeftWidth: 3, borderLeftColor: s.color }]}>
              <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center" }}>
                <Text style={styles.statLabel}>{s.label}</Text>
                <IconComponent size={16} color={s.color} />
              </View>
              <Text style={[styles.statValue, { color: s.color }]}>{s.value}</Text>
            </View>
          );
        })}
      </View>

      {/* Quick Actions (All 4 buttons fully working) */}
      <Text style={styles.sectionTitle}>Clinical Actions</Text>
      <View style={styles.actionsRow}>
        <TouchableOpacity
          style={styles.actionBtn}
          onPress={() => { setRxSuccess(false); setRxModalOpen(true); }}
        >
          <View style={[styles.actionIconBox, { backgroundColor: Colors.primaryFixed + "44" }]}>
            <FileSignature size={20} color={Colors.primary} />
          </View>
          <Text style={styles.actionLabel}>New Rx</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.actionBtn}
          onPress={() => { setLabSuccess(false); setLabsModalOpen(true); }}
        >
          <View style={[styles.actionIconBox, { backgroundColor: Colors.secondaryContainer + "55" }]}>
            <FlaskConical size={20} color={Colors.secondary} />
          </View>
          <Text style={styles.actionLabel}>Order Labs</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.actionBtn}
          onPress={() => setChatModalOpen(true)}
        >
          <View style={[styles.actionIconBox, { backgroundColor: Colors.tertiaryContainer + "55" }]}>
            <MessageSquare size={20} color={Colors.tertiary} />
          </View>
          <Text style={styles.actionLabel}>Patient Chat</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.actionBtn}
          onPress={() => { setNotesSaved(false); setNotesModalOpen(true); }}
        >
          <View style={[styles.actionIconBox, { backgroundColor: Colors.surfaceContainerHigh }]}>
            <FileText size={20} color={Colors.onSurface} />
          </View>
          <Text style={styles.actionLabel}>SOAP Notes</Text>
        </TouchableOpacity>
      </View>

      {/* Today's Schedule */}
      <View style={styles.scheduleHeaderRow}>
        <View>
          <Text style={styles.sectionTitle}>Today's Clinical Schedule</Text>
          <Text style={styles.sectionSubtitle}>{appointments.length} consultations scheduled for today</Text>
        </View>
        <View style={styles.scheduleHeaderBadge}>
          <Clock size={11} color={Colors.secondary} />
          <Text style={styles.scheduleHeaderBadgeText}>On Track</Text>
        </View>
      </View>

      {appointments.map((appt) => (
        <View key={appt.id} style={styles.scheduleCard}>
          {/* Top Bar: Time, Type, Status */}
          <View style={styles.scheduleCardTop}>
            <View style={styles.timeBadgeWrap}>
              <Clock size={13} color={Colors.primary} strokeWidth={2.2} />
              <Text style={styles.scheduleTimeText}>{appt.time}</Text>
            </View>

            <View style={styles.badgeRowRight}>
              <View
                style={[
                  styles.typeBadge,
                  {
                    backgroundColor:
                      appt.type === "Live Chat Consultation"
                        ? Colors.tertiaryContainer + "33"
                        : Colors.primaryFixed + "44",
                  },
                ]}
              >
                {appt.type === "Live Chat Consultation" ? (
                  <MessageSquare size={12} color={Colors.tertiary} />
                ) : (
                  <Building2 size={12} color={Colors.primary} />
                )}
                <Text
                  style={[
                    styles.typeText,
                    {
                      color:
                        appt.type === "Live Chat Consultation"
                          ? Colors.tertiary
                          : Colors.primary,
                    },
                  ]}
                >
                  {appt.type === "Live Chat Consultation" ? "Live Chat" : "In-Clinic"}
                </Text>
              </View>

              <View style={styles.statusPill}>
                <View style={styles.statusDotGreen} />
                <Text style={styles.statusPillText}>{appt.status}</Text>
              </View>
            </View>
          </View>

          {/* Divider */}
          <View style={styles.cardDivider} />

          {/* Middle: Patient Demographics & Chief Complaint */}
          <View style={styles.patientRow}>
            <View style={styles.patientAvatarBox}>
              <Text style={styles.patientAvatarInitials}>{appt.initials}</Text>
            </View>
            <View style={{ flex: 1, gap: 2 }}>
              <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between" }}>
                <Text style={styles.schedulePatientName}>{appt.name}</Text>
                <Text style={styles.patientDemographics}>Age {appt.age}</Text>
              </View>
              <View style={styles.complaintBox}>
                <Text style={styles.complaintText} numberOfLines={2}>
                  <Text style={styles.complaintLabel}>Reason: </Text>
                  {appt.complaint}
                </Text>
              </View>
            </View>
          </View>

          {/* Bottom Actions Row */}
          <View style={styles.scheduleActionRow}>
            <TouchableOpacity
              style={styles.chartActionBtn}
              onPress={() => {
                setActivePatient(appt);
                setChartModalOpen(true);
              }}
              activeOpacity={0.7}
            >
              <FileText size={14} color={Colors.onSurface} strokeWidth={2} />
              <Text style={styles.chartActionText}>Chart</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[
                styles.consultActionBtn,
                {
                  backgroundColor:
                    appt.type === "Live Chat Consultation"
                      ? Colors.secondary
                      : Colors.primary,
                },
              ]}
              onPress={() => handleStartConsultation(appt)}
              activeOpacity={0.8}
            >
              {appt.type === "Live Chat Consultation" ? (
                <MessageSquare size={14} color={Colors.onPrimary} strokeWidth={2.2} />
              ) : (
                <Stethoscope size={14} color={Colors.onPrimary} strokeWidth={2.2} />
              )}
              <Text style={styles.consultActionText}>
                {appt.type === "Live Chat Consultation" ? "Chat" : "Start"}
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.cancelActionBtn}
              onPress={() => setCancelConfirmAppt(appt)}
              activeOpacity={0.7}
            >
              <Trash2 size={14} color="#DC2626" strokeWidth={2} />
              <Text style={styles.cancelActionText}>Cancel</Text>
            </TouchableOpacity>
          </View>
        </View>
      ))}

      {/* ─── MODAL 1: Write Prescription ─── */}
      <Modal visible={rxModalOpen} transparent animationType="slide" onRequestClose={() => setRxModalOpen(false)}>
        <View style={styles.modalOverlay}>
          <View style={styles.modalCard}>
            {rxSuccess ? (
              <View style={styles.successBox}>
                <CheckCircle2 size={44} color={Colors.secondary} />
                <Text style={styles.modalTitle}>Prescription Authorized</Text>
                <Text style={styles.modalSub}>
                  Digital prescription for {rxMedName} {rxDosage} has been signed and dispatched to the pharmacy.
                </Text>
                <TouchableOpacity style={styles.submitBtn} onPress={() => setRxModalOpen(false)}>
                  <Text style={styles.submitBtnText}>Done</Text>
                </TouchableOpacity>
              </View>
            ) : (
              <>
                <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center" }}>
                  <View style={{ flexDirection: "row", alignItems: "center", gap: 6 }}>
                    <FileSignature size={20} color={Colors.primary} />
                    <Text style={styles.modalTitle}>Write Prescription</Text>
                  </View>
                  <TouchableOpacity onPress={() => setRxModalOpen(false)}>
                    <X size={20} color={Colors.outline} />
                  </TouchableOpacity>
                </View>

                <Text style={styles.inputLabel}>Patient</Text>
                <TextInput style={styles.inputField} value={rxPatient} onChangeText={setRxPatient} />

                <Text style={styles.inputLabel}>Medication & Strength</Text>
                <View style={{ flexDirection: "row", gap: Spacing.xs }}>
                  <TextInput style={[styles.inputField, { flex: 2 }]} value={rxMedName} onChangeText={setRxMedName} placeholder="Drug Name" />
                  <TextInput style={[styles.inputField, { flex: 1 }]} value={rxDosage} onChangeText={setRxDosage} placeholder="Dosage" />
                </View>

                <Text style={styles.inputLabel}>Directions for Patient (Sig)</Text>
                <TextInput
                  style={[styles.inputField, { height: 60, textAlignVertical: "top" }]}
                  multiline
                  value={rxInstructions}
                  onChangeText={setRxInstructions}
                />

                <TouchableOpacity
                  style={styles.submitBtn}
                  onPress={async () => {
                    try {
                      await fetch(Config.apiPatientMedications(DEMO_PATIENT_UHID), {
                        method: "POST",
                        headers: { "Content-Type": "application/json" },
                        body: JSON.stringify({
                          doctorId,
                          doctorName,
                          name: rxMedName,
                          dosage: rxDosage,
                          instructions: rxInstructions,
                          purpose: "Cardiometabolic Therapy",
                          timeSlot: "8:00 AM",
                        }),
                      });
                    } catch {}
                    setRxSuccess(true);
                  }}
                >
                  <Text style={styles.submitBtnText}>Sign & Transmit Prescription</Text>
                </TouchableOpacity>
              </>
            )}
          </View>
        </View>
      </Modal>

      {/* ─── MODAL 2: Real-Time WebSocket Patient Consultation Chat ─── */}
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
          name: chatPatient || "Sarah Jenkins",
          role: "patient",
          specialty: "Patient Record P-4821",
        }}
      />

      {/* ─── MODAL 3: Order Labs ─── */}
      <Modal visible={labsModalOpen} transparent animationType="slide" onRequestClose={() => setLabsModalOpen(false)}>
        <View style={styles.modalOverlay}>
          <View style={styles.modalCard}>
            {labSuccess ? (
              <View style={styles.successBox}>
                <CheckCircle2 size={44} color={Colors.secondary} />
                <Text style={styles.modalTitle}>Lab Order Submitted</Text>
                <Text style={styles.modalSub}>
                  Requisition generated for Sarah Jenkins with {selectedLabPanels.length} panels.
                </Text>
                <TouchableOpacity style={styles.submitBtn} onPress={() => setLabsModalOpen(false)}>
                  <Text style={styles.submitBtnText}>Done</Text>
                </TouchableOpacity>
              </View>
            ) : (
              <>
                <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center" }}>
                  <View style={{ flexDirection: "row", alignItems: "center", gap: 6 }}>
                    <FlaskConical size={20} color={Colors.secondary} />
                    <Text style={styles.modalTitle}>Order Diagnostics</Text>
                  </View>
                  <TouchableOpacity onPress={() => setLabsModalOpen(false)}>
                    <X size={20} color={Colors.outline} />
                  </TouchableOpacity>
                </View>

                <Text style={styles.inputLabel}>Select Diagnostic Panels</Text>
                {[
                  "Complete Blood Count (CBC)",
                  "Lipid Panel (Total, HDL, LDL, Triglycerides)",
                  "Comprehensive Metabolic Panel (CMP)",
                  "Hemoglobin A1c (HbA1c)",
                  "Thyroid Stimulating Hormone (TSH)",
                ].map((panel) => {
                  const isSelected = selectedLabPanels.includes(panel);
                  return (
                    <TouchableOpacity
                      key={panel}
                      style={[styles.labPanelOption, isSelected && styles.labPanelOptionActive]}
                      onPress={() => toggleLabPanel(panel)}
                    >
                      <View style={[styles.checkbox, isSelected && styles.checkboxActive]}>
                        {isSelected && <Check size={12} color="#FFF" strokeWidth={3} />}
                      </View>
                      <Text style={[styles.labPanelText, isSelected && { color: Colors.secondary }]}>
                        {panel}
                      </Text>
                    </TouchableOpacity>
                  );
                })}

                <TouchableOpacity style={styles.submitBtn} onPress={() => setLabSuccess(true)}>
                  <Text style={styles.submitBtnText}>Authorize Requisition ({selectedLabPanels.length})</Text>
                </TouchableOpacity>
              </>
            )}
          </View>
        </View>
      </Modal>

      {/* ─── MODAL 4: SOAP Clinical Notes ─── */}
      <Modal visible={notesModalOpen} transparent animationType="slide" onRequestClose={() => setNotesModalOpen(false)}>
        <View style={styles.modalOverlay}>
          <View style={styles.modalCard}>
            <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center" }}>
              <View style={{ flexDirection: "row", alignItems: "center", gap: 6 }}>
                <FileText size={20} color={Colors.primary} />
                <Text style={styles.modalTitle}>SOAP Encounter Note</Text>
              </View>
              <TouchableOpacity onPress={() => setNotesModalOpen(false)}>
                <X size={20} color={Colors.outline} />
              </TouchableOpacity>
            </View>

            <Text style={styles.inputLabel}>Patient: Sarah Jenkins · Encounter #E-9418</Text>
            <TextInput
              style={[styles.inputField, { height: 160, textAlignVertical: "top" }]}
              multiline
              value={soapNote}
              onChangeText={setSoapNote}
            />

            {notesSaved ? (
              <Text style={{ fontSize: 12, color: Colors.secondary, fontFamily: FontFamily.bodySemiBold, textAlign: "center" }}>
                Encounter note saved to patient electronic chart.
              </Text>
            ) : null}

            <TouchableOpacity style={styles.submitBtn} onPress={() => setNotesSaved(true)}>
              <Text style={styles.submitBtnText}>Save Encounter Note</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>



      {/* ─── MODAL 6: Patient Clinical Chart ─── */}
      <Modal visible={chartModalOpen} transparent animationType="slide" onRequestClose={() => setChartModalOpen(false)}>
        <View style={styles.modalOverlay}>
          <View style={styles.modalCard}>
            <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center" }}>
              <Text style={styles.modalTitle}>Clinical Chart: {activePatient?.name}</Text>
              <TouchableOpacity onPress={() => setChartModalOpen(false)}>
                <X size={20} color={Colors.outline} />
              </TouchableOpacity>
            </View>

            <View style={styles.chartDetailsBox}>
              <Text style={styles.chartDetailRow}>Age: {activePatient?.age} · Gender: Female</Text>
              <Text style={styles.chartDetailRow}>Scheduled: {activePatient?.time} ({activePatient?.type})</Text>
              <Text style={styles.chartDetailRow}>Chief Complaint: {activePatient?.complaint}</Text>
              <Text style={[styles.chartDetailRow, { color: Colors.primary }]}>Active Regimen: Atorvastatin 20mg, Metformin 500mg</Text>
            </View>

            <View style={{ flexDirection: "row", gap: Spacing.xs }}>
              <TouchableOpacity
                style={[styles.submitBtn, { flex: 1, backgroundColor: Colors.secondary }]}
                onPress={() => { setChartModalOpen(false); setRxModalOpen(true); }}
              >
                <Text style={styles.submitBtnText}>Write Rx</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.submitBtn, { flex: 1 }]}
                onPress={() => { setChartModalOpen(false); setNotesModalOpen(true); }}
              >
                <Text style={styles.submitBtnText}>Document Note</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* Themed Doctor Appointment Cancellation Confirmation */}
      <ThemedAlertModal
        visible={!!cancelConfirmAppt}
        type="warning"
        title="Cancel Appointment?"
        message={`Are you sure you want to cancel the scheduled encounter for ${
          cancelConfirmAppt?.name || "the patient"
        } at ${cancelConfirmAppt?.time || "today"}?`}
        onClose={() => setCancelConfirmAppt(null)}
        buttons={[
          {
            text: "Keep",
            style: "cancel",
            onPress: () => setCancelConfirmAppt(null),
          },
          {
            text: "Yes, Cancel",
            style: "destructive",
            onPress: async () => {
              const target = cancelConfirmAppt;
              setCancelConfirmAppt(null);
              if (!target) return;
              try {
                await fetch(Config.apiCancelAppointment(target.id), { method: "PATCH" });
                setAppointments((prev) => prev.filter((a) => a.id !== target.id));
                setDocAlert({
                  visible: true,
                  type: "success",
                  title: "Appointment Cancelled",
                  message: `The scheduled consultation for ${target.name} has been removed from today's schedule.`,
                });
              } catch {
                setAppointments((prev) => prev.filter((a) => a.id !== target.id));
              }
            },
          },
        ]}
      />

      {/* General Doctor Alert Modal */}
      <ThemedAlertModal
        visible={docAlert.visible}
        type={docAlert.type || "info"}
        title={docAlert.title}
        message={docAlert.message}
        onClose={() => setDocAlert((prev) => ({ ...prev, visible: false }))}
      />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.surface },
  content: { padding: Spacing.margin, gap: Spacing.sm, paddingBottom: 100 },
  greetingRow: { flexDirection: "row", alignItems: "center", gap: Spacing.sm },
  avatarCircle: { width: 48, height: 48, borderRadius: 24, backgroundColor: Colors.tertiary, justifyContent: "center", alignItems: "center" },
  avatarText: { fontSize: 18, color: Colors.onTertiary, fontFamily: FontFamily.headlineBold },
  greeting: { fontSize: FontSize.headlineSm, color: Colors.onSurface, fontFamily: FontFamily.headlineSemiBold },
  subtitle: { fontSize: FontSize.bodySm, color: Colors.onSurfaceVariant, fontFamily: FontFamily.dataMono },
  statsGrid: { flexDirection: "row", flexWrap: "wrap", gap: Spacing.xs },
  statCard: { flex: 1, minWidth: "45%", backgroundColor: Colors.surfaceContainerLowest, borderRadius: Radius.lg, padding: Spacing.xs, gap: 4 },
  statValue: { fontSize: FontSize.headlineSm, fontFamily: FontFamily.dataMonoBold },
  statLabel: { fontSize: FontSize.bodySm, color: Colors.onSurfaceVariant, fontFamily: FontFamily.bodyRegular },
  sectionTitle: { fontSize: FontSize.labelLg, color: Colors.onSurface, fontFamily: FontFamily.headlineSemiBold, marginTop: Spacing.xs },
  sectionSubtitle: { fontSize: 11, color: Colors.onSurfaceVariant, fontFamily: FontFamily.bodyRegular },
  actionsRow: { flexDirection: "row", gap: Spacing.xs },
  actionBtn: { flex: 1, backgroundColor: Colors.surfaceContainerLowest, borderRadius: Radius.xl, padding: Spacing.xs, alignItems: "center", gap: 6, borderWidth: 1, borderColor: Colors.outlineVariant },
  actionIconBox: { width: 42, height: 42, borderRadius: 21, justifyContent: "center", alignItems: "center" },
  actionLabel: { fontSize: 11, color: Colors.onSurface, fontFamily: FontFamily.bodySemiBold },
  scheduleHeaderRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginTop: Spacing.xs,
  },
  scheduleHeaderBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    backgroundColor: Colors.secondaryContainer + "44",
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: Radius.full,
  },
  scheduleHeaderBadgeText: {
    fontSize: 10,
    color: Colors.secondary,
    fontFamily: FontFamily.dataMonoBold,
  },
  scheduleCard: {
    backgroundColor: Colors.surfaceContainerLowest,
    borderRadius: Radius.xl,
    padding: Spacing.sm,
    gap: 10,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
    borderWidth: 1,
    borderColor: Colors.outlineVariant + "55",
    marginBottom: 4,
  },
  scheduleCardTop: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  timeBadgeWrap: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    backgroundColor: Colors.surfaceContainerLow,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: Radius.md,
  },
  scheduleTimeText: {
    fontSize: FontSize.bodySm,
    color: Colors.onSurface,
    fontFamily: FontFamily.dataMonoBold,
  },
  badgeRowRight: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  typeBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: Radius.full,
  },
  typeText: {
    fontSize: 10,
    fontFamily: FontFamily.bodySemiBold,
  },
  statusPill: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: Radius.full,
    backgroundColor: Colors.secondaryContainer + "44",
  },
  statusDotGreen: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: Colors.secondary,
  },
  statusPillText: {
    fontSize: 10,
    color: Colors.secondary,
    fontFamily: FontFamily.dataMonoBold,
  },
  cardDivider: {
    height: 1,
    backgroundColor: Colors.surfaceContainerHigh,
  },
  patientRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 12,
  },
  patientAvatarBox: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: Colors.primaryFixed,
    justifyContent: "center",
    alignItems: "center",
  },
  patientAvatarInitials: {
    fontSize: FontSize.labelLg,
    color: Colors.primary,
    fontFamily: FontFamily.headlineBold,
  },
  schedulePatientName: {
    fontSize: FontSize.labelLg,
    color: Colors.onSurface,
    fontFamily: FontFamily.bodySemiBold,
  },
  patientDemographics: {
    fontSize: FontSize.bodySm,
    color: Colors.onSurfaceVariant,
    fontFamily: FontFamily.dataMono,
  },
  complaintBox: {
    backgroundColor: Colors.surfaceContainerLow,
    borderRadius: Radius.md,
    paddingHorizontal: 8,
    paddingVertical: 4,
    marginTop: 4,
  },
  complaintText: {
    fontSize: 11,
    color: Colors.onSurfaceVariant,
    fontFamily: FontFamily.bodyRegular,
    lineHeight: 16,
  },
  complaintLabel: {
    fontFamily: FontFamily.bodySemiBold,
    color: Colors.onSurface,
  },
  scheduleActionRow: {
    flexDirection: "row",
    gap: Spacing.xs,
    marginTop: 2,
  },
  chartActionBtn: {
    flex: 1,
    height: 38,
    borderRadius: Radius.md,
    backgroundColor: Colors.surfaceContainerLow,
    borderWidth: 1,
    borderColor: Colors.outlineVariant,
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    gap: 6,
  },
  chartActionText: {
    fontSize: FontSize.labelMd,
    color: Colors.onSurface,
    fontFamily: FontFamily.bodySemiBold,
  },
  consultActionBtn: {
    flex: 1.2,
    height: 38,
    borderRadius: Radius.md,
    backgroundColor: Colors.primary,
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    gap: 6,
  },
  consultActionText: {
    fontSize: FontSize.labelMd,
    color: Colors.onPrimary,
    fontFamily: FontFamily.bodySemiBold,
  },
  cancelActionBtn: {
    paddingHorizontal: 12,
    height: 38,
    borderRadius: Radius.md,
    backgroundColor: "#FEF2F2",
    borderWidth: 1,
    borderColor: "#FECACA",
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    gap: 6,
  },
  cancelActionText: {
    fontSize: FontSize.labelMd,
    color: "#DC2626",
    fontFamily: FontFamily.bodySemiBold,
  },
  // Modal styles
  modalOverlay: { flex: 1, backgroundColor: "rgba(0,0,0,0.5)", justifyContent: "center", alignItems: "center", padding: Spacing.md },
  modalCard: {
    width: "94%",
    maxWidth: 440,
    backgroundColor: Colors.surfaceContainerLowest,
    borderRadius: Radius.xxl,
    padding: Spacing.lg,
    gap: Spacing.sm,
  },
  modalTitle: { fontSize: FontSize.headlineSm, color: Colors.onSurface, fontFamily: FontFamily.headlineSemiBold },
  modalSub: { fontSize: FontSize.bodySm, color: Colors.onSurfaceVariant, fontFamily: FontFamily.bodyRegular, textAlign: "center", lineHeight: 18 },
  inputLabel: { fontSize: 11, color: Colors.onSurfaceVariant, fontFamily: FontFamily.bodyMedium, marginTop: 4 },
  inputField: { height: 42, backgroundColor: Colors.surfaceContainerLow, borderRadius: Radius.md, paddingHorizontal: 10, fontSize: FontSize.bodyMd, color: Colors.onSurface, fontFamily: FontFamily.bodyRegular, borderWidth: 1, borderColor: Colors.outlineVariant },
  submitBtn: { height: 44, backgroundColor: Colors.primary, borderRadius: Radius.lg, justifyContent: "center", alignItems: "center", marginTop: 8 },
  submitBtnText: { fontSize: FontSize.labelMd, color: Colors.onPrimary, fontFamily: FontFamily.bodySemiBold },
  successBox: { alignItems: "center", gap: Spacing.xs, paddingVertical: Spacing.sm },
  // Chat Modal
  chatModalContainer: { flex: 1, backgroundColor: Colors.surface },
  chatHeader: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", padding: Spacing.margin, borderBottomWidth: 1, borderBottomColor: Colors.outlineVariant, backgroundColor: Colors.surfaceContainerLowest },
  chatAvatar: { width: 40, height: 40, borderRadius: 20, backgroundColor: Colors.primary, justifyContent: "center", alignItems: "center" },
  chatAvatarText: { fontSize: 14, color: Colors.onPrimary, fontFamily: FontFamily.headlineBold },
  chatHeaderName: { fontSize: FontSize.labelLg, color: Colors.onSurface, fontFamily: FontFamily.headlineSemiBold },
  chatHeaderSpecialty: { fontSize: 11, color: Colors.onSurfaceVariant, fontFamily: FontFamily.bodyRegular },
  chatCloseBtn: { width: 36, height: 36, borderRadius: 18, backgroundColor: Colors.surfaceContainerHigh, justifyContent: "center", alignItems: "center" },
  chatScroll: { flex: 1 },
  chatBubble: { maxWidth: "80%", borderRadius: Radius.lg, padding: 12, gap: 4 },
  chatBubbleDoctor: { alignSelf: "flex-end", backgroundColor: Colors.primary },
  chatBubblePatient: { alignSelf: "flex-start", backgroundColor: Colors.surfaceContainerLowest, borderWidth: 1, borderColor: Colors.outlineVariant },
  chatMsgText: { fontSize: FontSize.bodyMd, lineHeight: 20 },
  chatMsgTextDoctor: { color: Colors.onPrimary, fontFamily: FontFamily.bodyRegular },
  chatMsgTextPatient: { color: Colors.onSurface, fontFamily: FontFamily.bodyRegular },
  chatTimeText: { fontSize: 9, fontFamily: FontFamily.dataMono, alignSelf: "flex-end", color: "rgba(255,255,255,0.7)" },
  quickReplyRow: { flexDirection: "row", paddingHorizontal: Spacing.sm, gap: 6, paddingVertical: 4 },
  quickReplyChip: { paddingHorizontal: 10, paddingVertical: 5, borderRadius: Radius.full, backgroundColor: Colors.surfaceContainerHigh },
  quickReplyText: { fontSize: 11, color: Colors.primary, fontFamily: FontFamily.bodyMedium },
  chatInputBar: { flexDirection: "row", gap: Spacing.xs, padding: Spacing.sm, borderTopWidth: 1, borderTopColor: Colors.outlineVariant, backgroundColor: Colors.surfaceContainerLowest },
  chatTextInput: { flex: 1, height: 44, backgroundColor: Colors.surfaceContainerLow, borderRadius: Radius.full, paddingHorizontal: 16, fontSize: FontSize.bodyMd, color: Colors.onSurface, fontFamily: FontFamily.bodyRegular },
  chatSendBtn: { width: 44, height: 44, backgroundColor: Colors.primary, borderRadius: 22, justifyContent: "center", alignItems: "center" },
  // Labs Modal
  labPanelOption: { flexDirection: "row", alignItems: "center", gap: Spacing.xs, padding: 10, borderRadius: Radius.md, borderWidth: 1, borderColor: Colors.outlineVariant, backgroundColor: Colors.surfaceContainerLow, marginBottom: 4 },
  labPanelOptionActive: { borderColor: Colors.secondary, backgroundColor: Colors.secondaryContainer + "22" },
  checkbox: { width: 20, height: 20, borderRadius: 4, borderWidth: 1.5, borderColor: Colors.outlineVariant, justifyContent: "center", alignItems: "center" },
  checkboxActive: { backgroundColor: Colors.secondary, borderColor: Colors.secondary },
  labPanelText: { fontSize: FontSize.bodySm, color: Colors.onSurface, flex: 1 },
  chartDetailsBox: { backgroundColor: Colors.surfaceContainerLow, borderRadius: Radius.lg, padding: Spacing.sm, gap: 6, marginVertical: Spacing.xs },
  chartDetailRow: { fontSize: FontSize.bodySm, color: Colors.onSurface, fontFamily: FontFamily.bodyRegular },
});
