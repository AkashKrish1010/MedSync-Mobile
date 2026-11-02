// Admin screens — Home, Doctors, Visits, Patients, Profile
// Full doctor credentialing and network management (Emoji-Free with Lucide Icons & Full Interactivity)

import React, { useState, useEffect, useRef } from "react";
import {
  ADMIN_PATIENTS,
  ADMIN_REGISTERED_USERS,
  ADMIN_SCHEDULED_VISITS,
} from "../../data/mockData";
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  Modal,
  TextInput,
  ActivityIndicator,
  Switch,
  Animated,
  LayoutAnimation,
  Platform,
  UIManager,
  Easing,
} from "react-native";
import ThemedAlertModal, { ThemedAlertButton } from "../../components/ThemedAlertModal";

if (Platform.OS === "android" && UIManager.setLayoutAnimationEnabledExperimental) {
  UIManager.setLayoutAnimationEnabledExperimental(true);
}
import {
  Activity,
  ShieldCheck,
  AlertTriangle,
  Info,
  XCircle,
  CheckCircle2,
  Stethoscope,
  Search,
  X,
  Building2,
  Mail,
  Clock,
  Sparkles,
  User,
  Calendar,
  MessageSquare,
  LogOut,
  ArrowRight,
  Plus,
  Trash2,
  Eye,
  Sliders,
  Users,
  BarChart3,
  FileCheck,
  Phone,
  Lock,
  ChevronRight,
  TrendingUp,
  Edit3,
  Save,
  Server,
  Cpu,
  HardDrive,
  Shield,
  Check,
  Copy,
  RefreshCw,
  Download,
  Key,
  Radio,
  Smartphone,
  Laptop,
  Award,
} from "lucide-react-native";
import { Colors } from "../../theme/colors";
import { Spacing, Radius, FontSize, FontFamily } from "../../theme/typography";
import { Config } from "../../config";

interface DoctorData {
  id: string;
  name: string;
  specialty: string;
  licenseId: string;
  experience: string;
  email: string;
  rating: number;
  reviewsCount: number;
  avatar: string;
  availableToday: boolean;
  hospital: string;
  createdAt: string;
  credentials?: { email: string; password?: string };
}

// ─── Admin Home ───────────────────────────────────────────────────────────────
export function AdminHome({
  onSignOut,
  onNavigateDoctors,
}: {
  onSignOut: () => void;
  onNavigateDoctors?: () => void;
}) {
  const [doctorCount, setDoctorCount] = useState<number>(3);
  const [timeframe, setTimeframe] = useState<"7D" | "30D" | "90D">("7D");
  const [selectedDayIdx, setSelectedDayIdx] = useState<number>(3); // default to Thursday
  const chartAnim = useRef(new Animated.Value(1)).current;

  // Chart datasets for Clinical Encounters & AI Neural Scans
  const chartData7D = [
    { label: "Mon", visits: 28, aiScans: 14, total: 42 },
    { label: "Tue", visits: 34, aiScans: 22, total: 56 },
    { label: "Wed", visits: 31, aiScans: 19, total: 50 },
    { label: "Thu", visits: 48, aiScans: 28, total: 76 },
    { label: "Fri", visits: 44, aiScans: 25, total: 69 },
    { label: "Sat", visits: 18, aiScans: 12, total: 30 },
    { label: "Sun", visits: 14, aiScans: 9, total: 23 },
  ];

  const chartData30D = [
    { label: "W1", visits: 180, aiScans: 95, total: 275 },
    { label: "W2", visits: 215, aiScans: 120, total: 335 },
    { label: "W3", visits: 240, aiScans: 145, total: 385 },
    { label: "W4", visits: 290, aiScans: 172, total: 462 },
  ];

  const chartData90D = [
    { label: "Jul", visits: 890, aiScans: 480, total: 1370 },
    { label: "Aug", visits: 1040, aiScans: 590, total: 1630 },
    { label: "Sep", visits: 1220, aiScans: 720, total: 1940 },
  ];

  const activeChartData =
    timeframe === "7D" ? chartData7D : timeframe === "30D" ? chartData30D : chartData90D;
  const maxVal = Math.max(...activeChartData.map((d) => d.total));

  const handleTimeframeChange = (tf: "7D" | "30D" | "90D") => {
    if (timeframe === tf) return;
    LayoutAnimation.configureNext(
      LayoutAnimation.create(
        320,
        LayoutAnimation.Types.easeInEaseOut,
        LayoutAnimation.Properties.opacity
      )
    );
    setTimeframe(tf);
    setSelectedDayIdx(0);
    chartAnim.setValue(0);
    Animated.timing(chartAnim, {
      toValue: 1,
      duration: 380,
      easing: Easing.bezier(0.16, 1, 0.3, 1),
      useNativeDriver: false,
    }).start();
  };

  useEffect(() => {
    fetch(Config.apiDoctors)
      .then((r) => r.json())
      .then((data) => {
        if (Array.isArray(data)) setDoctorCount(data.length);
      })
      .catch(() => {});
  }, []);

  const systemLogs = [
    { type: "success", message: "Nightly DB backup completed successfully", time: "2m ago" },
    { type: "info", message: `${doctorCount} verified clinical staff in active roster`, time: "10m ago" },
    { type: "warning", message: "3 pending doctor credential reviews", time: "15m ago" },
    { type: "info", message: "Dr. Taylor completed 12 AI-assisted sessions", time: "1h ago" },
    { type: "error", message: "Failed payment gateway ping — retry resolved", time: "2h ago" },
  ];

  const renderLogIcon = (type: string) => {
    switch (type) {
      case "success":
        return <CheckCircle2 size={16} color={Colors.secondary} />;
      case "warning":
        return <AlertTriangle size={16} color={Colors.primary} />;
      case "error":
        return <XCircle size={16} color={Colors.error} />;
      default:
        return <Info size={16} color={Colors.outline} />;
    }
  };

  const kpis = [
    { label: "Active Doctors", value: String(doctorCount), change: "Online", positive: true },
    { label: "Active Users", value: "1,248", change: "+4.2%", positive: true },
    { label: "Total Visits", value: "3,847", change: "+12%", positive: true },
    { label: "AI Scans Today", value: "89", change: "+31%", positive: true },
  ];

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
      <View style={styles.greetingRow}>
        <View style={styles.avatarCircle}>
          <Text style={styles.avatarText}>AW</Text>
        </View>
        <View style={{ flex: 1 }}>
          <Text style={styles.greeting}>Operations Hub</Text>
          <Text style={styles.subtitle}>Admin Lead · Alexander Wright</Text>
        </View>
      </View>

      {/* KPIs */}
      <View style={styles.kpiGrid}>
        {kpis.map((k, idx) => (
          <View key={idx} style={styles.kpiCard}>
            <Text style={styles.kpiValue}>{k.value}</Text>
            <Text style={styles.kpiLabel}>{k.label}</Text>
            <View
              style={[
                styles.changeBadge,
                {
                  backgroundColor: k.positive
                    ? Colors.secondaryContainer + "55"
                    : Colors.errorContainer,
                },
              ]}
            >
              <Text
                style={[
                  styles.changeText,
                  { color: k.positive ? Colors.secondary : Colors.onErrorContainer },
                ]}
              >
                {k.change}
              </Text>
            </View>
          </View>
        ))}
      </View>

      {/* ─── Clinical Telehealth & AI Analytics Graph Card ─── */}
      <View style={styles.graphCard}>
        {/* Graph Header */}
        <View style={styles.graphHeaderRow}>
          <View style={{ flex: 1 }}>
            <View style={{ flexDirection: "row", alignItems: "center", gap: 6 }}>
              <BarChart3 size={18} color={Colors.primary} strokeWidth={2.2} />
              <Text style={styles.graphTitle}>Encounter & AI Analytics</Text>
            </View>
            <Text style={styles.graphSubtitle}>Live consultations vs. neural diagnostics</Text>
          </View>

          {/* Timeframe selector */}
          <View style={styles.timeframePills}>
            {(["7D", "30D", "90D"] as const).map((tf) => (
              <TouchableOpacity
                key={tf}
                onPress={() => handleTimeframeChange(tf)}
                style={[
                  styles.timeframePill,
                  timeframe === tf && styles.timeframePillActive,
                ]}
              >
                <Text
                  style={[
                    styles.timeframePillText,
                    timeframe === tf && styles.timeframePillTextActive,
                  ]}
                >
                  {tf}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Selected Data Point Highlight Badge */}
        {activeChartData[selectedDayIdx] && (
          <View style={styles.graphTooltip}>
            <View style={styles.tooltipPulse} />
            <Text style={styles.tooltipText}>
              <Text style={{ fontFamily: FontFamily.dataMonoBold, color: Colors.primary }}>
                {activeChartData[selectedDayIdx].label}:{" "}
              </Text>
              {activeChartData[selectedDayIdx].visits} Consultations ·{" "}
              {activeChartData[selectedDayIdx].aiScans} AI Scans (
              <Text style={{ fontFamily: FontFamily.dataMonoBold }}>
                {activeChartData[selectedDayIdx].total} Total
              </Text>
              )
            </Text>
          </View>
        )}

        {/* The Graph Bars & Axis */}
        <View style={styles.chartContainer}>
          {/* Background Grid Lines */}
          <View style={styles.gridLinesContainer}>
            <View style={styles.gridLine} />
            <View style={styles.gridLine} />
            <View style={styles.gridLine} />
            <View style={styles.gridLineBaseline} />
          </View>

          {/* Bars */}
          <View style={styles.barsContainer}>
            {activeChartData.map((item, idx) => {
              const isSelected = selectedDayIdx === idx;
              const barWidth = timeframe === "7D" ? 26 : timeframe === "30D" ? 40 : 54;
              const targetHeight = Math.max(24, (item.total / maxVal) * 148);
              const animatedHeight = chartAnim.interpolate({
                inputRange: [0, 1],
                outputRange: [12, targetHeight],
              });
              const visitPct = (item.visits / item.total) * 100;
              const aiPct = (item.aiScans / item.total) * 100;

              return (
                <TouchableOpacity
                  key={idx}
                  onPress={() => setSelectedDayIdx(idx)}
                  style={styles.barCol}
                  activeOpacity={0.8}
                >
                  {/* Floating count right above selected bar */}
                  {isSelected ? (
                    <View style={styles.barFloatingCount}>
                      <Text style={styles.barFloatingText}>{item.total}</Text>
                    </View>
                  ) : (
                    <View style={styles.barFloatingCountSpacer} />
                  )}

                  {/* Dual-tone Stacked Bar with Smooth Animated Height */}
                  <Animated.View
                    style={[
                      styles.barTrack,
                      { width: barWidth, height: animatedHeight },
                      isSelected && styles.barTrackSelected,
                    ]}
                  >
                    {/* Top segment: AI Scans (Green) */}
                    <View
                      style={[
                        styles.barSegmentAi,
                        { height: `${aiPct}%` },
                        isSelected && { backgroundColor: Colors.secondary },
                      ]}
                    />
                    {/* Bottom segment: Visits (Blue) */}
                    <View
                      style={[
                        styles.barSegmentVisits,
                        { height: `${visitPct}%` },
                        isSelected && { backgroundColor: Colors.primary },
                      ]}
                    />
                  </Animated.View>

                  {/* X-Axis Day Label */}
                  <Text
                    style={[
                      styles.axisLabel,
                      isSelected && styles.axisLabelSelected,
                    ]}
                  >
                    {item.label}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>
        </View>

        {/* Legend */}
        <View style={styles.graphLegendRow}>
          <View style={styles.legendItem}>
            <View style={[styles.legendDot, { backgroundColor: Colors.primary }]} />
            <Text style={styles.legendLabel}>Clinical Consultations</Text>
          </View>
          <View style={styles.legendItem}>
            <View style={[styles.legendDot, { backgroundColor: Colors.secondary }]} />
            <Text style={styles.legendLabel}>AI Neural Scans</Text>
          </View>
        </View>

        {/* Key Metrics Mini Footer */}
        <View style={styles.graphMetricFooter}>
          <View style={styles.graphMetricBox}>
            <Text style={styles.graphMetricLabel}>Weekly Growth</Text>
            <View style={{ flexDirection: "row", alignItems: "center", gap: 3 }}>
              <TrendingUp size={13} color={Colors.secondary} />
              <Text style={styles.graphMetricValPositive}>+18.4%</Text>
            </View>
          </View>
          <View style={styles.graphMetricDivider} />
          <View style={styles.graphMetricBox}>
            <Text style={styles.graphMetricLabel}>Avg Daily Load</Text>
            <Text style={styles.graphMetricVal}>48.2 pts</Text>
          </View>
          <View style={styles.graphMetricDivider} />
          <View style={styles.graphMetricBox}>
            <Text style={styles.graphMetricLabel}>AI Confidence</Text>
            <Text style={styles.graphMetricVal}>99.4%</Text>
          </View>
        </View>

        {/* Department Volume Distribution Bar */}
        <View style={styles.deptVolumeBox}>
          <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 6 }}>
            <Text style={styles.deptTitle}>DEPARTMENT DISTRIBUTION</Text>
            <Text style={styles.deptSub}>4 Active Specialties</Text>
          </View>

          {/* Segmented Distribution Bar */}
          <View style={styles.deptProgressBar}>
            <View style={[styles.deptSeg, { flex: 38, backgroundColor: Colors.primary }]} />
            <View style={[styles.deptSeg, { flex: 27, backgroundColor: Colors.secondary }]} />
            <View style={[styles.deptSeg, { flex: 23, backgroundColor: Colors.tertiary }]} />
            <View style={[styles.deptSeg, { flex: 12, backgroundColor: "#E67E22" }]} />
          </View>

          {/* Department Legend */}
          <View style={styles.deptLegendGrid}>
            <Text style={styles.deptLegendText}>
              <Text style={{ color: Colors.primary, fontFamily: FontFamily.dataMonoBold }}>38%</Text> Cardiology
            </Text>
            <Text style={styles.deptLegendText}>
              <Text style={{ color: Colors.secondary, fontFamily: FontFamily.dataMonoBold }}>27%</Text> Diagnostics
            </Text>
            <Text style={styles.deptLegendText}>
              <Text style={{ color: Colors.tertiary, fontFamily: FontFamily.dataMonoBold }}>23%</Text> Neurology
            </Text>
            <Text style={styles.deptLegendText}>
              <Text style={{ color: "#E67E22", fontFamily: FontFamily.dataMonoBold }}>12%</Text> General
            </Text>
          </View>
        </View>
      </View>

      {/* Doctor Management Quick Card */}
      <View style={styles.doctorCtaCard}>
        <View style={{ flex: 1, gap: 4 }}>
          <View style={{ flexDirection: "row", alignItems: "center", gap: 6 }}>
            <Stethoscope size={18} color={Colors.primary} />
            <Text style={styles.doctorCtaTitle}>Clinical Staff Provisioning</Text>
          </View>
          <Text style={styles.doctorCtaSubtitle}>
            Provision new doctors, generate their access credentials, and activate them on the patient booking directory.
          </Text>
        </View>
        {onNavigateDoctors && (
          <TouchableOpacity onPress={onNavigateDoctors} style={styles.doctorCtaBtn}>
            <Text style={styles.doctorCtaBtnText}>Manage Doctors</Text>
            <ArrowRight size={14} color={Colors.onPrimary} />
          </TouchableOpacity>
        )}
      </View>

      {/* System Logs */}
      <Text style={styles.sectionTitle}>Live Clinical Infrastructure Logs</Text>
      {systemLogs.map((log, idx) => {
        const logColors: Record<string, { bg: string; border: string }> = {
          success: { bg: Colors.secondaryContainer + "22", border: Colors.secondary },
          warning: { bg: Colors.primaryFixed + "33", border: Colors.primary },
          info: { bg: Colors.surfaceContainerLowest, border: Colors.outlineVariant },
          error: { bg: Colors.errorContainer + "33", border: Colors.error },
        };
        const lc = logColors[log.type] || logColors.info;
        return (
          <View
            key={idx}
            style={[
              styles.logCard,
              { backgroundColor: lc.bg, borderLeftColor: lc.border, borderLeftWidth: 3 },
            ]}
          >
            {renderLogIcon(log.type)}
            <View style={{ flex: 1 }}>
              <Text style={styles.logMessage}>{log.message}</Text>
              <Text style={styles.logTime}>{log.time}</Text>
            </View>
          </View>
        );
      })}

      <TouchableOpacity onPress={onSignOut} style={styles.signOutBtn} activeOpacity={0.8}>
        <LogOut size={18} color={Colors.error} />
        <Text style={styles.signOutText}>Sign Out of Console</Text>
      </TouchableOpacity>
    </ScrollView>
  );
}

// ─── Admin Doctors Screen (Provisioning & Credential Handout) ──────────────────
export function AdminDoctors() {
  const [doctors, setDoctors] = useState<DoctorData[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [modalVisible, setModalVisible] = useState(false);

  // Form states for adding doctor
  const [name, setName] = useState("Dr. Aisha Patel");
  const [specialty, setSpecialty] = useState("Neurology & Cognitive Care");
  const [hospital, setHospital] = useState("MedSync Neuro Institute");
  const [licenseId, setLicenseId] = useState("MED-NY-849102");
  const [experience, setExperience] = useState("9 Years");
  const [email, setEmail] = useState("dr.aisha@medsync.clinic");
  const [password, setPassword] = useState("Doctor@123");
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState("");

  // Credential Handout Modal State
  const [issuedCreds, setIssuedCreds] = useState<{
    name: string;
    email: string;
    password: string;
    specialty: string;
    hospital: string;
  } | null>(null);

  const [docAlert, setDocAlert] = useState<{
    visible: boolean;
    type?: "info" | "success" | "warning" | "error" | "ai" | "clinical";
    title: string;
    message?: string;
    buttons?: ThemedAlertButton[];
  }>({
    visible: false,
    title: "",
  });

  const fetchDoctors = async () => {
    setLoading(true);
    try {
      const res = await fetch(Config.apiDoctors);
      const data = await res.json();
      if (Array.isArray(data)) setDoctors(data);
    } catch {
      // ignore
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDoctors();
  }, []);

  const handleCreateDoctor = async () => {
    if (!name.trim() || !specialty.trim() || !email.trim() || !password.trim()) {
      setFormError("Name, specialty, email, and password are required.");
      return;
    }
    setFormError("");
    setSubmitting(true);

    try {
      const res = await fetch(Config.apiAdminAddDoctor, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: name.trim(),
          specialty: specialty.trim(),
          hospital: hospital.trim(),
          licenseId: licenseId.trim(),
          experience: experience.trim(),
          email: email.trim(),
          password: password.trim(),
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        setFormError(data.error || "Failed to create doctor.");
        setSubmitting(false);
        return;
      }

      setModalVisible(false);
      setIssuedCreds({
        name: name.trim(),
        email: email.trim(),
        password: password.trim(),
        specialty: specialty.trim(),
        hospital: hospital.trim(),
      });

      // Reset
      setName("");
      setEmail("");
      setPassword("Doctor@123");
      setSpecialty("");
      setLicenseId("");
      fetchDoctors();
    } catch {
      setFormError("Network error. Please check your connection and try again.");
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeleteDoctor = (id: string, docName: string) => {
    setDocAlert({
      visible: true,
      type: "warning",
      title: "Revoke Doctor Access?",
      message: `Are you sure you want to remove ${docName} from the active clinical roster?`,
      buttons: [
        {
          text: "Cancel",
          style: "cancel",
          onPress: () => setDocAlert((prev) => ({ ...prev, visible: false })),
        },
        {
          text: "Remove",
          style: "destructive",
          onPress: async () => {
            setDocAlert((prev) => ({ ...prev, visible: false }));
            try {
              const res = await fetch(Config.apiAdminDeleteDoctor(id), { method: "DELETE" });
              if (res.ok) {
                setDoctors((prev) => prev.filter((d) => d.id !== id));
              }
            } catch {
              // ignore
            }
          },
        },
      ],
    });
  };

  const filteredDoctors = doctors.filter((d) =>
    (d.name + d.specialty + d.hospital + d.email).toLowerCase().includes(search.toLowerCase())
  );

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
      {/* Header */}
      <View style={styles.sectionHeaderRow}>
        <View>
          <Text style={styles.screenHeading}>Doctor Roster</Text>
          <Text style={styles.screenSubheading}>
            {doctors.length} credentialed physicians · Admin Directory
          </Text>
        </View>
        <TouchableOpacity style={styles.addDoctorBtn} onPress={() => setModalVisible(true)}>
          <Plus size={16} color={Colors.onPrimary} />
          <Text style={styles.addDoctorBtnText}>Add Doctor</Text>
        </TouchableOpacity>
      </View>

      {/* Search Input */}
      <View style={styles.searchBar}>
        <Search size={18} color={Colors.outline} />
        <TextInput
          style={styles.searchInput}
          placeholder="Search doctor by name, specialty, or email..."
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

      {/* Doctors List */}
      {loading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={Colors.primary} />
          <Text style={styles.loadingText}>Fetching medical staff...</Text>
        </View>
      ) : filteredDoctors.length === 0 ? (
        <View style={styles.emptyCard}>
          <Stethoscope size={36} color={Colors.outline} />
          <Text style={styles.emptyTitle}>No doctors found</Text>
          <Text style={styles.emptyText}>Tap 'Add Doctor' to register and issue credentials.</Text>
        </View>
      ) : (
        filteredDoctors.map((doc) => (
          <View key={doc.id} style={styles.doctorAdminCard}>
            <View style={styles.doctorTopRow}>
              <View style={styles.doctorAvatar}>
                <Text style={styles.doctorAvatarText}>{doc.avatar || doc.name.slice(0, 2).toUpperCase()}</Text>
              </View>
              <View style={{ flex: 1 }}>
                <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between" }}>
                  <Text style={styles.docAdminName}>{doc.name}</Text>
                  <View
                    style={[
                      styles.badge,
                      {
                        backgroundColor: doc.availableToday
                          ? Colors.secondaryContainer + "55"
                          : Colors.surfaceContainerHigh,
                      },
                    ]}
                  >
                    <Text
                      style={[
                        styles.badgeText,
                        {
                          color: doc.availableToday ? Colors.secondary : Colors.onSurfaceVariant,
                        },
                      ]}
                    >
                      {doc.availableToday ? "Online" : "Inactive"}
                    </Text>
                  </View>
                </View>
                <Text style={styles.docAdminSpecialty}>{doc.specialty}</Text>
                <View style={{ flexDirection: "row", alignItems: "center", gap: 4, marginTop: 2 }}>
                  <Building2 size={13} color={Colors.onSurfaceVariant} />
                  <Text style={styles.docAdminHospital}>{doc.hospital}</Text>
                </View>
              </View>
            </View>

            {/* Credential summary box */}
            <View style={styles.credBox}>
              <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center" }}>
                <Text style={styles.credLabel}>ISSUED CREDENTIALS</Text>
                <Text style={styles.credHint}>Doctor uses this to sign in</Text>
              </View>
              <View style={styles.credDetailsRow}>
                <View style={{ flexDirection: "row", alignItems: "center", gap: 4 }}>
                  <Mail size={12} color={Colors.outline} />
                  <Text style={styles.credItem}>{doc.email}</Text>
                </View>
                <View style={{ flexDirection: "row", alignItems: "center", gap: 4 }}>
                  <ShieldCheck size={12} color={Colors.outline} />
                  <Text style={styles.credItem}>{doc.licenseId}</Text>
                </View>
              </View>
            </View>

            {/* Actions */}
            <View style={styles.doctorActionsRow}>
              <View style={styles.docMetaTag}>
                <Clock size={12} color={Colors.onSurfaceVariant} />
                <Text style={styles.docMetaText}>{doc.experience}</Text>
              </View>
              <TouchableOpacity
                onPress={() => handleDeleteDoctor(doc.id, doc.name)}
                style={styles.deleteBtn}
              >
                <Trash2 size={13} color={Colors.error} />
                <Text style={styles.deleteBtnText}>Remove</Text>
              </TouchableOpacity>
            </View>
          </View>
        ))
      )}

      {/* Add Doctor Modal */}
      <Modal visible={modalVisible} transparent animationType="slide" onRequestClose={() => setModalVisible(false)}>
        <View style={styles.modalBackdrop}>
          <View style={styles.formCard}>
            <View style={styles.formHeader}>
              <View>
                <Text style={styles.formTitle}>Add New Doctor</Text>
                <Text style={styles.formSubtitle}>Provision doctor credentials & activate for patients</Text>
              </View>
              <TouchableOpacity onPress={() => setModalVisible(false)} style={styles.closeBtn}>
                <X size={16} color={Colors.onSurfaceVariant} />
              </TouchableOpacity>
            </View>

            {formError ? <Text style={styles.formErrorText}>{formError}</Text> : null}

            <ScrollView showsVerticalScrollIndicator={false} style={{ maxHeight: 380 }}>
              <View style={styles.formGroup}>
                <Text style={styles.inputLabel}>Full Name</Text>
                <TextInput
                  style={styles.formInput}
                  value={name}
                  onChangeText={setName}
                  placeholder="e.g. Dr. Jessica Adams"
                  placeholderTextColor={Colors.outline}
                />
              </View>

              <View style={styles.formGroup}>
                <Text style={styles.inputLabel}>Specialization</Text>
                <TextInput
                  style={styles.formInput}
                  value={specialty}
                  onChangeText={setSpecialty}
                  placeholder="e.g. Pediatrics & Child Health"
                  placeholderTextColor={Colors.outline}
                />
              </View>

              <View style={styles.formGroup}>
                <Text style={styles.inputLabel}>Hospital / Department</Text>
                <TextInput
                  style={styles.formInput}
                  value={hospital}
                  onChangeText={setHospital}
                  placeholder="e.g. MedSync Children's Wing"
                  placeholderTextColor={Colors.outline}
                />
              </View>

              <View style={{ flexDirection: "row", gap: Spacing.xs }}>
                <View style={[styles.formGroup, { flex: 1 }]}>
                  <Text style={styles.inputLabel}>License ID</Text>
                  <TextInput
                    style={styles.formInput}
                    value={licenseId}
                    onChangeText={setLicenseId}
                    placeholder="e.g. MED-CA-40291"
                    placeholderTextColor={Colors.outline}
                  />
                </View>
                <View style={[styles.formGroup, { flex: 1 }]}>
                  <Text style={styles.inputLabel}>Experience</Text>
                  <TextInput
                    style={styles.formInput}
                    value={experience}
                    onChangeText={setExperience}
                    placeholder="e.g. 8 Years"
                    placeholderTextColor={Colors.outline}
                  />
                </View>
              </View>

              <View style={styles.formGroup}>
                <Text style={styles.inputLabel}>Doctor Login Email (Credential)</Text>
                <TextInput
                  style={styles.formInput}
                  value={email}
                  onChangeText={setEmail}
                  placeholder="e.g. dr.jessica@medsync.clinic"
                  placeholderTextColor={Colors.outline}
                  keyboardType="email-address"
                  autoCapitalize="none"
                />
              </View>

              <View style={styles.formGroup}>
                <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center" }}>
                  <Text style={styles.inputLabel}>Issued Password (Credential)</Text>
                  <TouchableOpacity
                    onPress={() => setPassword("DocPass" + Math.floor(100 + Math.random() * 900) + "!")}
                    style={{ flexDirection: "row", alignItems: "center", gap: 4 }}
                  >
                    <Sparkles size={13} color={Colors.primary} />
                    <Text style={styles.genPassText}>Auto-Gen</Text>
                  </TouchableOpacity>
                </View>
                <TextInput
                  style={styles.formInput}
                  value={password}
                  onChangeText={setPassword}
                  placeholder="Password for doctor login"
                  placeholderTextColor={Colors.outline}
                />
              </View>
            </ScrollView>

            <TouchableOpacity
              style={[styles.submitDoctorBtn, submitting && { opacity: 0.6 }]}
              onPress={handleCreateDoctor}
              disabled={submitting}
            >
              {submitting ? (
                <ActivityIndicator color={Colors.onPrimary} />
              ) : (
                <>
                  <CheckCircle2 size={18} color={Colors.onPrimary} />
                  <Text style={styles.submitDoctorBtnText}>Provision & Generate Credentials</Text>
                </>
              )}
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* Credential Handout Sheet Modal */}
      <Modal visible={!!issuedCreds} transparent animationType="fade" onRequestClose={() => setIssuedCreds(null)}>
        <View style={styles.modalBackdrop}>
          <View style={styles.credHandoutCard}>
            <View style={styles.credHandoutIconBox}>
              <Sparkles size={28} color={Colors.primary} />
            </View>
            <Text style={styles.credHandoutTitle}>Doctor Provisioned Successfully!</Text>
            <Text style={styles.credHandoutSubtitle}>
              Give these login credentials to the doctor. They can immediately sign in and will appear on patient booking directories:
            </Text>

            <View style={styles.credCardVisual}>
              <View style={styles.credVisualRow}>
                <Text style={styles.credVisualLabel}>DOCTOR</Text>
                <Text style={styles.credVisualValue}>{issuedCreds?.name}</Text>
              </View>
              <View style={styles.credVisualRow}>
                <Text style={styles.credVisualLabel}>SPECIALTY</Text>
                <Text style={styles.credVisualValue}>{issuedCreds?.specialty}</Text>
              </View>
              <View style={styles.credVisualDivider} />
              <View style={styles.credVisualRow}>
                <Text style={styles.credVisualLabel}>SIGN-IN EMAIL</Text>
                <Text style={[styles.credVisualValue, { fontFamily: FontFamily.dataMono, color: Colors.primary }]}>
                  {issuedCreds?.email}
                </Text>
              </View>
              <View style={styles.credVisualRow}>
                <Text style={styles.credVisualLabel}>PASSWORD</Text>
                <Text style={[styles.credVisualValue, { fontFamily: FontFamily.dataMonoBold, color: Colors.secondary }]}>
                  {issuedCreds?.password}
                </Text>
              </View>
            </View>

            <TouchableOpacity style={styles.doneCredBtn} onPress={() => setIssuedCreds(null)}>
              <Text style={styles.doneCredBtnText}>Done (Credentials Noted)</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* Themed Doctor Management Alert Modal */}
      <ThemedAlertModal
        visible={docAlert.visible}
        type={docAlert.type || "warning"}
        title={docAlert.title}
        message={docAlert.message}
        buttons={docAlert.buttons}
        onClose={() => setDocAlert((prev) => ({ ...prev, visible: false }))}
      />
    </ScrollView>
  );
}

// ─── Admin Visits ─────────────────────────────────────────────────────────────
export function AdminVisits() {
  const [visitsList, setVisitsList] = useState(ADMIN_SCHEDULED_VISITS);
  const [selectedVisit, setSelectedVisit] = useState<any | null>(null);
  const [visitAlert, setVisitAlert] = useState<{
    visible: boolean;
    type?: "info" | "success" | "warning" | "error" | "ai" | "clinical";
    title: string;
    message?: string;
    buttons?: ThemedAlertButton[];
  }>({
    visible: false,
    title: "",
  });

  const handleCancelVisit = (id: string) => {
    setVisitAlert({
      visible: true,
      type: "warning",
      title: "Cancel Appointment?",
      message: "Are you sure you want to cancel this scheduled encounter?",
      buttons: [
        {
          text: "Keep Visit",
          style: "cancel",
          onPress: () => setVisitAlert((prev) => ({ ...prev, visible: false })),
        },
        {
          text: "Yes, Cancel",
          style: "destructive",
          onPress: () => {
            setVisitAlert((prev) => ({ ...prev, visible: false }));
            setVisitsList((prev) => prev.filter((v) => v.id !== id));
            setSelectedVisit(null);
          },
        },
      ],
    });
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
      <Text style={styles.sectionTitle}>All Scheduled Encounters</Text>
      {visitsList.map((v) => (
        <TouchableOpacity
          key={v.id}
          style={styles.visitCard}
          onPress={() => setSelectedVisit(v)}
          activeOpacity={0.7}
        >
          <View style={styles.visitTop}>
            <Text style={styles.visitDoctor}>{v.doctor}</Text>
            <View
              style={[
                styles.badge,
                {
                  backgroundColor:
                    v.status === "Active"
                      ? Colors.secondaryContainer + "55"
                      : Colors.primaryFixed + "33",
                },
              ]}
            >
              <Text
                style={[
                  styles.badgeText,
                  { color: v.status === "Active" ? Colors.secondary : Colors.primary },
                ]}
              >
                {v.status}
              </Text>
            </View>
          </View>
          <View style={{ flexDirection: "row", alignItems: "center", gap: 6 }}>
            <User size={14} color={Colors.onSurfaceVariant} />
            <Text style={styles.visitPatient}>{v.patient}</Text>
          </View>
          <View style={{ flexDirection: "row", alignItems: "center", gap: 12 }}>
            <View style={{ flexDirection: "row", alignItems: "center", gap: 4 }}>
              <Calendar size={13} color={Colors.outline} />
              <Text style={styles.visitMeta}>{v.date}</Text>
            </View>
            <View style={{ flexDirection: "row", alignItems: "center", gap: 4 }}>
              {v.type === "Live Chat" ? (
                <MessageSquare size={13} color={Colors.outline} />
              ) : (
                <Building2 size={13} color={Colors.outline} />
              )}
              <Text style={styles.visitMeta}>{v.type}</Text>
            </View>
          </View>
        </TouchableOpacity>
      ))}

      {/* Visit Detail / Admin Reassign Modal */}
      <Modal visible={!!selectedVisit} transparent animationType="slide" onRequestClose={() => setSelectedVisit(null)}>
        <View style={styles.modalBackdrop}>
          {selectedVisit && (
            <View style={styles.formCard}>
              <View style={styles.formHeader}>
                <Text style={styles.formTitle}>Encounter Management</Text>
                <TouchableOpacity onPress={() => setSelectedVisit(null)} style={styles.closeBtn}>
                  <X size={16} color={Colors.onSurfaceVariant} />
                </TouchableOpacity>
              </View>

              <View style={styles.visitDetailBox}>
                <Text style={styles.visitDetailItem}>Doctor: <Text style={{ fontFamily: FontFamily.bodySemiBold }}>{selectedVisit.doctor}</Text></Text>
                <Text style={styles.visitDetailItem}>Patient: <Text style={{ fontFamily: FontFamily.bodySemiBold }}>{selectedVisit.patient}</Text></Text>
                <Text style={styles.visitDetailItem}>Time: <Text style={{ fontFamily: FontFamily.bodySemiBold }}>{selectedVisit.date}</Text></Text>
                <Text style={styles.visitDetailItem}>Location: <Text style={{ fontFamily: FontFamily.bodySemiBold }}>{selectedVisit.room}</Text></Text>
              </View>

              <View style={{ gap: 8, marginTop: 8 }}>
                <TouchableOpacity
                  style={styles.primaryActionBtn}
                  onPress={() => {
                    setVisitAlert({
                      visible: true,
                      type: "success",
                      title: "Encounter Confirmed",
                      message: "Visit priority validated and SMS reminder sent to patient.",
                    });
                    setSelectedVisit(null);
                  }}
                >
                  <CheckCircle2 size={16} color={Colors.onPrimary} />
                  <Text style={styles.primaryActionBtnText}>Confirm & Send Patient SMS</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={styles.cancelVisitBtn}
                  onPress={() => handleCancelVisit(selectedVisit.id)}
                >
                  <Trash2 size={16} color={Colors.error} />
                  <Text style={styles.cancelVisitBtnText}>Cancel & Reschedule</Text>
                </TouchableOpacity>
              </View>
            </View>
          )}
        </View>
      </Modal>

      {/* Themed Admin Visits Alert Modal */}
      <ThemedAlertModal
        visible={visitAlert.visible}
        type={visitAlert.type || "info"}
        title={visitAlert.title}
        message={visitAlert.message}
        buttons={visitAlert.buttons}
        onClose={() => setVisitAlert((prev) => ({ ...prev, visible: false }))}
      />
    </ScrollView>
  );
}

// ─── Admin Patients ───────────────────────────────────────────────────────────
export function AdminPatients() {
  const [patients, setPatients] = useState(ADMIN_PATIENTS);
  const [search, setSearch] = useState("");
  const [selectedPatient, setSelectedPatient] = useState<any | null>(null);
  const [patientAlert, setPatientAlert] = useState<{
    visible: boolean;
    type?: "info" | "success" | "warning" | "error" | "ai" | "clinical";
    title: string;
    message?: string;
  }>({
    visible: false,
    title: "",
  });

  const filtered = patients.filter((p) =>
    (p.name + p.uhid + p.doctor).toLowerCase().includes(search.toLowerCase())
  );

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
      <View style={styles.searchBar}>
        <Search size={18} color={Colors.outline} />
        <TextInput
          style={styles.searchInput}
          placeholder="Search patient by name, UHID, or doctor..."
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

      {filtered.map((p) => (
        <TouchableOpacity
          key={p.id}
          style={styles.patientCard}
          onPress={() => setSelectedPatient(p)}
          activeOpacity={0.7}
        >
          <View style={styles.patientAvatar}>
            <Text style={styles.patientAvatarText}>{p.name[0]}</Text>
          </View>
          <View style={{ flex: 1 }}>
            <Text style={styles.patientName}>{p.name}</Text>
            <Text style={styles.patientMeta}>{p.uhid} · {p.doctor}</Text>
          </View>
          <View
            style={[
              styles.badge,
              {
                backgroundColor:
                  p.status === "AI Flagged"
                    ? Colors.errorContainer
                    : Colors.secondaryContainer + "55",
              },
            ]}
          >
            {p.status === "AI Flagged" ? (
              <AlertTriangle size={10} color={Colors.onErrorContainer} style={{ marginRight: 2 }} />
            ) : (
              <CheckCircle2 size={10} color={Colors.secondary} style={{ marginRight: 2 }} />
            )}
            <Text
              style={[
                styles.badgeText,
                {
                  color:
                    p.status === "AI Flagged"
                      ? Colors.onErrorContainer
                      : Colors.secondary,
                },
              ]}
            >
              {p.status}
            </Text>
          </View>
        </TouchableOpacity>
      ))}

      {/* Patient Detail Modal */}
      <Modal visible={!!selectedPatient} transparent animationType="slide" onRequestClose={() => setSelectedPatient(null)}>
        <View style={styles.modalBackdrop}>
          {selectedPatient && (
            <View style={styles.formCard}>
              <View style={styles.formHeader}>
                <Text style={styles.formTitle}>Patient Clinical Dossier</Text>
                <TouchableOpacity onPress={() => setSelectedPatient(null)} style={styles.closeBtn}>
                  <X size={16} color={Colors.onSurfaceVariant} />
                </TouchableOpacity>
              </View>
              <View style={styles.visitDetailBox}>
                <Text style={styles.visitDetailItem}>Patient: <Text style={{ fontFamily: FontFamily.bodySemiBold }}>{selectedPatient.name}</Text></Text>
                <Text style={styles.visitDetailItem}>UHID: <Text style={{ fontFamily: FontFamily.dataMono }}>{selectedPatient.uhid}</Text></Text>
                <Text style={styles.visitDetailItem}>Attending Physician: <Text style={{ fontFamily: FontFamily.bodySemiBold }}>{selectedPatient.doctor}</Text></Text>
                <Text style={styles.visitDetailItem}>Clinical Notes: <Text style={{ fontFamily: FontFamily.bodyRegular }}>{selectedPatient.notes}</Text></Text>
              </View>

              <TouchableOpacity
                style={styles.primaryActionBtn}
                onPress={() => {
                  setPatientAlert({
                    visible: true,
                    type: "clinical",
                    title: "Patient Access Shared",
                    message: `Clinical profile for ${selectedPatient.name} synchronized to attending clinic terminal.`,
                  });
                  setSelectedPatient(null);
                }}
              >
                <Eye size={16} color={Colors.onPrimary} />
                <Text style={styles.primaryActionBtnText}>Sync to Clinic Terminal</Text>
              </TouchableOpacity>
            </View>
          )}
        </View>
      </Modal>

      {/* Themed Admin Patient Alert Modal */}
      <ThemedAlertModal
        visible={patientAlert.visible}
        type={patientAlert.type || "clinical"}
        title={patientAlert.title}
        message={patientAlert.message}
        onClose={() => setPatientAlert((prev) => ({ ...prev, visible: false }))}
      />
    </ScrollView>
  );
}

// ─── Admin Profile ────────────────────────────────────────────────────────────
export function AdminProfile({ onSignOut }: { onSignOut: () => void }) {
  const [activeModal, setActiveModal] = useState<string | null>(null);

  // Admin Information State
  const [adminName, setAdminName] = useState("Alexander Wright");
  const [adminRole, setAdminRole] = useState("Chief Operations Lead · Level-5 Master Clearance");
  const [adminEmail, setAdminEmail] = useState("alexander.wright@medsync.health");
  const [adminPager, setAdminPager] = useState("+1 (555) 901-4422");
  const [copiedToken, setCopiedToken] = useState(false);

  // Temp form states for editing admin info
  const [tempAdminName, setTempAdminName] = useState(adminName);
  const [tempAdminRole, setTempAdminRole] = useState(adminRole);
  const [tempAdminEmail, setTempAdminEmail] = useState(adminEmail);
  const [tempAdminPager, setTempAdminPager] = useState(adminPager);
  const [editAdminModal, setEditAdminModal] = useState(false);

  // Quick System Governance Controls
  const [maintenanceMode, setMaintenanceMode] = useState(false);
  const [autoReminders, setAutoReminders] = useState(true);
  const [aiGuardrail, setAiGuardrail] = useState(true);
  const [telehealthSurge, setTelehealthSurge] = useState(false);

  // Clinic System Settings State
  const [clinicName, setClinicName] = useState("MedSync Central Hospital & Multispecialty Clinics");
  const [clinicAddress, setClinicAddress] = useState("742 Evergreen Healthcare Blvd, Suite 400, NY 10001");
  const [nurseHotline, setNurseHotline] = useState("+1 (555) 911-0022");
  const [timezone, setTimezone] = useState("America/New_York (EST / EDT)");
  const [bookingWindow, setBookingWindow] = useState("60");
  const [consultBuffer, setConsultBuffer] = useState("15");
  const [autoReschedule, setAutoReschedule] = useState(true);
  const [enforceMfa, setEnforceMfa] = useState(true);

  // User Directory State
  const [userSearch, setUserSearch] = useState("");
  const [registeredUsers, setRegisteredUsers] = useState(ADMIN_REGISTERED_USERS);

  // Cluster Nodes State
  const [nodes] = useState([
    { id: 1, name: "MedSync Core REST API", port: "3001", latency: "18ms", memory: "42 MB", status: "Healthy" },
    { id: 2, name: "Neural Diagnostic Engine", port: "—", latency: "142ms", memory: "Active", status: "Online" },
    { id: 3, name: "Live Chat WebSocket Gateway", port: "3001/ws", latency: "12ms", memory: "Active rooms", status: "Operational" },
  ]);
  const [isPinging, setIsPinging] = useState(false);
  const [adminAlert, setAdminAlert] = useState<{
    visible: boolean;
    type?: "info" | "success" | "warning" | "error" | "ai" | "clinical";
    title: string;
    message?: string;
    buttons?: ThemedAlertButton[];
  }>({
    visible: false,
    title: "",
  });

  const handleCopyToken = () => {
    setCopiedToken(true);
    setTimeout(() => setCopiedToken(false), 2500);
    setAdminAlert({
      visible: true,
      type: "success",
      title: "Token Copied",
      message: "Master Authority Key AUTH-KEY-8829-X9 copied to clipboard.",
    });
  };

  const handleSaveAdminInfo = () => {
    setAdminName(tempAdminName.trim() || "Alexander Wright");
    setAdminRole(tempAdminRole.trim() || "Chief Operations Lead");
    setAdminEmail(tempAdminEmail.trim() || "alexander.wright@medsync.health");
    setAdminPager(tempAdminPager.trim() || "+1 (555) 901-4422");
    setEditAdminModal(false);
    setAdminAlert({
      visible: true,
      type: "success",
      title: "Authority Updated",
      message: "Admin credentialing and pager details have been saved.",
    });
  };

  const handleSaveClinicSettings = () => {
    setAdminAlert({
      visible: true,
      type: "success",
      title: "Clinic Settings Saved",
      message: "Hospital parameters, emergency nurse hotline, and booking windows updated across the network.",
    });
    setActiveModal(null);
  };

  const handlePingNodes = () => {
    setIsPinging(true);
    setTimeout(() => {
      setIsPinging(false);
      setAdminAlert({
        visible: true,
        type: "success",
        title: "Cluster Telemetry Refreshed",
        message: "All cluster nodes responded with sub-200ms latency.",
      });
    }, 600);
  };

  const handleToggleMaintenance = (val: boolean) => {
    if (val) {
      setAdminAlert({
        visible: true,
        type: "warning",
        title: "Activate Maintenance Mode?",
        message: "This will temporarily pause patient booking and show a system maintenance notice.",
        buttons: [
          {
            text: "Cancel",
            style: "cancel",
            onPress: () => setAdminAlert((prev) => ({ ...prev, visible: false })),
          },
          {
            text: "Activate",
            style: "destructive",
            onPress: () => {
              setAdminAlert((prev) => ({ ...prev, visible: false }));
              setMaintenanceMode(true);
            },
          },
        ],
      });
    } else {
      setMaintenanceMode(false);
      setAdminAlert({
        visible: true,
        type: "info",
        title: "Maintenance Deactivated",
        message: "Hospital network is fully operational.",
      });
    }
  };

  const handleToggleUserStatus = (id: string, name: string) => {
    setRegisteredUsers((prev) =>
      prev.map((u) => {
        if (u.id === id) {
          const nextStatus = u.status === "Active" ? "Suspended" : "Active";
          setAdminAlert({
            visible: true,
            type: nextStatus === "Active" ? "success" : "warning",
            title: "Account Status Changed",
            message: `${name} is now marked as ${nextStatus}.`,
          });
          return { ...u, status: nextStatus };
        }
        return u;
      })
    );
  };

  const handleResetUserPassword = (name: string, email: string) => {
    setAdminAlert({
      visible: true,
      type: "info",
      title: "Password Reset Sent",
      message: `Temporary one-time sign-in link dispatched to ${email} for ${name}.`,
    });
  };

  const handleSyncUser = (name: string, uhid: string) => {
    setAdminAlert({
      visible: true,
      type: "clinical",
      title: "Clinical Dossier Synced",
      message: `Records for ${name} (${uhid}) synchronized across all attending clinic terminals.`,
    });
  };

  const handleExportAnalytics = () => {
    setAdminAlert({
      visible: true,
      type: "info",
      title: "Export Initiated",
      message: "Clinical operations summary exported to 'medsync-ops-q3.csv'. Ready for audit review.",
    });
  };

  const handleDownloadCompliance = () => {
    setAdminAlert({
      visible: true,
      type: "success",
      title: "Dossier Generated",
      message: "Verified HIPAA Compliance Report & BAA Addendum generated (PDF). Sent to master administrative email.",
    });
  };

  const handleRotateSessionTokens = () => {
    setAdminAlert({
      visible: true,
      type: "warning",
      title: "Session Tokens Rotated",
      message: "All active web and terminal sessions invalidated. Master session authenticated via local YubiKey.",
    });
  };

  const menu = [
    { id: "clinic", label: "Clinic System Settings", sub: "Facility hotline, booking windows, timezone", icon: Building2 },
    { id: "users", label: "Registered Patient Accounts", sub: "5 active patient profiles, access status", icon: Users },
    { id: "analytics", label: "Operations Analytics & Capacity", sub: "Occupancy, avg wait, cancellation rate", icon: BarChart3 },
    { id: "security", label: "Security & Encryption Audit", sub: "AES-256 GCM, TLS 1.3 PFS, master sessions", icon: Lock },
    { id: "compliance", label: "HIPAA Compliance Reports", sub: "Privacy & Security rules, BAA validity", icon: FileCheck },
  ];

  const filteredUsers = registeredUsers.filter((u) =>
    (u.name + u.uhid + u.email + u.doctor).toLowerCase().includes(userSearch.toLowerCase())
  );

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
      {/* ─── 1. Admin Identity & Master Authority Card ──────────────────────── */}
      <View style={styles.adminIdentityCard}>
        <View style={styles.adminTopRow}>
          <View style={styles.adminAvatarCircle}>
            <Text style={styles.adminAvatarText}>AW</Text>
          </View>
          <TouchableOpacity
            style={styles.adminEditBtn}
            onPress={() => {
              setTempAdminName(adminName);
              setTempAdminRole(adminRole);
              setTempAdminEmail(adminEmail);
              setTempAdminPager(adminPager);
              setEditAdminModal(true);
            }}
            activeOpacity={0.7}
          >
            <Edit3 size={13} color={Colors.primary} />
            <Text style={styles.adminEditBtnText}>Edit Info</Text>
          </TouchableOpacity>
        </View>

        <Text style={styles.adminName}>{adminName}</Text>
        <Text style={styles.adminRole}>{adminRole}</Text>

        {/* Clearance & Token Chips */}
        <View style={styles.adminChipRow}>
          <View style={styles.adminClearanceBadge}>
            <Award size={13} color={Colors.primary} />
            <Text style={styles.adminClearanceText}>Level 5 Clearance</Text>
          </View>
          <TouchableOpacity
            style={styles.adminTokenChip}
            onPress={handleCopyToken}
            activeOpacity={0.7}
          >
            <Key size={12} color={Colors.outline} />
            <Text style={styles.adminTokenText}>AUTH-KEY-8829-X9</Text>
            {copiedToken ? (
              <Check size={12} color={Colors.secondary} />
            ) : (
              <Copy size={12} color={Colors.outline} />
            )}
          </TouchableOpacity>
        </View>

        {/* Contact info row */}
        <View style={styles.adminContactRow}>
          <View style={styles.adminContactItem}>
            <Mail size={12} color={Colors.outline} />
            <Text style={styles.adminContactText}>{adminEmail}</Text>
          </View>
          <View style={styles.adminContactItem}>
            <Phone size={12} color={Colors.outline} />
            <Text style={styles.adminContactText}>{adminPager}</Text>
          </View>
        </View>

        {/* 3-Stat Row */}
        <View style={styles.statsRow}>
          {[
            { label: "Active Nodes", value: "4 / 4", id: "nodes_stat" },
            { label: "System Uptime", value: "99.98%", id: "uptime_stat" },
            { label: "Security Level", value: "Tier 1", id: "tier_stat" },
          ].map((s, idx) => (
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
              {idx < 2 && <View style={styles.statDivider} />}
            </React.Fragment>
          ))}
        </View>
      </View>

      {/* ─── 2. System Governance & Live Telemetry Card ────────────────────── */}
      <View style={styles.systemCard}>
        <View style={styles.systemStatusRow}>
          <View style={styles.pulseDot} />
          <View style={{ flex: 1 }}>
            <Text style={styles.systemStatusTitle}>All 4 Server Clusters Operational</Text>
            <Text style={styles.systemStatusSub}>Zero incident reports · Real-time telemetry active</Text>
          </View>
        </View>

        <View style={styles.switchDivider} />

        {/* Quick Governance Switches */}
        <View style={styles.switchRow}>
          <View style={styles.switchLabelBox}>
            <Text style={styles.switchTitle}>Hospital Maintenance Mode</Text>
            <Text style={styles.switchSubtitle}>Temporarily pause non-urgent patient self-booking</Text>
          </View>
          <Switch
            value={maintenanceMode}
            onValueChange={handleToggleMaintenance}
            trackColor={{ false: Colors.surfaceContainerHighest, true: Colors.error }}
            thumbColor={Colors.surfaceContainerLowest}
          />
        </View>

        <View style={styles.switchDivider} />

        <View style={styles.switchRow}>
          <View style={styles.switchLabelBox}>
            <Text style={styles.switchTitle}>Automated SMS Reminders</Text>
            <Text style={styles.switchSubtitle}>Dispatch alerts 24h & 2h before appointments</Text>
          </View>
          <Switch
            value={autoReminders}
            onValueChange={setAutoReminders}
            trackColor={{ false: Colors.surfaceContainerHighest, true: Colors.primary }}
            thumbColor={Colors.surfaceContainerLowest}
          />
        </View>

        <View style={styles.switchDivider} />

        <View style={styles.switchRow}>
          <View style={styles.switchLabelBox}>
            <Text style={styles.switchTitle}>AI Clinical Scans Guardrail</Text>
            <Text style={styles.switchSubtitle}>Mandate physician sign-off on borderline vitals & ECG alerts</Text>
          </View>
          <Switch
            value={aiGuardrail}
            onValueChange={setAiGuardrail}
            trackColor={{ false: Colors.surfaceContainerHighest, true: Colors.primary }}
            thumbColor={Colors.surfaceContainerLowest}
          />
        </View>

        <View style={styles.switchDivider} />

        <View style={styles.switchRow}>
          <View style={styles.switchLabelBox}>
            <Text style={styles.switchTitle}>Emergency Live Chat Surge</Text>
            <Text style={styles.switchSubtitle}>Dynamically expand live chat consultation queue capacity</Text>
          </View>
          <Switch
            value={telehealthSurge}
            onValueChange={setTelehealthSurge}
            trackColor={{ false: Colors.surfaceContainerHighest, true: Colors.primary }}
            thumbColor={Colors.surfaceContainerLowest}
          />
        </View>
      </View>

      {/* ─── 3. Facility Accreditation & Security Standard Card ───────────── */}
      <View style={styles.credentialsCard}>
        <View style={{ flexDirection: "row", alignItems: "center", gap: 6, marginBottom: 4 }}>
          <ShieldCheck size={18} color={Colors.primary} />
          <Text style={styles.adminModalCardTitle}>Facility Accreditation & Security</Text>
        </View>
        <View style={styles.credGrid}>
          <View style={styles.credGridItem}>
            <Text style={styles.credGridLabel}>FACILITY LICENSE</Text>
            <Text style={styles.credGridVal}>HOSP-REG-2024-CA</Text>
          </View>
          <View style={styles.credGridItem}>
            <Text style={styles.credGridLabel}>CLOUD INFRASTRUCTURE</Text>
            <Text style={styles.credGridVal}>HIPAA Cloud us-east-1</Text>
          </View>
          <View style={styles.credGridItem}>
            <Text style={styles.credGridLabel}>TRANSPORT CIPHER</Text>
            <Text style={styles.credGridVal}>TLS 1.3 Strict HTTPS</Text>
          </View>
          <View style={styles.credGridItem}>
            <Text style={styles.credGridLabel}>BAA AGREEMENT</Text>
            <Text style={[styles.credGridVal, { color: Colors.secondary }]}>Active · Dec 2027</Text>
          </View>
        </View>
      </View>

      {/* ─── 4. Administrative Operations Menu Card ────────────────────────── */}
      <View style={styles.menuCard}>
        {menu.map((item, idx) => {
          const IconComp = item.icon;
          return (
            <View key={item.id}>
              <TouchableOpacity
                style={styles.menuItem}
                onPress={() => setActiveModal(item.id)}
                activeOpacity={0.7}
              >
                <IconComp size={20} color={Colors.primary} />
                <View style={{ flex: 1 }}>
                  <Text style={styles.menuLabel}>{item.label}</Text>
                  <Text style={{ fontSize: 11, color: Colors.onSurfaceVariant, fontFamily: FontFamily.bodyRegular, marginTop: 1 }}>
                    {item.sub}
                  </Text>
                </View>
                <ChevronRight size={18} color={Colors.onSurfaceVariant} />
              </TouchableOpacity>
              {idx < menu.length - 1 && <View style={styles.menuDivider} />}
            </View>
          );
        })}
      </View>

      {/* ─── Sign Out Button ──────────────────────────────────────────────── */}
      <TouchableOpacity onPress={onSignOut} style={styles.signOutBtn} activeOpacity={0.8}>
        <LogOut size={18} color={Colors.error} />
        <Text style={styles.signOutText}>Sign Out of Console</Text>
      </TouchableOpacity>

      {/* ─── Edit Admin Info Modal ────────────────────────────────────────── */}
      <Modal visible={editAdminModal} animationType="slide" presentationStyle="pageSheet" onRequestClose={() => setEditAdminModal(false)}>
        <View style={styles.modalBackdropSheet}>
          <View style={styles.sheetHeader}>
            <Text style={styles.sheetTitle}>Edit Authority Profile</Text>
            <TouchableOpacity onPress={() => setEditAdminModal(false)} style={styles.closeBtn}>
              <X size={18} color={Colors.onSurface} />
            </TouchableOpacity>
          </View>
          <ScrollView contentContainerStyle={{ padding: Spacing.md, gap: Spacing.sm }}>
            <View style={styles.formGroup}>
              <Text style={styles.inputLabel}>Administrator Full Name</Text>
              <TextInput style={styles.formInput} value={tempAdminName} onChangeText={setTempAdminName} />
            </View>
            <View style={styles.formGroup}>
              <Text style={styles.inputLabel}>Designated Title & Role</Text>
              <TextInput style={styles.formInput} value={tempAdminRole} onChangeText={setTempAdminRole} />
            </View>
            <View style={styles.formGroup}>
              <Text style={styles.inputLabel}>Administrative Email Address</Text>
              <TextInput style={styles.formInput} value={tempAdminEmail} onChangeText={setTempAdminEmail} keyboardType="email-address" />
            </View>
            <View style={styles.formGroup}>
              <Text style={styles.inputLabel}>Emergency Operations Pager</Text>
              <TextInput style={styles.formInput} value={tempAdminPager} onChangeText={setTempAdminPager} keyboardType="phone-pad" />
            </View>
            <TouchableOpacity style={styles.adminSaveBtn} onPress={handleSaveAdminInfo} activeOpacity={0.8}>
              <Save size={18} color={Colors.onPrimary} />
              <Text style={styles.adminSaveBtnText}>Save Authority Profile</Text>
            </TouchableOpacity>
          </ScrollView>
        </View>
      </Modal>

      {/* ─── Admin Setting & Telemetry Sheets ─────────────────────────────── */}
      <Modal visible={!!activeModal} animationType="slide" presentationStyle="pageSheet" onRequestClose={() => setActiveModal(null)}>
        <View style={styles.modalBackdropSheet}>
          <View style={styles.sheetHeader}>
            <Text style={styles.sheetTitle}>
              {activeModal === "admin_info" && "Administrator Key Status"}
              {activeModal === "nodes_stat" && "Active Server Nodes (4)"}
              {activeModal === "uptime_stat" && "30-Day Infrastructure Uptime"}
              {activeModal === "tier_stat" && "Tier-1 Defense & Encryption"}
              {activeModal === "clinic" && "Clinic System Settings"}
              {activeModal === "users" && "User & Patient Directory"}
              {activeModal === "analytics" && "Clinical Operations Analytics"}
              {activeModal === "security" && "Security & Encryption Audit"}
              {activeModal === "compliance" && "HIPAA Compliance Reports"}
            </Text>
            <TouchableOpacity onPress={() => setActiveModal(null)} style={styles.closeBtn}>
              <X size={18} color={Colors.onSurface} />
            </TouchableOpacity>
          </View>

          <ScrollView contentContainerStyle={{ padding: Spacing.md, gap: Spacing.sm }} showsVerticalScrollIndicator={false}>
            {/* Admin Key Clearance */}
            {activeModal === "admin_info" && (
              <View style={{ gap: Spacing.sm }}>
                <View style={styles.adminModalCard}>
                  <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between" }}>
                    <Text style={styles.adminModalCardTitle}>Administrative Authority Dossier</Text>
                    <View style={styles.adminClearanceBadge}>
                      <Award size={12} color={Colors.primary} />
                      <Text style={styles.adminClearanceText}>LEVEL 5</Text>
                    </View>
                  </View>
                  <View style={styles.adminModalDivider} />
                  <View style={styles.adminModalRow}>
                    <Text style={styles.adminModalLabel}>Authorized Officer</Text>
                    <Text style={styles.adminModalValue}>{adminName}</Text>
                  </View>
                  <View style={styles.adminModalRow}>
                    <Text style={styles.adminModalLabel}>Designated Role</Text>
                    <Text style={styles.adminModalValue}>{adminRole}</Text>
                  </View>
                  <View style={styles.adminModalRow}>
                    <Text style={styles.adminModalLabel}>Administrative Email</Text>
                    <Text style={styles.adminModalValue}>{adminEmail}</Text>
                  </View>
                  <View style={styles.adminModalRow}>
                    <Text style={styles.adminModalLabel}>Direct Pager / Station</Text>
                    <Text style={styles.adminModalValue}>{adminPager}</Text>
                  </View>
                  <View style={styles.adminModalRow}>
                    <Text style={styles.adminModalLabel}>Hardware MFA Token</Text>
                    <Text style={styles.adminModalValue}>YubiKey 5C NFC (#99420)</Text>
                  </View>
                  <View style={styles.adminModalRow}>
                    <Text style={styles.adminModalLabel}>Enforced IP Subnet</Text>
                    <Text style={styles.adminModalValue}>192.168.0.103 (Local Subnet)</Text>
                  </View>
                  <View style={styles.adminModalRow}>
                    <Text style={styles.adminModalLabel}>Master Clearance Scope</Text>
                    <Text style={styles.adminModalValue}>Credential Doctors, Audit Logs, Cluster Ops</Text>
                  </View>
                </View>

                <TouchableOpacity
                  style={styles.adminSaveBtn}
                  onPress={() => {
                    setActiveModal(null);
                    setTempAdminName(adminName);
                    setTempAdminRole(adminRole);
                    setTempAdminEmail(adminEmail);
                    setTempAdminPager(adminPager);
                    setEditAdminModal(true);
                  }}
                  activeOpacity={0.8}
                >
                  <Edit3 size={18} color={Colors.onPrimary} />
                  <Text style={styles.adminSaveBtnText}>Edit Administrative Details</Text>
                </TouchableOpacity>
              </View>
            )}

            {/* Server Nodes */}
            {activeModal === "nodes_stat" && (
              <View style={{ gap: Spacing.sm }}>
                <View style={styles.adminModalCard}>
                  <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center" }}>
                    <Text style={styles.adminModalCardTitle}>Cluster Telemetry (4 Active Nodes)</Text>
                    <View style={{ flexDirection: "row", alignItems: "center", gap: 4 }}>
                      <View style={styles.pulseDot} />
                      <Text style={{ fontSize: 11, color: Colors.secondary, fontFamily: FontFamily.dataMonoBold }}>100% HEALTHY</Text>
                    </View>
                  </View>
                  <Text style={styles.adminModalCardSub}>Real-time monitoring across hospital application, inference & storage layers.</Text>
                </View>

                {nodes.map((node) => (
                  <View key={node.id} style={styles.nodeCard}>
                    <View style={styles.nodeTopRow}>
                      <Server size={18} color={Colors.primary} />
                      <View style={{ flex: 1 }}>
                        <Text style={styles.nodeName}>{node.name}</Text>
                        <Text style={{ fontSize: 11, color: Colors.outline, fontFamily: FontFamily.dataMono }}>Port {node.port} · Cluster ID: N0{node.id}</Text>
                      </View>
                      <View style={[styles.badge, { backgroundColor: Colors.secondaryContainer + "55" }]}>
                        <Text style={[styles.badgeText, { color: Colors.secondary }]}>{node.status}</Text>
                      </View>
                    </View>
                    <View style={styles.nodeDetailsRow}>
                      <View style={styles.nodeDetailItem}>
                        <Text style={styles.nodeDetailLabel}>LATENCY</Text>
                        <Text style={styles.nodeDetailVal}>{node.latency}</Text>
                      </View>
                      <View style={styles.nodeDetailItem}>
                        <Text style={styles.nodeDetailLabel}>LOAD / RAM</Text>
                        <Text style={styles.nodeDetailVal}>{node.memory}</Text>
                      </View>
                      <View style={styles.nodeDetailItem}>
                        <Text style={styles.nodeDetailLabel}>UPTIME</Text>
                        <Text style={styles.nodeDetailVal}>99.99%</Text>
                      </View>
                    </View>
                  </View>
                ))}

                <TouchableOpacity
                  style={styles.adminSaveBtn}
                  onPress={handlePingNodes}
                  activeOpacity={0.8}
                >
                  <RefreshCw size={18} color={Colors.onPrimary} />
                  <Text style={styles.adminSaveBtnText}>{isPinging ? "Pinging All Clusters..." : "Trigger Cluster Health Ping"}</Text>
                </TouchableOpacity>
              </View>
            )}

            {/* System Uptime */}
            {activeModal === "uptime_stat" && (
              <View style={{ gap: Spacing.sm }}>
                <View style={styles.adminModalCard}>
                  <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center" }}>
                    <Text style={styles.adminModalCardTitle}>30-Day Continuous Availability</Text>
                    <Text style={{ fontSize: FontSize.headlineSm, color: Colors.secondary, fontFamily: FontFamily.dataMonoBold }}>99.98%</Text>
                  </View>
                  <Text style={styles.adminModalCardSub}>SLA Commitment: 99.95% | Actual: 99.98% (Exceeding Target)</Text>

                  {/* 30-day block indicators */}
                  <View style={{ flexDirection: "row", gap: 3, flexWrap: "wrap", marginTop: 8 }}>
                    {Array.from({ length: 30 }).map((_, i) => (
                      <View
                        key={i}
                        style={{
                          width: 8,
                          height: 16,
                          borderRadius: 2,
                          backgroundColor: i === 21 ? Colors.primary : Colors.secondary,
                        }}
                      />
                    ))}
                  </View>
                  <View style={{ flexDirection: "row", justifyContent: "space-between", marginTop: 4 }}>
                    <Text style={{ fontSize: 10, color: Colors.outline, fontFamily: FontFamily.dataMono }}>30 Days Ago</Text>
                    <Text style={{ fontSize: 10, color: Colors.outline, fontFamily: FontFamily.dataMono }}>Today (Operational)</Text>
                  </View>
                </View>

                <View style={styles.adminModalCard}>
                  <Text style={styles.adminModalCardTitle}>SLA Incident Summary</Text>
                  <View style={styles.adminModalRow}>
                    <Text style={styles.adminModalLabel}>Current Continuous Uptime</Text>
                    <Text style={styles.adminModalValue}>42 days, 18 hours</Text>
                  </View>
                  <View style={styles.adminModalRow}>
                    <Text style={styles.adminModalLabel}>Unplanned Outages (Quarter)</Text>
                    <Text style={[styles.adminModalValue, { color: Colors.secondary }]}>0 Incidents</Text>
                  </View>
                  <View style={styles.adminModalRow}>
                    <Text style={styles.adminModalLabel}>Scheduled Maintenance</Text>
                    <Text style={styles.adminModalValue}>1 window (12 mins, off-peak)</Text>
                  </View>
                  <View style={styles.adminModalRow}>
                    <Text style={styles.adminModalLabel}>Mean Time to Recovery (MTTR)</Text>
                    <Text style={styles.adminModalValue}>{"< 2.4 minutes"}</Text>
                  </View>
                </View>
              </View>
            )}

            {/* Security Level / Defense */}
            {activeModal === "tier_stat" && (
              <View style={{ gap: Spacing.sm }}>
                <View style={styles.adminModalCard}>
                  <Text style={styles.adminModalCardTitle}>Tier-1 Defense Architecture</Text>
                  <Text style={styles.adminModalCardSub}>Multi-layered defense safeguards deployed across cloud and clinic edges.</Text>
                </View>

                {[
                  { title: "End-to-End ePHI Encryption", desc: "All patient vitals, clinical encounters, and prescriptions are protected by AES-256 GCM authenticated encryption at rest and in transit.", icon: Lock },
                  { title: "Zero-Trust Device Identity", desc: "Hardware token verification (YubiKey / WebAuthn) required for administrative commands and doctor credential issuance.", icon: Key },
                  { title: "AI Behavioral Anomaly Filter", desc: "Real-time heuristics monitor suspicious query patterns, unauthorized mass exports, or abnormal credential attempts.", icon: Cpu },
                  { title: "Immutable Append-Only Audit Trail", desc: "Every chart viewing, doctor creation, or patient record update is cryptographically hashed with SHA-256 integrity checks.", icon: ShieldCheck },
                ].map((pillar, idx) => {
                  const IconP = pillar.icon;
                  return (
                    <View key={idx} style={styles.adminModalCard}>
                      <View style={{ flexDirection: "row", alignItems: "center", gap: 8 }}>
                        <IconP size={20} color={Colors.primary} />
                        <Text style={{ fontSize: FontSize.bodySm, color: Colors.onSurface, fontFamily: FontFamily.bodySemiBold }}>{pillar.title}</Text>
                      </View>
                      <Text style={{ fontSize: 11, color: Colors.onSurfaceVariant, fontFamily: FontFamily.bodyRegular, lineHeight: 18, marginTop: 4 }}>{pillar.desc}</Text>
                    </View>
                  );
                })}
              </View>
            )}

            {/* Clinic System Settings */}
            {activeModal === "clinic" && (
              <View style={{ gap: Spacing.sm }}>
                <View style={styles.adminModalCard}>
                  <Text style={styles.adminModalCardTitle}>Facility Parameters</Text>
                  <View style={styles.formGroup}>
                    <Text style={styles.inputLabel}>Facility Registered Name</Text>
                    <TextInput
                      style={styles.formInput}
                      value={clinicName}
                      onChangeText={setClinicName}
                    />
                  </View>
                  <View style={styles.formGroup}>
                    <Text style={styles.inputLabel}>Physical Campus Address</Text>
                    <TextInput
                      style={styles.formInput}
                      value={clinicAddress}
                      onChangeText={setClinicAddress}
                    />
                  </View>
                  <View style={styles.formGroup}>
                    <Text style={styles.inputLabel}>Emergency Nurse Triage Hotline</Text>
                    <TextInput
                      style={styles.formInput}
                      value={nurseHotline}
                      onChangeText={setNurseHotline}
                      keyboardType="phone-pad"
                    />
                  </View>
                  <View style={styles.formGroup}>
                    <Text style={styles.inputLabel}>Operational Timezone</Text>
                    <TextInput
                      style={styles.formInput}
                      value={timezone}
                      onChangeText={setTimezone}
                    />
                  </View>
                </View>

                <View style={styles.adminModalCard}>
                  <Text style={styles.adminModalCardTitle}>Booking & Scheduling Rules</Text>
                  <View style={styles.formGroup}>
                    <Text style={styles.inputLabel}>Maximum Advance Booking Window (Days)</Text>
                    <TextInput
                      style={styles.formInput}
                      value={bookingWindow}
                      onChangeText={setBookingWindow}
                      keyboardType="numeric"
                    />
                  </View>
                  <View style={styles.formGroup}>
                    <Text style={styles.inputLabel}>Consultation Transition Buffer (Minutes)</Text>
                    <TextInput
                      style={styles.formInput}
                      value={consultBuffer}
                      onChangeText={setConsultBuffer}
                      keyboardType="numeric"
                    />
                  </View>
                  <View style={styles.switchRow}>
                    <View style={styles.switchLabelBox}>
                      <Text style={styles.switchTitle}>Auto-Reschedule on Physician Emergency</Text>
                      <Text style={styles.switchSubtitle}>Automatically notify affected patients with next-available slots</Text>
                    </View>
                    <Switch
                      value={autoReschedule}
                      onValueChange={setAutoReschedule}
                      trackColor={{ false: Colors.surfaceContainerHighest, true: Colors.primary }}
                      thumbColor={Colors.surfaceContainerLowest}
                    />
                  </View>
                  <View style={styles.switchRow}>
                    <View style={styles.switchLabelBox}>
                      <Text style={styles.switchTitle}>Enforce 2FA for Clinical Staff</Text>
                      <Text style={styles.switchSubtitle}>Require biometric or TOTP token on every provider login</Text>
                    </View>
                    <Switch
                      value={enforceMfa}
                      onValueChange={setEnforceMfa}
                      trackColor={{ false: Colors.surfaceContainerHighest, true: Colors.primary }}
                      thumbColor={Colors.surfaceContainerLowest}
                    />
                  </View>
                </View>

                <TouchableOpacity
                  style={styles.adminSaveBtn}
                  onPress={handleSaveClinicSettings}
                  activeOpacity={0.8}
                >
                  <Save size={18} color={Colors.onPrimary} />
                  <Text style={styles.adminSaveBtnText}>Save Clinic Configuration</Text>
                </TouchableOpacity>
              </View>
            )}

            {/* Registered Patient Accounts */}
            {activeModal === "users" && (
              <View style={{ gap: Spacing.sm }}>
                <View style={styles.searchBar}>
                  <Search size={18} color={Colors.outline} />
                  <TextInput
                    style={styles.searchInput}
                    placeholder="Search patient by name, UHID, or email..."
                    placeholderTextColor={Colors.outline}
                    value={userSearch}
                    onChangeText={setUserSearch}
                  />
                  {userSearch.length > 0 && (
                    <TouchableOpacity onPress={() => setUserSearch("")}>
                      <X size={16} color={Colors.outline} />
                    </TouchableOpacity>
                  )}
                </View>

                <View style={{ flexDirection: "row", gap: 8 }}>
                  <View style={[styles.badge, { backgroundColor: Colors.surfaceContainerLowest, borderWidth: 1, borderColor: Colors.outlineVariant }]}>
                    <Text style={[styles.badgeText, { color: Colors.onSurface }]}>Total: {registeredUsers.length}</Text>
                  </View>
                  <View style={[styles.badge, { backgroundColor: Colors.secondaryContainer + "55" }]}>
                    <Text style={[styles.badgeText, { color: Colors.secondary }]}>Active: {registeredUsers.filter((u) => u.status === "Active").length}</Text>
                  </View>
                  <View style={[styles.badge, { backgroundColor: Colors.errorContainer }]}>
                    <Text style={[styles.badgeText, { color: Colors.onErrorContainer }]}>AI Flagged: {registeredUsers.filter((u) => u.status === "AI Flagged").length}</Text>
                  </View>
                </View>

                {filteredUsers.map((u) => (
                  <View key={u.id} style={styles.userItemCard}>
                    <View style={{ flexDirection: "row", alignItems: "center", gap: Spacing.xs }}>
                      <View style={styles.userAvatar}>
                        <Text style={styles.userAvatarText}>{u.name[0]}</Text>
                      </View>
                      <View style={{ flex: 1 }}>
                        <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between" }}>
                          <Text style={styles.userName}>{u.name}</Text>
                          <View
                            style={[
                              styles.badge,
                              {
                                backgroundColor:
                                  u.status === "Active"
                                    ? Colors.secondaryContainer + "55"
                                    : u.status === "AI Flagged"
                                    ? Colors.errorContainer
                                    : Colors.surfaceContainerHighest,
                              },
                            ]}
                          >
                            <Text
                              style={[
                                styles.badgeText,
                                {
                                  color:
                                    u.status === "Active"
                                      ? Colors.secondary
                                      : u.status === "AI Flagged"
                                      ? Colors.onErrorContainer
                                      : Colors.onSurfaceVariant,
                                },
                              ]}
                            >
                              {u.status}
                            </Text>
                          </View>
                        </View>
                        <Text style={styles.userMeta}>{u.uhid} · {u.email}</Text>
                        <Text style={[styles.userMeta, { color: Colors.primary }]}>Physician: {u.doctor} · {u.phone}</Text>
                      </View>
                    </View>

                    <View style={styles.userActionsRow}>
                      <TouchableOpacity
                        style={styles.userActionMiniBtn}
                        onPress={() => handleSyncUser(u.name, u.uhid)}
                      >
                        <Eye size={12} color={Colors.primary} />
                        <Text style={styles.userActionMiniText}>Sync Dossier</Text>
                      </TouchableOpacity>
                      <TouchableOpacity
                        style={styles.userActionMiniBtn}
                        onPress={() => handleResetUserPassword(u.name, u.email)}
                      >
                        <Key size={12} color={Colors.primary} />
                        <Text style={styles.userActionMiniText}>Reset 2FA</Text>
                      </TouchableOpacity>
                      <TouchableOpacity
                        style={[
                          styles.userActionMiniBtn,
                          u.status === "Active" ? { borderColor: Colors.error } : { borderColor: Colors.secondary },
                        ]}
                        onPress={() => handleToggleUserStatus(u.id, u.name)}
                      >
                        <Shield size={12} color={u.status === "Active" ? Colors.error : Colors.secondary} />
                        <Text
                          style={[
                            styles.userActionMiniText,
                            { color: u.status === "Active" ? Colors.error : Colors.secondary },
                          ]}
                        >
                          {u.status === "Active" ? "Suspend" : "Activate"}
                        </Text>
                      </TouchableOpacity>
                    </View>
                  </View>
                ))}
              </View>
            )}

            {/* Operations Analytics */}
            {activeModal === "analytics" && (
              <View style={{ gap: Spacing.sm }}>
                <View style={styles.analyticsKpiGrid}>
                  <View style={styles.analyticsKpiCard}>
                    <Text style={styles.analyticsKpiVal}>82.4%</Text>
                    <Text style={styles.analyticsKpiLabel}>Clinic Occupancy</Text>
                    <View style={{ flexDirection: "row", alignItems: "center", gap: 2 }}>
                      <TrendingUp size={11} color={Colors.secondary} />
                      <Text style={{ fontSize: 10, color: Colors.secondary, fontFamily: FontFamily.dataMonoBold }}>+4.2%</Text>
                    </View>
                  </View>
                  <View style={styles.analyticsKpiCard}>
                    <Text style={styles.analyticsKpiVal}>18.2m</Text>
                    <Text style={styles.analyticsKpiLabel}>Avg Consultation</Text>
                    <Text style={{ fontSize: 10, color: Colors.outline, fontFamily: FontFamily.dataMono }}>Target: 20m</Text>
                  </View>
                  <View style={styles.analyticsKpiCard}>
                    <Text style={styles.analyticsKpiVal}>98.1%</Text>
                    <Text style={styles.analyticsKpiLabel}>Doctor Attendance</Text>
                    <Text style={{ fontSize: 10, color: Colors.secondary, fontFamily: FontFamily.dataMono }}>On Schedule</Text>
                  </View>
                  <View style={styles.analyticsKpiCard}>
                    <Text style={[styles.analyticsKpiVal, { color: Colors.secondary }]}>2.1%</Text>
                    <Text style={styles.analyticsKpiLabel}>Cancellation Rate</Text>
                    <Text style={{ fontSize: 10, color: Colors.secondary, fontFamily: FontFamily.dataMono }}>Industry: 8%</Text>
                  </View>
                </View>

                <View style={styles.adminModalCard}>
                  <Text style={styles.adminModalCardTitle}>Departmental Encounter Volume</Text>
                  {[
                    { dept: "Cardiology & Electrophysiology", pct: "38%", visits: "142 visits", color: Colors.primary },
                    { dept: "Diagnostics & Imaging", pct: "27%", visits: "101 visits", color: Colors.secondary },
                    { dept: "Neurology & Cognitive Care", pct: "23%", visits: "86 visits", color: Colors.tertiary },
                    { dept: "General Medicine & Triage", pct: "12%", visits: "45 visits", color: "#E67E22" },
                  ].map((d, idx) => (
                    <View key={idx} style={{ gap: 4, marginTop: 6 }}>
                      <View style={{ flexDirection: "row", justifyContent: "space-between" }}>
                        <Text style={{ fontSize: FontSize.bodySm, color: Colors.onSurface, fontFamily: FontFamily.bodySemiBold }}>{d.dept}</Text>
                        <Text style={{ fontSize: FontSize.bodySm, color: d.color, fontFamily: FontFamily.dataMonoBold }}>{d.pct} ({d.visits})</Text>
                      </View>
                      <View style={{ height: 6, backgroundColor: Colors.surfaceContainerHigh, borderRadius: 3, overflow: "hidden" }}>
                        <View style={{ width: d.pct as any, height: "100%", backgroundColor: d.color }} />
                      </View>
                    </View>
                  ))}
                </View>

                <View style={styles.adminModalCard}>
                  <Text style={styles.adminModalCardTitle}>Daily Peak Admission Surge Hours</Text>
                  {[
                    { time: "09:00 - 11:30 AM", load: "Morning Intake Peak", status: "High (48% of daily load)" },
                    { time: "02:00 - 04:30 PM", load: "Afternoon Specialist Clinic", status: "Moderate (38% load)" },
                    { time: "05:00 - 07:00 PM", load: "Evening Follow-up & Triage", status: "Light (14% load)" },
                  ].map((h, idx) => (
                    <View key={idx} style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center", paddingVertical: 4 }}>
                      <View>
                        <Text style={{ fontSize: FontSize.bodySm, color: Colors.onSurface, fontFamily: FontFamily.bodyMedium }}>{h.time}</Text>
                        <Text style={{ fontSize: 11, color: Colors.onSurfaceVariant, fontFamily: FontFamily.bodyRegular }}>{h.load}</Text>
                      </View>
                      <Text style={{ fontSize: 11, color: Colors.primary, fontFamily: FontFamily.dataMono }}>{h.status}</Text>
                    </View>
                  ))}
                </View>

                <TouchableOpacity
                  style={styles.adminSaveBtn}
                  onPress={handleExportAnalytics}
                  activeOpacity={0.8}
                >
                  <Download size={18} color={Colors.onPrimary} />
                  <Text style={styles.adminSaveBtnText}>Export Full Operations Audit (CSV)</Text>
                </TouchableOpacity>
              </View>
            )}

            {/* Security Audit */}
            {activeModal === "security" && (
              <View style={{ gap: Spacing.sm }}>
                <View style={[styles.adminModalCard, { borderLeftWidth: 4, borderLeftColor: Colors.secondary }]}>
                  <View style={{ flexDirection: "row", alignItems: "center", gap: 8 }}>
                    <ShieldCheck size={28} color={Colors.secondary} />
                    <View style={{ flex: 1 }}>
                      <Text style={styles.adminModalCardTitle}>Cryptographic Defense: 100 / 100</Text>
                      <Text style={styles.adminModalCardSub}>SOC-2 Type II Certified · Zero Detected Anomalies</Text>
                    </View>
                  </View>
                </View>

                <View style={styles.adminModalCard}>
                  <Text style={styles.adminModalCardTitle}>Active Encryption Ciphers</Text>
                  {[
                    { label: "Rest Encryption", val: "AES-256 GCM authenticated ciphertext on DB storage", status: "Active" },
                    { label: "Transit Security", val: "TLS 1.3 with Perfect Forward Secrecy (PFS)", status: "Active" },
                    { label: "Audit Log Integrity", val: "SHA-256 HMAC append-only hash chain", status: "Verified" },
                    { label: "Hardware MFA", val: "FIDO2 / WebAuthn token required for clearance", status: "Enforced" },
                    { label: "Key Rotation Schedule", val: "Last rotated 14 days ago · Next in 76 days", status: "Current" },
                  ].map((item, idx) => (
                    <View key={idx} style={{ paddingVertical: 4 }}>
                      <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center" }}>
                        <Text style={{ fontSize: 11, color: Colors.outline, fontFamily: FontFamily.dataMonoBold }}>{item.label}</Text>
                        <Text style={{ fontSize: 10, color: Colors.secondary, fontFamily: FontFamily.dataMonoBold }}>{item.status}</Text>
                      </View>
                      <Text style={{ fontSize: FontSize.bodySm, color: Colors.onSurface, fontFamily: FontFamily.bodyRegular, marginTop: 2 }}>{item.val}</Text>
                      {idx < 4 && <View style={{ height: 1, backgroundColor: Colors.surfaceContainerLow, marginTop: 6 }} />}
                    </View>
                  ))}
                </View>

                <View style={styles.adminModalCard}>
                  <Text style={styles.adminModalCardTitle}>Active Master Administrative Sessions</Text>
                  {[
                    { dev: "Current Mobile App (This Device)", ip: "192.168.0.103", time: "Active Now", icon: Smartphone },
                    { dev: "Master Web Console · Station 4B", ip: "192.168.0.103", time: "Station 4B · 22m ago", icon: Laptop },
                  ].map((s, idx) => {
                    const IconC = s.icon;
                    return (
                      <View key={idx} style={{ flexDirection: "row", alignItems: "center", gap: 10, paddingVertical: 4 }}>
                        <IconC size={18} color={Colors.primary} />
                        <View style={{ flex: 1 }}>
                          <Text style={{ fontSize: FontSize.bodySm, color: Colors.onSurface, fontFamily: FontFamily.bodySemiBold }}>{s.dev}</Text>
                          <Text style={{ fontSize: 11, color: Colors.onSurfaceVariant, fontFamily: FontFamily.dataMono }}>IP: {s.ip} · {s.time}</Text>
                        </View>
                      </View>
                    );
                  })}
                </View>

                <TouchableOpacity
                  style={[styles.adminSaveBtn, { backgroundColor: Colors.error }]}
                  onPress={handleRotateSessionTokens}
                  activeOpacity={0.8}
                >
                  <Lock size={18} color={Colors.onError} />
                  <Text style={[styles.adminSaveBtnText, { color: Colors.onError }]}>Rotate Keys & Invalidate Other Sessions</Text>
                </TouchableOpacity>
              </View>
            )}

            {/* Compliance Reports */}
            {activeModal === "compliance" && (
              <View style={{ gap: Spacing.sm }}>
                <View style={[styles.adminModalCard, { borderLeftWidth: 4, borderLeftColor: Colors.primary }]}>
                  <View style={{ flexDirection: "row", alignItems: "center", gap: 8 }}>
                    <FileCheck size={28} color={Colors.primary} />
                    <View style={{ flex: 1 }}>
                      <Text style={styles.adminModalCardTitle}>HIPAA Security & Privacy Verification</Text>
                      <Text style={styles.adminModalCardSub}>45 CFR Parts 160 & 164 · 100% Audit Compliance</Text>
                    </View>
                  </View>
                </View>

                <View style={styles.adminModalCard}>
                  <Text style={styles.adminModalCardTitle}>Statutory Safeguards Checklist</Text>
                  {[
                    { rule: "Privacy Rule: Minimum Necessary Disclosure", desc: "Access limited strictly to attending physicians & verified patient dossiers.", status: "Verified" },
                    { rule: "Security Rule: Technical & Physical Safeguards", desc: "Hardware MFA, 15-minute screen timeout, AES-256 rest encryption.", status: "Verified" },
                    { rule: "Breach Notification Protocol", desc: "Automated alert pipeline tested with zero leakage incidents recorded.", status: "Verified" },
                    { rule: "Business Associate Agreement (BAA)", desc: "Current signed BAA executed with HIPAA Dedicated Cloud Provider.", status: "Active" },
                  ].map((c, idx) => (
                    <View key={idx} style={styles.complianceItemRow}>
                      <CheckCircle2 size={16} color={Colors.secondary} style={{ marginTop: 2 }} />
                      <View style={{ flex: 1 }}>
                        <Text style={styles.complianceTitle}>{c.rule}</Text>
                        <Text style={styles.complianceDesc}>{c.desc}</Text>
                      </View>
                    </View>
                  ))}
                </View>

                <View style={styles.adminModalCard}>
                  <Text style={styles.adminModalCardTitle}>Recent Regulatory Audit Logs</Text>
                  {[
                    { date: "Sep 18, 2026", event: "Bi-weekly cryptographic checksum verification passed." },
                    { date: "Aug 30, 2026", event: "Physician clinical access permissions audited and re-certified." },
                    { date: "Jul 15, 2026", event: "Annual HIPAA external penetration test completed: 0 high-risk findings." },
                  ].map((l, idx) => (
                    <View key={idx} style={{ paddingVertical: 4 }}>
                      <Text style={{ fontSize: 11, color: Colors.outline, fontFamily: FontFamily.dataMonoBold }}>{l.date}</Text>
                      <Text style={{ fontSize: FontSize.bodySm, color: Colors.onSurface, fontFamily: FontFamily.bodyRegular }}>{l.event}</Text>
                    </View>
                  ))}
                </View>

                <TouchableOpacity
                  style={styles.adminSaveBtn}
                  onPress={handleDownloadCompliance}
                  activeOpacity={0.8}
                >
                  <Download size={18} color={Colors.onPrimary} />
                  <Text style={styles.adminSaveBtnText}>Download Verified HIPAA Compliance Dossier (PDF)</Text>
                </TouchableOpacity>
              </View>
            )}
          </ScrollView>
        </View>
      </Modal>

      {/* Themed Admin Profile Alert Modal */}
      <ThemedAlertModal
        visible={adminAlert.visible}
        type={adminAlert.type || "info"}
        title={adminAlert.title}
        message={adminAlert.message}
        buttons={adminAlert.buttons}
        onClose={() => setAdminAlert((prev) => ({ ...prev, visible: false }))}
      />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.surface },
  content: { padding: Spacing.margin, gap: Spacing.sm, paddingBottom: 100 },
  greetingRow: { flexDirection: "row", alignItems: "center", gap: Spacing.sm },
  avatarCircle: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: Colors.error,
    justifyContent: "center",
    alignItems: "center",
  },
  avatarText: { fontSize: 18, color: Colors.onError, fontFamily: FontFamily.headlineBold },
  greeting: { fontSize: FontSize.headlineSm, color: Colors.onSurface, fontFamily: FontFamily.headlineSemiBold },
  subtitle: { fontSize: FontSize.bodySm, color: Colors.onSurfaceVariant, fontFamily: FontFamily.dataMono },
  kpiGrid: { flexDirection: "row", flexWrap: "wrap", gap: Spacing.xs },
  kpiCard: {
    flex: 1,
    minWidth: "45%",
    backgroundColor: Colors.surfaceContainerLowest,
    borderRadius: Radius.xl,
    padding: Spacing.xs,
    gap: 4,
  },
  kpiValue: { fontSize: FontSize.headlineSm, color: Colors.onSurface, fontFamily: FontFamily.dataMonoBold },
  kpiLabel: { fontSize: FontSize.bodySm, color: Colors.onSurfaceVariant, fontFamily: FontFamily.bodyRegular },
  changeBadge: { alignSelf: "flex-start", paddingHorizontal: 6, paddingVertical: 2, borderRadius: Radius.full },
  changeText: { fontSize: 10, fontFamily: FontFamily.bodySemiBold },
  sectionTitle: {
    fontSize: FontSize.labelLg,
    color: Colors.onSurface,
    fontFamily: FontFamily.headlineSemiBold,
    marginTop: 4,
  },
  sectionHeaderRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
  screenHeading: { fontSize: FontSize.headlineSm, color: Colors.onSurface, fontFamily: FontFamily.headlineSemiBold },
  screenSubheading: { fontSize: FontSize.bodySm, color: Colors.onSurfaceVariant, fontFamily: FontFamily.bodyRegular },
  addDoctorBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    backgroundColor: Colors.primary,
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: Radius.full,
  },
  addDoctorBtnText: { fontSize: FontSize.labelMd, color: Colors.onPrimary, fontFamily: FontFamily.bodySemiBold },
  doctorCtaCard: {
    backgroundColor: Colors.primaryFixed + "33",
    borderRadius: Radius.xl,
    padding: Spacing.sm,
    borderWidth: 1,
    borderColor: Colors.primary + "33",
    gap: Spacing.xs,
  },
  doctorCtaTitle: { fontSize: FontSize.labelLg, color: Colors.primary, fontFamily: FontFamily.headlineSemiBold },
  doctorCtaSubtitle: { fontSize: FontSize.bodySm, color: Colors.onSurfaceVariant, fontFamily: FontFamily.bodyRegular, lineHeight: 18 },
  doctorCtaBtn: {
    alignSelf: "flex-start",
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    backgroundColor: Colors.primary,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: Radius.md,
    marginTop: 4,
  },
  doctorCtaBtnText: { fontSize: FontSize.labelMd, color: Colors.onPrimary, fontFamily: FontFamily.bodySemiBold },
  logCard: { flexDirection: "row", alignItems: "flex-start", gap: Spacing.xs, borderRadius: Radius.lg, padding: Spacing.xs },
  logMessage: { fontSize: FontSize.bodySm, color: Colors.onSurface, fontFamily: FontFamily.bodyMedium },
  logTime: { fontSize: FontSize.dataMono, color: Colors.outline, fontFamily: FontFamily.dataMono, marginTop: 2 },
  signOutBtn: {
    height: 48,
    borderRadius: Radius.xl,
    borderWidth: 1.5,
    borderColor: Colors.error,
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    gap: 8,
    marginTop: 8,
  },
  signOutText: { fontSize: FontSize.labelLg, color: Colors.error, fontFamily: FontFamily.bodySemiBold },
  visitCard: { backgroundColor: Colors.surfaceContainerLowest, borderRadius: Radius.xl, padding: Spacing.sm, gap: 6 },
  visitTop: { flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
  visitDoctor: { fontSize: FontSize.labelLg, color: Colors.onSurface, fontFamily: FontFamily.bodySemiBold },
  visitPatient: { fontSize: FontSize.bodyMd, color: Colors.onSurfaceVariant, fontFamily: FontFamily.bodyMedium },
  visitMeta: { fontSize: FontSize.bodySm, color: Colors.outline, fontFamily: FontFamily.dataMono },
  badge: { flexDirection: "row", alignItems: "center", paddingHorizontal: 8, paddingVertical: 3, borderRadius: Radius.full },
  badgeText: { fontSize: 10, fontFamily: FontFamily.bodySemiBold },
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
  patientCard: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.xs,
    backgroundColor: Colors.surfaceContainerLowest,
    borderRadius: Radius.xl,
    padding: Spacing.sm,
  },
  patientAvatar: { width: 44, height: 44, borderRadius: 22, backgroundColor: Colors.primary, justifyContent: "center", alignItems: "center" },
  patientAvatarText: { fontSize: 18, color: Colors.onPrimary, fontFamily: FontFamily.headlineBold },
  patientName: { fontSize: FontSize.labelLg, color: Colors.onSurface, fontFamily: FontFamily.bodySemiBold },
  patientMeta: { fontSize: FontSize.bodySm, color: Colors.onSurfaceVariant, fontFamily: FontFamily.dataMono },
  profileCard: { backgroundColor: Colors.surfaceContainerLowest, borderRadius: Radius.xxl, padding: Spacing.md, alignItems: "center", gap: 8 },
  profileName: { fontSize: FontSize.headlineSm, color: Colors.onSurface, fontFamily: FontFamily.headlineSemiBold },
  profileRole: { fontSize: FontSize.bodyMd, color: Colors.onSurfaceVariant, fontFamily: FontFamily.bodyRegular },
  tapToEditHint: { fontSize: 11, color: Colors.primary, fontFamily: FontFamily.bodyMedium },
  statsRow: { flexDirection: "row", width: "100%", paddingTop: 8 },
  statItem: { flex: 1, alignItems: "center" },
  statValue: { fontSize: FontSize.headlineSm, color: Colors.error, fontFamily: FontFamily.dataMonoBold },
  statLabel: { fontSize: FontSize.bodySm, color: Colors.onSurfaceVariant, fontFamily: FontFamily.bodyRegular },
  statDivider: { width: 1, backgroundColor: Colors.surfaceContainerHigh, marginVertical: 4 },
  menuCard: { backgroundColor: Colors.surfaceContainerLowest, borderRadius: Radius.xl, overflow: "hidden" },
  menuItem: { flexDirection: "row", alignItems: "center", gap: Spacing.sm, padding: Spacing.sm },
  menuLabel: { flex: 1, fontSize: FontSize.bodyMd, color: Colors.onSurface, fontFamily: FontFamily.bodyMedium },
  menuDivider: { height: 1, backgroundColor: Colors.surfaceContainerLow, marginHorizontal: Spacing.sm },
  // Doctor Admin cards
  doctorAdminCard: {
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
  doctorTopRow: { flexDirection: "row", gap: Spacing.xs, alignItems: "center" },
  doctorAvatar: { width: 44, height: 44, borderRadius: 22, backgroundColor: Colors.primary, justifyContent: "center", alignItems: "center" },
  doctorAvatarText: { fontSize: FontSize.labelLg, color: Colors.onPrimary, fontFamily: FontFamily.headlineBold },
  docAdminName: { fontSize: FontSize.labelLg, color: Colors.onSurface, fontFamily: FontFamily.bodySemiBold },
  docAdminSpecialty: { fontSize: FontSize.bodySm, color: Colors.primary, fontFamily: FontFamily.bodyMedium },
  docAdminHospital: { fontSize: 11, color: Colors.onSurfaceVariant, fontFamily: FontFamily.bodyRegular },
  credBox: { backgroundColor: Colors.surfaceContainerLow, borderRadius: Radius.md, padding: 8, gap: 4 },
  credLabel: { fontSize: 9, color: Colors.outline, fontFamily: FontFamily.dataMonoBold, letterSpacing: 0.5 },
  credHint: { fontSize: 9, color: Colors.onSurfaceVariant, fontFamily: FontFamily.bodyRegular },
  credDetailsRow: { flexDirection: "row", justifyContent: "space-between", flexWrap: "wrap", gap: 4 },
  credItem: { fontSize: 11, color: Colors.onSurface, fontFamily: FontFamily.dataMono },
  doctorActionsRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginTop: 2 },
  docMetaTag: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: Radius.sm,
    backgroundColor: Colors.surfaceContainerHigh,
  },
  docMetaText: { fontSize: 10, color: Colors.onSurfaceVariant, fontFamily: FontFamily.dataMono },
  deleteBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: Radius.sm,
    borderWidth: 1,
    borderColor: Colors.error,
  },
  deleteBtnText: { fontSize: 11, color: Colors.error, fontFamily: FontFamily.bodySemiBold },
  loadingContainer: { alignItems: "center", gap: 8, paddingVertical: 30 },
  loadingText: { fontSize: FontSize.bodyMd, color: Colors.onSurfaceVariant, fontFamily: FontFamily.bodyRegular },
  emptyCard: { alignItems: "center", gap: 8, paddingVertical: 30, backgroundColor: Colors.surfaceContainerLowest, borderRadius: Radius.xl },
  emptyTitle: { fontSize: FontSize.labelLg, color: Colors.onSurface, fontFamily: FontFamily.bodySemiBold },
  emptyText: { fontSize: FontSize.bodySm, color: Colors.outline, fontFamily: FontFamily.bodyRegular },
  // Modal styles
  modalBackdrop: { flex: 1, backgroundColor: "rgba(0,0,0,0.55)", justifyContent: "center", alignItems: "center", padding: Spacing.md },
  modalBackdropSheet: { flex: 1, backgroundColor: Colors.surface },
  sheetHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: Spacing.md,
    backgroundColor: Colors.surfaceContainerLowest,
    borderBottomWidth: 1,
    borderBottomColor: Colors.surfaceContainerHigh,
  },
  sheetTitle: { fontSize: FontSize.headlineSm, color: Colors.onSurface, fontFamily: FontFamily.headlineSemiBold },
  sheetText: { fontSize: FontSize.bodyMd, color: Colors.onSurface, fontFamily: FontFamily.bodyRegular, lineHeight: 20 },
  formCard: { width: "100%", maxWidth: 400, backgroundColor: Colors.surfaceContainerLowest, borderRadius: Radius.xxl, padding: Spacing.md, gap: Spacing.xs },
  formHeader: { flexDirection: "row", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 6 },
  formTitle: { fontSize: FontSize.headlineSm, color: Colors.onSurface, fontFamily: FontFamily.headlineSemiBold },
  formSubtitle: { fontSize: 11, color: Colors.onSurfaceVariant, fontFamily: FontFamily.bodyRegular },
  closeBtn: { width: 32, height: 32, borderRadius: 16, backgroundColor: Colors.surfaceContainerHigh, justifyContent: "center", alignItems: "center" },
  formErrorText: { fontSize: FontSize.bodySm, color: Colors.error, fontFamily: FontFamily.bodyMedium },
  formGroup: { gap: 4, marginBottom: 8 },
  inputLabel: { fontSize: 11, color: Colors.onSurfaceVariant, fontFamily: FontFamily.bodyMedium },
  formInput: { height: 42, backgroundColor: Colors.surfaceContainerLow, borderRadius: Radius.md, paddingHorizontal: 10, fontSize: FontSize.bodyMd, color: Colors.onSurface, fontFamily: FontFamily.bodyRegular, borderWidth: 1, borderColor: Colors.outlineVariant },
  genPassText: { fontSize: 11, color: Colors.primary, fontFamily: FontFamily.bodySemiBold },
  submitDoctorBtn: {
    height: 46,
    backgroundColor: Colors.primary,
    borderRadius: Radius.lg,
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    gap: 8,
    marginTop: 8,
  },
  submitDoctorBtnText: { fontSize: FontSize.labelLg, color: Colors.onPrimary, fontFamily: FontFamily.bodySemiBold },
  // Credential Handout Modal
  credHandoutCard: { width: "100%", maxWidth: 360, backgroundColor: Colors.surfaceContainerLowest, borderRadius: Radius.xxl, padding: Spacing.md, alignItems: "center", gap: Spacing.xs },
  credHandoutIconBox: { width: 56, height: 56, borderRadius: 28, backgroundColor: Colors.primaryFixed + "44", justifyContent: "center", alignItems: "center" },
  credHandoutTitle: { fontSize: FontSize.headlineSm, color: Colors.onSurface, fontFamily: FontFamily.headlineSemiBold, textAlign: "center" },
  credHandoutSubtitle: { fontSize: FontSize.bodySm, color: Colors.onSurfaceVariant, fontFamily: FontFamily.bodyRegular, textAlign: "center", lineHeight: 18 },
  credCardVisual: { width: "100%", backgroundColor: Colors.surfaceContainerLow, borderRadius: Radius.lg, padding: Spacing.sm, gap: 6, marginVertical: 8, borderWidth: 1, borderColor: Colors.outlineVariant },
  credVisualRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
  credVisualLabel: { fontSize: 9, color: Colors.outline, fontFamily: FontFamily.dataMonoBold, letterSpacing: 0.5 },
  credVisualValue: { fontSize: FontSize.bodySm, color: Colors.onSurface, fontFamily: FontFamily.bodySemiBold },
  credVisualDivider: { height: 1, backgroundColor: Colors.outlineVariant, marginVertical: 2 },
  doneCredBtn: { width: "100%", height: 44, backgroundColor: Colors.primary, borderRadius: Radius.lg, justifyContent: "center", alignItems: "center" },
  doneCredBtnText: { fontSize: FontSize.labelMd, color: Colors.onPrimary, fontFamily: FontFamily.bodySemiBold },
  visitDetailBox: { backgroundColor: Colors.surfaceContainerLow, borderRadius: Radius.lg, padding: Spacing.sm, gap: 6, marginVertical: 4 },
  visitDetailItem: { fontSize: FontSize.bodyMd, color: Colors.onSurface, fontFamily: FontFamily.bodyRegular },
  primaryActionBtn: { height: 44, backgroundColor: Colors.primary, borderRadius: Radius.lg, flexDirection: "row", justifyContent: "center", alignItems: "center", gap: 6 },
  primaryActionBtnText: { fontSize: FontSize.labelMd, color: Colors.onPrimary, fontFamily: FontFamily.bodySemiBold },
  cancelVisitBtn: { height: 44, backgroundColor: Colors.surfaceContainer, borderRadius: Radius.lg, flexDirection: "row", justifyContent: "center", alignItems: "center", gap: 6 },
  cancelVisitBtnText: { fontSize: FontSize.labelMd, color: Colors.error, fontFamily: FontFamily.bodySemiBold },
  // Analytics Graph Card Styles
  graphCard: {
    backgroundColor: Colors.surfaceContainerLowest,
    borderRadius: Radius.xxl,
    padding: Spacing.md,
    gap: 14,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.06,
    shadowRadius: 12,
    elevation: 3,
    borderWidth: 1,
    borderColor: Colors.outlineVariant + "44",
  },
  graphHeaderRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    flexWrap: "wrap",
    gap: 8,
  },
  graphTitle: {
    fontSize: FontSize.headlineSm,
    color: Colors.onSurface,
    fontFamily: FontFamily.headlineSemiBold,
  },
  graphSubtitle: {
    fontSize: 12,
    color: Colors.onSurfaceVariant,
    fontFamily: FontFamily.bodyRegular,
    marginTop: 2,
  },
  timeframePills: {
    flexDirection: "row",
    backgroundColor: Colors.surfaceContainerLow,
    borderRadius: Radius.full,
    padding: 3,
    gap: 3,
  },
  timeframePill: {
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: Radius.full,
  },
  timeframePillActive: {
    backgroundColor: Colors.primary,
    shadowColor: Colors.primary,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 2,
  },
  timeframePillText: {
    fontSize: 11,
    color: Colors.onSurfaceVariant,
    fontFamily: FontFamily.dataMonoBold,
  },
  timeframePillTextActive: {
    color: Colors.onPrimary,
  },
  graphTooltip: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    backgroundColor: Colors.primaryFixed + "33",
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: Radius.lg,
    borderLeftWidth: 3.5,
    borderLeftColor: Colors.primary,
  },
  tooltipPulse: {
    width: 7,
    height: 7,
    borderRadius: 3.5,
    backgroundColor: Colors.primary,
  },
  tooltipText: {
    fontSize: 12,
    color: Colors.onSurface,
    fontFamily: FontFamily.bodyMedium,
  },
  chartContainer: {
    height: 215,
    position: "relative",
    justifyContent: "flex-end",
    marginTop: 10,
    marginBottom: 8,
  },
  gridLinesContainer: {
    position: "absolute",
    top: 26,
    left: 0,
    right: 0,
    bottom: 26,
    justifyContent: "space-between",
  },
  gridLine: {
    height: 1,
    backgroundColor: Colors.surfaceContainerHigh,
    width: "100%",
    opacity: 0.7,
  },
  gridLineBaseline: {
    height: 1.5,
    backgroundColor: Colors.surfaceContainerHighest,
    width: "100%",
  },
  barsContainer: {
    flexDirection: "row",
    alignItems: "flex-end",
    justifyContent: "space-between",
    height: "100%",
    paddingHorizontal: 6,
    paddingBottom: 4,
  },
  barCol: {
    flex: 1,
    alignItems: "center",
    justifyContent: "flex-end",
    height: "100%",
  },
  barFloatingCount: {
    marginBottom: 6,
    backgroundColor: Colors.inverseSurface,
    paddingHorizontal: 7,
    paddingVertical: 3,
    borderRadius: Radius.sm,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 4,
    elevation: 2,
  },
  barFloatingCountSpacer: {
    height: 22,
    marginBottom: 6,
  },
  barFloatingText: {
    fontSize: 10,
    color: Colors.inverseOnSurface,
    fontFamily: FontFamily.dataMonoBold,
  },
  barTrack: {
    borderRadius: Radius.sm,
    backgroundColor: Colors.surfaceContainerHigh,
    overflow: "hidden",
    justifyContent: "flex-end",
  },
  barTrackSelected: {
    borderWidth: 2,
    borderColor: Colors.primary,
    shadowColor: Colors.primary,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 6,
    elevation: 3,
  },
  barSegmentAi: {
    width: "100%",
    backgroundColor: Colors.secondaryContainer,
  },
  barSegmentVisits: {
    width: "100%",
    backgroundColor: Colors.primary,
  },
  axisLabel: {
    marginTop: 8,
    fontSize: 11,
    color: Colors.onSurfaceVariant,
    fontFamily: FontFamily.dataMono,
  },
  axisLabelSelected: {
    color: Colors.primary,
    fontFamily: FontFamily.dataMonoBold,
  },
  graphLegendRow: {
    flexDirection: "row",
    justifyContent: "center",
    gap: 20,
    marginTop: 12,
    marginBottom: 4,
  },
  legendItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: 7,
  },
  legendDot: {
    width: 9,
    height: 9,
    borderRadius: 4.5,
  },
  legendLabel: {
    fontSize: 12,
    color: Colors.onSurfaceVariant,
    fontFamily: FontFamily.bodyMedium,
  },
  graphMetricFooter: {
    flexDirection: "row",
    backgroundColor: Colors.surfaceContainerLow,
    borderRadius: Radius.lg,
    paddingVertical: 12,
    paddingHorizontal: 12,
    justifyContent: "space-between",
    alignItems: "center",
    marginTop: 6,
  },
  graphMetricBox: {
    flex: 1,
    alignItems: "center",
    gap: 3,
  },
  graphMetricDivider: {
    width: 1,
    height: 26,
    backgroundColor: Colors.outlineVariant + "55",
  },
  graphMetricLabel: {
    fontSize: 10,
    color: Colors.outline,
    fontFamily: FontFamily.dataMonoBold,
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  graphMetricVal: {
    fontSize: 13,
    color: Colors.onSurface,
    fontFamily: FontFamily.dataMonoBold,
  },
  graphMetricValPositive: {
    fontSize: 13,
    color: Colors.secondary,
    fontFamily: FontFamily.dataMonoBold,
  },
  deptVolumeBox: {
    backgroundColor: Colors.surfaceContainerLow,
    borderRadius: Radius.lg,
    padding: 14,
    gap: 6,
    marginTop: 6,
  },
  deptTitle: {
    fontSize: 9,
    color: Colors.outline,
    fontFamily: FontFamily.dataMonoBold,
    letterSpacing: 0.5,
  },
  deptSub: {
    fontSize: 10,
    color: Colors.onSurfaceVariant,
    fontFamily: FontFamily.dataMono,
  },
  deptProgressBar: {
    height: 8,
    borderRadius: 4,
    overflow: "hidden",
    flexDirection: "row",
    marginVertical: 4,
  },
  deptSeg: {
    height: "100%",
  },
  deptLegendGrid: {
    flexDirection: "row",
    justifyContent: "space-between",
    flexWrap: "wrap",
    gap: 4,
    marginTop: 2,
  },
  deptLegendText: {
    fontSize: 10,
    color: Colors.onSurfaceVariant,
    fontFamily: FontFamily.bodyRegular,
  },
  // Admin Identity Card Styles
  adminIdentityCard: {
    backgroundColor: Colors.surfaceContainerLowest,
    borderRadius: Radius.xxl,
    padding: Spacing.md,
    gap: Spacing.xs,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
    borderWidth: 1,
    borderColor: Colors.outlineVariant + "44",
  },
  adminTopRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  adminAvatarCircle: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: Colors.error,
    justifyContent: "center",
    alignItems: "center",
  },
  adminAvatarText: {
    fontSize: 20,
    color: Colors.onError,
    fontFamily: FontFamily.headlineBold,
  },
  adminEditBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    backgroundColor: Colors.primaryFixed + "33",
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: Radius.full,
  },
  adminEditBtnText: {
    fontSize: 12,
    color: Colors.primary,
    fontFamily: FontFamily.bodySemiBold,
  },
  adminName: {
    fontSize: FontSize.headlineSm,
    color: Colors.onSurface,
    fontFamily: FontFamily.headlineBold,
    marginTop: 2,
  },
  adminRole: {
    fontSize: FontSize.bodySm,
    color: Colors.onSurfaceVariant,
    fontFamily: FontFamily.bodyRegular,
  },
  adminChipRow: {
    flexDirection: "row",
    alignItems: "center",
    flexWrap: "wrap",
    gap: 6,
    marginVertical: 4,
  },
  adminClearanceBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: Radius.full,
    backgroundColor: Colors.primaryFixed + "33",
  },
  adminClearanceText: {
    fontSize: 10,
    color: Colors.primary,
    fontFamily: FontFamily.dataMonoBold,
  },
  adminTokenChip: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: Radius.full,
    backgroundColor: Colors.surfaceContainerLow,
    borderWidth: 1,
    borderColor: Colors.outlineVariant,
  },
  adminTokenText: {
    fontSize: 10,
    color: Colors.onSurface,
    fontFamily: FontFamily.dataMono,
  },
  adminContactRow: {
    flexDirection: "row",
    alignItems: "center",
    flexWrap: "wrap",
    gap: Spacing.sm,
    paddingVertical: 2,
  },
  adminContactItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  adminContactText: {
    fontSize: 11,
    color: Colors.onSurfaceVariant,
    fontFamily: FontFamily.bodyRegular,
  },

  // System Card & Governance Switches
  systemCard: {
    backgroundColor: Colors.surfaceContainerLowest,
    borderRadius: Radius.xl,
    padding: Spacing.md,
    gap: Spacing.xs,
    borderWidth: 1,
    borderColor: Colors.outlineVariant + "44",
  },
  systemStatusRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    paddingBottom: 2,
  },
  pulseDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: Colors.secondary,
  },
  systemStatusTitle: {
    fontSize: FontSize.labelLg,
    color: Colors.onSurface,
    fontFamily: FontFamily.headlineSemiBold,
  },
  systemStatusSub: {
    fontSize: 11,
    color: Colors.onSurfaceVariant,
    fontFamily: FontFamily.bodyRegular,
  },
  switchDivider: {
    height: 1,
    backgroundColor: Colors.surfaceContainerLow,
    marginVertical: 4,
  },
  switchRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    gap: 8,
    paddingVertical: 2,
  },
  switchLabelBox: {
    flex: 1,
    gap: 2,
  },
  switchTitle: {
    fontSize: FontSize.bodySm,
    color: Colors.onSurface,
    fontFamily: FontFamily.bodySemiBold,
  },
  switchSubtitle: {
    fontSize: 11,
    color: Colors.onSurfaceVariant,
    fontFamily: FontFamily.bodyRegular,
    lineHeight: 15,
  },

  // Credentials Card
  credentialsCard: {
    backgroundColor: Colors.surfaceContainerLowest,
    borderRadius: Radius.xl,
    padding: Spacing.md,
    gap: Spacing.xs,
    borderWidth: 1,
    borderColor: Colors.outlineVariant + "44",
  },
  credGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
    marginTop: 4,
  },
  credGridItem: {
    flex: 1,
    minWidth: "45%",
    backgroundColor: Colors.surfaceContainerLow,
    borderRadius: Radius.md,
    padding: 8,
    gap: 2,
  },
  credGridLabel: {
    fontSize: 9,
    color: Colors.outline,
    fontFamily: FontFamily.dataMonoBold,
    letterSpacing: 0.5,
  },
  credGridVal: {
    fontSize: FontSize.bodySm,
    color: Colors.onSurface,
    fontFamily: FontFamily.bodySemiBold,
  },

  // Modal Cards & Rows
  adminModalCard: {
    backgroundColor: Colors.surfaceContainerLowest,
    borderRadius: Radius.xl,
    padding: Spacing.md,
    gap: 8,
    borderWidth: 1,
    borderColor: Colors.outlineVariant + "44",
  },
  adminModalCardTitle: {
    fontSize: FontSize.labelLg,
    color: Colors.onSurface,
    fontFamily: FontFamily.headlineSemiBold,
  },
  adminModalCardSub: {
    fontSize: 11,
    color: Colors.onSurfaceVariant,
    fontFamily: FontFamily.bodyRegular,
    lineHeight: 16,
  },
  adminModalDivider: {
    height: 1,
    backgroundColor: Colors.surfaceContainerLow,
    marginVertical: 2,
  },
  adminModalRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 3,
  },
  adminModalLabel: {
    fontSize: FontSize.bodySm,
    color: Colors.outline,
    fontFamily: FontFamily.bodyMedium,
  },
  adminModalValue: {
    fontSize: FontSize.bodySm,
    color: Colors.onSurface,
    fontFamily: FontFamily.bodySemiBold,
  },
  adminSaveBtn: {
    height: 48,
    backgroundColor: Colors.primary,
    borderRadius: Radius.lg,
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    gap: 8,
    marginTop: 4,
  },
  adminSaveBtnText: {
    fontSize: FontSize.labelLg,
    color: Colors.onPrimary,
    fontFamily: FontFamily.bodySemiBold,
  },

  // Node Telemetry Card
  nodeCard: {
    backgroundColor: Colors.surfaceContainerLowest,
    borderRadius: Radius.xl,
    padding: Spacing.sm,
    gap: 8,
    borderWidth: 1,
    borderColor: Colors.outlineVariant + "44",
  },
  nodeTopRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  nodeName: {
    fontSize: FontSize.bodySm,
    color: Colors.onSurface,
    fontFamily: FontFamily.bodySemiBold,
  },
  nodeDetailsRow: {
    flexDirection: "row",
    backgroundColor: Colors.surfaceContainerLow,
    borderRadius: Radius.md,
    padding: 8,
    justifyContent: "space-around",
  },
  nodeDetailItem: {
    alignItems: "center",
    gap: 2,
  },
  nodeDetailLabel: {
    fontSize: 9,
    color: Colors.outline,
    fontFamily: FontFamily.dataMonoBold,
  },
  nodeDetailVal: {
    fontSize: 11,
    color: Colors.onSurface,
    fontFamily: FontFamily.dataMonoBold,
  },

  // User Item Card
  userItemCard: {
    backgroundColor: Colors.surfaceContainerLowest,
    borderRadius: Radius.xl,
    padding: Spacing.sm,
    gap: 8,
    borderWidth: 1,
    borderColor: Colors.outlineVariant + "44",
  },
  userAvatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: Colors.primary,
    justifyContent: "center",
    alignItems: "center",
  },
  userAvatarText: {
    fontSize: 16,
    color: Colors.onPrimary,
    fontFamily: FontFamily.headlineBold,
  },
  userName: {
    fontSize: FontSize.bodySm,
    color: Colors.onSurface,
    fontFamily: FontFamily.bodySemiBold,
  },
  userMeta: {
    fontSize: 11,
    color: Colors.onSurfaceVariant,
    fontFamily: FontFamily.dataMono,
  },
  userActionsRow: {
    flexDirection: "row",
    gap: 6,
    justifyContent: "flex-end",
    paddingTop: 4,
    borderTopWidth: 1,
    borderTopColor: Colors.surfaceContainerLow,
  },
  userActionMiniBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: Radius.sm,
    borderWidth: 1,
    borderColor: Colors.outlineVariant,
    backgroundColor: Colors.surfaceContainerLowest,
  },
  userActionMiniText: {
    fontSize: 10,
    color: Colors.primary,
    fontFamily: FontFamily.bodySemiBold,
  },

  // Operations Analytics Grid
  analyticsKpiGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
  },
  analyticsKpiCard: {
    flex: 1,
    minWidth: "45%",
    backgroundColor: Colors.surfaceContainerLowest,
    borderRadius: Radius.xl,
    padding: Spacing.sm,
    gap: 2,
    borderWidth: 1,
    borderColor: Colors.outlineVariant + "44",
  },
  analyticsKpiVal: {
    fontSize: FontSize.headlineSm,
    color: Colors.onSurface,
    fontFamily: FontFamily.dataMonoBold,
  },
  analyticsKpiLabel: {
    fontSize: 11,
    color: Colors.onSurfaceVariant,
    fontFamily: FontFamily.bodyRegular,
  },

  // Compliance Rows
  complianceItemRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 8,
    paddingVertical: 4,
  },
  complianceTitle: {
    fontSize: FontSize.bodySm,
    color: Colors.onSurface,
    fontFamily: FontFamily.bodySemiBold,
  },
  complianceDesc: {
    fontSize: 11,
    color: Colors.onSurfaceVariant,
    fontFamily: FontFamily.bodyRegular,
    lineHeight: 16,
    marginTop: 2,
  },
});
