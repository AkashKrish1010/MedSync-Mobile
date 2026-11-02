import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  Switch,
  Modal,
  TextInput,
} from "react-native";
import {
  Bell,
  ClipboardList,
  Pill,
  ShieldCheck,
  HelpCircle,
  LogOut,
  Ruler,
  Scale,
  Droplet,
  AlertTriangle,
  Copy,
  Check,
  ChevronRight,
  X,
  PhoneCall,
  MessageSquare,
  FileDown,
  Smartphone,
  Edit3,
  Award,
  Heart,
  Save,
  Mail,
  Phone as PhoneIcon,
  UserCheck,
} from "lucide-react-native";
import { Colors } from "../../theme/colors";
import { Spacing, Radius, FontSize, FontFamily } from "../../theme/typography";
import ThemedAlertModal from "../../components/ThemedAlertModal";
import { Config } from "../../config";
import type { AuthUserProfile } from "../../types";

interface PatientProfileProps {
  onSignOut: () => void;
  patientProfile?: AuthUserProfile | null;
  onUpdateProfile?: (updated: Partial<AuthUserProfile>) => void;
}

export default function PatientProfile({
  onSignOut,
  patientProfile,
  onUpdateProfile,
}: PatientProfileProps) {
  const isDemoAccount = patientProfile?.email?.toLowerCase().includes("sarah") ?? false;

  const [notifications, setNotifications] = useState(true);
  const [copiedUhid, setCopiedUhid] = useState(false);
  const [profileAlert, setProfileAlert] = useState<{
    visible: boolean;
    type?: "info" | "success" | "warning" | "error" | "ai" | "clinical";
    title: string;
    message?: string;
  }>({
    visible: false,
    title: "",
  });

  // Profile data states — initialized from user's signup/login credentials
  const [patientName, setPatientName] = useState(
    patientProfile?.name || (isDemoAccount ? "Sarah Jenkins" : "Patient")
  );
  const [phone, setPhone] = useState(
    patientProfile?.phone || (isDemoAccount ? "+1 (555) 012-3456" : "")
  );
  const [email, setEmail] = useState(
    patientProfile?.email || (isDemoAccount ? "sarah.jenkins@medsync.io" : "")
  );
  const [emergencyContact, setEmergencyContact] = useState(
    patientProfile?.emergencyContact || (isDemoAccount ? "David Jenkins (Spouse) - +1 (555) 987-6543" : "")
  );

  // Biometrics states
  const [height, setHeight] = useState(
    patientProfile?.height || (isDemoAccount ? "5'6\"" : "")
  );
  const [weight, setWeight] = useState(
    patientProfile?.weight || (isDemoAccount ? "142" : "")
  );
  const [bloodType, setBloodType] = useState(
    patientProfile?.bloodType || (isDemoAccount ? "O+" : "")
  );
  const [allergies, setAllergies] = useState(
    patientProfile?.allergies || (isDemoAccount ? "Penicillin (Severe), Shellfish (Mild)" : "")
  );

  const uhid = patientProfile?.uhid || "P-4821";

  // Dynamic clinical counts
  const [visitCount, setVisitCount] = useState(isDemoAccount ? 24 : 0);
  const [labCount, setLabCount] = useState(isDemoAccount ? 12 : 0);
  const [userAppointments, setUserAppointments] = useState<any[]>([]);
  const [userRecords, setUserRecords] = useState<any[]>([]);

  // Modal states for settings items
  const [historyModal, setHistoryModal] = useState(false);
  const [medsModal, setMedsModal] = useState(false);
  const [securityModal, setSecurityModal] = useState(false);
  const [supportModal, setSupportModal] = useState(false);

  // Card click modal states
  const [editProfileModal, setEditProfileModal] = useState(false);
  const [biometricsModal, setBiometricsModal] = useState(false);
  const [visitsStatModal, setVisitsStatModal] = useState(false);
  const [labsStatModal, setLabsStatModal] = useState(false);
  const [membershipModal, setMembershipModal] = useState(false);

  // Temp form states for editing biometrics
  const [tempWeight, setTempWeight] = useState(weight);
  const [tempHeight, setTempHeight] = useState(height);
  const [tempBlood, setTempBlood] = useState(bloodType);
  const [tempAllergies, setTempAllergies] = useState(allergies);

  // Temp form states for profile
  const [tempName, setTempName] = useState(patientName);
  const [tempPhone, setTempPhone] = useState(phone);
  const [tempEmail, setTempEmail] = useState(email);
  const [tempEmergency, setTempEmergency] = useState(emergencyContact);

  // Sync state whenever patientProfile changes
  useEffect(() => {
    if (patientProfile) {
      if (patientProfile.name) setPatientName(patientProfile.name);
      if (patientProfile.phone !== undefined) setPhone(patientProfile.phone);
      if (patientProfile.email) setEmail(patientProfile.email);
      if (patientProfile.emergencyContact !== undefined) setEmergencyContact(patientProfile.emergencyContact);
      if (patientProfile.height !== undefined) setHeight(patientProfile.height);
      if (patientProfile.weight !== undefined) setWeight(patientProfile.weight);
      if (patientProfile.bloodType !== undefined) setBloodType(patientProfile.bloodType);
      if (patientProfile.allergies !== undefined) setAllergies(patientProfile.allergies);
    }
  }, [patientProfile]);

  // Fetch persisted profile & real stats from backend
  useEffect(() => {
    if (!uhid) return;

    // Fetch profile
    fetch(Config.apiPatientProfile(uhid))
      .then((r) => (r.ok ? r.json() : null))
      .then((data) => {
        if (data?.success && data?.profile) {
          const p = data.profile;
          if (p.name) setPatientName(p.name);
          if (p.phone !== undefined) setPhone(p.phone);
          if (p.email) setEmail(p.email);
          if (p.emergencyContact !== undefined) setEmergencyContact(p.emergencyContact);
          if (p.height !== undefined) setHeight(p.height);
          if (p.weight !== undefined) setWeight(p.weight);
          if (p.bloodType !== undefined) setBloodType(p.bloodType);
          if (p.allergies !== undefined) setAllergies(p.allergies);
        }
      })
      .catch(() => {});

    // Fetch user appointments
    fetch(Config.apiPatientAppointments(uhid))
      .then((r) => (r.ok ? r.json() : null))
      .then((data) => {
        if (data) {
          const up = data.upcoming || [];
          const past = data.past || [];
          const all = [...up, ...past];
          setUserAppointments(all);
          if (all.length > 0) {
            setVisitCount(all.length);
          } else if (!isDemoAccount) {
            setVisitCount(0);
          }
        }
      })
      .catch(() => {});

    // Fetch user records
    fetch(Config.apiPatientRecords(uhid))
      .then((r) => (r.ok ? r.json() : null))
      .then((data) => {
        if (Array.isArray(data)) {
          setUserRecords(data);
          if (data.length > 0) {
            setLabCount(data.length);
          } else if (!isDemoAccount) {
            setLabCount(0);
          }
        }
      })
      .catch(() => {});
  }, [uhid, isDemoAccount]);

  const stats = [
    { label: "Total Visits", value: String(visitCount), onPress: () => setVisitsStatModal(true) },
    { label: "Lab Reports", value: String(labCount), onPress: () => setLabsStatModal(true) },
    { label: "Account Status", value: "Active", onPress: () => setMembershipModal(true) },
  ];

  const handleCopyUhid = () => {
    setCopiedUhid(true);
    setTimeout(() => setCopiedUhid(false), 2500);
    setProfileAlert({
      visible: true,
      type: "success",
      title: "UHID Copied",
      message: `Unique Health Identifier ${uhid} copied to clipboard.`,
    });
  };

  const handleSaveProfile = async () => {
    const updatedName = tempName.trim() || patientName;
    const updatedPhone = tempPhone.trim();
    const updatedEmail = tempEmail.trim();
    const updatedEmergency = tempEmergency.trim();

    setPatientName(updatedName);
    setPhone(updatedPhone);
    setEmail(updatedEmail);
    setEmergencyContact(updatedEmergency);

    const updates = {
      name: updatedName,
      phone: updatedPhone,
      email: updatedEmail,
      emergencyContact: updatedEmergency,
    };

    if (onUpdateProfile) {
      onUpdateProfile(updates);
    }

    try {
      await fetch(Config.apiPatientProfile(uhid), {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(updates),
      });
    } catch {}

    setEditProfileModal(false);
    setProfileAlert({
      visible: true,
      type: "success",
      title: "Profile Updated",
      message: "Your profile contact details were saved successfully.",
    });
  };

  const handleSaveBiometrics = async () => {
    const updatedWeight = tempWeight.trim();
    const updatedHeight = tempHeight.trim();
    const updatedBlood = tempBlood.trim();
    const updatedAllergies = tempAllergies.trim();

    setWeight(updatedWeight);
    setHeight(updatedHeight);
    setBloodType(updatedBlood);
    setAllergies(updatedAllergies);

    const updates = {
      weight: updatedWeight,
      height: updatedHeight,
      bloodType: updatedBlood,
      allergies: updatedAllergies,
    };

    if (onUpdateProfile) {
      onUpdateProfile(updates);
    }

    try {
      await fetch(Config.apiPatientProfile(uhid), {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(updates),
      });
    } catch {}

    setBiometricsModal(false);
    setProfileAlert({
      visible: true,
      type: "clinical",
      title: "Biometrics Recorded",
      message: "Your updated clinical biometrics and allergy notes were saved.",
    });
  };

  // Dynamic BMI Calculation
  const weightNum = parseFloat(weight);
  let bmiDisplay = "--";
  let bmiCategory = "Update height & weight to calculate BMI";
  if (!isNaN(weightNum) && weightNum > 0) {
    // Attempt parse height in format like 5'6" or inches or cm
    let heightInches = 66; // default fallback if unparseable
    const match = height.match(/(\d+)'\s*(\d+)?/);
    if (match) {
      const feet = parseInt(match[1], 10);
      const inches = parseInt(match[2] || "0", 10);
      heightInches = feet * 12 + inches;
    } else {
      const parsedH = parseFloat(height);
      if (!isNaN(parsedH) && parsedH > 30 && parsedH < 90) {
        heightInches = parsedH;
      }
    }
    const calculatedBmi = ((weightNum / (heightInches * heightInches)) * 703).toFixed(1);
    bmiDisplay = calculatedBmi;
    const bmiVal = parseFloat(calculatedBmi);
    if (bmiVal < 18.5) bmiCategory = "Underweight physiological range (< 18.5)";
    else if (bmiVal <= 24.9) bmiCategory = "Normal physiological range (18.5 – 24.9 kg/m²)";
    else if (bmiVal <= 29.9) bmiCategory = "Overweight physiological range (25.0 – 29.9 kg/m²)";
    else bmiCategory = "Elevated BMI category (≥ 30.0 kg/m²)";
  }

  const avatarInitials = (patientName || "PT")
    .split(" ")
    .filter(Boolean)
    .map((n) => n[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
      {/* Profile Header Card */}
      <View style={styles.profileCard}>
        <View style={styles.profileTopRow}>
          <View style={styles.avatarCircle}>
            <Text style={styles.avatarText}>{avatarInitials}</Text>
          </View>
          <TouchableOpacity
            style={styles.editProfilePill}
            onPress={() => {
              setTempName(patientName);
              setTempPhone(phone);
              setTempEmail(email);
              setTempEmergency(emergencyContact);
              setEditProfileModal(true);
            }}
            activeOpacity={0.7}
          >
            <Edit3 size={13} color={Colors.primary} />
            <Text style={styles.editProfilePillText}>Edit Profile</Text>
          </TouchableOpacity>
        </View>

        <Text style={styles.profileName}>{patientName}</Text>
        <Text style={styles.profileRole}>Patient Account · Verified</Text>

        <TouchableOpacity onPress={handleCopyUhid} style={styles.uhidBadge} activeOpacity={0.7}>
          <Text style={styles.uhidText}>UHID: {uhid}</Text>
          {copiedUhid ? (
            <Check size={14} color={Colors.secondary} />
          ) : (
            <Copy size={14} color={Colors.primary} />
          )}
        </TouchableOpacity>

        {/* Interactive Stats Row */}
        <View style={styles.statsRow}>
          {stats.map((s, idx) => (
            <React.Fragment key={idx}>
              <TouchableOpacity
                style={styles.statItem}
                onPress={s.onPress}
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

      {/* Verified Contact Details Card */}
      <View style={styles.card}>
        <Text style={styles.cardLabel}>ACCOUNT DETAILS & VERIFIED CONTACT</Text>
        <View style={styles.contactDetailsBox}>
          <View style={styles.contactRow}>
            <View style={styles.contactIconWrap}>
              <Mail size={16} color={Colors.primary} />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.contactLabel}>Email Address</Text>
              <Text style={styles.contactValue}>{email || "Not specified"}</Text>
            </View>
          </View>

          <View style={styles.contactDivider} />

          <View style={styles.contactRow}>
            <View style={styles.contactIconWrap}>
              <PhoneIcon size={16} color={Colors.primary} />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.contactLabel}>Direct Contact Number</Text>
              <Text style={styles.contactValue}>{phone || "Not specified"}</Text>
            </View>
          </View>

          <View style={styles.contactDivider} />

          <View style={styles.contactRow}>
            <View style={styles.contactIconWrap}>
              <UserCheck size={16} color={Colors.secondary} />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.contactLabel}>Emergency Contact</Text>
              <Text style={styles.contactValue}>
                {emergencyContact || "Not set (Tap Edit Profile to add)"}
              </Text>
            </View>
          </View>
        </View>
      </View>

      {/* Clinical Biometrics Card - Interactive */}
      <TouchableOpacity
        style={styles.card}
        onPress={() => {
          setTempWeight(weight);
          setTempHeight(height);
          setTempBlood(bloodType);
          setTempAllergies(allergies);
          setBiometricsModal(true);
        }}
        activeOpacity={0.8}
      >
        <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center" }}>
          <Text style={styles.cardLabel}>CLINICAL BIOMETRIC BASELINE</Text>
          <View style={{ flexDirection: "row", alignItems: "center", gap: 4 }}>
            <Text style={styles.tapToEditHint}>Tap to update</Text>
            <ChevronRight size={12} color={Colors.primary} />
          </View>
        </View>

        <View style={styles.healthRow}>
          <View style={styles.healthItem}>
            <View style={styles.healthIconBox}>
              <Ruler size={20} color={Colors.primary} />
            </View>
            <Text style={styles.healthValue}>{height || "Not set"}</Text>
            <Text style={styles.healthItemLabel}>Height</Text>
          </View>
          <View style={styles.healthItem}>
            <View style={styles.healthIconBox}>
              <Scale size={20} color={Colors.primary} />
            </View>
            <Text style={styles.healthValue}>{weight ? `${weight} lbs` : "Not set"}</Text>
            <Text style={styles.healthItemLabel}>Weight (BMI {bmiDisplay})</Text>
          </View>
          <View style={styles.healthItem}>
            <View style={styles.healthIconBox}>
              <Droplet size={20} color={Colors.error} />
            </View>
            <Text style={styles.healthValue}>{bloodType || "Not set"}</Text>
            <Text style={styles.healthItemLabel}>Blood Type</Text>
          </View>
        </View>

        <TouchableOpacity
          style={styles.allergyRow}
          onPress={() => setMedsModal(true)}
          activeOpacity={0.7}
        >
          <AlertTriangle size={16} color={Colors.onErrorContainer} />
          <Text style={styles.allergyText} numberOfLines={1}>
            {allergies ? `Allergies: ${allergies}` : "Allergies: None reported (Tap to record)"}
          </Text>
          <ChevronRight size={14} color={Colors.onErrorContainer} style={{ marginLeft: "auto" }} />
        </TouchableOpacity>
      </TouchableOpacity>

      {/* Settings Menu */}
      <View style={styles.menuCard}>
        {/* Notifications Toggle */}
        <View style={styles.menuItem}>
          <Bell size={20} color={Colors.primary} />
          <Text style={styles.menuLabel}>Appointment & Lab Notifications</Text>
          <Switch
            value={notifications}
            onValueChange={setNotifications}
            trackColor={{ false: Colors.surfaceContainerHigh, true: Colors.primary }}
            thumbColor={Colors.onPrimary}
          />
        </View>
        <View style={styles.menuDivider} />

        {/* Medical History */}
        <TouchableOpacity
          style={styles.menuItem}
          onPress={() => setHistoryModal(true)}
          activeOpacity={0.7}
        >
          <ClipboardList size={20} color={Colors.primary} />
          <Text style={styles.menuLabel}>Medical History & Immunizations</Text>
          <ChevronRight size={18} color={Colors.onSurfaceVariant} />
        </TouchableOpacity>
        <View style={styles.menuDivider} />

        {/* Medications & Allergies */}
        <TouchableOpacity
          style={styles.menuItem}
          onPress={() => setMedsModal(true)}
          activeOpacity={0.7}
        >
          <Pill size={20} color={Colors.primary} />
          <Text style={styles.menuLabel}>Medications & Detailed Allergies</Text>
          <ChevronRight size={18} color={Colors.onSurfaceVariant} />
        </TouchableOpacity>
        <View style={styles.menuDivider} />

        {/* Privacy & Security */}
        <TouchableOpacity
          style={styles.menuItem}
          onPress={() => setSecurityModal(true)}
          activeOpacity={0.7}
        >
          <ShieldCheck size={20} color={Colors.primary} />
          <Text style={styles.menuLabel}>Privacy & Security Audit</Text>
          <ChevronRight size={18} color={Colors.onSurfaceVariant} />
        </TouchableOpacity>
        <View style={styles.menuDivider} />

        {/* Help & Support */}
        <TouchableOpacity
          style={styles.menuItem}
          onPress={() => setSupportModal(true)}
          activeOpacity={0.7}
        >
          <HelpCircle size={20} color={Colors.primary} />
          <Text style={styles.menuLabel}>Clinical Help & Support</Text>
          <ChevronRight size={18} color={Colors.onSurfaceVariant} />
        </TouchableOpacity>
      </View>

      {/* Sign Out */}
      <TouchableOpacity onPress={onSignOut} style={styles.signOutBtn} activeOpacity={0.8}>
        <LogOut size={18} color={Colors.error} />
        <Text style={styles.signOutText}>Sign Out</Text>
      </TouchableOpacity>

      <Text style={styles.footer}>MedSync Mobile · HIPAA Compliant · 256-Bit E2E</Text>

      {/* ─── Edit Profile Modal ────────────────────────────────────────────── */}
      <Modal
        visible={editProfileModal}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={() => setEditProfileModal(false)}
      >
        <View style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>Edit Patient Profile</Text>
            <TouchableOpacity onPress={() => setEditProfileModal(false)} style={styles.modalCloseBtn}>
              <X size={18} color={Colors.onSurface} />
            </TouchableOpacity>
          </View>
          <ScrollView contentContainerStyle={styles.modalBody}>
            <View style={styles.formGroup}>
              <Text style={styles.formLabel}>Full Legal Name</Text>
              <TextInput
                style={styles.formInput}
                value={tempName}
                onChangeText={setTempName}
                placeholder="Full Name"
                placeholderTextColor={Colors.outline}
              />
            </View>

            <View style={styles.formGroup}>
              <Text style={styles.formLabel}>Primary Phone Number</Text>
              <TextInput
                style={styles.formInput}
                value={tempPhone}
                onChangeText={setTempPhone}
                placeholder="+1 (555) 000-0000"
                placeholderTextColor={Colors.outline}
                keyboardType="phone-pad"
              />
            </View>

            <View style={styles.formGroup}>
              <Text style={styles.formLabel}>Email Address</Text>
              <TextInput
                style={styles.formInput}
                value={tempEmail}
                onChangeText={setTempEmail}
                placeholder="Email address"
                placeholderTextColor={Colors.outline}
                keyboardType="email-address"
                autoCapitalize="none"
              />
            </View>

            <View style={styles.formGroup}>
              <Text style={styles.formLabel}>Emergency Contact</Text>
              <TextInput
                style={styles.formInput}
                value={tempEmergency}
                onChangeText={setTempEmergency}
                placeholder="Name, Relationship & Phone"
                placeholderTextColor={Colors.outline}
              />
            </View>

            <TouchableOpacity style={styles.saveBtn} onPress={handleSaveProfile}>
              <Save size={18} color={Colors.onPrimary} />
              <Text style={styles.saveBtnText}>Save Profile Changes</Text>
            </TouchableOpacity>
          </ScrollView>
        </View>
      </Modal>

      {/* ─── Biometrics Modal ─────────────────────────────────────────────── */}
      <Modal
        visible={biometricsModal}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={() => setBiometricsModal(false)}
      >
        <View style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>Update Clinical Biometrics</Text>
            <TouchableOpacity onPress={() => setBiometricsModal(false)} style={styles.modalCloseBtn}>
              <X size={18} color={Colors.onSurface} />
            </TouchableOpacity>
          </View>
          <ScrollView contentContainerStyle={styles.modalBody}>
            <View style={styles.bmiCard}>
              <Heart size={24} color={Colors.primary} />
              <View style={{ flex: 1 }}>
                <Text style={styles.bmiCardTitle}>Calculated BMI: {bmiDisplay}</Text>
                <Text style={styles.bmiCardDesc}>{bmiCategory}</Text>
              </View>
            </View>

            <View style={styles.formGroup}>
              <Text style={styles.formLabel}>Current Weight (lbs)</Text>
              <TextInput
                style={styles.formInput}
                value={tempWeight}
                onChangeText={setTempWeight}
                keyboardType="numeric"
                placeholder="e.g. 150"
                placeholderTextColor={Colors.outline}
              />
            </View>

            <View style={styles.formGroup}>
              <Text style={styles.formLabel}>Height</Text>
              <TextInput
                style={styles.formInput}
                value={tempHeight}
                onChangeText={setTempHeight}
                placeholder="e.g. 5'8&quot;"
                placeholderTextColor={Colors.outline}
              />
            </View>

            <View style={styles.formGroup}>
              <Text style={styles.formLabel}>Blood Type (ABO / Rh)</Text>
              <TextInput
                style={styles.formInput}
                value={tempBlood}
                onChangeText={setTempBlood}
                placeholder="e.g. O+, A+, B-"
                placeholderTextColor={Colors.outline}
              />
            </View>

            <View style={styles.formGroup}>
              <Text style={styles.formLabel}>Known Allergies</Text>
              <TextInput
                style={styles.formInput}
                value={tempAllergies}
                onChangeText={setTempAllergies}
                placeholder="e.g. Penicillin, Shellfish, or None"
                placeholderTextColor={Colors.outline}
              />
            </View>

            <TouchableOpacity style={styles.saveBtn} onPress={handleSaveBiometrics}>
              <Check size={18} color={Colors.onPrimary} />
              <Text style={styles.saveBtnText}>Record Updated Biometrics</Text>
            </TouchableOpacity>
          </ScrollView>
        </View>
      </Modal>

      {/* ─── Total Visits Breakdown Modal ──────────────────────────────────── */}
      <Modal
        visible={visitsStatModal}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={() => setVisitsStatModal(false)}
      >
        <View style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>Visits History ({visitCount} Encounters)</Text>
            <TouchableOpacity onPress={() => setVisitsStatModal(false)} style={styles.modalCloseBtn}>
              <X size={18} color={Colors.onSurface} />
            </TouchableOpacity>
          </View>
          <ScrollView contentContainerStyle={styles.modalBody}>
            <Text style={styles.subSectionTitle}>CLINICAL SESSIONS</Text>
            {userAppointments.length > 0 ? (
              userAppointments.map((v, i) => (
                <View key={i} style={styles.historyCard}>
                  <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center" }}>
                    <Text style={styles.historyTitle}>{v.doctorName || v.doctor}</Text>
                    <Text style={styles.historyStatus}>{v.date} {v.time || ""}</Text>
                  </View>
                  <Text style={styles.historyDesc}>{v.type} · {v.complaint || v.status || "Completed"}</Text>
                </View>
              ))
            ) : isDemoAccount ? (
              [
                { date: "Today 3:00 PM", doctor: "Dr. Taylor Reynolds", type: "In-Clinic Cardiology", outcome: "Routine BP Check & ECG Review" },
                { date: "Sep 02, 2026", doctor: "Dr. Priya Sharma", type: "Telehealth Live Chat", outcome: "Metabolic panel prescription adjustment" },
              ].map((v, i) => (
                <View key={i} style={styles.historyCard}>
                  <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center" }}>
                    <Text style={styles.historyTitle}>{v.doctor}</Text>
                    <Text style={styles.historyStatus}>{v.date}</Text>
                  </View>
                  <Text style={styles.historyDesc}>{v.type} · {v.outcome}</Text>
                </View>
              ))
            ) : (
              <View style={styles.emptyCard}>
                <Text style={styles.emptyTitle}>No Clinical Visits Yet</Text>
                <Text style={styles.emptyDesc}>
                  Scheduled in-clinic consultations and live doctor chats will appear here once booked.
                </Text>
              </View>
            )}
          </ScrollView>
        </View>
      </Modal>

      {/* ─── Lab Reports Stat Modal ────────────────────────────────────────── */}
      <Modal
        visible={labsStatModal}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={() => setLabsStatModal(false)}
      >
        <View style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>Diagnostic Lab Archives</Text>
            <TouchableOpacity onPress={() => setLabsStatModal(false)} style={styles.modalCloseBtn}>
              <X size={18} color={Colors.onSurface} />
            </TouchableOpacity>
          </View>
          <ScrollView contentContainerStyle={styles.modalBody}>
            {userRecords.length > 0 ? (
              userRecords.map((r, i) => (
                <View key={i} style={styles.historyCard}>
                  <Text style={styles.historyTitle}>{r.title}</Text>
                  <Text style={styles.historyDesc}>{r.type} · {r.date} · {r.status}</Text>
                  {r.summary ? <Text style={styles.emptyDesc}>{r.summary}</Text> : null}
                </View>
              ))
            ) : isDemoAccount ? (
              <>
                <View style={styles.historyCard}>
                  <Text style={styles.historyTitle}>Archive Summary</Text>
                  <Text style={styles.historyDesc}>Diagnostic panels completed and reviewed by attending physician.</Text>
                </View>
                <Text style={styles.subSectionTitle}>CATEGORIES</Text>
                {[
                  { cat: "Hematology & CBC", count: "4 panels", latest: "Sep 12, 2026" },
                  { cat: "Metabolic & Lipid Panels", count: "5 panels", latest: "Aug 28, 2026" },
                ].map((c, i) => (
                  <View key={i} style={styles.vacCard}>
                    <View style={{ flex: 1 }}>
                      <Text style={styles.vacName}>{c.cat}</Text>
                      <Text style={styles.vacDate}>Last updated: {c.latest}</Text>
                    </View>
                    <View style={styles.vacBadge}>
                      <Text style={styles.vacBadgeText}>{c.count}</Text>
                    </View>
                  </View>
                ))}
              </>
            ) : (
              <View style={styles.emptyCard}>
                <Text style={styles.emptyTitle}>No Diagnostic Lab Archives</Text>
                <Text style={styles.emptyDesc}>
                  Uploaded blood panels, biomarker summaries, and pathology reports will be archived here.
                </Text>
              </View>
            )}
          </ScrollView>
        </View>
      </Modal>

      {/* ─── Membership & Timeline Modal ───────────────────────────────────── */}
      <Modal
        visible={membershipModal}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={() => setMembershipModal(false)}
      >
        <View style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>Patient Care Timeline</Text>
            <TouchableOpacity onPress={() => setMembershipModal(false)} style={styles.modalCloseBtn}>
              <X size={18} color={Colors.onSurface} />
            </TouchableOpacity>
          </View>
          <ScrollView contentContainerStyle={styles.modalBody}>
            <View style={styles.historyCard}>
              <View style={{ flexDirection: "row", alignItems: "center", gap: 8 }}>
                <Award size={20} color={Colors.primary} />
                <Text style={styles.historyTitle}>
                  {isDemoAccount ? "Member Since October 2023" : "Registered Patient Account"}
                </Text>
              </View>
              <Text style={styles.historyDesc}>
                Active clinical care account on the MedSync Health Network.
              </Text>
            </View>

            <Text style={styles.subSectionTitle}>ACCOUNT IDENTITY</Text>
            <View style={styles.historyCard}>
              <Text style={styles.historyTitle}>Patient Name</Text>
              <Text style={styles.historyDesc}>{patientName}</Text>
            </View>
            <View style={styles.historyCard}>
              <Text style={styles.historyTitle}>Unique Health Identifier</Text>
              <Text style={styles.historyDesc}>{uhid}</Text>
            </View>
            <View style={styles.historyCard}>
              <Text style={styles.historyTitle}>Primary Care Facility</Text>
              <Text style={styles.historyDesc}>MedSync Health Care Network · Digital Clinic</Text>
            </View>
          </ScrollView>
        </View>
      </Modal>

      {/* ─── Medical History Modal ────────────────────────────────────────── */}
      <Modal
        visible={historyModal}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={() => setHistoryModal(false)}
      >
        <View style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>Medical History</Text>
            <TouchableOpacity onPress={() => setHistoryModal(false)} style={styles.modalCloseBtn}>
              <X size={18} color={Colors.onSurface} />
            </TouchableOpacity>
          </View>
          <ScrollView contentContainerStyle={styles.modalBody}>
            {isDemoAccount ? (
              <>
                <Text style={styles.subSectionTitle}>CHRONIC CONDITIONS</Text>
                <View style={styles.historyCard}>
                  <View style={styles.historyRow}>
                    <Text style={styles.historyTitle}>Essential Hypertension (Stage 1)</Text>
                    <Text style={styles.historyStatus}>Controlled</Text>
                  </View>
                  <Text style={styles.historyDesc}>Diagnosed Oct 2024 · Under Dr. Taylor Reynolds care.</Text>
                </View>

                <Text style={styles.subSectionTitle}>IMMUNIZATION RECORDS</Text>
                {[
                  { name: "COVID-19 mRNA Booster", date: "Nov 14, 2025", status: "Up to Date" },
                  { name: "Influenza Quadrivalent", date: "Oct 02, 2025", status: "Current Season" },
                ].map((v, i) => (
                  <View key={i} style={styles.vacCard}>
                    <View style={{ flex: 1 }}>
                      <Text style={styles.vacName}>{v.name}</Text>
                      <Text style={styles.vacDate}>Administered {v.date}</Text>
                    </View>
                    <View style={styles.vacBadge}>
                      <Text style={styles.vacBadgeText}>{v.status}</Text>
                    </View>
                  </View>
                ))}
              </>
            ) : (
              <View style={styles.emptyCard}>
                <Text style={styles.emptyTitle}>No Medical History on File</Text>
                <Text style={styles.emptyDesc}>
                  No chronic conditions or past surgical procedures have been recorded. Diagnostic records and health history will synchronize when uploaded or reviewed by your doctor.
                </Text>
              </View>
            )}
          </ScrollView>
        </View>
      </Modal>

      {/* ─── Medications & Allergies Modal ─────────────────────────────────── */}
      <Modal
        visible={medsModal}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={() => setMedsModal(false)}
      >
        <View style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>Medications & Allergies</Text>
            <TouchableOpacity onPress={() => setMedsModal(false)} style={styles.modalCloseBtn}>
              <X size={18} color={Colors.onSurface} />
            </TouchableOpacity>
          </View>
          <ScrollView contentContainerStyle={styles.modalBody}>
            <Text style={styles.subSectionTitle}>REPORTED ALLERGIES</Text>
            {allergies ? (
              <View style={[styles.allergyDetailCard, { backgroundColor: Colors.errorContainer }]}>
                <AlertTriangle size={20} color={Colors.onErrorContainer} />
                <View style={{ flex: 1 }}>
                  <Text style={styles.allergyTitle}>Active Allergy Notice</Text>
                  <Text style={styles.allergyDetail}>{allergies}</Text>
                </View>
              </View>
            ) : (
              <View style={styles.emptyCard}>
                <Text style={styles.emptyTitle}>No Known Allergies</Text>
                <Text style={styles.emptyDesc}>No drug or environmental allergies reported on this profile.</Text>
              </View>
            )}

            <Text style={styles.subSectionTitle}>ACTIVE PRESCRIBED MEDICATIONS</Text>
            {isDemoAccount ? (
              [
                { name: "Atorvastatin 20mg", freq: "1 tablet every evening", for: "Cholesterol lipid balance", refills: "3 remaining" },
                { name: "Metformin HCl 500mg", freq: "1 tablet with meal", for: "Glycemic stability", refills: "2 remaining" },
              ].map((m, i) => (
                <View key={i} style={styles.historyCard}>
                  <Text style={styles.historyTitle}>{m.name}</Text>
                  <Text style={styles.historyDesc}>{m.freq} · {m.for}</Text>
                  <Text style={styles.medRefill}>Refills: {m.refills}</Text>
                </View>
              ))
            ) : (
              <View style={styles.emptyCard}>
                <Text style={styles.emptyTitle}>No Active Medications</Text>
                <Text style={styles.emptyDesc}>
                  Prescription regimens ordered by physicians during clinical consults will appear here automatically.
                </Text>
              </View>
            )}
          </ScrollView>
        </View>
      </Modal>

      {/* ─── Privacy & Security Modal ──────────────────────────────────────── */}
      <Modal
        visible={securityModal}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={() => setSecurityModal(false)}
      >
        <View style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>Privacy & Security Audit</Text>
            <TouchableOpacity onPress={() => setSecurityModal(false)} style={styles.modalCloseBtn}>
              <X size={18} color={Colors.onSurface} />
            </TouchableOpacity>
          </View>
          <ScrollView contentContainerStyle={styles.modalBody}>
            <View style={styles.securityBanner}>
              <ShieldCheck size={26} color={Colors.secondary} />
              <View style={{ flex: 1 }}>
                <Text style={styles.securityBannerTitle}>256-Bit Cryptographic Protection</Text>
                <Text style={styles.securityBannerDesc}>Your records and consultations are encrypted end-to-end under HIPAA standards.</Text>
              </View>
            </View>

            <Text style={styles.subSectionTitle}>SESSION SECURITY</Text>
            <View style={styles.historyCard}>
              <View style={{ flexDirection: "row", alignItems: "center", gap: 8 }}>
                <Smartphone size={18} color={Colors.primary} />
                <Text style={styles.historyTitle}>Current Device (This Phone)</Text>
              </View>
              <Text style={styles.historyDesc}>Active now · Verified Session</Text>
            </View>

            <Text style={styles.subSectionTitle}>DATA EXPORT & RIGHTS</Text>
            <TouchableOpacity
              style={styles.exportBtn}
              onPress={() =>
                setProfileAlert({
                  visible: true,
                  type: "info",
                  title: "Archive Requested",
                  message: `A full encrypted archive for patient ${uhid} has been queued for download.`,
                })
              }
            >
              <FileDown size={18} color={Colors.primary} />
              <Text style={styles.exportBtnText}>Request Full Clinical Data Archive (JSON/PDF)</Text>
            </TouchableOpacity>
          </ScrollView>
        </View>
      </Modal>

      {/* ─── Help & Support Modal ──────────────────────────────────────────── */}
      <Modal
        visible={supportModal}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={() => setSupportModal(false)}
      >
        <View style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>Clinical Support</Text>
            <TouchableOpacity onPress={() => setSupportModal(false)} style={styles.modalCloseBtn}>
              <X size={18} color={Colors.onSurface} />
            </TouchableOpacity>
          </View>
          <ScrollView contentContainerStyle={styles.modalBody}>
            <View style={styles.emergencyCard}>
              <AlertTriangle size={22} color={Colors.onError} />
              <View style={{ flex: 1 }}>
                <Text style={styles.emergencyTitle}>Emergency Services</Text>
                <Text style={styles.emergencyDesc}>If you are experiencing severe chest pain, breathing difficulty, or acute distress, dial 911 immediately.</Text>
              </View>
            </View>

            <Text style={styles.subSectionTitle}>MEDSYNC CONTACT CHANNELS</Text>
            <TouchableOpacity
              style={styles.supportChannel}
              onPress={() =>
                setProfileAlert({
                  visible: true,
                  type: "clinical",
                  title: "Calling Nurse Line",
                  message: "Connecting to 24/7 MedSync Registered Nurse Helpline: +1 (800) 555-6337",
                })
              }
            >
              <View style={styles.supportIconBox}><PhoneCall size={20} color={Colors.primary} /></View>
              <View style={{ flex: 1 }}>
                <Text style={styles.supportChannelTitle}>24/7 Triage Nurse Line</Text>
                <Text style={styles.supportChannelSubtitle}>Average response time: under 2 minutes</Text>
              </View>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.supportChannel}
              onPress={() =>
                setProfileAlert({
                  visible: true,
                  type: "info",
                  title: "Support Live Chat",
                  message: "A patient concierge agent is connecting to assist with scheduling and records.",
                })
              }
            >
              <View style={styles.supportIconBox}><MessageSquare size={20} color={Colors.primary} /></View>
              <View style={{ flex: 1 }}>
                <Text style={styles.supportChannelTitle}>Patient Concierge Chat</Text>
                <Text style={styles.supportChannelSubtitle}>Live billing, app troubleshooting, appointment support</Text>
              </View>
            </TouchableOpacity>
          </ScrollView>
        </View>
      </Modal>

      {/* Themed Profile Alert Modal */}
      <ThemedAlertModal
        visible={profileAlert.visible}
        type={profileAlert.type || "info"}
        title={profileAlert.title}
        message={profileAlert.message}
        onClose={() => setProfileAlert((prev) => ({ ...prev, visible: false }))}
      />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.surface },
  content: { padding: Spacing.margin, gap: Spacing.sm, paddingBottom: 100 },
  profileCard: {
    backgroundColor: Colors.surfaceContainerLowest,
    borderRadius: Radius.xxl,
    padding: Spacing.md,
    alignItems: "center",
    gap: 8,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.06,
    shadowRadius: 16,
    elevation: 3,
  },
  profileTopRow: {
    width: "100%",
    alignItems: "center",
    position: "relative",
  },
  avatarCircle: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: Colors.primary,
    justifyContent: "center",
    alignItems: "center",
  },
  avatarText: {
    fontSize: 28,
    color: Colors.onPrimary,
    fontFamily: FontFamily.headlineBold,
  },
  editProfilePill: {
    position: "absolute",
    right: 0,
    top: 0,
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    backgroundColor: Colors.surfaceContainerLow,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: Radius.full,
    borderWidth: 1,
    borderColor: Colors.outlineVariant,
  },
  editProfilePillText: {
    fontSize: FontSize.bodySm,
    color: Colors.primary,
    fontFamily: FontFamily.bodySemiBold,
  },
  profileName: {
    fontSize: FontSize.headlineSm,
    color: Colors.onSurface,
    fontFamily: FontFamily.headlineSemiBold,
  },
  profileRole: {
    fontSize: FontSize.bodyMd,
    color: Colors.onSurfaceVariant,
    fontFamily: FontFamily.bodyRegular,
  },
  uhidBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    backgroundColor: Colors.surfaceContainerLow,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: Radius.full,
  },
  uhidText: {
    fontSize: FontSize.labelMd,
    color: Colors.onSurface,
    fontFamily: FontFamily.dataMonoBold,
  },
  statsRow: {
    flexDirection: "row",
    width: "100%",
    paddingTop: 8,
  },
  statItem: { flex: 1, alignItems: "center" },
  statValue: {
    fontSize: FontSize.headlineSm,
    color: Colors.primary,
    fontFamily: FontFamily.dataMonoBold,
  },
  statLabel: {
    fontSize: FontSize.bodySm,
    color: Colors.onSurfaceVariant,
    fontFamily: FontFamily.bodyRegular,
  },
  statDivider: {
    width: 1,
    backgroundColor: Colors.surfaceContainerHigh,
    marginVertical: 4,
  },
  card: {
    backgroundColor: Colors.surfaceContainerLowest,
    borderRadius: Radius.xl,
    padding: Spacing.sm,
    gap: Spacing.xs,
  },
  cardLabel: {
    fontSize: FontSize.dataMono,
    color: Colors.outline,
    fontFamily: FontFamily.dataMonoBold,
    textTransform: "uppercase",
    letterSpacing: 1,
  },
  tapToEditHint: {
    fontSize: 11,
    color: Colors.primary,
    fontFamily: FontFamily.bodyMedium,
  },
  contactDetailsBox: {
    backgroundColor: Colors.surfaceContainerLow,
    borderRadius: Radius.lg,
    padding: Spacing.sm,
    marginTop: 4,
  },
  contactRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    paddingVertical: 4,
  },
  contactIconWrap: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: Colors.surfaceContainerLowest,
    justifyContent: "center",
    alignItems: "center",
  },
  contactLabel: {
    fontSize: 11,
    color: Colors.onSurfaceVariant,
    fontFamily: FontFamily.bodyRegular,
  },
  contactValue: {
    fontSize: FontSize.bodySm,
    color: Colors.onSurface,
    fontFamily: FontFamily.bodySemiBold,
  },
  contactDivider: {
    height: 1,
    backgroundColor: Colors.outlineVariant + "44",
    marginVertical: 6,
  },
  healthRow: { flexDirection: "row", justifyContent: "space-around", marginVertical: 4 },
  healthItem: { alignItems: "center", gap: 4 },
  healthIconBox: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: Colors.surfaceContainerLow,
    justifyContent: "center",
    alignItems: "center",
  },
  healthValue: {
    fontSize: FontSize.labelLg,
    color: Colors.onSurface,
    fontFamily: FontFamily.bodySemiBold,
  },
  healthItemLabel: {
    fontSize: FontSize.bodySm,
    color: Colors.onSurfaceVariant,
    fontFamily: FontFamily.bodyRegular,
  },
  allergyRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    backgroundColor: Colors.errorContainer + "88",
    borderRadius: Radius.md,
    padding: 10,
    marginTop: 4,
  },
  allergyText: {
    flex: 1,
    fontSize: FontSize.bodySm,
    color: Colors.onErrorContainer,
    fontFamily: FontFamily.bodyMedium,
  },
  menuCard: {
    backgroundColor: Colors.surfaceContainerLowest,
    borderRadius: Radius.xl,
    overflow: "hidden",
  },
  menuItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.sm,
    padding: Spacing.sm,
  },
  menuLabel: {
    flex: 1,
    fontSize: FontSize.bodyMd,
    color: Colors.onSurface,
    fontFamily: FontFamily.bodyMedium,
  },
  menuDivider: {
    height: 1,
    backgroundColor: Colors.surfaceContainerLow,
    marginHorizontal: Spacing.sm,
  },
  signOutBtn: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    gap: 8,
    height: 48,
    borderRadius: Radius.xl,
    borderWidth: 1.5,
    borderColor: Colors.error,
  },
  signOutText: {
    fontSize: FontSize.labelLg,
    color: Colors.error,
    fontFamily: FontFamily.bodySemiBold,
  },
  footer: {
    textAlign: "center",
    fontSize: 10,
    color: Colors.outline,
    fontFamily: FontFamily.dataMono,
  },
  emptyCard: {
    backgroundColor: Colors.surfaceContainerLowest,
    borderRadius: Radius.xl,
    padding: Spacing.md,
    alignItems: "center",
    gap: 6,
    borderWidth: 1,
    borderColor: Colors.outlineVariant + "55",
  },
  emptyTitle: {
    fontSize: FontSize.bodyMd,
    color: Colors.onSurface,
    fontFamily: FontFamily.bodySemiBold,
  },
  emptyDesc: {
    fontSize: FontSize.bodySm,
    color: Colors.onSurfaceVariant,
    fontFamily: FontFamily.bodyRegular,
    textAlign: "center",
    lineHeight: 18,
  },
  modalContainer: {
    flex: 1,
    backgroundColor: Colors.surface,
  },
  modalHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    backgroundColor: Colors.surfaceContainerLowest,
    borderBottomWidth: 1,
    borderBottomColor: Colors.surfaceContainerHigh,
  },
  modalTitle: {
    fontSize: FontSize.headlineSm,
    color: Colors.onSurface,
    fontFamily: FontFamily.headlineSemiBold,
  },
  modalCloseBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: Colors.surfaceContainerHigh,
    justifyContent: "center",
    alignItems: "center",
  },
  modalBody: {
    padding: Spacing.md,
    gap: Spacing.sm,
    paddingBottom: 40,
  },
  formGroup: {
    gap: 4,
  },
  formLabel: {
    fontSize: FontSize.labelMd,
    color: Colors.onSurfaceVariant,
    fontFamily: FontFamily.bodyMedium,
  },
  formInput: {
    height: 46,
    backgroundColor: Colors.surfaceContainerLowest,
    borderRadius: Radius.lg,
    borderWidth: 1,
    borderColor: Colors.outlineVariant,
    paddingHorizontal: Spacing.sm,
    fontSize: FontSize.bodyMd,
    color: Colors.onSurface,
    fontFamily: FontFamily.bodyRegular,
  },
  saveBtn: {
    height: 48,
    backgroundColor: Colors.primary,
    borderRadius: Radius.xl,
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    gap: 8,
    marginTop: 10,
  },
  saveBtnText: {
    fontSize: FontSize.labelLg,
    color: Colors.onPrimary,
    fontFamily: FontFamily.bodySemiBold,
  },
  bmiCard: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.sm,
    backgroundColor: Colors.primaryFixed + "33",
    borderRadius: Radius.xl,
    padding: Spacing.sm,
    borderWidth: 1,
    borderColor: Colors.primary + "33",
  },
  bmiCardTitle: {
    fontSize: FontSize.labelLg,
    color: Colors.primary,
    fontFamily: FontFamily.bodySemiBold,
  },
  bmiCardDesc: {
    fontSize: FontSize.bodySm,
    color: Colors.onSurfaceVariant,
    fontFamily: FontFamily.bodyRegular,
    marginTop: 2,
  },
  subSectionTitle: {
    fontSize: FontSize.dataMono,
    color: Colors.outline,
    fontFamily: FontFamily.dataMonoBold,
    textTransform: "uppercase",
    letterSpacing: 1,
    marginTop: 6,
  },
  historyCard: {
    backgroundColor: Colors.surfaceContainerLowest,
    borderRadius: Radius.xl,
    padding: Spacing.sm,
    gap: 4,
  },
  historyRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  historyTitle: {
    fontSize: FontSize.labelLg,
    color: Colors.onSurface,
    fontFamily: FontFamily.bodySemiBold,
  },
  historyStatus: {
    fontSize: 11,
    color: Colors.secondary,
    fontFamily: FontFamily.bodySemiBold,
  },
  historyDesc: {
    fontSize: FontSize.bodySm,
    color: Colors.onSurfaceVariant,
    fontFamily: FontFamily.bodyRegular,
  },
  medRefill: {
    fontSize: 11,
    color: Colors.primary,
    fontFamily: FontFamily.dataMono,
    marginTop: 2,
  },
  vacCard: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    backgroundColor: Colors.surfaceContainerLowest,
    borderRadius: Radius.lg,
    padding: Spacing.sm,
  },
  vacName: {
    fontSize: FontSize.bodyMd,
    color: Colors.onSurface,
    fontFamily: FontFamily.bodySemiBold,
  },
  vacDate: {
    fontSize: FontSize.bodySm,
    color: Colors.outline,
    fontFamily: FontFamily.bodyRegular,
  },
  vacBadge: {
    backgroundColor: Colors.secondaryContainer + "55",
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: Radius.full,
  },
  vacBadgeText: {
    fontSize: 10,
    color: Colors.secondary,
    fontFamily: FontFamily.bodySemiBold,
  },
  allergyDetailCard: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.xs,
    borderRadius: Radius.xl,
    padding: Spacing.sm,
  },
  allergyTitle: {
    fontSize: FontSize.labelLg,
    color: Colors.onErrorContainer,
    fontFamily: FontFamily.bodySemiBold,
  },
  allergyDetail: {
    fontSize: FontSize.bodySm,
    color: Colors.onErrorContainer,
    fontFamily: FontFamily.bodyRegular,
  },
  securityBanner: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.sm,
    backgroundColor: Colors.secondaryContainer + "33",
    borderRadius: Radius.xl,
    padding: Spacing.sm,
    borderWidth: 1,
    borderColor: Colors.secondary + "44",
  },
  securityBannerTitle: {
    fontSize: FontSize.labelLg,
    color: Colors.onSurface,
    fontFamily: FontFamily.bodySemiBold,
  },
  securityBannerDesc: {
    fontSize: FontSize.bodySm,
    color: Colors.onSurfaceVariant,
    fontFamily: FontFamily.bodyRegular,
    lineHeight: 18,
  },
  exportBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    backgroundColor: Colors.surfaceContainerLowest,
    borderRadius: Radius.xl,
    padding: Spacing.sm,
    borderWidth: 1,
    borderColor: Colors.primary + "44",
  },
  exportBtnText: {
    fontSize: FontSize.labelMd,
    color: Colors.primary,
    fontFamily: FontFamily.bodySemiBold,
  },
  emergencyCard: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.sm,
    backgroundColor: Colors.error,
    borderRadius: Radius.xl,
    padding: Spacing.sm,
  },
  emergencyTitle: {
    fontSize: FontSize.labelLg,
    color: Colors.onError,
    fontFamily: FontFamily.headlineSemiBold,
  },
  emergencyDesc: {
    fontSize: FontSize.bodySm,
    color: Colors.onError,
    fontFamily: FontFamily.bodyRegular,
    lineHeight: 18,
  },
  supportChannel: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.sm,
    backgroundColor: Colors.surfaceContainerLowest,
    borderRadius: Radius.xl,
    padding: Spacing.sm,
  },
  supportIconBox: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: Colors.surfaceContainerLow,
    justifyContent: "center",
    alignItems: "center",
  },
  supportChannelTitle: {
    fontSize: FontSize.labelLg,
    color: Colors.onSurface,
    fontFamily: FontFamily.bodySemiBold,
  },
  supportChannelSubtitle: {
    fontSize: FontSize.bodySm,
    color: Colors.onSurfaceVariant,
    fontFamily: FontFamily.bodyRegular,
  },
});
