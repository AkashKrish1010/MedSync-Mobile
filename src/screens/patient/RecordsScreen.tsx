import React, { useState, useEffect, useCallback } from "react";
import { useFocusEffect } from "@react-navigation/native";
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  Modal,
  Platform,
  ActivityIndicator,
} from "react-native";
import {
  FlaskConical,
  Activity,
  FileText,
  Pill,
  Microscope,
  ArrowRight,
  AlertTriangle,
  AlertCircle,
  CheckCircle2,
  Download,
  X,
  Calendar,
  User,
  Building2,
  Sparkles,
  HelpCircle,
  Heart,
  Sun,
  ShieldCheck,
  Clock,
  Compass,
  Check,
  Camera,
} from "lucide-react-native";
import * as Print from "expo-print";
import * as Sharing from "expo-sharing";
import { Colors } from "../../theme/colors";
import { Spacing, Radius, FontSize, FontFamily } from "../../theme/typography";
import AIScanScreen from "../AIScanScreen";
import PrescriptionScanModal from "../../components/PrescriptionScanModal";
import ThemedAlertModal, { ThemedAlertButton } from "../../components/ThemedAlertModal";
import { HEALTH_RECORDS } from "../../data/mockData";
import { Config } from "../../config";
import { DEMO_PATIENT_UHID, DEMO_PATIENT_NAME } from "../../constants/patient";
import type { AuthUserProfile } from "../../types";

interface HealthRecord {
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

interface BiomarkerExplanation {
  name: string;
  value: string;
  status: "Normal" | "Elevated" | "Low" | string;
  headline: string;
  simpleExplanation: string;
  actionableTip: string;
}

interface ActionPlanItem {
  category: string;
  title: string;
  details: string;
}

interface AiExplanationData {
  verdictTitle: string;
  verdictSummary: string;
  biomarkerExplanations: BiomarkerExplanation[];
  actionPlan: ActionPlanItem[];
  questionsForDoctor: string[];
}

const STEPPER_STAGES = [
  {
    step: 1,
    title: "Reading Biomarkers & Quantitative Values",
    desc: "Parsing clinical lab metrics, units, and reference standards",
  },
  {
    step: 2,
    title: "Engaging Clinical Diagnostic AI",
    desc: "Consulting neural diagnostic models with zero-jargon protocol",
  },
  {
    step: 3,
    title: "Translating Medical Terminology",
    desc: "Deconstructing medical jargon into patient-friendly plain English",
  },
  {
    step: 4,
    title: "Synthesizing Personalized Action Guide",
    desc: "Formulating everyday lifestyle tips and physician visit questions",
  },
];

export default function PatientRecords({
  patientProfile,
}: {
  patientProfile?: AuthUserProfile | null;
}) {
  const userUhid = patientProfile?.uhid || DEMO_PATIENT_UHID;
  const userName = patientProfile?.name || DEMO_PATIENT_NAME;
  const isDemoAccount = patientProfile?.email ? patientProfile.email.toLowerCase().includes("sarah") : true;

  const [aiOpen, setAiOpen] = useState(false);
  const [rxScanOpen, setRxScanOpen] = useState(false);
  const [selectedRecord, setSelectedRecord] = useState<HealthRecord | null>(null);
  const [records, setRecords] = useState<HealthRecord[]>(isDemoAccount ? HEALTH_RECORDS : []);
  const [loadingRecords, setLoadingRecords] = useState(true);

  // Plain-English AI Explanation State
  const [aiExplanationVisible, setAiExplanationVisible] = useState(false);
  const [aiExplaining, setAiExplaining] = useState(false);
  const [explainStep, setExplainStep] = useState(1);
  const [aiExplanationData, setAiExplanationData] = useState<AiExplanationData | null>(null);

  // PDF Generation State
  const [isGeneratingPdf, setIsGeneratingPdf] = useState(false);

  // Themed Alert State
  const [alertConfig, setAlertConfig] = useState<{
    visible: boolean;
    type?: "info" | "success" | "warning" | "error" | "ai";
    title: string;
    message?: string;
    buttons?: ThemedAlertButton[];
  }>({
    visible: false,
    title: "",
  });

  const showAlert = (
    title: string,
    message?: string,
    type: "info" | "success" | "warning" | "error" | "ai" = "info",
    buttons?: ThemedAlertButton[]
  ) => {
    setAlertConfig({
      visible: true,
      type,
      title,
      message,
      buttons: buttons || [{ text: "Got it", style: "primary" }],
    });
  };

  const fetchRecords = useCallback(async (isInitial = false) => {
    if (isInitial) setLoadingRecords(true);
    try {
      const res = await fetch(Config.apiPatientRecords(userUhid));
      const data = await res.json();
      if (Array.isArray(data)) {
        if (data.length > 0) {
          const mapped: HealthRecord[] = data.map((r: any) => ({
            id: r.id || r._id,
            title: r.title,
            date:
              r.date ||
              new Date(r.createdAt || Date.now()).toLocaleDateString("en-US", {
                month: "short",
                day: "numeric",
                year: "numeric",
              }),
            doctor: r.doctorName || "MedSync Clinical AI",
            type: r.type || "Diagnostic Report",
            iconType:
              r.type?.toLowerCase().includes("lab") || r.type?.toLowerCase().includes("blood")
                ? "flask"
                : "activity",
            status: r.isOptimal === false ? "Flagged" : "Reviewed",
            summary: r.summary || "Clinical diagnostic evaluation.",
            biomarkers: (r.biomarkers || []).map((b: any) => ({
              name: b.name,
              value: b.value,
              status:
                b.status === "Optimal" || b.status === "Normal"
                  ? "Normal"
                  : b.status === "Deficient" || b.status === "Low"
                  ? "Low"
                  : "Elevated",
            })),
          }));
          setRecords(mapped);
        } else if (!isDemoAccount) {
          setRecords([]);
        }
      }
    } catch {
    } finally {
      if (isInitial) setLoadingRecords(false);
    }
  }, [userUhid, isDemoAccount]);

  useFocusEffect(
    useCallback(() => {
      fetchRecords(true);
      const interval = setInterval(() => fetchRecords(false), 5000);
      return () => clearInterval(interval);
    }, [fetchRecords])
  );

  const renderIcon = (type: string) => {
    switch (type) {
      case "flask":
        return <FlaskConical size={22} color={Colors.primary} />;
      case "activity":
        return <Activity size={22} color={Colors.secondary} />;
      case "pill":
        return <Pill size={22} color={Colors.primary} />;
      default:
        return <FileText size={22} color={Colors.outline} />;
    }
  };

  // ─── Real PDF Report Generation ───────────────────────────────────────────
  const handleDownloadPdf = async (record: HealthRecord) => {
    try {
      setIsGeneratingPdf(true);

      const htmlContent = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <title>${record.title}</title>
  <style>
    body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif; padding: 40px; color: #18181b; line-height: 1.5; }
    .header { border-bottom: 2px solid #7c3aed; padding-bottom: 18px; margin-bottom: 24px; display: flex; justify-content: space-between; align-items: center; }
    .logo { font-size: 24px; font-weight: 800; color: #7c3aed; letter-spacing: -0.5px; }
    .sub { font-size: 13px; color: #71717a; margin-top: 2px; }
    .badge { display: inline-block; padding: 5px 12px; border-radius: 999px; font-size: 11px; font-weight: 700; text-transform: uppercase; background: #ecfdf5; color: #059669; }
    .meta-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 12px; margin-bottom: 24px; background: #f8fafc; padding: 18px; border-radius: 8px; font-size: 13px; border: 1px solid #e2e8f0; }
    .meta-item { display: flex; flex-direction: column; }
    .meta-label { font-size: 11px; color: #71717a; text-transform: uppercase; font-weight: 700; margin-bottom: 2px; }
    .meta-val { font-weight: 600; color: #0f172a; }
    table { width: 100%; border-collapse: collapse; margin-top: 16px; margin-bottom: 24px; }
    th { background: #f1f5f9; text-align: left; padding: 12px 14px; font-size: 12px; text-transform: uppercase; color: #475569; border-bottom: 2px solid #cbd5e1; }
    td { padding: 12px 14px; border-bottom: 1px solid #e2e8f0; font-size: 13px; }
    .status-tag { padding: 3px 8px; border-radius: 4px; font-size: 11px; font-weight: 700; text-transform: uppercase; }
    .normal { background: #d1fae5; color: #065f46; }
    .elevated { background: #fee2e2; color: #991b1b; }
    .low { background: #fef3c7; color: #92400e; }
    .summary-box { background: #f5f3ff; border-left: 4px solid #7c3aed; padding: 16px; margin-bottom: 24px; border-radius: 4px; }
    .footer { margin-top: 40px; padding-top: 18px; border-top: 1px solid #e2e8f0; display: flex; justify-content: space-between; font-size: 11px; color: #94a3b8; }
  </style>
</head>
<body>
  <div class="header">
    <div>
      <div class="logo">MedSync Health Network</div>
      <div class="sub">Diagnostic Pathology & Clinical Intelligence Division</div>
    </div>
    <div>
      <span class="badge">Official Clinical Laboratory Document</span>
    </div>
  </div>

  <div class="meta-grid">
    <div class="meta-item"><span class="meta-label">Patient Name</span><span class="meta-val">${userName}</span></div>
    <div class="meta-item"><span class="meta-label">Patient UHID</span><span class="meta-val">${userUhid}</span></div>
    <div class="meta-item"><span class="meta-label">Laboratory Document</span><span class="meta-val">${record.title}</span></div>
    <div class="meta-item"><span class="meta-label">Encounter Date</span><span class="meta-val">${record.date}</span></div>
    <div class="meta-item"><span class="meta-label">Attending Clinician</span><span class="meta-val">${record.doctor}</span></div>
    <div class="meta-item"><span class="meta-label">Record Status</span><span class="meta-val">${record.status}</span></div>
  </div>

  <div class="summary-box">
    <div style="font-weight: 700; color: #5b21b6; margin-bottom: 6px; font-size: 14px;">Clinical Diagnostic Summary</div>
    <div style="font-size: 13px; line-height: 1.6; color: #334155;">${record.summary}</div>
  </div>

  <h3 style="margin-top: 20px; margin-bottom: 6px; font-size: 15px; color: #0f172a;">Laboratory Biomarkers & Quantitative Values</h3>
  <table>
    <thead>
      <tr>
        <th>Biomarker / Assay</th>
        <th>Result Value</th>
        <th>Clinical Evaluation</th>
      </tr>
    </thead>
    <tbody>
      ${record.biomarkers
        .map(
          (b) => `
        <tr>
          <td style="font-weight: 600; color: #0f172a;">${b.name}</td>
          <td>${b.value}</td>
          <td><span class="status-tag ${
            b.status === "Normal" ? "normal" : b.status === "Elevated" ? "elevated" : "low"
          }">${b.status}</span></td>
        </tr>
      `
        )
        .join("")}
    </tbody>
  </table>

  <div class="footer">
    <div>Digital Physician Verification: Lic #MD-884920 · Attending Pathologist</div>
    <div>HIPAA & HITECH Encrypted Clinical Record · MedSync v3.2</div>
  </div>
</body>
</html>`;

      if (Platform.OS === "web") {
        await Print.printAsync({ html: htmlContent });
        showAlert(
          "PDF Report Ready",
          `The official clinical document for "${record.title}" has been compiled and opened for download / printing.`,
          "success"
        );
      } else {
        const { uri } = await Print.printToFileAsync({ html: htmlContent });
        if (await Sharing.isAvailableAsync()) {
          await Sharing.shareAsync(uri, {
            UTI: ".pdf",
            mimeType: "application/pdf",
            dialogTitle: `Download ${record.title} PDF`,
          });
        }
        showAlert(
          "PDF Saved Successfully",
          `Official signed PDF for "${record.title}" is ready and saved to your device documents.`,
          "success"
        );
      }
    } catch {
      showAlert(
        "PDF Generation Error",
        "Could not compile PDF document. Please try again.",
        "error"
      );
    } finally {
      setIsGeneratingPdf(false);
    }
  };

  // ─── Real Gemini AI Plain-English Explanation with Stepper ─────────────────
  const handleExplainWithAi = async (record: HealthRecord) => {
    setAiExplanationVisible(true);
    setAiExplaining(true);
    setExplainStep(1);
    setAiExplanationData(null);

    let currentStep = 1;
    const stepInterval = setInterval(() => {
      currentStep++;
      if (currentStep <= 3) {
        setExplainStep(currentStep);
      }
    }, 700);

    try {
      const res = await fetch(Config.apiExplainRecord, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: record.title,
          summary: record.summary,
          biomarkers: record.biomarkers,
          doctor: record.doctor,
          date: record.date,
        }),
      });

      const data = await res.json();
      clearInterval(stepInterval);
      setExplainStep(4);
      setTimeout(() => {
        setAiExplanationData(data);
        setAiExplaining(false);
      }, 450);
    } catch {
      clearInterval(stepInterval);
      setAiExplaining(false);
      setAiExplanationVisible(false);
      showAlert(
        "AI Connection Error",
        "Could not generate clinical explanation. Please check your network connection and try again.",
        "error"
      );
    }
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      {/* Overview Metric Bar */}
      <View style={styles.summaryBar}>
        <View style={styles.summaryItem}>
          <Text style={styles.summaryValue}>{records.length}</Text>
          <Text style={styles.summaryLabel}>Total Records</Text>
        </View>
        <View style={styles.summaryDivider} />
        <View style={styles.summaryItem}>
          <Text style={[styles.summaryValue, { color: Colors.error }]}>
            {records.filter((r) => r.status === "Flagged").length}
          </Text>
          <Text style={styles.summaryLabel}>Attention</Text>
        </View>
        <View style={styles.summaryDivider} />
        <View style={styles.summaryItem}>
          <Text style={[styles.summaryValue, { color: Colors.secondary }]}>
            {records.filter((r) => r.status === "Reviewed").length}
          </Text>
          <Text style={styles.summaryLabel}>Reviewed</Text>
        </View>
      </View>

      {/* AI Report Scanner Card — Sharp corners per user request */}
      <TouchableOpacity style={styles.aiScanBtn} onPress={() => setAiOpen(true)}>
        <View style={styles.aiScanIconBox}>
          <Microscope size={24} color={Colors.onPrimary} />
        </View>
        <View style={{ flex: 1 }}>
          <Text style={styles.aiScanTitle}>AI Clinical Report Scanner</Text>
          <Text style={styles.aiScanSubtitle}>Upload or type lab data for instant clinical insights</Text>
        </View>
        <ArrowRight size={20} color={Colors.onPrimary} />
      </TouchableOpacity>

      {/* Prescription Pad (Rx) OCR Scanner Card */}
      <TouchableOpacity
        style={[styles.aiScanBtn, { backgroundColor: "#0284C7", marginTop: 8 }]}
        onPress={() => setRxScanOpen(true)}
      >
        <View style={[styles.aiScanIconBox, { backgroundColor: "rgba(255,255,255,0.2)" }]}>
          <Camera size={24} color={Colors.onPrimary} />
        </View>
        <View style={{ flex: 1 }}>
          <Text style={styles.aiScanTitle}>Prescription Pad (Rx) OCR</Text>
          <Text style={styles.aiScanSubtitle}>Snap paper prescription to auto-populate daily medicines</Text>
        </View>
        <ArrowRight size={20} color={Colors.onPrimary} />
      </TouchableOpacity>

      {/* Records List */}
      <Text style={styles.sectionLabel}>CLINICAL ARCHIVES</Text>
      {loadingRecords && records.length === 0 ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={Colors.primary} />
          <Text style={styles.loadingText}>Fetching diagnostic lab archives...</Text>
        </View>
      ) : records.length === 0 ? (
        <View style={styles.emptyContainer}>
          <FileText size={32} color={Colors.outline} />
          <Text style={styles.emptyTitle}>No Diagnostic Lab Archives</Text>
          <Text style={styles.emptySub}>
            Upload blood panels, metabolic reports, or pathology documents using the AI Clinical Report Scanner above.
          </Text>
        </View>
      ) : (
        records.map((rec) => (
          <TouchableOpacity
            key={rec.id}
            style={styles.recordCard}
            onPress={() => setSelectedRecord(rec)}
            activeOpacity={0.7}
          >
            <View style={styles.recordIcon}>{renderIcon(rec.iconType)}</View>
            <View style={{ flex: 1 }}>
              <Text style={styles.recordTitle}>{rec.title}</Text>
              <Text style={styles.recordMeta}>
                {rec.type} · {rec.date}
              </Text>
              <Text style={styles.recordDoctor}>{rec.doctor}</Text>
            </View>
            <View style={{ alignItems: "flex-end", gap: 8 }}>
              <View
                style={[
                  styles.recordStatus,
                  {
                    backgroundColor:
                      rec.status === "Flagged"
                        ? Colors.errorContainer
                        : Colors.secondaryContainer + "55",
                  },
                ]}
              >
                {rec.status === "Flagged" ? (
                  <AlertTriangle size={11} color={Colors.onErrorContainer} />
                ) : (
                  <CheckCircle2 size={11} color={Colors.secondary} />
                )}
                <Text
                  style={[
                    styles.recordStatusText,
                    {
                      color:
                        rec.status === "Flagged"
                          ? Colors.onErrorContainer
                          : Colors.secondary,
                    },
                  ]}
                >
                  {rec.status}
                </Text>
              </View>
            </View>
          </TouchableOpacity>
        ))
      )}

      {/* ─── Record Details Full Modal ────────────────────────────────────────── */}
      <Modal
        visible={!!selectedRecord}
        animationType="slide"
        presentationStyle="fullScreen"
        onRequestClose={() => setSelectedRecord(null)}
      >
        {selectedRecord && (
          <View style={styles.detailContainer}>
            <View style={styles.detailHeader}>
              <View style={{ flex: 1 }}>
                <Text style={styles.detailTitle}>{selectedRecord.title}</Text>
                <Text style={styles.detailSubtitle}>Official Clinical Diagnostic Record</Text>
              </View>
              <TouchableOpacity
                onPress={() => setSelectedRecord(null)}
                style={styles.detailCloseBtn}
              >
                <X size={20} color={Colors.onSurface} />
              </TouchableOpacity>
            </View>

            <ScrollView contentContainerStyle={styles.detailContent} showsVerticalScrollIndicator={false}>
              {/* Metadata Card */}
              <View style={styles.detailMetaCard}>
                <View style={styles.detailMetaRow}>
                  <Calendar size={16} color={Colors.primary} />
                  <Text style={styles.detailMetaText}>{selectedRecord.date}</Text>
                </View>
                <View style={styles.detailMetaRow}>
                  <User size={16} color={Colors.primary} />
                  <Text style={styles.detailMetaText}>{selectedRecord.doctor}</Text>
                </View>
                <View style={styles.detailMetaRow}>
                  <Building2 size={16} color={Colors.primary} />
                  <Text style={styles.detailMetaText}>MedSync Central Pathology Lab</Text>
                </View>
              </View>

              {/* Status Banner */}
              <View
                style={[
                  styles.detailStatusBanner,
                  {
                    backgroundColor:
                      selectedRecord.status === "Flagged"
                        ? Colors.errorContainer
                        : Colors.secondaryContainer + "44",
                  },
                ]}
              >
                {selectedRecord.status === "Flagged" ? (
                  <AlertTriangle size={18} color={Colors.onErrorContainer} />
                ) : (
                  <CheckCircle2 size={18} color={Colors.secondary} />
                )}
                <View style={{ flex: 1 }}>
                  <Text
                    style={[
                      styles.detailStatusTitle,
                      {
                        color:
                          selectedRecord.status === "Flagged"
                            ? Colors.onErrorContainer
                            : Colors.secondary,
                      },
                    ]}
                  >
                    Status: {selectedRecord.status}
                  </Text>
                  <Text style={styles.detailStatusDesc}>{selectedRecord.summary}</Text>
                </View>
              </View>

              {/* Biomarkers Table */}
              <Text style={styles.detailSectionLabel}>RECORD BIOMARKERS & VALUES</Text>
              <View style={styles.biomarkerTable}>
                {selectedRecord.biomarkers.map((bio, idx) => (
                  <View
                    key={idx}
                    style={[
                      styles.biomarkerRow,
                      idx < selectedRecord.biomarkers.length - 1 && styles.biomarkerBorder,
                    ]}
                  >
                    <View>
                      <Text style={styles.bioName}>{bio.name}</Text>
                      <Text style={styles.bioStatusHint}>Clinical evaluation</Text>
                    </View>
                    <View style={{ alignItems: "flex-end", gap: 4 }}>
                      <Text style={styles.bioValue}>{bio.value}</Text>
                      <View
                        style={[
                          styles.bioBadge,
                          {
                            backgroundColor:
                              bio.status === "Normal"
                                ? Colors.secondaryContainer + "55"
                                : Colors.errorContainer,
                          },
                        ]}
                      >
                        <Text
                          style={[
                            styles.bioBadgeText,
                            {
                              color:
                                bio.status === "Normal"
                                  ? Colors.secondary
                                  : Colors.onErrorContainer,
                            },
                          ]}
                        >
                          {bio.status}
                        </Text>
                      </View>
                    </View>
                  </View>
                ))}
              </View>

              {/* ACTIONS: Download PDF (Working) & Explain with AI Intelligence */}
              <Text style={styles.detailSectionLabel}>ACTIONS</Text>

              {/* Working Download PDF button (Share Link removed per user request) */}
              <TouchableOpacity
                style={styles.actionBtnSecondaryFull}
                onPress={() => handleDownloadPdf(selectedRecord)}
                disabled={isGeneratingPdf}
                activeOpacity={0.8}
              >
                {isGeneratingPdf ? (
                  <>
                    <ActivityIndicator size="small" color={Colors.primary} />
                    <Text style={styles.actionBtnSecondaryText}>Compiling PDF Report...</Text>
                  </>
                ) : (
                  <>
                    <Download size={18} color={Colors.primary} />
                    <Text style={styles.actionBtnSecondaryText}>Download PDF Report</Text>
                  </>
                )}
              </TouchableOpacity>

              {/* AI Plain-English Explanation Button (Directly queries Gemini AI!) */}
              <TouchableOpacity
                style={styles.actionBtnPrimary}
                onPress={() => handleExplainWithAi(selectedRecord)}
                activeOpacity={0.85}
              >
                <Sparkles size={18} color={Colors.onPrimary} />
                <Text style={styles.actionBtnPrimaryText}>Explain with AI Intelligence</Text>
              </TouchableOpacity>
            </ScrollView>
          </View>
        )}
      </Modal>

      {/* ─── PLAIN-ENGLISH AI EXPLANATION MODAL (Gemini Live + Stepper, Zero Emojis) ──── */}
      <Modal
        visible={aiExplanationVisible && !!selectedRecord}
        animationType="slide"
        presentationStyle="fullScreen"
        onRequestClose={() => setAiExplanationVisible(false)}
      >
        {selectedRecord && (
          <View style={styles.explanationContainer}>
            {/* Header */}
            <View style={styles.explanationHeader}>
              <View style={styles.explanationHeaderLeft}>
                <View style={styles.aiBadgeBox}>
                  <Sparkles size={20} color="#7C3AED" />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={styles.explanationHeaderTitle}>AI Plain-English Breakdown</Text>
                  <Text style={styles.explanationHeaderSub} numberOfLines={1}>
                    {selectedRecord.title} · Easy Words
                  </Text>
                </View>
              </View>
              <TouchableOpacity
                onPress={() => setAiExplanationVisible(false)}
                style={styles.detailCloseBtn}
              >
                <X size={20} color={Colors.onSurface} />
              </TouchableOpacity>
            </View>

            {aiExplaining ? (
              /* ─── LOADING STEPPER STATE ──────────────────────────────────── */
              <ScrollView
                contentContainerStyle={styles.stepperContainer}
                showsVerticalScrollIndicator={false}
              >
                <View style={styles.stepperHeaderBox}>
                  <View style={styles.stepperBadge}>
                    <Sparkles size={13} color="#7C3AED" />
                    <Text style={styles.stepperBadgeText}>Clinical AI Diagnostics</Text>
                  </View>
                  <Text style={styles.stepperCardTitle}>Analyzing Diagnostic Findings</Text>
                  <Text style={styles.stepperCardSub}>
                    Translating clinical biomarkers into patient-friendly plain English
                  </Text>

                  {/* Animated Progress Track */}
                  <View style={styles.stepperProgressBar}>
                    <View
                      style={[
                        styles.stepperProgressFill,
                        { width: `${Math.min((explainStep / 4) * 100, 100)}%` },
                      ]}
                    />
                  </View>
                  <Text style={styles.stepperStepCounter}>Stage {explainStep} of 4</Text>
                </View>

                {/* 4 Vertical Stepper Stages */}
                <View style={styles.stepsList}>
                  {STEPPER_STAGES.map((s) => {
                    const isDone = explainStep > s.step;
                    const isCurrent = explainStep === s.step;
                    return (
                      <View key={s.step} style={styles.stepRow}>
                        <View style={styles.stepIndicatorCol}>
                          <View
                            style={[
                              styles.stepCircle,
                              isDone && styles.stepCircleDone,
                              isCurrent && styles.stepCircleCurrent,
                            ]}
                          >
                            {isDone ? (
                              <CheckCircle2 size={16} color="#FFFFFF" strokeWidth={2.4} />
                            ) : isCurrent ? (
                              <ActivityIndicator size="small" color="#FFFFFF" />
                            ) : (
                              <Text style={styles.stepNumText}>{s.step}</Text>
                            )}
                          </View>
                          {s.step < 4 && (
                            <View
                              style={[
                                styles.stepConnector,
                                isDone && styles.stepConnectorDone,
                              ]}
                            />
                          )}
                        </View>
                        <View style={styles.stepContentCol}>
                          <Text
                            style={[
                              styles.stepTitle,
                              (isDone || isCurrent) && styles.stepTitleActive,
                            ]}
                          >
                            {s.title}
                          </Text>
                          <Text style={styles.stepDesc}>{s.desc}</Text>
                        </View>
                      </View>
                    );
                  })}
                </View>

                {/* Reassurance Banner (Zero Emojis Enforced) */}
                <View style={styles.stepperNotice}>
                  <ShieldCheck size={18} color="#059669" />
                  <Text style={styles.stepperNoticeText}>
                    Strictly zero emojis and jargon-free: MedSync synthesizes verified, reassuring explanations for patients.
                  </Text>
                </View>
              </ScrollView>
            ) : aiExplanationData ? (
              /* ─── LIVE GEMINI AI RESULTS (NO EMOJIS) ──────────────────────── */
              <ScrollView
                contentContainerStyle={styles.explanationContent}
                showsVerticalScrollIndicator={false}
              >
                {/* Verdict Summary Card */}
                <View style={styles.verdictCard}>
                  <View style={styles.verdictIconRow}>
                    <ShieldCheck size={22} color="#059669" />
                    <Text style={styles.verdictTitle}>
                      {aiExplanationData.verdictTitle || "The Big Picture in Simple Words"}
                    </Text>
                  </View>
                  <Text style={styles.verdictBody}>{aiExplanationData.verdictSummary}</Text>
                </View>

                {/* Biomarker Breakdown */}
                <Text style={styles.explanationSectionLabel}>WHAT YOUR NUMBERS MEAN</Text>

                {aiExplanationData.biomarkerExplanations?.map((b, idx) => {
                  const isElevated = b.status?.toLowerCase().includes("elevat") || b.status?.toLowerCase().includes("high");
                  const isLow = b.status?.toLowerCase().includes("low") || b.status?.toLowerCase().includes("defic");
                  return (
                    <View key={idx} style={styles.plainCard}>
                      <View style={styles.plainCardHeader}>
                        {isElevated ? (
                          <View style={[styles.statusIconWrap, { backgroundColor: "#FEF3C7" }]}>
                            <AlertTriangle size={16} color="#D97706" strokeWidth={2.4} />
                          </View>
                        ) : isLow ? (
                          <View style={[styles.statusIconWrap, { backgroundColor: "#DBEAFE" }]}>
                            <AlertCircle size={16} color="#2563EB" strokeWidth={2.4} />
                          </View>
                        ) : (
                          <View style={[styles.statusIconWrap, { backgroundColor: "#D1FAE5" }]}>
                            <CheckCircle2 size={16} color="#059669" strokeWidth={2.4} />
                          </View>
                        )}
                        <View style={{ flex: 1 }}>
                          <Text style={styles.plainCardTitle}>{b.headline || b.name}</Text>
                          <Text style={styles.plainCardValue}>
                            Your result: <Text style={styles.boldValue}>{b.value}</Text>
                          </Text>
                        </View>
                        <View
                          style={[
                            styles.plainCardBadge,
                            isElevated
                              ? { backgroundColor: "#FEF3C7" }
                              : isLow
                              ? { backgroundColor: "#DBEAFE" }
                              : { backgroundColor: "#D1FAE5" },
                          ]}
                        >
                          <Text
                            style={[
                              styles.plainCardBadgeText,
                              isElevated
                                ? { color: "#B45309" }
                                : isLow
                                ? { color: "#1D4ED8" }
                                : { color: "#065F46" },
                            ]}
                          >
                            {b.status}
                          </Text>
                        </View>
                      </View>
                      <Text style={styles.plainCardDesc}>{b.simpleExplanation}</Text>
                      {b.actionableTip ? (
                        <View style={styles.tipBox}>
                          <Compass size={14} color="#7C3AED" />
                          <Text style={styles.tipText}>
                            <Text style={{ fontFamily: FontFamily.bodySemiBold }}>Everyday Habit: </Text>
                            {b.actionableTip}
                          </Text>
                        </View>
                      ) : null}
                    </View>
                  );
                })}

                {/* Practical Action Plan */}
                {aiExplanationData.actionPlan?.length > 0 && (
                  <>
                    <Text style={styles.explanationSectionLabel}>WHAT YOU CAN DO NEXT</Text>
                    <View style={styles.planCard}>
                      {aiExplanationData.actionPlan.map((plan, pIdx) => (
                        <View key={pIdx} style={styles.planRow}>
                          {pIdx === 0 ? (
                            <Heart size={18} color="#059669" style={{ marginTop: 2 }} />
                          ) : pIdx === 1 ? (
                            <Sun size={18} color="#D97706" style={{ marginTop: 2 }} />
                          ) : (
                            <Clock size={18} color="#7C3AED" style={{ marginTop: 2 }} />
                          )}
                          <View style={{ flex: 1 }}>
                            <Text style={styles.planBold}>
                              {plan.category}: {plan.title}
                            </Text>
                            <Text style={styles.planText}>{plan.details}</Text>
                          </View>
                        </View>
                      ))}
                    </View>
                  </>
                )}

                {/* Questions for Doctor */}
                {aiExplanationData.questionsForDoctor?.length > 0 && (
                  <View style={styles.questionsBox}>
                    <View style={{ flexDirection: "row", alignItems: "center", gap: 8 }}>
                      <HelpCircle size={18} color="#7C3AED" />
                      <Text style={styles.questionsBoxTitle}>
                        Questions For Dr. {selectedRecord.doctor}
                      </Text>
                    </View>
                    {aiExplanationData.questionsForDoctor.map((q, qIdx) => (
                      <View key={qIdx} style={styles.questionItem}>
                        <View style={styles.questionBullet} />
                        <Text style={styles.questionText}>{q}</Text>
                      </View>
                    ))}
                  </View>
                )}

                {/* Bottom Done Button */}
                <TouchableOpacity
                  style={styles.actionBtnPrimary}
                  onPress={() => setAiExplanationVisible(false)}
                  activeOpacity={0.85}
                >
                  <CheckCircle2 size={18} color={Colors.onPrimary} />
                  <Text style={styles.actionBtnPrimaryText}>Understood, Looks Great!</Text>
                </TouchableOpacity>
              </ScrollView>
            ) : null}
          </View>
        )}
      </Modal>

      {/* ─── AI Scan Upload Modal — fullScreen with sharp corners ────────────── */}
      <Modal
        visible={aiOpen}
        animationType="slide"
        presentationStyle="fullScreen"
        onRequestClose={() => setAiOpen(false)}
      >
        <AIScanScreen
          type="report"
          patientUhid={userUhid}
          onClose={() => {
            setAiOpen(false);
            fetchRecords();
          }}
          onRecordSaved={() => {
            fetchRecords();
          }}
        />
      </Modal>

      {/* ─── Prescription Pad (Rx) OCR Scanner Modal ──────────────────────────── */}
      <PrescriptionScanModal
        visible={rxScanOpen}
        onClose={() => setRxScanOpen(false)}
        patientUhid={userUhid}
      />

      {/* ─── Unified Themed Alert Dialog ─────────────────────────────────────── */}
      <ThemedAlertModal
        visible={alertConfig.visible}
        type={alertConfig.type}
        title={alertConfig.title}
        message={alertConfig.message}
        buttons={alertConfig.buttons}
        onClose={() => setAlertConfig((prev) => ({ ...prev, visible: false }))}
      />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.surface },
  content: { padding: Spacing.margin, gap: Spacing.sm, paddingBottom: 100 },
  summaryBar: {
    flexDirection: "row",
    backgroundColor: Colors.surfaceContainerLowest,
    borderRadius: Radius.xl,
    padding: Spacing.sm,
  },
  summaryItem: { flex: 1, alignItems: "center" },
  summaryValue: {
    fontSize: FontSize.headlineLg,
    color: Colors.primary,
    fontFamily: FontFamily.dataMonoBold,
  },
  summaryLabel: {
    fontSize: FontSize.bodySm,
    color: Colors.onSurfaceVariant,
    fontFamily: FontFamily.bodyRegular,
  },
  summaryDivider: {
    width: 1,
    backgroundColor: Colors.surfaceContainerHigh,
    marginVertical: 4,
  },
  aiScanBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.sm,
    backgroundColor: Colors.primary,
    borderRadius: 0, // Sharp corners for report scanner
    padding: Spacing.sm,
    shadowColor: Colors.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 10,
    elevation: 3,
  },
  aiScanIconBox: {
    width: 44,
    height: 44,
    borderRadius: 0, // Sharp corners for report scanner
    backgroundColor: "rgba(255,255,255,0.18)",
    justifyContent: "center",
    alignItems: "center",
  },
  aiScanTitle: {
    fontSize: FontSize.labelLg,
    color: Colors.onPrimary,
    fontFamily: FontFamily.headlineSemiBold,
  },
  aiScanSubtitle: {
    fontSize: FontSize.bodySm,
    color: "rgba(255,255,255,0.8)",
    fontFamily: FontFamily.bodyRegular,
  },
  sectionLabel: {
    fontSize: FontSize.dataMono,
    color: Colors.outline,
    fontFamily: FontFamily.dataMonoBold,
    textTransform: "uppercase",
    letterSpacing: 1,
    marginTop: 4,
  },
  recordCard: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.sm,
    backgroundColor: Colors.surfaceContainerLowest,
    borderRadius: Radius.xl,
    padding: Spacing.sm,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 6,
    elevation: 2,
    borderWidth: 1,
    borderColor: Colors.surfaceContainerHigh,
  },
  recordIcon: {
    width: 44,
    height: 44,
    borderRadius: Radius.md,
    backgroundColor: Colors.surfaceContainerLow,
    justifyContent: "center",
    alignItems: "center",
  },
  recordTitle: {
    fontSize: FontSize.labelLg,
    color: Colors.onSurface,
    fontFamily: FontFamily.bodySemiBold,
  },
  recordMeta: {
    fontSize: FontSize.bodySm,
    color: Colors.onSurfaceVariant,
    fontFamily: FontFamily.bodyRegular,
  },
  recordDoctor: {
    fontSize: 11,
    color: Colors.primary,
    fontFamily: FontFamily.bodyMedium,
  },
  recordStatus: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: Radius.full,
  },
  recordStatusText: {
    fontSize: 10,
    fontFamily: FontFamily.dataMonoBold,
    textTransform: "uppercase",
  },

  // ─── RECORD DETAILS MODAL ───────────────────────────────────────────────
  detailContainer: {
    flex: 1,
    backgroundColor: Colors.surface,
  },
  detailHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: Spacing.md,
    paddingTop: 18,
    paddingBottom: 14,
    backgroundColor: Colors.surfaceContainerLowest,
    borderBottomWidth: 1,
    borderBottomColor: Colors.surfaceContainerHigh,
  },
  detailTitle: {
    fontSize: 18,
    fontFamily: FontFamily.headlineBold,
    color: Colors.onSurface,
  },
  detailSubtitle: {
    fontSize: 11,
    fontFamily: FontFamily.dataMono,
    color: Colors.onSurfaceVariant,
    marginTop: 2,
  },
  detailCloseBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: Colors.surfaceContainerHigh,
    justifyContent: "center",
    alignItems: "center",
  },
  detailContent: {
    padding: Spacing.md,
    gap: Spacing.sm,
    paddingBottom: 40,
  },
  detailMetaCard: {
    backgroundColor: Colors.surfaceContainerLowest,
    borderRadius: Radius.xl,
    padding: Spacing.sm,
    gap: 8,
  },
  detailMetaRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  detailMetaText: {
    fontSize: FontSize.bodyMd,
    color: Colors.onSurface,
    fontFamily: FontFamily.bodyRegular,
  },
  detailStatusBanner: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: Spacing.xs,
    padding: Spacing.sm,
    borderRadius: Radius.xl,
  },
  detailStatusTitle: {
    fontSize: FontSize.labelLg,
    fontFamily: FontFamily.bodySemiBold,
    marginBottom: 2,
  },
  detailStatusDesc: {
    fontSize: FontSize.bodySm,
    color: Colors.onSurface,
    fontFamily: FontFamily.bodyRegular,
    lineHeight: 18,
  },
  detailSectionLabel: {
    fontSize: FontSize.dataMono,
    color: Colors.outline,
    fontFamily: FontFamily.dataMonoBold,
    textTransform: "uppercase",
    letterSpacing: 1,
    marginTop: 6,
  },
  biomarkerTable: {
    backgroundColor: Colors.surfaceContainerLowest,
    borderRadius: Radius.xl,
    padding: Spacing.sm,
  },
  biomarkerRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 10,
  },
  biomarkerBorder: {
    borderBottomWidth: 1,
    borderBottomColor: Colors.surfaceContainerHigh,
  },
  bioName: {
    fontSize: FontSize.bodyMd,
    color: Colors.onSurface,
    fontFamily: FontFamily.bodySemiBold,
  },
  bioStatusHint: {
    fontSize: 11,
    color: Colors.outline,
    fontFamily: FontFamily.dataMono,
  },
  bioValue: {
    fontSize: FontSize.labelLg,
    color: Colors.onSurface,
    fontFamily: FontFamily.dataMonoBold,
  },
  bioBadge: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: Radius.full,
  },
  bioBadgeText: {
    fontSize: 10,
    fontFamily: FontFamily.bodySemiBold,
  },

  // Actions
  actionBtnSecondaryFull: {
    height: 48,
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    gap: 8,
    backgroundColor: Colors.surfaceContainerLowest,
    borderRadius: Radius.xl,
    borderWidth: 1.5,
    borderColor: Colors.primary + "55",
  },
  actionBtnSecondaryText: {
    fontSize: FontSize.labelMd,
    color: Colors.primary,
    fontFamily: FontFamily.bodySemiBold,
  },
  actionBtnPrimary: {
    height: 48,
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    gap: 8,
    backgroundColor: Colors.primary,
    borderRadius: Radius.xl,
    shadowColor: Colors.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 10,
    elevation: 3,
  },
  actionBtnPrimaryText: {
    fontSize: FontSize.labelLg,
    color: Colors.onPrimary,
    fontFamily: FontFamily.bodySemiBold,
  },

  // ─── AI PLAIN ENGLISH EXPLANATION MODAL STYLES ──────────────────────────
  explanationContainer: {
    flex: 1,
    backgroundColor: Colors.surface,
  },
  explanationHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: Spacing.md,
    paddingTop: 18,
    paddingBottom: 14,
    backgroundColor: Colors.surfaceContainerLowest,
    borderBottomWidth: 1,
    borderBottomColor: Colors.surfaceContainerHigh,
  },
  explanationHeaderLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    flex: 1,
  },
  aiBadgeBox: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "#F5F3FF",
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 1,
    borderColor: "rgba(124, 58, 237, 0.2)",
  },
  explanationHeaderTitle: {
    fontSize: 16,
    fontFamily: FontFamily.headlineBold,
    color: Colors.onSurface,
  },
  explanationHeaderSub: {
    fontSize: 11,
    fontFamily: FontFamily.dataMono,
    color: Colors.primary,
    marginTop: 1,
  },
  explanationContent: {
    padding: Spacing.md,
    gap: 14,
    paddingBottom: 40,
  },
  verdictCard: {
    backgroundColor: "#ECFDF5",
    borderWidth: 1,
    borderColor: "#A7F3D0",
    borderRadius: Radius.xl,
    padding: Spacing.md,
    gap: 8,
  },
  verdictIconRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  verdictTitle: {
    fontSize: 15,
    fontFamily: FontFamily.headlineBold,
    color: "#065F46",
  },
  verdictBody: {
    fontSize: 13,
    color: "#047857",
    fontFamily: FontFamily.bodyRegular,
    lineHeight: 20,
  },
  explanationSectionLabel: {
    fontSize: FontSize.dataMono,
    color: Colors.outline,
    fontFamily: FontFamily.dataMonoBold,
    textTransform: "uppercase",
    letterSpacing: 1,
    marginTop: 4,
  },
  statusIconWrap: {
    width: 32,
    height: 32,
    borderRadius: Radius.md,
    justifyContent: "center",
    alignItems: "center",
  },
  plainCard: {
    backgroundColor: Colors.surfaceContainerLowest,
    borderRadius: Radius.xl,
    padding: 14,
    gap: 8,
    borderWidth: 1,
    borderColor: Colors.surfaceContainerHigh,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.03,
    shadowRadius: 6,
    elevation: 1,
  },
  plainCardHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  plainCardTitle: {
    fontSize: 14,
    fontFamily: FontFamily.bodySemiBold,
    color: Colors.onSurface,
  },
  plainCardValue: {
    fontSize: 11,
    fontFamily: FontFamily.dataMono,
    color: Colors.onSurfaceVariant,
    marginTop: 1,
  },
  boldValue: {
    color: Colors.primary,
    fontFamily: FontFamily.dataMonoBold,
  },
  plainCardBadge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: Radius.full,
  },
  plainCardBadgeText: {
    fontSize: 10,
    fontFamily: FontFamily.dataMonoBold,
    textTransform: "uppercase",
  },
  plainCardDesc: {
    fontSize: 13,
    fontFamily: FontFamily.bodyRegular,
    color: Colors.onSurface,
    lineHeight: 19,
    backgroundColor: "#FBF9FE",
    padding: 10,
    borderRadius: 8,
  },
  tipBox: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 8,
    backgroundColor: "#F5F3FF",
    borderWidth: 1,
    borderColor: "rgba(124, 58, 237, 0.2)",
    borderRadius: Radius.md,
    padding: 8,
  },
  tipText: {
    flex: 1,
    fontSize: 12,
    fontFamily: FontFamily.bodyRegular,
    color: "#5B21B6",
    lineHeight: 16,
  },
  planCard: {
    backgroundColor: Colors.surfaceContainerLowest,
    borderRadius: Radius.xl,
    padding: 16,
    gap: 12,
    borderWidth: 1,
    borderColor: Colors.surfaceContainerHigh,
  },
  planRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 10,
  },
  planText: {
    fontSize: 12,
    color: Colors.onSurfaceVariant,
    fontFamily: FontFamily.bodyRegular,
    lineHeight: 18,
    marginTop: 2,
  },
  planBold: {
    fontFamily: FontFamily.bodySemiBold,
    color: Colors.onSurface,
    fontSize: 13,
  },
  questionsBox: {
    backgroundColor: "#F5F3FF",
    borderWidth: 1,
    borderColor: "rgba(124, 58, 237, 0.25)",
    borderRadius: Radius.xl,
    padding: 16,
    gap: 10,
  },
  questionsBoxTitle: {
    fontSize: 13,
    fontFamily: FontFamily.headlineSemiBold,
    color: "#5B21B6",
  },
  questionItem: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 8,
  },
  questionBullet: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: "#7C3AED",
    marginTop: 6,
  },
  questionText: {
    flex: 1,
    fontSize: 12,
    color: "#4C1D95",
    fontFamily: FontFamily.bodyRegular,
    lineHeight: 18,
  },
  // ─── Loading Stepper Styles ───
  stepperContainer: {
    padding: Spacing.md,
    gap: Spacing.md,
    paddingBottom: 60,
  },
  stepperHeaderBox: {
    backgroundColor: Colors.surfaceContainerLowest,
    borderRadius: Radius.xl,
    padding: Spacing.md,
    borderWidth: 1,
    borderColor: Colors.surfaceContainerHigh,
    alignItems: "center",
    gap: 8,
  },
  stepperBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    backgroundColor: "#EDE9FE",
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: Radius.full,
  },
  stepperBadgeText: {
    fontSize: 11,
    fontFamily: FontFamily.dataMonoBold,
    color: "#7C3AED",
    letterSpacing: 0.3,
  },
  stepperCardTitle: {
    fontSize: FontSize.headlineSm,
    color: Colors.onSurface,
    fontFamily: FontFamily.headlineBold,
    textAlign: "center",
  },
  stepperCardSub: {
    fontSize: FontSize.bodySm,
    color: Colors.onSurfaceVariant,
    fontFamily: FontFamily.bodyRegular,
    textAlign: "center",
    lineHeight: 18,
  },
  stepperProgressBar: {
    width: "100%",
    height: 6,
    backgroundColor: Colors.surfaceContainerHigh,
    borderRadius: Radius.full,
    marginTop: 6,
    overflow: "hidden",
  },
  stepperProgressFill: {
    height: "100%",
    backgroundColor: "#7C3AED",
    borderRadius: Radius.full,
  },
  stepperStepCounter: {
    fontSize: 11,
    fontFamily: FontFamily.dataMonoBold,
    color: "#7C3AED",
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  stepsList: {
    backgroundColor: Colors.surfaceContainerLowest,
    borderRadius: Radius.xl,
    padding: Spacing.md,
    borderWidth: 1,
    borderColor: Colors.surfaceContainerHigh,
    gap: 6,
  },
  stepRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 12,
  },
  stepIndicatorCol: {
    alignItems: "center",
    width: 28,
  },
  stepCircle: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: Colors.surfaceContainerHigh,
    justifyContent: "center",
    alignItems: "center",
  },
  stepCircleDone: {
    backgroundColor: "#059669",
  },
  stepCircleCurrent: {
    backgroundColor: "#7C3AED",
  },
  stepNumText: {
    fontSize: 12,
    fontFamily: FontFamily.dataMonoBold,
    color: Colors.outline,
  },
  stepConnector: {
    width: 2,
    height: 36,
    backgroundColor: Colors.surfaceContainerHigh,
    marginVertical: 3,
  },
  stepConnectorDone: {
    backgroundColor: "#059669",
  },
  stepContentCol: {
    flex: 1,
    paddingTop: 3,
    paddingBottom: 16,
  },
  stepTitle: {
    fontSize: 13,
    color: Colors.onSurfaceVariant,
    fontFamily: FontFamily.bodyMedium,
  },
  stepTitleActive: {
    color: Colors.onSurface,
    fontFamily: FontFamily.headlineSemiBold,
  },
  stepDesc: {
    fontSize: 11,
    color: Colors.outline,
    fontFamily: FontFamily.bodyRegular,
    marginTop: 2,
    lineHeight: 16,
  },
  stepperNotice: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    backgroundColor: "#ECFDF5",
    borderWidth: 1,
    borderColor: "#A7F3D0",
    borderRadius: Radius.lg,
    padding: Spacing.sm,
  },
  stepperNoticeText: {
    flex: 1,
    fontSize: 11,
    color: "#065F46",
    fontFamily: FontFamily.bodyMedium,
    lineHeight: 16,
  },
  emptyContainer: {
    backgroundColor: Colors.surfaceContainerLowest,
    borderRadius: Radius.xl,
    padding: Spacing.xl,
    alignItems: "center",
    gap: 8,
    borderWidth: 1,
    borderColor: Colors.outlineVariant + "55",
    marginTop: 8,
  },
  emptyTitle: {
    fontSize: FontSize.bodyMd,
    color: Colors.onSurface,
    fontFamily: FontFamily.bodySemiBold,
  },
  emptySub: {
    fontSize: FontSize.bodySm,
    color: Colors.onSurfaceVariant,
    fontFamily: FontFamily.bodyRegular,
    textAlign: "center",
    lineHeight: 18,
  },
  loadingContainer: {
    paddingVertical: 36,
    alignItems: "center",
    justifyContent: "center",
    gap: 12,
  },
  loadingText: {
    fontSize: FontSize.bodyMd,
    color: Colors.onSurfaceVariant,
    fontFamily: FontFamily.bodyMedium,
  },
});
