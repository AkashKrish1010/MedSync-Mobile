import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  Modal,
  Switch,
  TextInput,
  ActivityIndicator,
} from "react-native";
import * as ImagePicker from "expo-image-picker";
import {
  Calendar,
  FileText,
  Bell,
  BarChart3,
  Shield,
  LogOut,
  ChevronRight,
  Award,
  X,
  CheckCircle2,
  Edit3,
  Star,
  Users,
  GraduationCap,
  Building2,
  Phone,
  Clock,
  Save,
  Camera,
} from "lucide-react-native";
import { Colors } from "../../theme/colors";
import { Spacing, Radius, FontSize, FontFamily } from "../../theme/typography";
import { Config } from "../../config";
import DoctorAvatar from "../../components/DoctorAvatar";
import ThemedAlertModal from "../../components/ThemedAlertModal";
import type { AuthDoctorProfile } from "../AuthScreen";

interface DoctorProfileProps {
  onSignOut: () => void;
  doctorProfile: AuthDoctorProfile | null;
}

export default function DoctorProfile({ onSignOut, doctorProfile }: DoctorProfileProps) {
  const [activeModal, setActiveModal] = useState<string | null>(null);
  const [notificationsEnabled, setNotificationsEnabled] = useState(true);
  const [telehealthEnabled, setTelehealthEnabled] = useState(true);

  // Doctor state
  const [docName, setDocName] = useState("Dr. Taylor Reynolds");
  const [specialty, setSpecialty] = useState("Cardiology & Electrophysiology");
  const [hospital, setHospital] = useState("MedSync Heart Center · Suite 4B");
  const [officePhone, setOfficePhone] = useState("+1 (555) 349-2010");
  const [profilePhotoUrl, setProfilePhotoUrl] = useState<string | undefined>();
  const [avatarInitials, setAvatarInitials] = useState("TR");
  const [doctorId, setDoctorId] = useState<string | null>(null);
  const [photoUploading, setPhotoUploading] = useState(false);

  useEffect(() => {
    if (!doctorProfile) return;
    setDoctorId(doctorProfile.id);
    setDocName(doctorProfile.name);
    setSpecialty(doctorProfile.specialty);
    setHospital(doctorProfile.hospital || "MedSync Clinic");
    setAvatarInitials(doctorProfile.avatar || "DR");
    setProfilePhotoUrl(doctorProfile.profilePhotoUrl);
  }, [doctorProfile]);

  // Edit doctor modal
  const [editDocModal, setEditDocModal] = useState(false);
  const [tempName, setTempName] = useState(docName);
  const [tempSpecialty, setTempSpecialty] = useState(specialty);
  const [tempHospital, setTempHospital] = useState(hospital);
  const [tempPhone, setTempPhone] = useState(officePhone);
  const [docAlert, setDocAlert] = useState<{
    visible: boolean;
    type?: "info" | "success" | "warning" | "error" | "ai" | "clinical";
    title: string;
    message?: string;
  }>({
    visible: false,
    title: "",
  });

  const stats = [
    { label: "Patients", value: "124", id: "patients_stat" },
    { label: "Rating", value: "4.9 / 5", id: "rating_stat" },
    { label: "Experience", value: "12 Years", id: "experience_stat" },
  ];

  const menuItems = [
    { id: "schedule", icon: Calendar, label: "Consultation Hours & Availability" },
    { id: "notifications", icon: Bell, label: "Urgent Lab Notifications" },
    { id: "security", icon: Shield, label: "Credentials & HIPAA Compliance" },
    { id: "analytics", icon: BarChart3, label: "Clinical Performance & Metrics" },
  ];

  const handleUploadPhoto = async () => {
    if (!doctorId) {
      setDocAlert({
        visible: true,
        type: "warning",
        title: "Sign In Required",
        message: "Sign in as a doctor to upload a profile photo.",
      });
      return;
    }

    const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!permission.granted) {
      setDocAlert({
        visible: true,
        type: "warning",
        title: "Permission Needed",
        message: "Allow photo library access to upload a profile picture.",
      });
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ["images"],
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.65,
      base64: true,
    });

    if (result.canceled || !result.assets[0]?.base64) return;

    const asset = result.assets[0];
    const mime = asset.mimeType || "image/jpeg";
    const dataUrl = `data:${mime};base64,${asset.base64}`;

    setPhotoUploading(true);
    try {
      const res = await fetch(Config.apiDoctorPhoto(doctorId), {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ profilePhotoUrl: dataUrl }),
      });
      const data = await res.json();
      if (!res.ok) {
        setDocAlert({
          visible: true,
          type: "error",
          title: "Upload Failed",
          message: data.error || "Could not save photo.",
        });
        return;
      }
      setProfilePhotoUrl(data.doctor?.profilePhotoUrl || dataUrl);
      setDocAlert({
        visible: true,
        type: "success",
        title: "Photo Updated",
        message: "Patients will see your new profile photo on the dashboard.",
      });
    } catch {
      setDocAlert({
        visible: true,
        type: "error",
        title: "Connection Error",
        message: "Unable to connect to clinical services. Please check your network connection and try again.",
      });
    } finally {
      setPhotoUploading(false);
    }
  };

  const handleSaveDocProfile = () => {
    setDocName(tempName.trim() || "Dr. Taylor Reynolds");
    setSpecialty(tempSpecialty.trim() || "Cardiology & Electrophysiology");
    setHospital(tempHospital.trim() || "MedSync Heart Center");
    setOfficePhone(tempPhone.trim());
    setEditDocModal(false);
    setDocAlert({
      visible: true,
      type: "success",
      title: "Profile Updated",
      message: "Your clinical profile information has been saved.",
    });
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
      {/* Profile Card */}
      <View style={styles.profileCard}>
        <View style={styles.profileTopRow}>
          <TouchableOpacity
            onPress={handleUploadPhoto}
            disabled={photoUploading}
            activeOpacity={0.85}
            style={styles.avatarTouchable}
          >
            <DoctorAvatar
              name={docName}
              avatar={avatarInitials}
              profilePhotoUrl={profilePhotoUrl}
              size={80}
              active
            />
            <View style={styles.cameraBadge}>
              {photoUploading ? (
                <ActivityIndicator size="small" color={Colors.onPrimary} />
              ) : (
                <Camera size={14} color={Colors.onPrimary} />
              )}
            </View>
          </TouchableOpacity>
          <Text style={styles.uploadHint}>Tap photo to upload</Text>
          <TouchableOpacity
            style={styles.editProfilePill}
            onPress={() => {
              setTempName(docName);
              setTempSpecialty(specialty);
              setTempHospital(hospital);
              setTempPhone(officePhone);
              setEditDocModal(true);
            }}
            activeOpacity={0.7}
          >
            <Edit3 size={13} color={Colors.primary} />
            <Text style={styles.editProfilePillText}>Edit Info</Text>
          </TouchableOpacity>
        </View>

        <Text style={styles.name}>{docName}</Text>
        <Text style={styles.specialty}>{specialty}</Text>
        <View style={{ flexDirection: "row", alignItems: "center", gap: 4 }}>
          <Building2 size={13} color={Colors.onSurfaceVariant} />
          <Text style={styles.hospitalText}>{hospital}</Text>
        </View>

        <View style={styles.licBadge}>
          <Award size={14} color={Colors.primary} />
          <Text style={styles.licText}>MED-CA-984210 · Board Certified</Text>
        </View>

        {/* Interactive Stats Row */}
        <View style={styles.statsRow}>
          {stats.map((s, idx) => (
            <React.Fragment key={idx}>
              <TouchableOpacity
                style={styles.statItem}
                onPress={() => setActiveModal(s.id)}
                activeOpacity={0.7}
              >
                <Text style={styles.statValue}>{s.value}</Text>
                <View style={{ flexDirection: "row", alignItems: "center", gap: 2 }}>
                  <Text style={styles.statLabel}>{s.label}</Text>
                  <ChevronRight size={12} color={Colors.outline} />
                </View>
              </TouchableOpacity>
              {idx < stats.length - 1 && <View style={styles.statDivider} />}
            </React.Fragment>
          ))}
        </View>
      </View>

      {/* Menu Card */}
      <View style={styles.menuCard}>
        {menuItems.map((item, idx, arr) => {
          const IconComponent = item.icon;
          return (
            <View key={item.id}>
              <TouchableOpacity style={styles.menuItem} onPress={() => setActiveModal(item.id)} activeOpacity={0.7}>
                <IconComponent size={20} color={Colors.primary} />
                <Text style={styles.menuLabel}>{item.label}</Text>
                <ChevronRight size={18} color={Colors.outline} />
              </TouchableOpacity>
              {idx < arr.length - 1 && <View style={styles.menuDivider} />}
            </View>
          );
        })}
      </View>

      <TouchableOpacity onPress={onSignOut} style={styles.signOutBtn} activeOpacity={0.8}>
        <LogOut size={18} color={Colors.error} />
        <Text style={styles.signOutText}>Sign Out</Text>
      </TouchableOpacity>

      {/* ─── Edit Doctor Info Modal ────────────────────────────────────────── */}
      <Modal visible={editDocModal} animationType="slide" presentationStyle="pageSheet" onRequestClose={() => setEditDocModal(false)}>
        <View style={styles.sheetContainer}>
          <View style={styles.sheetHeader}>
            <Text style={styles.sheetTitle}>Edit Physician Profile</Text>
            <TouchableOpacity onPress={() => setEditDocModal(false)} style={styles.closeBtn}>
              <X size={18} color={Colors.onSurface} />
            </TouchableOpacity>
          </View>
          <ScrollView contentContainerStyle={styles.sheetBody}>
            <View style={styles.formGroup}>
              <Text style={styles.formLabel}>Physician Display Name</Text>
              <TextInput style={styles.formInput} value={tempName} onChangeText={setTempName} />
            </View>
            <View style={styles.formGroup}>
              <Text style={styles.formLabel}>Clinical Specialty</Text>
              <TextInput style={styles.formInput} value={tempSpecialty} onChangeText={setTempSpecialty} />
            </View>
            <View style={styles.formGroup}>
              <Text style={styles.formLabel}>Clinic Facility & Suite</Text>
              <TextInput style={styles.formInput} value={tempHospital} onChangeText={setTempHospital} />
            </View>
            <View style={styles.formGroup}>
              <Text style={styles.formLabel}>Direct Clinic Extension Phone</Text>
              <TextInput style={styles.formInput} value={tempPhone} onChangeText={setTempPhone} keyboardType="phone-pad" />
            </View>
            <TouchableOpacity style={styles.saveBtn} onPress={handleSaveDocProfile}>
              <Save size={18} color={Colors.onPrimary} />
              <Text style={styles.saveBtnText}>Save Profile Updates</Text>
            </TouchableOpacity>
          </ScrollView>
        </View>
      </Modal>

      {/* ─── Patients Stat Modal ───────────────────────────────────────────── */}
      <Modal visible={activeModal === "patients_stat"} animationType="slide" presentationStyle="pageSheet" onRequestClose={() => setActiveModal(null)}>
        <View style={styles.sheetContainer}>
          <View style={styles.sheetHeader}>
            <Text style={styles.sheetTitle}>Active Patient Caseload (124)</Text>
            <TouchableOpacity onPress={() => setActiveModal(null)} style={styles.closeBtn}>
              <X size={18} color={Colors.onSurface} />
            </TouchableOpacity>
          </View>
          <ScrollView contentContainerStyle={styles.sheetBody}>
            <View style={styles.infoCard}>
              <Users size={22} color={Colors.primary} />
              <View style={{ flex: 1 }}>
                <Text style={styles.infoCardTitle}>Clinical Panel Status</Text>
                <Text style={styles.infoCardDesc}>112 stable routine patients · 12 priority follow-ups requiring review.</Text>
              </View>
            </View>
            <Text style={styles.sectionLabel}>PATIENT CASELOAD BREAKDOWN</Text>
            {[
              { category: "Arrhythmia & Atrial Fibrillation", count: "48 patients", status: "Active Care" },
              { category: "Hypertension & Vascular Monitoring", count: "42 patients", status: "Controlled" },
              { category: "Post-Cardiac Intervention", count: "21 patients", status: "Rehabilitation" },
              { category: "Electrophysiology Diagnostics", count: "13 patients", status: "Workup" },
            ].map((item, idx) => (
              <View key={idx} style={styles.rowCard}>
                <View style={{ flex: 1 }}>
                  <Text style={styles.rowTitle}>{item.category}</Text>
                  <Text style={styles.rowSub}>{item.count}</Text>
                </View>
                <View style={styles.badgePill}>
                  <Text style={styles.badgePillText}>{item.status}</Text>
                </View>
              </View>
            ))}
          </ScrollView>
        </View>
      </Modal>

      {/* ─── Rating & Reviews Stat Modal ───────────────────────────────────── */}
      <Modal visible={activeModal === "rating_stat"} animationType="slide" presentationStyle="pageSheet" onRequestClose={() => setActiveModal(null)}>
        <View style={styles.sheetContainer}>
          <View style={styles.sheetHeader}>
            <Text style={styles.sheetTitle}>Patient Feedback & Ratings</Text>
            <TouchableOpacity onPress={() => setActiveModal(null)} style={styles.closeBtn}>
              <X size={18} color={Colors.onSurface} />
            </TouchableOpacity>
          </View>
          <ScrollView contentContainerStyle={styles.sheetBody}>
            <View style={styles.infoCard}>
              <Star size={24} color={Colors.secondary} />
              <View style={{ flex: 1 }}>
                <Text style={styles.infoCardTitle}>Overall Clinical Rating: 4.9 / 5.0</Text>
                <Text style={styles.infoCardDesc}>Based on 248 verified post-consultation patient evaluations.</Text>
              </View>
            </View>
            <Text style={styles.sectionLabel}>VERIFIED PATIENT COMMENTS</Text>
            {[
              { patient: "Sarah J.", rating: 5, date: "Sep 14, 2026", comment: "Dr. Reynolds was exceptionally thorough explaining my ECG results and answering all questions." },
              { patient: "Robert K.", rating: 5, date: "Sep 08, 2026", comment: "Prompt, attentive, and very reassuring bedside manner during my telehealth session." },
              { patient: "Anika P.", rating: 5, date: "Aug 22, 2026", comment: "Great clinical follow-up. The medication adjustment made a noticeable difference." },
            ].map((r, idx) => (
              <View key={idx} style={styles.commentCard}>
                <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center" }}>
                  <Text style={styles.commentAuthor}>{r.patient} · {r.date}</Text>
                  <View style={{ flexDirection: "row", gap: 2 }}>
                    {[...Array(r.rating)].map((_, i) => (
                      <Star key={i} size={13} color={Colors.secondary} fill={Colors.secondary} />
                    ))}
                  </View>
                </View>
                <Text style={styles.commentText}>"{r.comment}"</Text>
              </View>
            ))}
          </ScrollView>
        </View>
      </Modal>

      {/* ─── Experience & Education Stat Modal ─────────────────────────────── */}
      <Modal visible={activeModal === "experience_stat"} animationType="slide" presentationStyle="pageSheet" onRequestClose={() => setActiveModal(null)}>
        <View style={styles.sheetContainer}>
          <View style={styles.sheetHeader}>
            <Text style={styles.sheetTitle}>Clinical Credentials & Education</Text>
            <TouchableOpacity onPress={() => setActiveModal(null)} style={styles.closeBtn}>
              <X size={18} color={Colors.onSurface} />
            </TouchableOpacity>
          </View>
          <ScrollView contentContainerStyle={styles.sheetBody}>
            <View style={styles.infoCard}>
              <GraduationCap size={24} color={Colors.primary} />
              <View style={{ flex: 1 }}>
                <Text style={styles.infoCardTitle}>12 Years Clinical Experience</Text>
                <Text style={styles.infoCardDesc}>Specialized in adult cardiovascular disorders and cardiac electrophysiology.</Text>
              </View>
            </View>
            <Text style={styles.sectionLabel}>EDUCATION & FELLOWSHIPS</Text>
            <View style={styles.rowCard}>
              <View>
                <Text style={styles.rowTitle}>Fellowship in Clinical Cardiac Electrophysiology</Text>
                <Text style={styles.rowSub}>Johns Hopkins University School of Medicine (2014 – 2017)</Text>
              </View>
            </View>
            <View style={styles.rowCard}>
              <View>
                <Text style={styles.rowTitle}>Internal Medicine Residency</Text>
                <Text style={styles.rowSub}>Stanford Health Care (2011 – 2014)</Text>
              </View>
            </View>
            <View style={styles.rowCard}>
              <View>
                <Text style={styles.rowTitle}>Doctor of Medicine (M.D.)</Text>
                <Text style={styles.rowSub}>Columbia University Vagelos College of Physicians and Surgeons (2011)</Text>
              </View>
            </View>
          </ScrollView>
        </View>
      </Modal>

      {/* ─── Schedule Modal ────────────────────────────────────────────────── */}
      <Modal visible={activeModal === "schedule"} transparent animationType="fade" onRequestClose={() => setActiveModal(null)}>
        <View style={styles.modalOverlay}>
          <View style={styles.modalCard}>
            <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center" }}>
              <Text style={styles.modalTitle}>Consultation Hours</Text>
              <TouchableOpacity onPress={() => setActiveModal(null)}>
                <X size={20} color={Colors.outline} />
              </TouchableOpacity>
            </View>
            <Text style={styles.modalBody}>Monday – Friday: 9:00 AM – 5:00 PM</Text>
            <Text style={styles.modalBody}>Live Chat Slots: 11:30 AM & 3:30 PM</Text>
            <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginTop: 8 }}>
              <Text style={styles.modalBody}>Accept Live Chat Bookings</Text>
              <Switch value={telehealthEnabled} onValueChange={setTelehealthEnabled} />
            </View>
            <TouchableOpacity style={styles.modalBtn} onPress={() => setActiveModal(null)}>
              <Text style={styles.modalBtnText}>Done</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* ─── Notifications Modal ───────────────────────────────────────────── */}
      <Modal visible={activeModal === "notifications"} transparent animationType="fade" onRequestClose={() => setActiveModal(null)}>
        <View style={styles.modalOverlay}>
          <View style={styles.modalCard}>
            <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center" }}>
              <Text style={styles.modalTitle}>Urgent Notifications</Text>
              <TouchableOpacity onPress={() => setActiveModal(null)}>
                <X size={20} color={Colors.outline} />
              </TouchableOpacity>
            </View>
            <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginTop: 8 }}>
              <Text style={styles.modalBody}>Critical Lab Alerts (Push)</Text>
              <Switch value={notificationsEnabled} onValueChange={setNotificationsEnabled} />
            </View>
            <TouchableOpacity style={styles.modalBtn} onPress={() => setActiveModal(null)}>
              <Text style={styles.modalBtnText}>Save Preferences</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* ─── Security Modal ────────────────────────────────────────────────── */}
      <Modal visible={activeModal === "security"} transparent animationType="fade" onRequestClose={() => setActiveModal(null)}>
        <View style={styles.modalOverlay}>
          <View style={styles.modalCard}>
            <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center" }}>
              <Text style={styles.modalTitle}>Security & Credentials</Text>
              <TouchableOpacity onPress={() => setActiveModal(null)}>
                <X size={20} color={Colors.outline} />
              </TouchableOpacity>
            </View>
            <Text style={styles.modalBody}>Email: dr.taylor@medsync.clinic</Text>
            <Text style={styles.modalBody}>License: MED-CA-984210 (Verified)</Text>
            <Text style={styles.modalBody}>Status: 256-Bit Encrypted Healthcare Provider</Text>
            <TouchableOpacity style={styles.modalBtn} onPress={() => setActiveModal(null)}>
              <Text style={styles.modalBtnText}>Close</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* ─── Analytics Modal ───────────────────────────────────────────────── */}
      <Modal visible={activeModal === "analytics"} transparent animationType="fade" onRequestClose={() => setActiveModal(null)}>
        <View style={styles.modalOverlay}>
          <View style={styles.modalCard}>
            <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center" }}>
              <Text style={styles.modalTitle}>Clinical Analytics</Text>
              <TouchableOpacity onPress={() => setActiveModal(null)}>
                <X size={20} color={Colors.outline} />
              </TouchableOpacity>
            </View>
            <Text style={styles.modalBody}>Monthly Encounters: 124 completed</Text>
            <Text style={styles.modalBody}>Patient Satisfaction: 98.4%</Text>
            <Text style={styles.modalBody}>AI Diagnostic Agreement: 94.2%</Text>
            <TouchableOpacity style={styles.modalBtn} onPress={() => setActiveModal(null)}>
              <Text style={styles.modalBtnText}>Close</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* Themed Doctor Alert Modal */}
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
  profileCard: { backgroundColor: Colors.surfaceContainerLowest, borderRadius: Radius.xxl, padding: Spacing.md, alignItems: "center", gap: 8, shadowColor: "#000", shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.06, shadowRadius: 16, elevation: 3 },
  profileTopRow: { width: "100%", alignItems: "center", position: "relative" },
  avatarTouchable: { position: "relative", marginBottom: 4 },
  cameraBadge: {
    position: "absolute",
    bottom: 0,
    right: 0,
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: Colors.primary,
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 2,
    borderColor: Colors.surfaceContainerLowest,
  },
  uploadHint: { fontSize: 10, color: Colors.onSurfaceVariant, fontFamily: FontFamily.bodyRegular, marginBottom: 4 },
  avatarCircle: { width: 80, height: 80, borderRadius: 40, backgroundColor: Colors.tertiary, justifyContent: "center", alignItems: "center" },
  avatarText: { fontSize: 28, color: Colors.onTertiary, fontFamily: FontFamily.headlineBold },
  editProfilePill: { position: "absolute", right: 0, top: 0, flexDirection: "row", alignItems: "center", gap: 4, backgroundColor: Colors.surfaceContainerLow, paddingHorizontal: 10, paddingVertical: 5, borderRadius: Radius.full, borderWidth: 1, borderColor: Colors.outlineVariant },
  editProfilePillText: { fontSize: FontSize.bodySm, color: Colors.primary, fontFamily: FontFamily.bodySemiBold },
  name: { fontSize: FontSize.headlineSm, color: Colors.onSurface, fontFamily: FontFamily.headlineSemiBold },
  specialty: { fontSize: FontSize.bodyMd, color: Colors.onSurfaceVariant, fontFamily: FontFamily.bodyRegular, textAlign: "center" },
  hospitalText: { fontSize: FontSize.bodySm, color: Colors.onSurfaceVariant, fontFamily: FontFamily.bodyRegular },
  licBadge: { flexDirection: "row", alignItems: "center", gap: 6, backgroundColor: Colors.surfaceContainerLow, paddingHorizontal: 12, paddingVertical: 6, borderRadius: Radius.full },
  licText: { fontSize: FontSize.dataMono, color: Colors.onSurfaceVariant, fontFamily: FontFamily.dataMonoBold },
  statsRow: { flexDirection: "row", width: "100%", paddingTop: 8 },
  statItem: { flex: 1, alignItems: "center" },
  statValue: { fontSize: FontSize.headlineSm, color: Colors.tertiary, fontFamily: FontFamily.dataMonoBold },
  statLabel: { fontSize: FontSize.bodySm, color: Colors.onSurfaceVariant, fontFamily: FontFamily.bodyRegular },
  statDivider: { width: 1, backgroundColor: Colors.surfaceContainerHigh, marginVertical: 4 },
  menuCard: { backgroundColor: Colors.surfaceContainerLowest, borderRadius: Radius.xl, overflow: "hidden" },
  menuItem: { flexDirection: "row", alignItems: "center", gap: Spacing.sm, padding: Spacing.sm },
  menuLabel: { flex: 1, fontSize: FontSize.bodyMd, color: Colors.onSurface, fontFamily: FontFamily.bodyMedium },
  menuDivider: { height: 1, backgroundColor: Colors.surfaceContainerLow, marginHorizontal: Spacing.sm },
  signOutBtn: { height: 48, borderRadius: Radius.xl, borderWidth: 1.5, borderColor: Colors.error, flexDirection: "row", justifyContent: "center", alignItems: "center", gap: 8 },
  signOutText: { fontSize: FontSize.labelLg, color: Colors.error, fontFamily: FontFamily.bodySemiBold },
  // Modal Overlays
  modalOverlay: { flex: 1, backgroundColor: "rgba(0,0,0,0.5)", justifyContent: "center", alignItems: "center", padding: Spacing.md },
  modalCard: { width: "100%", maxWidth: 360, backgroundColor: Colors.surfaceContainerLowest, borderRadius: Radius.xxl, padding: Spacing.md, gap: Spacing.xs },
  modalTitle: { fontSize: FontSize.headlineSm, color: Colors.onSurface, fontFamily: FontFamily.headlineSemiBold },
  modalBody: { fontSize: FontSize.bodyMd, color: Colors.onSurfaceVariant, fontFamily: FontFamily.bodyRegular, marginVertical: 2 },
  modalBtn: { height: 42, backgroundColor: Colors.primary, borderRadius: Radius.lg, justifyContent: "center", alignItems: "center", marginTop: 10 },
  modalBtnText: { fontSize: FontSize.labelMd, color: Colors.onPrimary, fontFamily: FontFamily.bodySemiBold },
  // Sheet Modals
  sheetContainer: { flex: 1, backgroundColor: Colors.surface },
  sheetHeader: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", paddingHorizontal: Spacing.md, paddingVertical: Spacing.sm, backgroundColor: Colors.surfaceContainerLowest, borderBottomWidth: 1, borderBottomColor: Colors.surfaceContainerHigh },
  sheetTitle: { fontSize: FontSize.headlineSm, color: Colors.onSurface, fontFamily: FontFamily.headlineSemiBold },
  closeBtn: { width: 36, height: 36, borderRadius: 18, backgroundColor: Colors.surfaceContainerHigh, justifyContent: "center", alignItems: "center" },
  sheetBody: { padding: Spacing.md, gap: Spacing.sm, paddingBottom: 40 },
  sectionLabel: { fontSize: FontSize.dataMono, color: Colors.outline, fontFamily: FontFamily.dataMonoBold, textTransform: "uppercase", letterSpacing: 1, marginTop: 6 },
  infoCard: { flexDirection: "row", alignItems: "center", gap: Spacing.sm, backgroundColor: Colors.primaryFixed + "33", borderRadius: Radius.xl, padding: Spacing.sm, borderWidth: 1, borderColor: Colors.primary + "33" },
  infoCardTitle: { fontSize: FontSize.labelLg, color: Colors.primary, fontFamily: FontFamily.bodySemiBold },
  infoCardDesc: { fontSize: FontSize.bodySm, color: Colors.onSurfaceVariant, fontFamily: FontFamily.bodyRegular, marginTop: 2 },
  rowCard: { backgroundColor: Colors.surfaceContainerLowest, borderRadius: Radius.xl, padding: Spacing.sm, flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
  rowTitle: { fontSize: FontSize.bodyMd, color: Colors.onSurface, fontFamily: FontFamily.bodySemiBold },
  rowSub: { fontSize: FontSize.bodySm, color: Colors.outline, fontFamily: FontFamily.bodyRegular, marginTop: 2 },
  badgePill: { backgroundColor: Colors.secondaryContainer + "55", paddingHorizontal: 8, paddingVertical: 3, borderRadius: Radius.full },
  badgePillText: { fontSize: 10, color: Colors.secondary, fontFamily: FontFamily.bodySemiBold },
  commentCard: { backgroundColor: Colors.surfaceContainerLowest, borderRadius: Radius.xl, padding: Spacing.sm, gap: 6 },
  commentAuthor: { fontSize: FontSize.bodySm, color: Colors.outline, fontFamily: FontFamily.dataMono },
  commentText: { fontSize: FontSize.bodyMd, color: Colors.onSurface, fontFamily: FontFamily.bodyRegular, fontStyle: "italic" },
  formGroup: { gap: 4 },
  formLabel: { fontSize: FontSize.labelMd, color: Colors.onSurfaceVariant, fontFamily: FontFamily.bodyMedium },
  formInput: { height: 46, backgroundColor: Colors.surfaceContainerLowest, borderRadius: Radius.lg, borderWidth: 1, borderColor: Colors.outlineVariant, paddingHorizontal: Spacing.sm, fontSize: FontSize.bodyMd, color: Colors.onSurface, fontFamily: FontFamily.bodyRegular },
  saveBtn: { height: 48, backgroundColor: Colors.primary, borderRadius: Radius.xl, flexDirection: "row", justifyContent: "center", alignItems: "center", gap: 8, marginTop: 10 },
  saveBtnText: { fontSize: FontSize.labelLg, color: Colors.onPrimary, fontFamily: FontFamily.bodySemiBold },
});
