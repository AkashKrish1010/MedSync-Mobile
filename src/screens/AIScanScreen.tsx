import React, { useState } from "react";
import { useNavigation } from "@react-navigation/native";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
  ActivityIndicator,
  Modal,
  Platform,
} from "react-native";
import * as DocumentPicker from "expo-document-picker";
import {
  X,
  Paperclip,
  Check,
  Zap,
  AlertTriangle,
  Microscope,
  CheckCircle2,
  Brain,
  RotateCcw,
  ShieldAlert,
  Upload,
  BookmarkCheck,
  FolderPlus,
  FileText,
  FileCheck,
  Trash2,
  RefreshCw,
  FileUp,
} from "lucide-react-native";
import { Colors } from "../theme/colors";
import { Spacing, FontSize, FontFamily } from "../theme/typography";
import { Config } from "../config";
import { AnalysisResult, BiomarkerDetail } from "../types";
import { DEMO_PATIENT_UHID } from "../constants/patient";

interface AIScanScreenProps {
  type: "report" | "symptom";
  onClose: () => void;
  onRecordSaved?: (record: any) => void;
  patientUhid?: string;
}

const samplePrompts = {
  symptom: [
    "Slight heart flutter and tightness after my morning running sessions.",
    "Frequent muscle cramps, mild dehydration, and elevated fatigue over the past 3 days.",
  ],
  report: [
    "Patient has low hemoglobin around 11.2 g/dL, vitamin D3 is deficient at 15 ng/mL, and total cholesterol is borderline at 210 mg/dL.",
    "Metabolic panel looks stable: fasting glucose is 85 mg/dL, potassium is 4.1 mEq/L, and serum creatinine is 0.9 mg/dL.",
  ],
};

// Client-side medical guardrail validation
function isMedicalReportText(inputText: string): boolean {
  if (!inputText || inputText.trim().length < 8) return false;
  const lower = inputText.toLowerCase();

  const nonMedicalTerms = [
    "recipe", "chocolate", "cake", "cook", "pizza", "burger", "movie", "song",
    "lyrics", "homework", "python", "javascript", "const ", "function()", "import ",
    "football", "crypto", "bitcoin", "weather", "gaming", "fortnite", "minecraft",
    "asdf", "qwerty", "lorem ipsum", "car repair", "travel trip"
  ];
  if (nonMedicalTerms.some((term) => lower.includes(term))) {
    return false;
  }

  const medicalTerms = [
    "blood", "cbc", "hemoglobin", "wbc", "rbc", "platelet", "cholesterol", "lipid",
    "ldl", "hdl", "triglyceride", "glucose", "sugar", "hba1c", "creatinine", "bun",
    "potassium", "sodium", "calcium", "vitamin", "iron", "ferritin", "thyroid", "tsh",
    "urine", "protein", "albumin", "liver", "alt", "ast", "bilirubin", "ecg", "ekg",
    "pressure", "bp", "pulse", "bpm", "heart", "oxygen", "spo2", "fever", "pain",
    "cough", "fatigue", "headache", "doctor", "patient", "lab", "test", "panel",
    "biomarker", "mg/dl", "g/dl", "mmol", "meq", "mcg", "mg", "tablet", "capsule",
    "diagnosis", "symptom", "clinical", "pathology", "specimen", "reference", "optimal",
    "elevated", "deficient", "serum", "plasma", "metabolic", "cell", "infection",
    "medication", "dose", "prescription", "allergy", "vitals", "normal", "abnormal"
  ];
  return medicalTerms.some((term) => lower.includes(term));
}

export default function AIScanScreen({ type, onClose, onRecordSaved, patientUhid }: AIScanScreenProps) {
  const navigation = useNavigation<any>();
  const [text, setText] = useState("");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<AnalysisResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [uploadedFileName, setUploadedFileName] = useState<string | null>(null);
  const [selectedFile, setSelectedFile] = useState<DocumentPicker.DocumentPickerAsset | null>(null);
  const [savedToArchives, setSavedToArchives] = useState(false);
  const [savingRecord, setSavingRecord] = useState(false);

  // Guardrail modal state
  const [guardrailModalVisible, setGuardrailModalVisible] = useState(false);
  const [guardrailReason, setGuardrailReason] = useState("");

  const formatFileSize = (bytes?: number): string => {
    if (!bytes || bytes <= 0) return "";
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  const blobToBase64 = (blob: Blob): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onloadend = () => {
        const resStr = (reader.result as string) || "";
        const base64 = resStr.includes(",") ? resStr.split(",")[1] : resStr;
        resolve(base64);
      };
      reader.onerror = reject;
      reader.readAsDataURL(blob);
    });
  };

  const handleSaveToArchives = async (customResult?: AnalysisResult): Promise<boolean> => {
    const target = customResult || result;
    if (!target || savingRecord) return false;
    setSavingRecord(true);
    const targetUhid = patientUhid || DEMO_PATIENT_UHID;
    try {
      const res = await fetch(Config.apiPatientRecords(targetUhid), {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: target.title || (type === "symptom" ? "AI Symptom Triage" : "Clinical Lab Report"),
          type: type === "symptom" ? "AI Symptom Triage" : "Lab Report Analysis",
          summary: target.summary || "",
          biomarkers: target.biomarkers || [],
          recommendations: target.recommendations || "",
          isOptimal: target.isOptimal ?? false,
          date: new Date().toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" }),
          doctorName: "MedSync Clinical AI",
          specialty: "Diagnostic Pathology",
        }),
      });
      const resData = await res.json();
      setSavedToArchives(true);
      onRecordSaved?.(resData.record || target);
      return true;
    } catch (e) {
      console.error("Auto-archive error:", e);
      return false;
    } finally {
      setSavingRecord(false);
    }
  };

  // ─── Text Analysis with Guardrails ────────────────────────────────────────
  const handleScan = async (inputText: string) => {
    if (!inputText.trim()) return;

    // Pre-flight client guardrail check
    if (type === "report" && !isMedicalReportText(inputText)) {
      setGuardrailReason(
        "The entered content does not contain recognized medical biomarkers, laboratory parameters, or clinical diagnostic data. Please enter or upload diagnostic reports or laboratory findings."
      );
      setGuardrailModalVisible(true);
      return;
    }

    setLoading(true);
    setError(null);
    setResult(null);
    setSavedToArchives(false);
    try {
      const response = await fetch(Config.apiAnalyze, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          text: inputText,
          type,
          patientUhid: DEMO_PATIENT_UHID,
        }),
      });
      if (!response.ok) throw new Error("Analysis failed. Please try again.");
      const data = await response.json();

      // Check server guardrail response
      if (data.isValid === false) {
        setGuardrailReason(
          data.invalidReason ||
            "The entered text could not be verified as a valid clinical or laboratory report. Please upload or enter diagnostic test results."
        );
        setGuardrailModalVisible(true);
        return;
      }

      setResult(data);
      // Auto-save immediately to clinical archives so it shows up in Records
      await handleSaveToArchives(data);
    } catch {
      setError("Unable to complete clinical analysis. Please verify your connection and try again.");
    } finally {
      setLoading(false);
    }
  };

  // ─── File Upload & Analysis with Universal Fallbacks ──────────────────────────
  const analyzeFile = async (assetToAnalyze?: DocumentPicker.DocumentPickerAsset) => {
    const asset = assetToAnalyze || selectedFile;
    if (!asset) return;

    setLoading(true);
    setError(null);
    setResult(null);
    setSavedToArchives(false);

    try {
      let fileBlob: any = null;
      if (Platform.OS === "web" && (asset as any).file) {
        fileBlob = (asset as any).file;
      } else if (asset.uri) {
        try {
          const res = await fetch(asset.uri);
          fileBlob = await res.blob();
        } catch (fetchErr) {
          console.warn("Could not fetch blob from uri directly:", fetchErr);
        }
      }

      let response: Response | null = null;
      let usedMultipart = false;

      // Method 1: Multipart FormData with standard Blob / File
      if (fileBlob) {
        try {
          const formData = new FormData();
          formData.append("type", type);
          formData.append("patientUhid", DEMO_PATIENT_UHID);
          formData.append("file", fileBlob, asset.name);

          const multipartRes = await fetch(Config.apiAnalyzeFile, {
            method: "POST",
            body: formData,
          });
          if (multipartRes.ok) {
            response = multipartRes;
            usedMultipart = true;
          } else {
            console.warn("Multipart returned non-OK status, attempting Base64 JSON fallback.");
          }
        } catch (formErr) {
          console.warn("Multipart upload error, using Base64 JSON fallback:", formErr);
        }
      }

      // Method 2: Resilient Base64 JSON fallback
      if (!usedMultipart || !response || !response.ok) {
        let base64String = "";
        if (fileBlob) {
          base64String = await blobToBase64(fileBlob);
        } else if (asset.uri) {
          const bRes = await fetch(asset.uri);
          const b = await bRes.blob();
          base64String = await blobToBase64(b);
        }

        if (base64String) {
          const mime =
            asset.mimeType ||
            (asset.name.toLowerCase().endsWith(".pdf")
              ? "application/pdf"
              : "image/jpeg");

          const jsonRes = await fetch(Config.apiAnalyzeFile, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              base64: base64String,
              fileName: asset.name,
              mimeType: mime,
              type,
              patientUhid: DEMO_PATIENT_UHID,
            }),
          });
          if (jsonRes.ok || !response) {
            response = jsonRes;
          }
        }
      }

      if (!response || !response.ok) {
        const errBody = response ? await response.json().catch(() => ({})) : {};
        throw new Error(errBody.error || "File analysis failed. Please verify the document format.");
      }

      const data = await response.json();

      // Check server guardrail response
      if (data.isValid === false) {
        setGuardrailReason(
          data.invalidReason ||
            "The uploaded document does not contain recognized clinical laboratory results, physiological biomarkers, or diagnostic data. Please upload a legitimate medical test report."
        );
        setGuardrailModalVisible(true);
        return;
      }

      setResult(data);
      // Auto-save immediately to clinical archives so it shows up in Records
      await handleSaveToArchives(data);
    } catch (err: any) {
      if (err?.message !== "User canceled document picker") {
        setError("Unable to process the document. Please verify the file and try again.");
      }
    } finally {
      setLoading(false);
    }
  };

  const handlePickFile = async () => {
    try {
      const res = await DocumentPicker.getDocumentAsync({
        type: ["application/pdf", "image/jpeg", "image/png", "image/webp"],
        copyToCacheDirectory: true,
      });

      if (res.canceled || !res.assets?.[0]) return;

      const asset = res.assets[0];
      setSelectedFile(asset);
      setUploadedFileName(asset.name);
      setError(null);
    } catch (err: any) {
      if (err?.message !== "User canceled document picker") {
        setError("Unable to select the document. Please try again.");
      }
    }
  };

  const handleRemoveFile = () => {
    setSelectedFile(null);
    setUploadedFileName(null);
    setError(null);
    setLoading(false);
  };

  const handleFileUpload = handlePickFile;

  const statusColor = (status: string) => {
    if (status === "Optimal" || status === "Normal")
      return { bg: Colors.secondaryContainer + "55", text: Colors.secondary };
    return { bg: Colors.errorContainer, text: Colors.onErrorContainer };
  };

  return (
    <View style={styles.container}>
      {/* Header — Sharp corners for Report Scanner */}
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <Microscope size={22} color={Colors.onPrimary} />
          <Text style={styles.headerTitle}>
            {type === "symptom" ? "AI Symptom Diagnostic" : "AI Clinical Report Scanner"}
          </Text>
        </View>
        <TouchableOpacity onPress={onClose} style={styles.closeBtn}>
          <X size={18} color={Colors.onPrimary} />
        </TouchableOpacity>
      </View>

      <ScrollView
        style={styles.body}
        contentContainerStyle={styles.bodyContent}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        {!result ? (
          <>
            <Text style={styles.description}>
              {type === "symptom"
                ? "Describe your current physical observations, duration, and lifestyle factors."
                : "Type or paste lab data, or upload a PDF/image report for AI analysis."}
            </Text>

            {/* Text Input — Sharp corners */}
            <TextInput
              style={styles.textarea}
              value={text}
              onChangeText={setText}
              multiline
              numberOfLines={5}
              placeholder={
                type === "symptom"
                  ? "e.g. Heart race baseline of 94bpm with mild shortness of breath..."
                  : "e.g. CBC Panel: Fasting Glucose 92 mg/dL, Vitamin D3 18 ng/mL, Total Cholesterol 210 mg/dL..."
              }
              placeholderTextColor={Colors.outline}
              textAlignVertical="top"
            />

            {/* FILE UPLOAD & ATTACHMENT CARD — Sharp corners */}
            {!selectedFile ? (
              <TouchableOpacity
                onPress={handlePickFile}
                style={styles.uploadBtn}
                disabled={loading}
              >
                <View style={styles.uploadIconBox}>
                  <FileUp size={20} color={Colors.primary} />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={styles.uploadTitle}>Upload Clinical Lab Report</Text>
                  <Text style={styles.uploadSubtitle}>
                    PDF, JPEG, PNG or WebP — up to 20 MB
                  </Text>
                </View>
                <View style={styles.uploadBrowseBadge}>
                  <Text style={styles.uploadBrowseText}>Browse</Text>
                </View>
              </TouchableOpacity>
            ) : (
              <View style={styles.attachedFileCard}>
                <View style={styles.attachedFileTop}>
                  <View style={styles.attachedFileIconBox}>
                    {selectedFile.name.toLowerCase().endsWith(".pdf") ? (
                      <FileText size={22} color={Colors.primary} />
                    ) : (
                      <FileCheck size={22} color={Colors.primary} />
                    )}
                  </View>
                  <View style={{ flex: 1, paddingRight: Spacing.xs }}>
                    <Text style={styles.attachedFileName} numberOfLines={1}>
                      {selectedFile.name}
                    </Text>
                    <Text style={styles.attachedFileMeta}>
                      {selectedFile.name.toLowerCase().endsWith(".pdf")
                        ? "PDF Clinical Document"
                        : "Medical Image File"}
                      {selectedFile.size ? ` · ${formatFileSize(selectedFile.size)}` : ""}
                    </Text>
                  </View>
                  {loading ? (
                    <ActivityIndicator size="small" color={Colors.primary} />
                  ) : (
                    <View style={styles.attachedFileReadyBadge}>
                      <Text style={styles.attachedFileReadyText}>Attached</Text>
                    </View>
                  )}
                </View>

                {/* Actions: Choose Other / Remove */}
                <View style={styles.attachedFileActions}>
                  <TouchableOpacity
                    style={styles.attachedFileBtn}
                    onPress={handlePickFile}
                    disabled={loading}
                  >
                    <RefreshCw size={13} color={Colors.primary} />
                    <Text style={styles.attachedFileBtnText}>Choose Other</Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={[styles.attachedFileBtn, styles.attachedFileRemoveBtn]}
                    onPress={handleRemoveFile}
                    disabled={loading}
                  >
                    <Trash2 size={13} color={Colors.error} />
                    <Text style={[styles.attachedFileBtnText, { color: Colors.error }]}>
                      Remove File
                    </Text>
                  </TouchableOpacity>
                </View>
              </View>
            )}

            {/* Sample Prompts — Sharp corners */}
            <View style={styles.samplesSection}>
              <Text style={styles.samplesLabel}>SAMPLE OBSERVATIONS</Text>
              {samplePrompts[type].map((p, idx) => (
                <TouchableOpacity
                  key={idx}
                  onPress={() => {
                    setText(p);
                    handleScan(p);
                  }}
                  style={styles.sampleBtn}
                >
                  <Zap size={15} color={Colors.primary} style={{ marginTop: 2 }} />
                  <Text style={styles.sampleBtnText} numberOfLines={2}>
                    {p}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            {error && (
              <View style={styles.errorBox}>
                <AlertTriangle size={18} color={Colors.onErrorContainer} />
                <Text style={styles.errorText}>{error}</Text>
              </View>
            )}

            {/* Primary CTA — Sharp corners */}
            <TouchableOpacity
              onPress={() => {
                if (selectedFile) {
                  analyzeFile(selectedFile);
                } else if (text.trim()) {
                  handleScan(text);
                }
              }}
              disabled={loading || (!text.trim() && !selectedFile)}
              style={[
                styles.scanBtn,
                (loading || (!text.trim() && !selectedFile)) && styles.scanBtnDisabled,
              ]}
            >
              {loading ? (
                <>
                  <ActivityIndicator color={Colors.onPrimary} size="small" />
                  <Text style={styles.scanBtnText}>
                    {selectedFile ? "Analyzing Attached Report..." : "Ingesting Data..."}
                  </Text>
                </>
              ) : (
                <>
                  <Microscope size={20} color={Colors.onPrimary} />
                  <Text style={styles.scanBtnText}>
                    {selectedFile ? "Analyze Uploaded Report" : "Start Clinical Sync"}
                  </Text>
                </>
              )}
            </TouchableOpacity>
          </>
        ) : (
          /* Results — Sharp corners */
          <>
            <View style={styles.resultHeader}>
              <Text style={styles.resultTitle} numberOfLines={2}>
                {result.title}
              </Text>
              <View
                style={[
                  styles.statusBadge,
                  {
                    backgroundColor: result.isOptimal
                      ? Colors.secondaryContainer + "55"
                      : Colors.errorContainer,
                  },
                ]}
              >
                {result.isOptimal ? (
                  <CheckCircle2 size={13} color={Colors.secondary} />
                ) : (
                  <AlertTriangle size={13} color={Colors.onErrorContainer} />
                )}
                <Text
                  style={[
                    styles.statusBadgeText,
                    {
                      color: result.isOptimal ? Colors.secondary : Colors.onErrorContainer,
                    },
                  ]}
                >
                  {result.isOptimal ? "Clinical Stability" : "Action Required"}
                </Text>
              </View>
            </View>

            <Text style={styles.sectionLabel}>INGESTED BIOMARKERS</Text>
            {result.biomarkers.map((bio: BiomarkerDetail, idx: number) => {
              const sc = statusColor(bio.status);
              return (
                <View key={idx} style={styles.biomarkerRow}>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.biomarkerName}>{bio.name}</Text>
                    <Text style={styles.biomarkerRef}>{bio.reference}</Text>
                  </View>
                  <View style={{ alignItems: "flex-end", gap: 4 }}>
                    <Text style={styles.biomarkerValue}>{bio.value}</Text>
                    <View style={[styles.biomarkerStatus, { backgroundColor: sc.bg }]}>
                      <Text style={[styles.biomarkerStatusText, { color: sc.text }]}>
                        {bio.status}
                      </Text>
                    </View>
                  </View>
                </View>
              );
            })}

            <View style={styles.aiSummaryBox}>
              <View style={styles.aiSummaryHeader}>
                <Brain size={18} color={Colors.primary} />
                <Text style={styles.aiSummaryLabel}>Neural Intelligence Analysis</Text>
              </View>
              <Text style={styles.aiSummaryText}>{result.summary}</Text>
            </View>

            <Text style={styles.sectionLabel}>RECOMMENDED PROTOCOLS</Text>
            <View style={styles.recommendationsBox}>
              <Text style={styles.recommendationsText}>{result.recommendations}</Text>
            </View>

            {savedToArchives && (
              <View style={styles.savedBanner}>
                <CheckCircle2 size={16} color="#059669" />
                <Text style={styles.savedBannerText}>
                  Archived to Patient Clinical Records · Available for PDF Export & AI Explanation
                </Text>
              </View>
            )}

            <View style={styles.resultFooter}>
              {/* Primary Action Button — Full Width */}
              <TouchableOpacity
                style={styles.primaryBtn}
                onPress={async () => {
                  if (!savedToArchives && result) {
                    await handleSaveToArchives(result);
                  }
                  onClose();
                  try {
                    navigation.navigate("Records");
                  } catch (e) {}
                }}
              >
                <Check size={16} color={Colors.onPrimary} />
                <Text style={styles.primaryBtnText} numberOfLines={1}>
                  View in Clinical Archives
                </Text>
              </TouchableOpacity>

              {/* Secondary Actions Row — Balanced 2-Button Grid */}
              <View style={styles.resultSecondaryRow}>
                <TouchableOpacity
                  style={styles.secondaryBtn}
                  onPress={() => {
                    setResult(null);
                    setText("");
                    setSelectedFile(null);
                    setUploadedFileName(null);
                    setSavedToArchives(false);
                    setError(null);
                  }}
                >
                  <RotateCcw size={15} color={Colors.onSurface} />
                  <Text style={styles.secondaryBtnText} numberOfLines={1}>
                    Scan Another
                  </Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={[
                    styles.saveArchiveBtn,
                    savedToArchives && styles.saveArchiveBtnDone,
                  ]}
                  onPress={() => handleSaveToArchives()}
                  disabled={savingRecord || savedToArchives}
                  activeOpacity={0.8}
                >
                  {savingRecord ? (
                    <ActivityIndicator size="small" color="#FFFFFF" />
                  ) : savedToArchives ? (
                    <>
                      <CheckCircle2 size={15} color="#FFFFFF" strokeWidth={2.4} />
                      <Text style={styles.saveArchiveBtnText} numberOfLines={1}>
                        Saved in Archives
                      </Text>
                    </>
                  ) : (
                    <>
                      <BookmarkCheck size={15} color="#FFFFFF" strokeWidth={2.2} />
                      <Text style={styles.saveArchiveBtnText} numberOfLines={1}>
                        Save to Archives
                      </Text>
                    </>
                  )}
                </TouchableOpacity>
              </View>
            </View>
          </>
        )}
      </ScrollView>

      {/* ─── GUARDRAIL MODAL (Unrelated Content Modal) ────────────────────────── */}
      <Modal
        visible={guardrailModalVisible}
        transparent
        animationType="fade"
        onRequestClose={() => setGuardrailModalVisible(false)}
      >
        <View style={styles.guardrailOverlay}>
          <View style={styles.guardrailCard}>
            {/* Warning Header */}
            <View style={styles.guardrailHeader}>
              <View style={styles.guardrailIconBox}>
                <ShieldAlert size={28} color="#DC2626" />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.guardrailTitle}>Medical Content Required</Text>
                <Text style={styles.guardrailSubtitle}>
                  Unrelated or non-clinical content detected
                </Text>
              </View>
              <TouchableOpacity
                onPress={() => setGuardrailModalVisible(false)}
                style={styles.guardrailCloseBtn}
              >
                <X size={18} color={Colors.onSurfaceVariant} />
              </TouchableOpacity>
            </View>

            {/* Explanation */}
            <Text style={styles.guardrailReasonText}>
              {guardrailReason ||
                "The submitted content does not appear to contain medical lab results, physiological biomarkers, or clinical diagnostic data."}
            </Text>

            {/* Accepted Format Guide */}
            <View style={styles.guardrailGuideBox}>
              <Text style={styles.guardrailGuideTitle}>PLEASE PROVIDE VALID CLINICAL DATA:</Text>
              <View style={styles.guardrailBulletRow}>
                <CheckCircle2 size={14} color={Colors.primary} style={{ marginTop: 2 }} />
                <Text style={styles.guardrailBulletText}>
                  <Text style={styles.boldWord}>Blood Panels:</Text> Complete Blood Count (CBC), Hemoglobin, WBC, Platelets
                </Text>
              </View>
              <View style={styles.guardrailBulletRow}>
                <CheckCircle2 size={14} color={Colors.primary} style={{ marginTop: 2 }} />
                <Text style={styles.guardrailBulletText}>
                  <Text style={styles.boldWord}>Metabolic & Lipids:</Text> Fasting Glucose, HbA1c, Cholesterol, Triglycerides
                </Text>
              </View>
              <View style={styles.guardrailBulletRow}>
                <CheckCircle2 size={14} color={Colors.primary} style={{ marginTop: 2 }} />
                <Text style={styles.guardrailBulletText}>
                  <Text style={styles.boldWord}>Pathology & Urinalysis:</Text> Electrolytes, Liver enzymes (ALT/AST), Kidney panels
                </Text>
              </View>
              <View style={styles.guardrailBulletRow}>
                <CheckCircle2 size={14} color={Colors.primary} style={{ marginTop: 2 }} />
                <Text style={styles.guardrailBulletText}>
                  <Text style={styles.boldWord}>Documents:</Text> PDF or clear photos of official diagnostic lab reports
                </Text>
              </View>
            </View>

            {/* Action Buttons — Sharp corners */}
            <View style={styles.guardrailActions}>
              <TouchableOpacity
                style={styles.guardrailUploadBtn}
                onPress={() => {
                  setGuardrailModalVisible(false);
                  setTimeout(() => handleFileUpload(), 300);
                }}
              >
                <Upload size={16} color={Colors.onPrimary} />
                <Text style={styles.guardrailUploadBtnText}>Upload Appropriate Document</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.guardrailSampleBtn}
                onPress={() => {
                  const sample = samplePrompts.report[0];
                  setText(sample);
                  setGuardrailModalVisible(false);
                  setTimeout(() => handleScan(sample), 300);
                }}
              >
                <Zap size={16} color={Colors.primary} />
                <Text style={styles.guardrailSampleBtnText}>Load Sample Lab Report</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.guardrailCancelBtn}
                onPress={() => setGuardrailModalVisible(false)}
              >
                <Text style={styles.guardrailCancelBtnText}>Edit My Input</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.surface,
    borderRadius: 0, // Sharp corners for report scanner
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: Spacing.md,
    paddingTop: 18,
    paddingBottom: 14,
    backgroundColor: Colors.primary,
    borderRadius: 0, // Sharp corners
  },
  headerLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  headerTitle: {
    fontSize: FontSize.headlineSm,
    color: Colors.onPrimary,
    fontFamily: FontFamily.headlineSemiBold,
  },
  closeBtn: {
    width: 32,
    height: 32,
    borderRadius: 0, // Sharp corners
    backgroundColor: "rgba(255,255,255,0.15)",
    justifyContent: "center",
    alignItems: "center",
  },
  body: { flex: 1 },
  bodyContent: { padding: Spacing.md, gap: Spacing.sm },
  description: {
    fontSize: FontSize.bodySm,
    color: Colors.onSurfaceVariant,
    fontFamily: FontFamily.bodyRegular,
    lineHeight: 18,
  },
  textarea: {
    height: 120,
    backgroundColor: Colors.surfaceContainerLow,
    borderRadius: 0, // Sharp corners for report scanner
    borderWidth: 1,
    borderColor: Colors.outlineVariant,
    padding: Spacing.xs,
    fontSize: FontSize.bodyMd,
    color: Colors.onSurface,
    fontFamily: FontFamily.bodyRegular,
  },
  uploadBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.xs,
    backgroundColor: Colors.surfaceContainerLow,
    borderRadius: 0, // Sharp corners for report scanner
    borderWidth: 1.5,
    borderColor: Colors.primary,
    borderStyle: "dashed",
    padding: Spacing.sm,
  },
  uploadIconBox: {
    width: 38,
    height: 38,
    borderRadius: 0, // Sharp corners
    backgroundColor: Colors.surfaceContainerHighest,
    justifyContent: "center",
    alignItems: "center",
  },
  uploadTitle: {
    fontSize: FontSize.labelLg,
    color: Colors.primary,
    fontFamily: FontFamily.bodySemiBold,
  },
  uploadSubtitle: {
    fontSize: FontSize.bodySm,
    color: Colors.onSurfaceVariant,
    fontFamily: FontFamily.bodyRegular,
  },
  uploadedBadge: {
    width: 24,
    height: 24,
    borderRadius: 0, // Sharp corners
    backgroundColor: Colors.secondaryContainer,
    justifyContent: "center",
    alignItems: "center",
  },
  uploadBrowseBadge: {
    paddingHorizontal: 10,
    paddingVertical: 5,
    backgroundColor: Colors.primary,
    borderRadius: 0,
  },
  uploadBrowseText: {
    fontSize: 11,
    fontFamily: FontFamily.bodySemiBold,
    color: Colors.onPrimary,
    letterSpacing: 0.5,
  },
  attachedFileCard: {
    backgroundColor: Colors.surfaceContainerLowest,
    borderRadius: 0, // Sharp corners
    borderWidth: 1.5,
    borderColor: Colors.primary,
    padding: Spacing.sm,
    gap: 10,
  },
  attachedFileTop: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  attachedFileIconBox: {
    width: 40,
    height: 40,
    borderRadius: 0,
    backgroundColor: Colors.primaryContainer + "44",
    justifyContent: "center",
    alignItems: "center",
  },
  attachedFileName: {
    fontSize: FontSize.bodyMd,
    fontFamily: FontFamily.bodySemiBold,
    color: Colors.onSurface,
  },
  attachedFileMeta: {
    fontSize: 11,
    fontFamily: FontFamily.dataMono,
    color: Colors.onSurfaceVariant,
    marginTop: 2,
  },
  attachedFileReadyBadge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    backgroundColor: Colors.secondaryContainer + "55",
    borderRadius: 0,
  },
  attachedFileReadyText: {
    fontSize: 10,
    fontFamily: FontFamily.bodySemiBold,
    color: Colors.secondary,
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  attachedFileActions: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    borderTopWidth: 1,
    borderTopColor: Colors.outlineVariant + "44",
    paddingTop: 8,
  },
  attachedFileBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 0,
    borderWidth: 1,
    borderColor: Colors.primary,
    backgroundColor: Colors.surfaceContainerLow,
  },
  attachedFileRemoveBtn: {
    borderColor: Colors.error,
    backgroundColor: Colors.errorContainer + "33",
  },
  attachedFileBtnText: {
    fontSize: 12,
    fontFamily: FontFamily.bodySemiBold,
    color: Colors.primary,
  },
  samplesSection: { gap: 8 },
  samplesLabel: {
    fontSize: FontSize.dataMono,
    color: Colors.outlineVariant,
    fontFamily: FontFamily.dataMonoBold,
    textTransform: "uppercase",
    letterSpacing: 1,
  },
  sampleBtn: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 8,
    backgroundColor: Colors.surfaceContainerLow,
    borderRadius: 0, // Sharp corners
    padding: 10,
    borderWidth: 1,
    borderColor: Colors.surfaceContainerHigh,
  },
  sampleBtnText: {
    flex: 1,
    fontSize: FontSize.bodySm,
    color: Colors.onSurfaceVariant,
    fontFamily: FontFamily.bodyRegular,
  },
  errorBox: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    backgroundColor: Colors.errorContainer,
    borderRadius: 0, // Sharp corners
    padding: Spacing.xs,
  },
  errorText: {
    flex: 1,
    fontSize: FontSize.bodySm,
    color: Colors.onErrorContainer,
    fontFamily: FontFamily.bodyMedium,
  },
  scanBtn: {
    height: 48,
    backgroundColor: Colors.primary,
    borderRadius: 0, // Sharp corners
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    gap: 8,
    shadowColor: Colors.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 3,
  },
  scanBtnDisabled: { opacity: 0.5 },
  scanBtnText: {
    fontSize: FontSize.labelLg,
    color: Colors.onPrimary,
    fontFamily: FontFamily.bodySemiBold,
  },
  // Results — Sharp corners
  resultHeader: { gap: 8 },
  resultTitle: {
    fontSize: FontSize.headlineSm,
    color: Colors.onSurface,
    fontFamily: FontFamily.headlineSemiBold,
  },
  statusBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    alignSelf: "flex-start",
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 0, // Sharp corners
  },
  statusBadgeText: {
    fontSize: FontSize.labelMd,
    fontFamily: FontFamily.bodySemiBold,
  },
  sectionLabel: {
    fontSize: FontSize.dataMono,
    color: Colors.outline,
    fontFamily: FontFamily.dataMonoBold,
    textTransform: "uppercase",
    letterSpacing: 1,
    marginTop: 4,
  },
  biomarkerRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: Spacing.xs,
    backgroundColor: Colors.surfaceContainerLow,
    borderRadius: 0, // Sharp corners
    borderWidth: 1,
    borderColor: Colors.outlineVariant,
  },
  biomarkerName: {
    fontSize: FontSize.labelLg,
    color: Colors.onSurface,
    fontFamily: FontFamily.bodySemiBold,
  },
  biomarkerRef: {
    fontSize: 11,
    color: Colors.outline,
    fontFamily: FontFamily.dataMono,
    marginTop: 2,
  },
  biomarkerValue: {
    fontSize: FontSize.dataMetric,
    color: Colors.onSurface,
    fontFamily: FontFamily.dataMonoBold,
  },
  biomarkerStatus: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 0, // Sharp corners
  },
  biomarkerStatusText: {
    fontSize: 11,
    fontFamily: FontFamily.bodySemiBold,
  },
  aiSummaryBox: {
    backgroundColor: Colors.primaryFixed + "33",
    borderWidth: 1,
    borderColor: Colors.primary + "22",
    borderRadius: 0, // Sharp corners
    padding: Spacing.sm,
    gap: 6,
  },
  aiSummaryHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  aiSummaryLabel: {
    fontSize: FontSize.labelMd,
    color: Colors.onSurface,
    fontFamily: FontFamily.bodySemiBold,
  },
  aiSummaryText: {
    fontSize: FontSize.bodySm,
    color: Colors.onSurfaceVariant,
    fontFamily: FontFamily.bodyRegular,
    lineHeight: 18,
  },
  recommendationsBox: {
    backgroundColor: Colors.surfaceContainer,
    borderRadius: 0, // Sharp corners
    padding: Spacing.sm,
  },
  recommendationsText: {
    fontSize: FontSize.bodySm,
    color: Colors.onSurfaceVariant,
    fontFamily: FontFamily.bodyRegular,
    lineHeight: 20,
  },
  resultFooter: {
    gap: 10,
    paddingTop: Spacing.sm,
    paddingBottom: Spacing.lg,
  },
  resultSecondaryRow: {
    flexDirection: "row",
    gap: 10,
    alignItems: "center",
  },
  primaryBtn: {
    width: "100%",
    height: 48,
    backgroundColor: Colors.primary,
    borderRadius: 0, // Sharp corners
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    gap: 8,
    paddingHorizontal: Spacing.md,
  },
  primaryBtnText: {
    fontSize: FontSize.labelLg,
    color: Colors.onPrimary,
    fontFamily: FontFamily.bodySemiBold,
  },
  secondaryBtn: {
    flex: 1,
    height: 44,
    backgroundColor: Colors.surfaceContainer,
    borderRadius: 0, // Sharp corners
    borderWidth: 1,
    borderColor: Colors.outlineVariant,
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    gap: 6,
    paddingHorizontal: 8,
  },
  secondaryBtnText: {
    fontSize: 13,
    color: Colors.onSurface,
    fontFamily: FontFamily.bodySemiBold,
  },
  savedBanner: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    backgroundColor: "#ECFDF5",
    borderWidth: 1,
    borderColor: "#A7F3D0",
    padding: 10,
    marginTop: 6,
  },
  savedBannerText: {
    flex: 1,
    fontSize: 12,
    color: "#065F46",
    fontFamily: FontFamily.bodyMedium,
    lineHeight: 16,
  },
  saveArchiveBtn: {
    flex: 1,
    height: 44,
    backgroundColor: Colors.secondary,
    borderRadius: 0, // Sharp corners
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    gap: 6,
    paddingHorizontal: 8,
  },
  saveArchiveBtnDone: {
    backgroundColor: "#059669",
  },
  saveArchiveBtnText: {
    fontSize: 13,
    color: Colors.onPrimary,
    fontFamily: FontFamily.bodySemiBold,
  },

  // ─── GUARDRAIL MODAL STYLES (Sharp corners) ──────────────────────
  guardrailOverlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.65)",
    justifyContent: "center",
    alignItems: "center",
    padding: Spacing.md,
  },
  guardrailCard: {
    width: "100%",
    maxWidth: 440,
    backgroundColor: Colors.surfaceContainerLowest,
    borderRadius: 0, // Sharp corners per request
    borderWidth: 2,
    borderColor: "#DC2626",
    padding: Spacing.md,
    gap: 14,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.25,
    shadowRadius: 16,
    elevation: 8,
  },
  guardrailHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  guardrailIconBox: {
    width: 44,
    height: 44,
    borderRadius: 0,
    backgroundColor: "#FEF2F2",
    justifyContent: "center",
    alignItems: "center",
  },
  guardrailTitle: {
    fontSize: 16,
    fontFamily: FontFamily.headlineBold,
    color: "#991B1B",
  },
  guardrailSubtitle: {
    fontSize: 11,
    fontFamily: FontFamily.dataMono,
    color: Colors.onSurfaceVariant,
    marginTop: 2,
  },
  guardrailCloseBtn: {
    padding: 6,
  },
  guardrailReasonText: {
    fontSize: FontSize.bodySm,
    color: Colors.onSurface,
    fontFamily: FontFamily.bodyMedium,
    lineHeight: 20,
    backgroundColor: "#FFFBEB",
    padding: 10,
    borderLeftWidth: 3,
    borderLeftColor: "#D97706",
  },
  guardrailGuideBox: {
    backgroundColor: Colors.surfaceContainerLow,
    padding: 12,
    gap: 8,
    borderWidth: 1,
    borderColor: Colors.outlineVariant,
  },
  guardrailGuideTitle: {
    fontSize: 10,
    fontFamily: FontFamily.dataMonoBold,
    color: Colors.primary,
    letterSpacing: 0.5,
    marginBottom: 2,
  },
  guardrailBulletRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 8,
  },
  guardrailBulletText: {
    flex: 1,
    fontSize: 12,
    color: Colors.onSurface,
    fontFamily: FontFamily.bodyRegular,
    lineHeight: 17,
  },
  boldWord: {
    fontFamily: FontFamily.bodySemiBold,
    color: Colors.onSurface,
  },
  guardrailActions: {
    gap: 8,
    marginTop: 4,
  },
  guardrailUploadBtn: {
    height: 44,
    backgroundColor: Colors.primary,
    borderRadius: 0, // Sharp corners
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    gap: 8,
  },
  guardrailUploadBtnText: {
    fontSize: 14,
    color: Colors.onPrimary,
    fontFamily: FontFamily.bodySemiBold,
  },
  guardrailSampleBtn: {
    height: 42,
    backgroundColor: Colors.surfaceContainerLow,
    borderRadius: 0, // Sharp corners
    borderWidth: 1,
    borderColor: Colors.primary,
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    gap: 8,
  },
  guardrailSampleBtnText: {
    fontSize: 13,
    color: Colors.primary,
    fontFamily: FontFamily.bodySemiBold,
  },
  guardrailCancelBtn: {
    height: 36,
    justifyContent: "center",
    alignItems: "center",
  },
  guardrailCancelBtnText: {
    fontSize: 13,
    color: Colors.onSurfaceVariant,
    fontFamily: FontFamily.bodyMedium,
  },
});
