import React, { useState, useCallback, useEffect } from "react";
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  TextInput,
  Modal,
  ActivityIndicator,
} from "react-native";
import {
  Search,
  AlertTriangle,
  MessageSquare,
  User,
  Users,
  X,
  Pill,
  Plus,
  CheckCircle2,
} from "lucide-react-native";
import { Colors } from "../../theme/colors";
import { Spacing, Radius, FontSize, FontFamily } from "../../theme/typography";
import ConsultationChatModal from "../../components/ConsultationChatModal";
import ThemedAlertModal from "../../components/ThemedAlertModal";
import { DOCTOR_PATIENT_REGISTRY } from "../../data/mockData";
import { Config } from "../../config";
import { DEFAULT_CHAT_ROOM } from "../../constants/patient";
import type { AuthDoctorProfile } from "../AuthScreen";

interface PatientRecord {
  id: string;
  name: string;
  uhid: string;
  age: number;
  status: "AI Flagged" | "Active";
  lastVisit: string;
  condition: string;
  allergies: string;
  activeRx: string;
}

interface ApiMed {
  id: string;
  name: string;
  dosage: string;
  instructions: string;
  timeSlot: string;
  taken: boolean;
  purpose: string;
}

export default function DoctorPatients({
  doctorProfile,
}: {
  doctorProfile: AuthDoctorProfile | null;
}) {
  const [search, setSearch] = useState("");
  const [selectedPatient, setSelectedPatient] = useState<PatientRecord | null>(null);
  const [profileModalOpen, setProfileModalOpen] = useState(false);
  const [chatModalOpen, setChatModalOpen] = useState(false);
  const [patientMeds, setPatientMeds] = useState<ApiMed[]>([]);
  const [medsLoading, setMedsLoading] = useState(false);
  const [addMedOpen, setAddMedOpen] = useState(false);
  const [newMedName, setNewMedName] = useState("");
  const [newMedDosage, setNewMedDosage] = useState("");
  const [newMedInstructions, setNewMedInstructions] = useState("");
  const [newMedPurpose, setNewMedPurpose] = useState("");
  const [newMedTime, setNewMedTime] = useState("8:00 AM");
  const [savingMed, setSavingMed] = useState(false);
  const [patientAlert, setPatientAlert] = useState<{
    visible: boolean;
    type?: "info" | "success" | "warning" | "error" | "ai" | "clinical";
    title: string;
    message?: string;
  }>({
    visible: false,
    title: "",
  });

  const [patients, setPatients] = useState<PatientRecord[]>(DOCTOR_PATIENT_REGISTRY);
  const [loadingPatients, setLoadingPatients] = useState(true);

  const doctorId = doctorProfile?.id ?? "doc-001";
  const doctorName = doctorProfile?.name ?? "Dr. Taylor Reynolds";

  useEffect(() => {
    let isMounted = true;
    const fetchPatients = async (isInitial = false) => {
      if (isInitial) setLoadingPatients(true);
      try {
        const res = await fetch(Config.apiDoctorPatients(doctorId));
        const data = await res.json();
        if (isMounted && Array.isArray(data) && data.length > 0) {
          setPatients(data);
        }
      } catch {
      } finally {
        if (isMounted && isInitial) setLoadingPatients(false);
      }
    };

    fetchPatients(true);
    const interval = setInterval(() => fetchPatients(false), 6000);
    return () => {
      isMounted = false;
      clearInterval(interval);
    };
  }, [doctorId]);

  const filtered = patients.filter((p) =>
    (p.name + p.uhid + p.condition).toLowerCase().includes(search.toLowerCase())
  );

  const loadMeds = useCallback(async (uhid: string) => {
    setMedsLoading(true);
    try {
      const res = await fetch(Config.apiPatientMedications(uhid));
      const data = await res.json();
      setPatientMeds(Array.isArray(data) ? data : []);
    } catch {
      setPatientMeds([]);
    } finally {
      setMedsLoading(false);
    }
  }, []);

  const handleOpenChat = (p: PatientRecord) => {
    setSelectedPatient(p);
    setChatModalOpen(true);
  };

  const handleOpenProfile = (p: PatientRecord) => {
    setSelectedPatient(p);
    loadMeds(p.uhid);
    setProfileModalOpen(true);
  };

  const handleAddMedication = async () => {
    if (!selectedPatient) return;
    if (!newMedName.trim() || !newMedDosage.trim()) {
      setPatientAlert({
        visible: true,
        type: "warning",
        title: "Required Fields",
        message: "Medication name and dosage are required.",
      });
      return;
    }
    setSavingMed(true);
    try {
      const res = await fetch(Config.apiPatientMedications(selectedPatient.uhid), {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          doctorId,
          doctorName,
          name: newMedName.trim(),
          dosage: newMedDosage.trim(),
          instructions: newMedInstructions.trim() || "As directed",
          purpose: newMedPurpose.trim() || "Clinical therapy",
          timeSlot: newMedTime.trim() || "As prescribed",
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setPatientAlert({
          visible: true,
          type: "error",
          title: "Prescription Error",
          message: data.error || "Could not add medication.",
        });
        return;
      }
      const savedName = newMedName.trim();
      setAddMedOpen(false);
      setNewMedName("");
      setNewMedDosage("");
      setNewMedInstructions("");
      setNewMedPurpose("");
      await loadMeds(selectedPatient.uhid);
      setPatientAlert({
        visible: true,
        type: "success",
        title: "Prescription Recorded",
        message: `${savedName} added to ${selectedPatient.name}'s care regimen.`,
      });
    } catch {
      setPatientAlert({
        visible: true,
        type: "error",
        title: "Connection Error",
        message: "Unable to record prescription. Please check your network connection and try again.",
      });
    } finally {
      setSavingMed(false);
    }
  };

  const adherenceSummary = () => {
    if (!patientMeds.length) return "No active prescriptions";
    const taken = patientMeds.filter((m) => m.taken).length;
    return `${taken} of ${patientMeds.length} doses logged today by patient`;
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
      <Text style={styles.heading}>Patient Registry</Text>
      <View style={styles.searchBar}>
        <Search size={18} color={Colors.outline} />
        <TextInput
          style={styles.searchInput}
          placeholder="Search by name, UHID, or diagnosis..."
          placeholderTextColor={Colors.outline}
          value={search}
          onChangeText={setSearch}
        />
        {search.length > 0 && (
          <TouchableOpacity onPress={() => setSearch("")}>
            <X size={16} color={Colors.outline} />
          </TouchableOpacity>
        )}
      </View>

      {loadingPatients && patients.length === 0 ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={Colors.primary} />
          <Text style={styles.loadingText}>Loading patient registry...</Text>
        </View>
      ) : filtered.length === 0 ? (
        <View style={styles.emptyContainer}>
          <Users size={36} color={Colors.outline} />
          <Text style={styles.emptyTitle}>
            {search.trim() ? "No matching patients" : "No patients in registry"}
          </Text>
          <Text style={styles.emptySub}>
            {search.trim()
              ? `No records found matching "${search}".`
              : "Patients assigned or scheduled for clinical review will appear here."}
          </Text>
        </View>
      ) : (
        filtered.map((p) => (
        <View key={p.id} style={styles.card}>
          <View style={styles.cardTop}>
            <View style={styles.avatarCircle}>
              <Text style={styles.avatarText}>{p.name.split(" ").map((n) => n[0]).join("")}</Text>
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.patientName}>{p.name}</Text>
              <Text style={styles.patientMeta}>Age {p.age} · UHID: {p.uhid}</Text>
              <Text style={styles.condition}>{p.condition}</Text>
            </View>
            <View
              style={[
                styles.badge,
                { backgroundColor: p.status === "AI Flagged" ? Colors.errorContainer : Colors.secondaryContainer + "55" },
              ]}
            >
              {p.status === "AI Flagged" ? (
                <AlertTriangle size={11} color={Colors.onErrorContainer} style={{ marginRight: 4 }} />
              ) : (
                <View style={[styles.dot, { backgroundColor: Colors.secondary }]} />
              )}
              <Text
                style={[
                  styles.badgeText,
                  { color: p.status === "AI Flagged" ? Colors.onErrorContainer : Colors.secondary },
                ]}
              >
                {p.status}
              </Text>
            </View>
          </View>
          <View style={styles.footer}>
            <Text style={styles.lastVisit}>Last visit: {p.lastVisit}</Text>
            <View style={styles.footerActions}>
              <TouchableOpacity style={styles.chatBtn} onPress={() => handleOpenChat(p)}>
                <MessageSquare size={14} color={Colors.onSurface} />
                <Text style={styles.chatBtnText}>Chat</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.viewBtn} onPress={() => handleOpenProfile(p)}>
                <User size={14} color={Colors.onPrimary} />
                <Text style={styles.viewBtnText}>View Chart</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      )))}

      {/* Patient Chart Modal */}
      <Modal visible={profileModalOpen} transparent animationType="slide" onRequestClose={() => setProfileModalOpen(false)}>
        <View style={styles.modalOverlay}>
          <ScrollView style={{ maxHeight: "88%" }} contentContainerStyle={styles.modalCard}>
            <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center" }}>
              <View>
                <Text style={styles.modalTitle}>{selectedPatient?.name}</Text>
                <Text style={styles.modalSub}>
                  {selectedPatient?.uhid} · Age {selectedPatient?.age}
                </Text>
              </View>
              <TouchableOpacity onPress={() => setProfileModalOpen(false)}>
                <X size={20} color={Colors.outline} />
              </TouchableOpacity>
            </View>

            <View style={styles.profileSection}>
              <Text style={styles.sectionLabel}>DIAGNOSTIC STATUS</Text>
              <Text style={styles.sectionValue}>{selectedPatient?.condition}</Text>
            </View>

            <View style={styles.profileSection}>
              <Text style={styles.sectionLabel}>KNOWN ALLERGIES</Text>
              <Text style={[styles.sectionValue, { color: Colors.error }]}>{selectedPatient?.allergies}</Text>
            </View>

            <View style={styles.regimenHeader}>
              <Text style={styles.sectionLabel}>PRESCRIBED CARE REGIMEN</Text>
              <Text style={styles.adherenceText}>{adherenceSummary()}</Text>
            </View>

            {medsLoading ? (
              <ActivityIndicator color={Colors.primary} style={{ marginVertical: 12 }} />
            ) : patientMeds.length === 0 ? (
              <Text style={styles.emptyMeds}>No medications prescribed yet.</Text>
            ) : (
              patientMeds.map((m) => (
                <View key={m.id} style={styles.medRow}>
                  <View style={[styles.medCheck, m.taken && styles.medCheckDone]}>
                    {m.taken ? <CheckCircle2 size={14} color={Colors.onPrimary} /> : null}
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.medName}>
                      {m.name} <Text style={styles.medDose}>{m.dosage}</Text>
                    </Text>
                    <Text style={styles.medMeta}>{m.instructions}</Text>
                    <Text style={styles.medStatus}>
                      {m.taken ? `✓ Taken · ${m.timeSlot}` : `Pending · ${m.timeSlot}`}
                    </Text>
                  </View>
                </View>
              ))
            )}

            <TouchableOpacity style={styles.addMedBtn} onPress={() => setAddMedOpen(true)}>
              <Plus size={16} color={Colors.primary} />
              <Text style={styles.addMedBtnText}>Add medication to regimen</Text>
            </TouchableOpacity>

            <View style={{ flexDirection: "row", gap: Spacing.xs, marginTop: 8 }}>
              <TouchableOpacity
                style={[styles.modalActionBtn, { backgroundColor: Colors.secondary }]}
                onPress={() => {
                  setProfileModalOpen(false);
                  if (selectedPatient) handleOpenChat(selectedPatient);
                }}
              >
                <MessageSquare size={16} color={Colors.onPrimary} />
                <Text style={styles.modalActionText}>Message</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.modalActionBtn, { backgroundColor: Colors.primary }]}
                onPress={() => setProfileModalOpen(false)}
              >
                <Text style={styles.modalActionText}>Close</Text>
              </TouchableOpacity>
            </View>
          </ScrollView>
        </View>
      </Modal>

      {/* Add medication sub-modal */}
      <Modal visible={addMedOpen} transparent animationType="fade" onRequestClose={() => setAddMedOpen(false)}>
        <View style={styles.modalOverlay}>
          <View style={styles.modalCard}>
            <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center" }}>
              <Text style={styles.modalTitle}>New prescription</Text>
              <TouchableOpacity onPress={() => setAddMedOpen(false)}>
                <X size={20} color={Colors.outline} />
              </TouchableOpacity>
            </View>
            <Text style={styles.fieldLabel}>Medication name</Text>
            <TextInput style={styles.formInput} value={newMedName} onChangeText={setNewMedName} placeholder="e.g. Lisinopril" />
            <Text style={styles.fieldLabel}>Dosage</Text>
            <TextInput style={styles.formInput} value={newMedDosage} onChangeText={setNewMedDosage} placeholder="e.g. 10 mg" />
            <Text style={styles.fieldLabel}>Instructions</Text>
            <TextInput style={styles.formInput} value={newMedInstructions} onChangeText={setNewMedInstructions} placeholder="1 tablet daily" />
            <Text style={styles.fieldLabel}>Purpose</Text>
            <TextInput style={styles.formInput} value={newMedPurpose} onChangeText={setNewMedPurpose} placeholder="BP control" />
            <Text style={styles.fieldLabel}>Reminder time</Text>
            <TextInput style={styles.formInput} value={newMedTime} onChangeText={setNewMedTime} placeholder="8:00 AM" />
            <TouchableOpacity style={styles.saveMedBtn} onPress={handleAddMedication} disabled={savingMed}>
              {savingMed ? (
                <ActivityIndicator color={Colors.onPrimary} />
              ) : (
                <>
                  <Pill size={16} color={Colors.onPrimary} />
                  <Text style={styles.modalActionText}>Save to care regimen</Text>
                </>
              )}
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {selectedPatient && (
        <ConsultationChatModal
          visible={chatModalOpen}
          onClose={() => setChatModalOpen(false)}
          room={DEFAULT_CHAT_ROOM}
          patientUhid={selectedPatient.uhid}
          doctorId={doctorId}
          doctorName={doctorName}
          onPrescriptionAdded={() => loadMeds(selectedPatient.uhid)}
          currentUser={{ name: doctorName, role: "doctor" }}
          otherParticipant={{
            name: selectedPatient.name,
            role: "patient",
            specialty: `UHID: ${selectedPatient.uhid}`,
          }}
        />
      )}

      {/* Themed Doctor Patient Alert Modal */}
      <ThemedAlertModal
        visible={patientAlert.visible}
        type={patientAlert.type || "info"}
        title={patientAlert.title}
        message={patientAlert.message}
        onClose={() => setPatientAlert((prev) => ({ ...prev, visible: false }))}
      />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.surface },
  content: { padding: Spacing.margin, gap: Spacing.sm, paddingBottom: 100 },
  heading: { fontSize: FontSize.headlineSm, color: Colors.onSurface, fontFamily: FontFamily.headlineSemiBold },
  searchBar: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    backgroundColor: Colors.surfaceContainerLowest,
    borderRadius: Radius.full,
    paddingHorizontal: Spacing.sm,
    paddingVertical: 10,
    borderWidth: 1,
    borderColor: Colors.outlineVariant,
  },
  searchInput: { flex: 1, fontSize: FontSize.bodyMd, color: Colors.onSurface, fontFamily: FontFamily.bodyRegular, padding: 0 },
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
  avatarCircle: { width: 44, height: 44, borderRadius: 22, backgroundColor: Colors.primary, justifyContent: "center", alignItems: "center" },
  avatarText: { fontSize: 16, color: Colors.onPrimary, fontFamily: FontFamily.headlineBold },
  patientName: { fontSize: FontSize.labelLg, color: Colors.onSurface, fontFamily: FontFamily.bodySemiBold },
  patientMeta: { fontSize: FontSize.bodySm, color: Colors.onSurfaceVariant, fontFamily: FontFamily.dataMono },
  condition: { fontSize: FontSize.bodySm, color: Colors.primary, fontFamily: FontFamily.bodyMedium },
  badge: { flexDirection: "row", alignItems: "center", paddingHorizontal: 8, paddingVertical: 4, borderRadius: Radius.full },
  dot: { width: 6, height: 6, borderRadius: 3, marginRight: 4 },
  badgeText: { fontSize: 10, fontFamily: FontFamily.bodySemiBold },
  footer: { gap: 6, paddingTop: 4, borderTopWidth: 1, borderTopColor: Colors.surfaceContainerHigh },
  lastVisit: { fontSize: FontSize.bodySm, color: Colors.outline, fontFamily: FontFamily.dataMono },
  footerActions: { flexDirection: "row", gap: Spacing.xs },
  chatBtn: { flex: 1, height: 38, borderRadius: Radius.md, backgroundColor: Colors.surfaceContainer, flexDirection: "row", justifyContent: "center", alignItems: "center", gap: 6 },
  chatBtnText: { fontSize: FontSize.labelMd, color: Colors.onSurface, fontFamily: FontFamily.bodyMedium },
  viewBtn: { flex: 1, height: 38, borderRadius: Radius.md, backgroundColor: Colors.primary, flexDirection: "row", justifyContent: "center", alignItems: "center", gap: 6 },
  viewBtnText: { fontSize: FontSize.labelMd, color: Colors.onPrimary, fontFamily: FontFamily.bodySemiBold },
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.5)",
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: Spacing.sm,
    paddingVertical: Spacing.md,
  },
  modalCard: {
    width: "94%",
    maxWidth: 440,
    alignSelf: "center",
    backgroundColor: Colors.surfaceContainerLowest,
    borderRadius: Radius.xxl,
    padding: Spacing.lg,
    gap: Spacing.sm,
  },
  modalTitle: { fontSize: FontSize.headlineSm, color: Colors.onSurface, fontFamily: FontFamily.headlineSemiBold },
  modalSub: { fontSize: FontSize.bodySm, color: Colors.onSurfaceVariant, fontFamily: FontFamily.dataMono },
  profileSection: { backgroundColor: Colors.surfaceContainerLow, borderRadius: Radius.md, padding: 8, gap: 2, marginVertical: 2 },
  sectionLabel: { fontSize: 9, color: Colors.outline, fontFamily: FontFamily.dataMonoBold, letterSpacing: 0.5 },
  sectionValue: { fontSize: FontSize.bodySm, color: Colors.onSurface, fontFamily: FontFamily.bodyMedium },
  regimenHeader: { marginTop: 6, gap: 2 },
  adherenceText: { fontSize: 11, color: Colors.secondary, fontFamily: FontFamily.bodyMedium },
  emptyMeds: { fontSize: FontSize.bodySm, color: Colors.onSurfaceVariant, fontFamily: FontFamily.bodyRegular, paddingVertical: 8 },
  medRow: { flexDirection: "row", gap: 10, alignItems: "flex-start", paddingVertical: 8, borderBottomWidth: 1, borderBottomColor: Colors.surfaceContainerHigh },
  medCheck: { width: 22, height: 22, borderRadius: 11, borderWidth: 2, borderColor: Colors.outlineVariant, justifyContent: "center", alignItems: "center" },
  medCheckDone: { backgroundColor: Colors.secondary, borderColor: Colors.secondary },
  medName: { fontSize: FontSize.labelMd, color: Colors.onSurface, fontFamily: FontFamily.bodySemiBold },
  medDose: { fontFamily: FontFamily.dataMono, color: Colors.primary },
  medMeta: { fontSize: 11, color: Colors.onSurfaceVariant, fontFamily: FontFamily.bodyRegular },
  medStatus: { fontSize: 10, color: Colors.outline, fontFamily: FontFamily.dataMono, marginTop: 2 },
  addMedBtn: { flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 6, paddingVertical: 12, borderRadius: Radius.md, borderWidth: 1, borderColor: Colors.primary, borderStyle: "dashed", marginTop: 4 },
  addMedBtnText: { fontSize: FontSize.labelMd, color: Colors.primary, fontFamily: FontFamily.bodySemiBold },
  modalActionBtn: { flex: 1, height: 42, borderRadius: Radius.lg, flexDirection: "row", justifyContent: "center", alignItems: "center", gap: 6 },
  modalActionText: { fontSize: FontSize.labelMd, color: Colors.onPrimary, fontFamily: FontFamily.bodySemiBold },
  fieldLabel: { fontSize: 11, color: Colors.onSurfaceVariant, fontFamily: FontFamily.bodyMedium, marginTop: 4 },
  formInput: { backgroundColor: Colors.surfaceContainerLow, borderRadius: Radius.md, padding: 10, fontSize: FontSize.bodyMd, color: Colors.onSurface, fontFamily: FontFamily.bodyRegular },
  saveMedBtn: { height: 44, borderRadius: Radius.lg, backgroundColor: Colors.primary, flexDirection: "row", justifyContent: "center", alignItems: "center", gap: 8, marginTop: 8 },
  loadingContainer: {
    paddingVertical: 48,
    alignItems: "center",
    justifyContent: "center",
    gap: 12,
  },
  loadingText: {
    fontSize: FontSize.bodyMd,
    color: Colors.onSurfaceVariant,
    fontFamily: FontFamily.bodyMedium,
  },
  emptyContainer: {
    paddingVertical: 36,
    paddingHorizontal: Spacing.lg,
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    backgroundColor: Colors.surfaceContainerLowest,
    borderRadius: Radius.xl,
    marginVertical: 4,
  },
  emptyTitle: {
    fontSize: FontSize.headlineSm,
    color: Colors.onSurface,
    fontFamily: FontFamily.headlineSemiBold,
    marginTop: 4,
  },
  emptySub: {
    fontSize: FontSize.bodySm,
    color: Colors.onSurfaceVariant,
    fontFamily: FontFamily.bodyRegular,
    textAlign: "center",
    lineHeight: 18,
  },
});
