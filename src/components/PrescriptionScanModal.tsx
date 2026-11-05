import React, { useState } from "react";
import {
  View,
  Text,
  Modal,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
  ActivityIndicator,
  Image,
  Dimensions,
} from "react-native";
import * as ImagePicker from "expo-image-picker";
import {
  Camera,
  Image as ImageIcon,
  X,
  FileSignature,
  CheckCircle2,
  Clock,
  Pill,
  Sparkles,
  AlertTriangle,
  RotateCcw,
  Check,
  Building2,
  User,
  Calendar,
} from "lucide-react-native";
import { Colors } from "../theme/colors";
import { Spacing, Radius, FontSize, FontFamily } from "../theme/typography";
import { Config } from "../config";
import ThemedAlertModal from "./ThemedAlertModal";

interface ScannedMedication {
  name: string;
  dosage: string;
  instructions: string;
  timeSlot: string;
  purpose: string;
  duration?: string;
  selected?: boolean;
}

interface ParsedPrescription {
  isValid: boolean;
  invalidReason?: string;
  doctorName: string;
  clinicHospital: string;
  date: string;
  diagnosis: string;
  medications: ScannedMedication[];
  doctorNotes?: string;
}

interface PrescriptionScanModalProps {
  visible: boolean;
  onClose: () => void;
  patientUhid: string;
  onMedicationsAdded?: (medications: any[]) => void;
}

const { width } = Dimensions.get("window");

export default function PrescriptionScanModal({
  visible,
  onClose,
  patientUhid,
  onMedicationsAdded,
}: PrescriptionScanModalProps) {
  const [step, setStep] = useState<"capture" | "scanning" | "review" | "success">("capture");
  const [imageUri, setImageUri] = useState<string | null>(null);
  const [parsedRx, setParsedRx] = useState<ParsedPrescription | null>(null);
  const [selectedMeds, setSelectedMeds] = useState<ScannedMedication[]>([]);
  const [isSaving, setIsSaving] = useState(false);
  const [alertConfig, setAlertConfig] = useState<{
    visible: boolean;
    type?: "info" | "success" | "warning" | "error";
    title: string;
    message?: string;
  }>({
    visible: false,
    title: "",
  });

  const resetState = () => {
    setStep("capture");
    setImageUri(null);
    setParsedRx(null);
    setSelectedMeds([]);
    setIsSaving(false);
  };

  const handleClose = () => {
    resetState();
    onClose();
  };

  // ─── Process Image with Gemini Vision OCR ──────────────────────────────────
  const processImage = async (base64: string, uri: string) => {
    setImageUri(uri);
    setStep("scanning");

    try {
      const res = await fetch(Config.apiScanPrescription, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          base64,
          mimeType: "image/jpeg",
          patientUhid,
        }),
      });

      if (!res.ok) {
        throw new Error("Unable to analyze prescription image.");
      }

      const data: ParsedPrescription = await res.json();

      if (data.isValid === false) {
        setAlertConfig({
          visible: true,
          type: "warning",
          title: "Prescription Not Recognized",
          message:
            data.invalidReason ||
            "The scanned image could not be verified as a medical prescription pad. Please hold your camera directly over the paper prescription and try again.",
        });
        setStep("capture");
        return;
      }

      if (!data.medications || data.medications.length === 0) {
        setAlertConfig({
          visible: true,
          type: "info",
          title: "No Medications Detected",
          message:
            "No specific medication names or strengths could be identified from this prescription image. Please ensure handwriting is legible and try again.",
        });
        setStep("capture");
        return;
      }

      const medsWithSelection = data.medications.map((m) => ({ ...m, selected: true }));
      setParsedRx({ ...data, medications: medsWithSelection });
      setSelectedMeds(medsWithSelection);
      setStep("review");
    } catch {
      setAlertConfig({
        visible: true,
        type: "error",
        title: "Scan Connection Error",
        message: "Failed to communicate with the MedSync Vision Engine. Please check your network connection and try again.",
      });
      setStep("capture");
    }
  };

  // ─── Camera Capture ────────────────────────────────────────────────────────
  const handleLaunchCamera = async () => {
    const { status } = await ImagePicker.requestCameraPermissionsAsync();
    if (status !== "granted") {
      setAlertConfig({
        visible: true,
        type: "warning",
        title: "Camera Permission Required",
        message: "MedSync needs camera access to capture paper prescriptions.",
      });
      return;
    }

    const result = await ImagePicker.launchCameraAsync({
      allowsEditing: true,
      quality: 0.85,
      base64: true,
    });

    if (!result.canceled && result.assets && result.assets[0].base64) {
      await processImage(result.assets[0].base64, result.assets[0].uri);
    }
  };

  // ─── Gallery Selection ─────────────────────────────────────────────────────
  const handleLaunchGallery = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== "granted") {
      setAlertConfig({
        visible: true,
        type: "warning",
        title: "Photos Permission Required",
        message: "MedSync needs access to your photo library to select prescription documents.",
      });
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      allowsEditing: true,
      quality: 0.85,
      base64: true,
    });

    if (!result.canceled && result.assets && result.assets[0].base64) {
      await processImage(result.assets[0].base64, result.assets[0].uri);
    }
  };

  // ─── Toggle Medication Selection ───────────────────────────────────────────
  const toggleMedication = (index: number) => {
    setSelectedMeds((prev) =>
      prev.map((m, idx) => (idx === index ? { ...m, selected: !m.selected } : m))
    );
  };

  // ─── Bulk Save to Patient Care Regimen ─────────────────────────────────────
  const handleSaveToCareRegimen = async () => {
    const active = selectedMeds.filter((m) => m.selected);
    if (active.length === 0) {
      setAlertConfig({
        visible: true,
        type: "warning",
        title: "No Medications Selected",
        message: "Please select at least one medication from the list to add to your daily care regimen.",
      });
      return;
    }

    setIsSaving(true);
    try {
      const res = await fetch(Config.apiPatientMedicationsBatch(patientUhid), {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          medications: active,
          doctorName: parsedRx?.doctorName || "Prescribing Physician",
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Unable to save medications.");
      }

      setStep("success");
      if (onMedicationsAdded) {
        onMedicationsAdded(data.medications || active);
      }

      setTimeout(() => {
        handleClose();
      }, 1600);
    } catch {
      setAlertConfig({
        visible: true,
        type: "error",
        title: "Save Failed",
        message: "Could not save medications to your regimen. Please try again.",
      });
    } finally {
      setIsSaving(false);
    }
  };

  const activeSelectedCount = selectedMeds.filter((m) => m.selected).length;

  return (
    <Modal visible={visible} animationType="slide" presentationStyle="pageSheet" onRequestClose={handleClose}>
      <View style={styles.container}>
        {/* Header */}
        <View style={styles.header}>
          <View style={styles.headerTitleRow}>
            <View style={styles.headerIconWrap}>
              <FileSignature size={18} color={Colors.primary} />
            </View>
            <View>
              <Text style={styles.headerTitle}>Prescription OCR</Text>
              <Text style={styles.headerSubtitle}>Auto-populate daily regimen from paper Rx</Text>
            </View>
          </View>
          <TouchableOpacity onPress={handleClose} style={styles.closeBtn}>
            <X size={18} color={Colors.onSurface} />
          </TouchableOpacity>
        </View>

        {/* ─── STEP 1: CAPTURE / UPLOAD ────────────────────────────────────── */}
        {step === "capture" && (
          <ScrollView contentContainerStyle={styles.captureBody} showsVerticalScrollIndicator={false}>
            {/* Camera Viewfinder Guide */}
            <View style={styles.viewfinderGuide}>
              <View style={styles.cornerTL} />
              <View style={styles.cornerTR} />
              <View style={styles.cornerBL} />
              <View style={styles.cornerBR} />
              <Camera size={44} color={Colors.primary} strokeWidth={1.8} />
              <Text style={styles.viewfinderText}>Position Prescription Pad</Text>
              <Text style={styles.viewfinderSubtext}>
                Ensure physician handwriting and dosages are well-lit and fully in frame
              </Text>
            </View>

            {/* Instruction Chips */}
            <View style={styles.tipsBox}>
              <View style={styles.tipRow}>
                <CheckCircle2 size={14} color={Colors.secondary} style={{ marginTop: 2 }} />
                <Text style={styles.tipText}>Deciphers cursive handwriting, abbreviations (OD, BD, TDS), and strengths</Text>
              </View>
              <View style={styles.tipRow}>
                <CheckCircle2 size={14} color={Colors.secondary} style={{ marginTop: 2 }} />
                <Text style={styles.tipText}>Maps medicines directly to 8:00 AM, 1:00 PM, and 9:00 PM reminder slots</Text>
              </View>
            </View>

            {/* Action Buttons */}
            <View style={styles.captureActions}>
              <TouchableOpacity style={styles.cameraBtn} onPress={handleLaunchCamera} activeOpacity={0.85}>
                <Camera size={20} color={Colors.onPrimary} />
                <Text style={styles.cameraBtnText}>Scan with Camera</Text>
              </TouchableOpacity>

              <TouchableOpacity style={styles.galleryBtn} onPress={handleLaunchGallery} activeOpacity={0.85}>
                <ImageIcon size={18} color={Colors.primary} />
                <Text style={styles.galleryBtnText}>Choose from Photos / PDF</Text>
              </TouchableOpacity>
            </View>
          </ScrollView>
        )}

        {/* ─── STEP 2: SCANNING & OCR ANALYSIS ─────────────────────────────── */}
        {step === "scanning" && (
          <View style={styles.scanningBody}>
            {imageUri && (
              <View style={styles.scanningImagePreview}>
                <Image source={{ uri: imageUri }} style={styles.scanningThumbnail} />
                <View style={styles.scanningOverlay}>
                  <ActivityIndicator size="large" color="#FFFFFF" />
                </View>
              </View>
            )}
            <View style={styles.scanningTextWrap}>
              <Sparkles size={24} color={Colors.primary} />
              <Text style={styles.scanningTitle}>Deciphering Prescription Pad...</Text>
              <Text style={styles.scanningSubtitle}>
                MedSync Vision AI is analyzing physician handwriting, dosages, and dosing intervals...
              </Text>
            </View>
          </View>
        )}

        {/* ─── STEP 3: REVIEW & CONFIRM ────────────────────────────────────── */}
        {step === "review" && parsedRx && (
          <View style={styles.reviewContainer}>
            <ScrollView contentContainerStyle={styles.reportBody} showsVerticalScrollIndicator={false}>
              {/* Physician & Clinic Card */}
              <View style={styles.docInfoCard}>
                <View style={styles.docMetaRow}>
                  <User size={14} color={Colors.primary} />
                  <Text style={styles.docMetaName}>{parsedRx.doctorName}</Text>
                </View>
                {parsedRx.clinicHospital ? (
                  <View style={styles.docMetaRow}>
                    <Building2 size={13} color={Colors.outline} />
                    <Text style={styles.docMetaHospital}>{parsedRx.clinicHospital}</Text>
                  </View>
                ) : null}
                <View style={styles.docMetaRow}>
                  <Calendar size={13} color={Colors.outline} />
                  <Text style={styles.docMetaDate}>{parsedRx.date}</Text>
                </View>
              </View>

              <View style={styles.sectionHeaderRow}>
                <Text style={styles.sectionHeader}>EXTRACTED MEDICATIONS ({selectedMeds.length})</Text>
                <Text style={styles.sectionHint}>Tap to select or deselect</Text>
              </View>

              {/* Medication Cards List */}
              {selectedMeds.map((med, idx) => (
                <TouchableOpacity
                  key={idx}
                  style={[styles.medItemCard, med.selected && styles.medItemCardActive]}
                  onPress={() => toggleMedication(idx)}
                  activeOpacity={0.8}
                >
                  <View style={[styles.medCheckbox, med.selected && styles.medCheckboxActive]}>
                    {med.selected ? <Check size={14} color="#FFF" strokeWidth={3} /> : null}
                  </View>
                  <View style={{ flex: 1, minWidth: 0, gap: 5 }}>
                    <View style={styles.medNameRow}>
                      <Text style={styles.medItemName} numberOfLines={2}>
                        {med.name}
                      </Text>
                      {med.dosage ? (
                        <View style={styles.doseBadge}>
                          <Text style={styles.doseBadgeText}>{med.dosage}</Text>
                        </View>
                      ) : null}
                    </View>
                    <Text style={styles.medInstructions} numberOfLines={2}>
                      {med.instructions}
                    </Text>
                    <View style={styles.medMetaFooter}>
                      <View style={styles.timeTag}>
                        <Clock size={11} color={Colors.primary} />
                        <Text style={styles.timeTagText} numberOfLines={1}>
                          {med.timeSlot}
                        </Text>
                      </View>
                      {med.purpose ? (
                        <View style={styles.purposeTag}>
                          <Pill size={11} color={Colors.secondary} />
                          <Text style={styles.purposeTagText} numberOfLines={1}>
                            {med.purpose}
                          </Text>
                        </View>
                      ) : null}
                    </View>
                  </View>
                </TouchableOpacity>
              ))}

              {/* Doctor Notes if present */}
              {parsedRx.doctorNotes ? (
                <View style={styles.notesBox}>
                  <Text style={styles.notesTitle}>Physician Clinical Instructions</Text>
                  <Text style={styles.notesBody}>{parsedRx.doctorNotes}</Text>
                </View>
              ) : null}

              {/* Retake Option */}
              <TouchableOpacity style={styles.retakeBtn} onPress={() => setStep("capture")}>
                <RotateCcw size={14} color={Colors.outline} />
                <Text style={styles.retakeText}>Retake / Scan Another Page</Text>
              </TouchableOpacity>
            </ScrollView>

            {/* Sticky Action Footer */}
            <View style={styles.footerActionRow}>
              <TouchableOpacity
                style={[styles.confirmBtn, activeSelectedCount === 0 && styles.confirmBtnDisabled]}
                disabled={activeSelectedCount === 0 || isSaving}
                onPress={handleSaveToCareRegimen}
                activeOpacity={0.85}
              >
                {isSaving ? (
                  <ActivityIndicator color={Colors.onPrimary} size="small" />
                ) : (
                  <>
                    <CheckCircle2 size={18} color={Colors.onPrimary} />
                    <Text style={styles.confirmBtnText}>
                      Add {activeSelectedCount} Medicine{activeSelectedCount === 1 ? "" : "s"} to Regimen
                    </Text>
                  </>
                )}
              </TouchableOpacity>
            </View>
          </View>
        )}

        {/* ─── STEP 4: SUCCESS CONFIRMATION ─────────────────────────────────── */}
        {step === "success" && (
          <View style={styles.successBody}>
            <View style={styles.successIconWrap}>
              <CheckCircle2 size={54} color={Colors.secondary} />
            </View>
            <Text style={styles.successTitle}>Care Regimen Updated</Text>
            <Text style={styles.successSubtitle}>
              Prescribed medications have been added to your daily schedule and medication tracker.
            </Text>
          </View>
        )}

        {/* Themed Alert Modal for Guardrails & Errors */}
        <ThemedAlertModal
          visible={alertConfig.visible}
          type={alertConfig.type}
          title={alertConfig.title}
          message={alertConfig.message}
          onClose={() => setAlertConfig((prev) => ({ ...prev, visible: false }))}
        />
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.surface,
  },
  header: {
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
  headerTitleRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  headerIconWrap: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: Colors.primaryFixed + "33",
    justifyContent: "center",
    alignItems: "center",
  },
  headerTitle: {
    fontSize: FontSize.headlineSm,
    fontFamily: FontFamily.headlineBold,
    color: Colors.onSurface,
  },
  headerSubtitle: {
    fontSize: FontSize.bodySm,
    fontFamily: FontFamily.bodyRegular,
    color: Colors.onSurfaceVariant,
  },
  closeBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: Colors.surfaceContainerHigh,
    justifyContent: "center",
    alignItems: "center",
  },

  // Capture Step
  captureBody: {
    padding: Spacing.md,
    gap: Spacing.md,
    alignItems: "center",
    paddingBottom: 40,
  },
  viewfinderGuide: {
    width: width - 36,
    height: 280,
    borderRadius: Radius.xxl,
    backgroundColor: Colors.surfaceContainerLowest,
    borderWidth: 1,
    borderColor: Colors.outlineVariant + "55",
    borderStyle: "dashed",
    justifyContent: "center",
    alignItems: "center",
    padding: Spacing.lg,
    position: "relative",
    marginTop: 8,
  },
  cornerTL: {
    position: "absolute",
    top: 14,
    left: 14,
    width: 24,
    height: 24,
    borderTopWidth: 3,
    borderLeftWidth: 3,
    borderColor: Colors.primary,
  },
  cornerTR: {
    position: "absolute",
    top: 14,
    right: 14,
    width: 24,
    height: 24,
    borderTopWidth: 3,
    borderRightWidth: 3,
    borderColor: Colors.primary,
  },
  cornerBL: {
    position: "absolute",
    bottom: 14,
    left: 14,
    width: 24,
    height: 24,
    borderBottomWidth: 3,
    borderLeftWidth: 3,
    borderColor: Colors.primary,
  },
  cornerBR: {
    position: "absolute",
    bottom: 14,
    right: 14,
    width: 24,
    height: 24,
    borderBottomWidth: 3,
    borderRightWidth: 3,
    borderColor: Colors.primary,
  },
  viewfinderText: {
    fontSize: FontSize.headlineSm,
    fontFamily: FontFamily.headlineSemiBold,
    color: Colors.onSurface,
    marginTop: 14,
  },
  viewfinderSubtext: {
    fontSize: FontSize.bodySm,
    fontFamily: FontFamily.bodyRegular,
    color: Colors.onSurfaceVariant,
    textAlign: "center",
    marginTop: 4,
    maxWidth: 240,
  },
  tipsBox: {
    width: "100%",
    backgroundColor: Colors.surfaceContainerLow,
    borderRadius: Radius.xl,
    padding: Spacing.sm,
    gap: 8,
  },
  tipRow: {
    flexDirection: "row",
    gap: 8,
    alignItems: "flex-start",
  },
  tipText: {
    flex: 1,
    fontSize: FontSize.bodySm,
    color: Colors.onSurface,
    fontFamily: FontFamily.bodyRegular,
    lineHeight: 18,
  },
  captureActions: {
    width: "100%",
    gap: Spacing.xs,
    marginTop: 4,
  },
  cameraBtn: {
    height: 48,
    backgroundColor: Colors.primary,
    borderRadius: Radius.lg,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    shadowColor: Colors.primary,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 6,
    elevation: 3,
  },
  cameraBtnText: {
    fontSize: FontSize.labelLg,
    color: Colors.onPrimary,
    fontFamily: FontFamily.bodySemiBold,
  },
  galleryBtn: {
    height: 46,
    backgroundColor: Colors.surfaceContainerLowest,
    borderRadius: Radius.lg,
    borderWidth: 1,
    borderColor: Colors.outlineVariant,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
  },
  galleryBtnText: {
    fontSize: FontSize.labelMd,
    color: Colors.primary,
    fontFamily: FontFamily.bodySemiBold,
  },

  // Scanning Step
  scanningBody: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: Spacing.xl,
    gap: 20,
  },
  scanningImagePreview: {
    width: 140,
    height: 180,
    borderRadius: Radius.lg,
    overflow: "hidden",
    position: "relative",
    borderWidth: 1,
    borderColor: Colors.outlineVariant,
  },
  scanningThumbnail: {
    width: "100%",
    height: "100%",
    resizeMode: "cover",
  },
  scanningOverlay: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: "rgba(0, 71, 102, 0.45)",
    justifyContent: "center",
    alignItems: "center",
  },
  scanningTextWrap: {
    alignItems: "center",
    gap: 8,
    maxWidth: 280,
  },
  scanningTitle: {
    fontSize: FontSize.headlineSm,
    fontFamily: FontFamily.headlineBold,
    color: Colors.onSurface,
    textAlign: "center",
  },
  scanningSubtitle: {
    fontSize: FontSize.bodySm,
    color: Colors.onSurfaceVariant,
    fontFamily: FontFamily.bodyRegular,
    textAlign: "center",
    lineHeight: 18,
  },

  // Review Step
  reviewContainer: {
    flex: 1,
  },
  reportBody: {
    padding: Spacing.md,
    gap: Spacing.sm,
    paddingBottom: 90,
  },
  docInfoCard: {
    backgroundColor: Colors.surfaceContainerLowest,
    borderRadius: Radius.xl,
    padding: Spacing.sm,
    gap: 6,
    borderWidth: 1,
    borderColor: Colors.surfaceContainerHigh,
  },
  docMetaRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  docMetaName: {
    fontSize: FontSize.labelLg,
    color: Colors.onSurface,
    fontFamily: FontFamily.headlineSemiBold,
  },
  docMetaHospital: {
    fontSize: FontSize.bodySm,
    color: Colors.onSurfaceVariant,
    fontFamily: FontFamily.bodyRegular,
  },
  docMetaDate: {
    fontSize: 11,
    color: Colors.outline,
    fontFamily: FontFamily.dataMono,
  },
  sectionHeaderRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginTop: 6,
  },
  sectionHeader: {
    fontSize: 11,
    fontFamily: FontFamily.dataMonoBold,
    color: Colors.outline,
    letterSpacing: 0.8,
  },
  sectionHint: {
    fontSize: 11,
    fontFamily: FontFamily.bodyRegular,
    color: Colors.onSurfaceVariant,
  },
  medItemCard: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 12,
    backgroundColor: Colors.surfaceContainerLowest,
    borderRadius: Radius.lg,
    padding: Spacing.sm,
    borderWidth: 1.5,
    borderColor: Colors.outlineVariant + "44",
    overflow: "hidden",
  },
  medItemCardActive: {
    borderColor: Colors.primary,
    backgroundColor: Colors.surfaceContainerLowest,
  },
  medCheckbox: {
    width: 22,
    height: 22,
    borderRadius: 6,
    borderWidth: 2,
    borderColor: Colors.outlineVariant,
    marginTop: 2,
    justifyContent: "center",
    alignItems: "center",
    flexShrink: 0,
  },
  medCheckboxActive: {
    backgroundColor: Colors.primary,
    borderColor: Colors.primary,
  },
  medNameRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    justifyContent: "space-between",
    gap: 8,
    width: "100%",
  },
  medItemName: {
    flex: 1,
    minWidth: 0,
    fontSize: FontSize.labelLg,
    color: Colors.onSurface,
    fontFamily: FontFamily.bodySemiBold,
    flexShrink: 1,
  },
  doseBadge: {
    flexShrink: 0,
    backgroundColor: Colors.primaryFixed + "33",
    paddingHorizontal: 8,
    paddingVertical: 2.5,
    borderRadius: Radius.full,
    alignSelf: "flex-start",
  },
  doseBadgeText: {
    fontSize: 11,
    color: Colors.primary,
    fontFamily: FontFamily.dataMonoBold,
  },
  medInstructions: {
    fontSize: FontSize.bodySm,
    color: Colors.onSurfaceVariant,
    fontFamily: FontFamily.bodyRegular,
    lineHeight: 18,
  },
  medMetaFooter: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 6,
    marginTop: 2,
    width: "100%",
  },
  timeTag: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    backgroundColor: Colors.surfaceContainerLow,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: Radius.full,
    maxWidth: "100%",
  },
  timeTagText: {
    fontSize: 10,
    color: Colors.primary,
    fontFamily: FontFamily.dataMonoBold,
    flexShrink: 1,
  },
  purposeTag: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    backgroundColor: Colors.secondaryContainer + "33",
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: Radius.full,
    maxWidth: "100%",
  },
  purposeTagText: {
    fontSize: 10,
    color: Colors.secondary,
    fontFamily: FontFamily.bodyMedium,
    flexShrink: 1,
  },
  notesBox: {
    backgroundColor: Colors.surfaceContainerLow,
    borderRadius: Radius.lg,
    padding: Spacing.sm,
    gap: 4,
    marginTop: 4,
  },
  notesTitle: {
    fontSize: 11,
    fontFamily: FontFamily.dataMonoBold,
    color: Colors.outline,
    letterSpacing: 0.5,
  },
  notesBody: {
    fontSize: FontSize.bodySm,
    color: Colors.onSurface,
    fontFamily: FontFamily.bodyRegular,
    lineHeight: 18,
  },
  retakeBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    paddingVertical: 12,
  },
  retakeText: {
    fontSize: FontSize.bodySm,
    color: Colors.onSurfaceVariant,
    fontFamily: FontFamily.bodyRegular,
  },
  footerActionRow: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    padding: Spacing.md,
    backgroundColor: Colors.surfaceContainerLowest,
    borderTopWidth: 1,
    borderTopColor: Colors.surfaceContainerHigh,
  },
  confirmBtn: {
    height: 48,
    backgroundColor: Colors.primary,
    borderRadius: Radius.lg,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
  },
  confirmBtnDisabled: {
    opacity: 0.5,
  },
  confirmBtnText: {
    fontSize: FontSize.labelLg,
    color: Colors.onPrimary,
    fontFamily: FontFamily.bodySemiBold,
  },

  // Success Step
  successBody: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: Spacing.xl,
    gap: 12,
  },
  successIconWrap: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: Colors.secondaryContainer + "44",
    justifyContent: "center",
    alignItems: "center",
  },
  successTitle: {
    fontSize: FontSize.headlineSm,
    fontFamily: FontFamily.headlineBold,
    color: Colors.onSurface,
  },
  successSubtitle: {
    fontSize: FontSize.bodyMd,
    color: Colors.onSurfaceVariant,
    fontFamily: FontFamily.bodyRegular,
    textAlign: "center",
    maxWidth: 280,
    lineHeight: 20,
  },
});
