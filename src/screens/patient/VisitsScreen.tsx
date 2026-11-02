import React, { useState, useCallback } from "react";
import { useFocusEffect } from "@react-navigation/native";
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
  Plus,
  User,
  MapPin,
  X,
  CheckCircle2,
  Trash2,
} from "lucide-react-native";
import { Colors } from "../../theme/colors";
import { Spacing, Radius, FontSize, FontFamily } from "../../theme/typography";
import ConsultationChatModal from "../../components/ConsultationChatModal";
import ThemedAlertModal from "../../components/ThemedAlertModal";
import { Config } from "../../config";
import { DEMO_PATIENT_NAME, DEMO_PATIENT_UHID, DEFAULT_CHAT_ROOM } from "../../constants/patient";
import type { AuthUserProfile } from "../../types";

interface AppointmentItem {
  id: string;
  doctorName: string;
  specialty: string;
  date: string;
  time: string;
  type: "In-Clinic" | "Live Chat Consultation";
  status: string;
  initials: string;
}

const statusColors: Record<string, { bg: string; text: string }> = {
  Confirmed: { bg: Colors.secondaryContainer + "55", text: Colors.secondary },
  "Pending Approval": { bg: Colors.primaryFixed + "55", text: Colors.primary },
  "Live Chat": { bg: Colors.tertiaryContainer + "55", text: Colors.tertiary },
  Cancelled: { bg: Colors.errorContainer, text: Colors.onErrorContainer },
};

export default function PatientVisits({
  patientProfile,
}: {
  patientProfile?: AuthUserProfile | null;
}) {
  const userUhid = patientProfile?.uhid || DEMO_PATIENT_UHID;
  const userName = patientProfile?.name || DEMO_PATIENT_NAME;

  const [filter, setFilter] = useState<"upcoming" | "past" | "cancelled">("upcoming");
  const filters: Array<"upcoming" | "past" | "cancelled"> = ["upcoming", "past", "cancelled"];
  const [appts, setAppts] = useState<{
    upcoming: AppointmentItem[];
    past: AppointmentItem[];
    cancelled: AppointmentItem[];
  }>({ upcoming: [], past: [], cancelled: [] });

  const loadAppointments = useCallback(() => {
    fetch(Config.apiPatientAppointments(userUhid))
      .then((r) => r.json())
      .then((data) => {
        if (data.upcoming) {
          setAppts({
            upcoming: data.upcoming,
            past: data.past || [],
            cancelled: data.cancelled || [],
          });
        }
      })
      .catch(() => {});
  }, []);

  useFocusEffect(
    useCallback(() => {
      loadAppointments();
    }, [loadAppointments])
  );

  // Modals
  const [bookingModalOpen, setBookingModalOpen] = useState(false);
  const [selectedDoctor, setSelectedDoctor] = useState("Dr. Taylor Reynolds");
  const [selectedType, setSelectedType] = useState<"In-Clinic" | "Live Chat Consultation">("Live Chat Consultation");
  const [selectedDate, setSelectedDate] = useState("Tomorrow, 10:00 AM");
  const [bookingConfirmed, setBookingConfirmed] = useState(false);

  // Real-time Chat Consultation Modal
  const [chatModalOpen, setChatModalOpen] = useState(false);
  const [activeChatDoctor, setActiveChatDoctor] = useState({
    name: "Dr. Taylor Reynolds",
    specialty: "Cardiologist",
    initials: "TR",
  });

  const [directionsModalOpen, setDirectionsModalOpen] = useState(false);
  const [cancelConfirmAppt, setCancelConfirmAppt] = useState<AppointmentItem | null>(null);
  const [cancelling, setCancelling] = useState(false);
  const [cancelAlert, setCancelAlert] = useState<{
    visible: boolean;
    title: string;
    message: string;
    type: "success" | "error" | "info";
  }>({
    visible: false,
    title: "",
    message: "",
    type: "info",
  });

  const handleCancelAppointment = async () => {
    if (!cancelConfirmAppt) return;
    setCancelling(true);
    try {
      const res = await fetch(
        Config.apiPatientCancelAppointment(userUhid, cancelConfirmAppt.id),
        { method: "PATCH" }
      );
      if (res.ok) {
        setCancelConfirmAppt(null);
        loadAppointments();
        setCancelAlert({
          visible: true,
          type: "success",
          title: "Appointment Cancelled",
          message: "Your appointment has been cancelled and removed from your upcoming schedule.",
        });
      } else {
        throw new Error("Cancellation failed");
      }
    } catch {
      setCancelConfirmAppt(null);
      setCancelAlert({
        visible: true,
        type: "error",
        title: "Cancellation Error",
        message: "Unable to cancel appointment at this time. Please try again.",
      });
    } finally {
      setCancelling(false);
    }
  };

  const visibleAppts = appts[filter];

  const handleCreateAppointment = async () => {
    try {
      const res = await fetch(Config.apiPatientAppointments(userUhid), {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          doctorId: selectedDoctor.includes("Taylor") ? "doc-001" : "doc-002",
          slotLabel: selectedDate,
          type: selectedType,
          patientName: userName,
        }),
      });
      if (res.ok) {
        loadAppointments();
        setBookingConfirmed(true);
      }
    } catch {
      /* ignore */
    }
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
      {/* Filter Tabs */}
      <View style={styles.filterRow}>
        {filters.map((f) => (
          <TouchableOpacity
            key={f}
            onPress={() => setFilter(f)}
            style={[styles.filterBtn, filter === f && styles.filterBtnActive]}
          >
            <Text style={[styles.filterText, filter === f && styles.filterTextActive]}>
              {f.charAt(0).toUpperCase() + f.slice(1)}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {visibleAppts.length === 0 && (
        <Text style={styles.emptyHint}>
          {filter === "upcoming"
            ? "No upcoming visits. Book from Home or use Book New Encounter below."
            : `No ${filter} visits on file.`}
        </Text>
      )}

      {/* Appointment Cards */}
      {visibleAppts.map((appt) => {
        const sc = statusColors[appt.status] || statusColors["Confirmed"];
        return (
          <View key={appt.id} style={styles.card}>
            <View style={styles.cardTop}>
              <View style={styles.avatarCircle}>
                <Text style={styles.avatarText}>{appt.initials}</Text>
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.apptDoctor}>{appt.doctorName}</Text>
                <Text style={styles.apptSpecialty}>{appt.specialty}</Text>
              </View>
              <View style={[styles.statusBadge, { backgroundColor: sc.bg }]}>
                <Text style={[styles.statusText, { color: sc.text }]}>{appt.status}</Text>
              </View>
            </View>
            <View style={styles.divider} />
            <View style={styles.cardBottom}>
              <View style={styles.metaItem}>
                <Calendar size={14} color={Colors.outline} />
                <Text style={styles.metaText}>{appt.date}</Text>
              </View>
              <View style={styles.metaItem}>
                <Clock size={14} color={Colors.outline} />
                <Text style={styles.metaText}>{appt.time}</Text>
              </View>
              <View style={styles.metaItem}>
                {appt.type === "Live Chat Consultation" ? (
                  <MessageSquare size={14} color={Colors.primary} />
                ) : (
                  <Building2 size={14} color={Colors.primary} />
                )}
                <Text style={styles.metaText}>{appt.type}</Text>
              </View>
            </View>
            {appt.status === "Confirmed" && filter === "upcoming" && (
              <View style={styles.actionRow}>
                <TouchableOpacity
                  style={styles.joinBtn}
                  onPress={() => {
                    if (appt.type === "Live Chat Consultation") {
                      setActiveChatDoctor({
                        name: appt.doctorName,
                        specialty: appt.specialty,
                        initials: appt.initials,
                      });
                      setChatModalOpen(true);
                    } else {
                      setDirectionsModalOpen(true);
                    }
                  }}
                >
                  {appt.type === "Live Chat Consultation" ? (
                    <MessageSquare size={15} color={Colors.onPrimary} style={{ marginRight: 6 }} />
                  ) : (
                    <MapPin size={15} color={Colors.onPrimary} style={{ marginRight: 6 }} />
                  )}
                  <Text style={styles.joinBtnText}>
                    {appt.type === "Live Chat Consultation" ? "Join Consultation" : "Directions"}
                  </Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={styles.cancelBtn}
                  onPress={() => setCancelConfirmAppt(appt)}
                  disabled={cancelling}
                  activeOpacity={0.7}
                >
                  <Trash2 size={14} color="#DC2626" style={{ marginRight: 4 }} />
                  <Text style={styles.cancelBtnText}>Cancel</Text>
                </TouchableOpacity>
              </View>
            )}
          </View>
        );
      })}

      {/* Book New Appointment CTA */}
      <TouchableOpacity
        style={styles.bookBtn}
        onPress={() => {
          setBookingConfirmed(false);
          setBookingModalOpen(true);
        }}
      >
        <Plus size={18} color={Colors.onPrimary} />
        <Text style={styles.bookBtnText}>Book New Encounter</Text>
      </TouchableOpacity>

      {/* ─── Book Appointment Modal ─────────────────────────────────────── */}
      <Modal visible={bookingModalOpen} animationType="slide" presentationStyle="pageSheet" onRequestClose={() => setBookingModalOpen(false)}>
        <View style={styles.modalContent}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>Book Consultation</Text>
            <TouchableOpacity onPress={() => setBookingModalOpen(false)} style={styles.closeBtn}>
              <X size={18} color={Colors.onSurface} />
            </TouchableOpacity>
          </View>

          {bookingConfirmed ? (
            <View style={styles.successBox}>
              <CheckCircle2 size={48} color={Colors.secondary} />
              <Text style={styles.successTitle}>Encounter Booked!</Text>
              <Text style={styles.successDesc}>
                Your session with {selectedDoctor} is confirmed for {selectedDate} ({selectedType}).
              </Text>
              <TouchableOpacity style={styles.doneBtn} onPress={() => setBookingModalOpen(false)}>
                <Text style={styles.doneBtnText}>Return to Visits</Text>
              </TouchableOpacity>
            </View>
          ) : (
            <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ gap: Spacing.sm, paddingBottom: 40 }}>
              <Text style={styles.fieldLabel}>CHOOSE PHYSICIAN</Text>
              {[
                { name: "Dr. Taylor Reynolds", specialty: "Cardiology & Electrophysiology" },
                { name: "Dr. Priya Sharma", specialty: "Endocrinology & Metabolism" },
                { name: "Dr. Marcus Webb", specialty: "General Primary Care" },
              ].map((doc, idx) => (
                <TouchableOpacity
                  key={idx}
                  onPress={() => setSelectedDoctor(doc.name)}
                  style={[styles.doctorOption, selectedDoctor === doc.name && styles.doctorOptionActive]}
                >
                  <User size={18} color={selectedDoctor === doc.name ? Colors.primary : Colors.outline} />
                  <View style={{ flex: 1 }}>
                    <Text style={[styles.docName, selectedDoctor === doc.name && { color: Colors.primary }]}>{doc.name}</Text>
                    <Text style={styles.docSpec}>{doc.specialty}</Text>
                  </View>
                </TouchableOpacity>
              ))}

              <Text style={styles.fieldLabel}>SESSION FORMAT</Text>
              <View style={styles.formatRow}>
                <TouchableOpacity
                  onPress={() => setSelectedType("Live Chat Consultation")}
                  style={[styles.formatBtn, selectedType === "Live Chat Consultation" && styles.formatBtnActive]}
                >
                  <MessageSquare size={16} color={selectedType === "Live Chat Consultation" ? Colors.primary : Colors.onSurfaceVariant} />
                  <Text style={[styles.formatBtnText, selectedType === "Live Chat Consultation" && { color: Colors.primary }]}>
                    Live Chat Consultation
                  </Text>
                </TouchableOpacity>
                <TouchableOpacity
                  onPress={() => setSelectedType("In-Clinic")}
                  style={[styles.formatBtn, selectedType === "In-Clinic" && styles.formatBtnActive]}
                >
                  <Building2 size={16} color={selectedType === "In-Clinic" ? Colors.primary : Colors.onSurfaceVariant} />
                  <Text style={[styles.formatBtnText, selectedType === "In-Clinic" && { color: Colors.primary }]}>
                    In-Clinic Visit
                  </Text>
                </TouchableOpacity>
              </View>

              <Text style={styles.fieldLabel}>PREFERRED DATE & TIME</Text>
              <TextInput
                style={styles.dateInput}
                value={selectedDate}
                onChangeText={setSelectedDate}
                placeholder="e.g. Tomorrow, 2:30 PM"
              />

              <TouchableOpacity style={styles.confirmBookingBtn} onPress={handleCreateAppointment}>
                <Text style={styles.confirmBookingBtnText}>Confirm & Schedule</Text>
              </TouchableOpacity>
            </ScrollView>
          )}
        </View>
      </Modal>

      {/* ─── Real-Time WebSocket Consultation Chat Modal ─────────────────── */}
      <ConsultationChatModal
        visible={chatModalOpen}
        onClose={() => setChatModalOpen(false)}
        room={DEFAULT_CHAT_ROOM}
        patientUhid={userUhid}
        currentUser={{
          name: userName,
          role: "patient",
        }}
        otherParticipant={{
          name: activeChatDoctor.name,
          role: "doctor",
          specialty: activeChatDoctor.specialty,
          avatar: activeChatDoctor.initials,
        }}
      />

      {/* ─── Clinic Route & Directions Modal ─────────────────────────────── */}
      <Modal visible={directionsModalOpen} animationType="slide" presentationStyle="pageSheet" onRequestClose={() => setDirectionsModalOpen(false)}>
        <View style={styles.modalContent}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>Clinic Directions</Text>
            <TouchableOpacity onPress={() => setDirectionsModalOpen(false)} style={styles.closeBtn}>
              <X size={18} color={Colors.onSurface} />
            </TouchableOpacity>
          </View>
          <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ gap: Spacing.sm }}>
            <View style={styles.routeCard}>
              <MapPin size={24} color={Colors.primary} />
              <View style={{ flex: 1 }}>
                <Text style={styles.routeClinicName}>MedSync Heart & Specialty Center</Text>
                <Text style={styles.routeClinicAddress}>550 Medical Center Way, Suite 4B, New York, NY 10021</Text>
              </View>
            </View>

            <Text style={styles.fieldLabel}>TRANSIT GUIDANCE</Text>
            <View style={styles.stepItem}>
              <Text style={styles.stepNum}>1</Text>
              <Text style={styles.stepText}>Subway: 6 Train to 68th St - Hunter College station (3 min walk).</Text>
            </View>
            <View style={styles.stepItem}>
              <Text style={styles.stepNum}>2</Text>
              <Text style={styles.stepText}>Parking: Underground valet parking available at Entrance West.</Text>
            </View>
            <View style={styles.stepItem}>
              <Text style={styles.stepNum}>3</Text>
              <Text style={styles.stepText}>Check-In: Proceed to Elevator B, 4th Floor Reception Desk.</Text>
            </View>

            <TouchableOpacity style={styles.doneBtn} onPress={() => setDirectionsModalOpen(false)}>
              <Text style={styles.doneBtnText}>Close Directions</Text>
            </TouchableOpacity>
          </ScrollView>
        </View>
      </Modal>

      {/* Themed Confirmation Modal for Cancel */}
      <ThemedAlertModal
        visible={!!cancelConfirmAppt}
        type="warning"
        title="Cancel Appointment?"
        message={`Are you sure you want to cancel your ${cancelConfirmAppt?.type ?? "appointment"} with ${cancelConfirmAppt?.doctorName ?? "the doctor"} scheduled for ${cancelConfirmAppt?.date ?? ""} at ${cancelConfirmAppt?.time ?? ""}? This will free up the slot for other patients.`}
        onClose={() => !cancelling && setCancelConfirmAppt(null)}
        buttons={[
          {
            text: "Keep Appointment",
            style: "cancel",
            onPress: () => !cancelling && setCancelConfirmAppt(null),
          },
          {
            text: cancelling ? "Cancelling..." : "Yes, Cancel",
            style: "destructive",
            onPress: handleCancelAppointment,
          },
        ]}
      />

      {/* Themed Alert Modal for Cancel Result */}
      <ThemedAlertModal
        visible={cancelAlert.visible}
        type={cancelAlert.type}
        title={cancelAlert.title}
        message={cancelAlert.message}
        onClose={() => setCancelAlert((prev) => ({ ...prev, visible: false }))}
        buttons={[
          {
            text: "Done",
            style: "primary",
            onPress: () => setCancelAlert((prev) => ({ ...prev, visible: false })),
          },
        ]}
      />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.surface },
  content: { padding: Spacing.margin, gap: Spacing.sm, paddingBottom: 100 },
  filterRow: { flexDirection: "row", backgroundColor: Colors.surfaceContainerLowest, borderRadius: Radius.full, padding: 4 },
  filterBtn: { flex: 1, paddingVertical: 8, alignItems: "center", borderRadius: Radius.full },
  filterBtnActive: { backgroundColor: Colors.primary },
  filterText: { fontSize: FontSize.labelMd, color: Colors.onSurfaceVariant, fontFamily: FontFamily.bodyMedium },
  filterTextActive: { color: Colors.onPrimary, fontFamily: FontFamily.bodySemiBold },
  emptyHint: {
    fontSize: FontSize.bodySm,
    color: Colors.onSurfaceVariant,
    fontFamily: FontFamily.bodyRegular,
    textAlign: "center",
    paddingVertical: Spacing.sm,
  },
  card: { backgroundColor: Colors.surfaceContainerLowest, borderRadius: Radius.xl, padding: Spacing.sm, gap: Spacing.xs, shadowColor: "#000", shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.04, shadowRadius: 8, elevation: 2 },
  cardTop: { flexDirection: "row", alignItems: "center", gap: Spacing.xs },
  avatarCircle: { width: 44, height: 44, borderRadius: 22, backgroundColor: Colors.tertiary, justifyContent: "center", alignItems: "center" },
  avatarText: { fontSize: FontSize.labelLg, color: Colors.onTertiary, fontFamily: FontFamily.headlineBold },
  apptDoctor: { fontSize: FontSize.labelLg, color: Colors.onSurface, fontFamily: FontFamily.bodySemiBold },
  apptSpecialty: { fontSize: FontSize.bodySm, color: Colors.onSurfaceVariant, fontFamily: FontFamily.bodyRegular },
  statusBadge: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: Radius.full },
  statusText: { fontSize: 11, fontFamily: FontFamily.bodySemiBold },
  divider: { height: 1, backgroundColor: Colors.surfaceContainerHigh, marginVertical: 2 },
  cardBottom: { flexDirection: "row", justifyContent: "space-between" },
  metaItem: { flexDirection: "row", alignItems: "center", gap: 4 },
  metaText: { fontSize: FontSize.bodySm, color: Colors.onSurfaceVariant, fontFamily: FontFamily.bodyRegular },
  actionRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.xs,
    marginTop: 6,
  },
  joinBtn: {
    flex: 1,
    height: 40,
    backgroundColor: Colors.primary,
    borderRadius: Radius.lg,
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
  },
  cancelBtn: {
    height: 40,
    paddingHorizontal: 14,
    backgroundColor: "#FEE2E2",
    borderRadius: Radius.lg,
    borderWidth: 1,
    borderColor: "#FECACA",
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
  },
  cancelBtnText: {
    fontSize: FontSize.bodySm,
    color: "#DC2626",
    fontFamily: FontFamily.bodySemiBold,
  },
  joinBtnText: { fontSize: FontSize.labelMd, color: Colors.onPrimary, fontFamily: FontFamily.bodySemiBold },
  bookBtn: { height: 48, backgroundColor: Colors.primary, borderRadius: Radius.xl, flexDirection: "row", justifyContent: "center", alignItems: "center", gap: 8, marginTop: Spacing.xs },
  bookBtnText: { fontSize: FontSize.labelLg, color: Colors.onPrimary, fontFamily: FontFamily.bodySemiBold },
  // Modal styles
  modalContent: { flex: 1, backgroundColor: Colors.surface, padding: Spacing.md, gap: Spacing.sm },
  modalHeader: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", borderBottomWidth: 1, borderBottomColor: Colors.surfaceContainerHigh, paddingBottom: Spacing.xs },
  modalTitle: { fontSize: FontSize.headlineSm, color: Colors.onSurface, fontFamily: FontFamily.headlineSemiBold },
  closeBtn: { width: 32, height: 32, borderRadius: 16, backgroundColor: Colors.surfaceContainerHigh, justifyContent: "center", alignItems: "center" },
  fieldLabel: { fontSize: FontSize.dataMono, color: Colors.outline, fontFamily: FontFamily.dataMonoBold, textTransform: "uppercase", letterSpacing: 1, marginTop: 4 },
  doctorOption: { flexDirection: "row", alignItems: "center", gap: 10, backgroundColor: Colors.surfaceContainerLowest, padding: Spacing.sm, borderRadius: Radius.lg, borderWidth: 1, borderColor: Colors.outlineVariant },
  doctorOptionActive: { borderColor: Colors.primary, backgroundColor: Colors.primaryFixed + "22" },
  docName: { fontSize: FontSize.labelLg, color: Colors.onSurface, fontFamily: FontFamily.bodySemiBold },
  docSpec: { fontSize: FontSize.bodySm, color: Colors.onSurfaceVariant, fontFamily: FontFamily.bodyRegular },
  formatRow: { flexDirection: "row", gap: Spacing.xs },
  formatBtn: { flex: 1, flexDirection: "row", justifyContent: "center", alignItems: "center", gap: 6, height: 44, backgroundColor: Colors.surfaceContainerLowest, borderRadius: Radius.lg, borderWidth: 1, borderColor: Colors.outlineVariant },
  formatBtnActive: { borderColor: Colors.primary, backgroundColor: Colors.primaryFixed + "22" },
  formatBtnText: { fontSize: FontSize.bodySm, color: Colors.onSurfaceVariant, fontFamily: FontFamily.bodyMedium },
  dateInput: { height: 46, backgroundColor: Colors.surfaceContainerLowest, borderRadius: Radius.lg, borderWidth: 1, borderColor: Colors.outlineVariant, paddingHorizontal: Spacing.sm, fontSize: FontSize.bodyMd, color: Colors.onSurface, fontFamily: FontFamily.bodyRegular },
  confirmBookingBtn: { height: 48, backgroundColor: Colors.primary, borderRadius: Radius.xl, justifyContent: "center", alignItems: "center", marginTop: 8 },
  confirmBookingBtnText: { fontSize: FontSize.labelLg, color: Colors.onPrimary, fontFamily: FontFamily.bodySemiBold },
  successBox: { flex: 1, justifyContent: "center", alignItems: "center", gap: Spacing.sm, paddingHorizontal: Spacing.lg },
  successTitle: { fontSize: FontSize.headlineMd, color: Colors.onSurface, fontFamily: FontFamily.headlineBold },
  successDesc: { fontSize: FontSize.bodyMd, color: Colors.onSurfaceVariant, fontFamily: FontFamily.bodyRegular, textAlign: "center", lineHeight: 22 },
  doneBtn: { width: "100%", height: 46, backgroundColor: Colors.primary, borderRadius: Radius.lg, justifyContent: "center", alignItems: "center", marginTop: Spacing.sm },
  doneBtnText: { fontSize: FontSize.labelMd, color: Colors.onPrimary, fontFamily: FontFamily.bodySemiBold },
  routeCard: { flexDirection: "row", alignItems: "center", gap: Spacing.sm, backgroundColor: Colors.surfaceContainerLowest, borderRadius: Radius.xl, padding: Spacing.sm, borderWidth: 1, borderColor: Colors.outlineVariant },
  routeClinicName: { fontSize: FontSize.labelLg, color: Colors.onSurface, fontFamily: FontFamily.bodySemiBold },
  routeClinicAddress: { fontSize: FontSize.bodySm, color: Colors.onSurfaceVariant, fontFamily: FontFamily.bodyRegular, marginTop: 2 },
  stepItem: { flexDirection: "row", alignItems: "flex-start", gap: Spacing.xs, backgroundColor: Colors.surfaceContainerLowest, borderRadius: Radius.lg, padding: Spacing.sm },
  stepNum: { width: 22, height: 22, borderRadius: 11, backgroundColor: Colors.primary, color: Colors.onPrimary, textAlign: "center", fontSize: 11, lineHeight: 22, fontFamily: FontFamily.dataMonoBold },
  stepText: { flex: 1, fontSize: FontSize.bodySm, color: Colors.onSurface, fontFamily: FontFamily.bodyRegular, lineHeight: 20 },
});
