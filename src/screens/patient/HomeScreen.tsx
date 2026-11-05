import React, { useState, useEffect, useCallback } from "react";
import { useFocusEffect } from "@react-navigation/native";
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  Image,
  StyleSheet,
  Modal,
  ActivityIndicator,
  TextInput,
} from "react-native";
import {
  Calendar,
  Clock,
  MapPin,
  Stethoscope,
  FileText,
  RefreshCw,
  Star,
  CheckCircle2,
  AlertTriangle,
  ChevronRight,
  Plus,
  Minus,
  X,
  Phone,
  Navigation,
  MessageSquare,
  Check,
  Building2,
  Sparkles,
  Trash2,
  Camera,
} from "lucide-react-native";
import { Colors } from "../../theme/colors";
import { Spacing, Radius, FontSize, FontFamily } from "../../theme/typography";
import { Config } from "../../config";
import AIScanScreen from "../AIScanScreen";
import PrescriptionScanModal from "../../components/PrescriptionScanModal";
import ConsultationChatModal from "../../components/ConsultationChatModal";
import ThemedAlertModal from "../../components/ThemedAlertModal";
import DoctorAvatar from "../../components/DoctorAvatar";
import { BOOKING_TIME_SLOTS } from "../../data/mockData";
import { DEMO_PATIENT_NAME, DEMO_PATIENT_UHID, DEFAULT_CHAT_ROOM } from "../../constants/patient";
import { usePatientClinical } from "../../hooks/usePatientClinical";
import type { AuthUserProfile } from "../../types";

interface PatientHomeProps {
  isDemoFlagged: boolean;
  patientProfile?: AuthUserProfile | null;
}

function getTimeOfDayGreeting(): string {
  const hour = new Date().getHours();
  if (hour < 12) return "Good morning";
  if (hour < 17) return "Good afternoon";
  return "Good evening";
}

export default function PatientHome({ isDemoFlagged, patientProfile }: PatientHomeProps) {
  const userUhid = patientProfile?.uhid || DEMO_PATIENT_UHID;
  const userName = patientProfile?.name || DEMO_PATIENT_NAME;
  const firstName = userName.split(" ")[0] || "Patient";
  const isSarah = patientProfile?.email ? patientProfile.email.toLowerCase().includes("sarah") : true;

  const [homeAlert, setHomeAlert] = useState<{
    visible: boolean;
    type?: "info" | "success" | "warning" | "error" | "ai" | "clinical";
    title: string;
    message?: string;
  }>({
    visible: false,
    title: "",
  });
  const [cancelConfirmAppt, setCancelConfirmAppt] = useState<any | null>(null);
  const [cancelling, setCancelling] = useState(false);
  const [waterAmount, setWaterAmount] = useState(1.5);
  const [aiModalOpen, setAiModalOpen] = useState(false);
  const [aiModalType, setAiModalType] = useState<"report" | "symptom">("symptom");
  const [rxScanOpen, setRxScanOpen] = useState(false);
  const [doctors, setDoctors] = useState<any[]>([]);
  const [doctorsLoading, setDoctorsLoading] = useState(true);
  const [doctorsError, setDoctorsError] = useState(false);

  const {
    meds,
    nextAppointment,
    inbox,
    loading: clinicalLoading,
    refresh: refreshClinical,
    toggleMedTaken,
    markInboxRead,
    bookAppointment,
    cancelAppointment,
  } = usePatientClinical(userUhid);

  // Modals state
  const [bookingDoctor, setBookingDoctor] = useState<any | null>(null);
  const [bookingSuccess, setBookingSuccess] = useState(false);
  const [bookingSubmitting, setBookingSubmitting] = useState(false);
  const [selectedSlot, setSelectedSlot] = useState("Tomorrow 10:00 AM");

  const [directionsModalOpen, setDirectionsModalOpen] = useState(false);
  const [chatModalOpen, setChatModalOpen] = useState(false);

  const fetchDoctors = () => {
    setDoctorsLoading(true);
    setDoctorsError(false);
    fetch(Config.apiDoctors)
      .then((r) => r.json())
      .then((data) => {
        setDoctors(Array.isArray(data) ? data : []);
      })
      .catch(() => {
        setDoctors([]);
        setDoctorsError(true);
      })
      .finally(() => setDoctorsLoading(false));
  };

  useEffect(() => {
    fetchDoctors();
  }, []);

  useFocusEffect(
    useCallback(() => {
      fetchDoctors();
      refreshClinical();
      const poll = setInterval(() => {
        refreshClinical();
        fetchDoctors();
      }, 5000);
      return () => clearInterval(poll);
    }, [refreshClinical])
  );

  // Lightweight inbox listener while on home (patient role ping)
  useEffect(() => {
    let ws: WebSocket | null = null;
    try {
      ws = new WebSocket(Config.wsChatUrl);
      ws.onopen = () => {
        ws?.send(
          JSON.stringify({
            type: "join",
            room: DEFAULT_CHAT_ROOM,
            senderName: userName,
            senderRole: "patient",
          })
        );
      };
      ws.onmessage = (ev) => {
        try {
          const payload = JSON.parse(ev.data);
          if (payload.type === "inbox_update" && payload.uhid === userUhid) {
            refreshClinical();
          }
        } catch {
          /* ignore */
        }
      };
    } catch {
      /* ignore */
    }
    return () => ws?.close();
  }, [refreshClinical]);

  const onToggleMed = (id: string, currentlyTaken: boolean) => {
    toggleMedTaken(id, !currentlyTaken);
  };

  const takenCount = meds.filter((m) => m.taken).length;
  const progressPercent = meds.length ? Math.round((takenCount / meds.length) * 100) : 0;

  const nextDoctorRecord =
    doctors.find((d) => d.id === nextAppointment?.doctorId) ??
    doctors.find((d) => d.name === nextAppointment?.doctorName);

  const handleConfirmBooking = async () => {
    if (!bookingDoctor?.id) return;
    setBookingSubmitting(true);
    try {
      await bookAppointment(bookingDoctor.id, selectedSlot, "Live Chat Consultation");
      setBookingSuccess(true);
    } catch {
      setHomeAlert({
        visible: true,
        type: "error",
        title: "Booking Failed",
        message: "Unable to schedule appointment at this time. Please check your connection and try again.",
      });
    } finally {
      setBookingSubmitting(false);
    }
  };

  const openChat = () => {
    markInboxRead();
    setChatModalOpen(true);
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
      {/* Greeting */}
      <View style={styles.greetingRow}>
        <View style={styles.avatarWrap}>
          {isSarah ? (
            <Image
              source={{ uri: "https://lh3.googleusercontent.com/aida-public/AB6AXuASBR4ZjfWEmkAAG9ojAsPC-soD4_RAktJvtYSBU854byYrVoY0HtSFZ2mSo8vtZHPqEVTliVXgyzzc766afmnW9Sfn1xdRnPStml7ih3SBzzkQWV4JFbbrNaa4B08cAw-SdUpF286EVcFVqrgRACjnCNnKoMR-oMz03W9pKZFG6gsCc1yAoHNg_yfLrw5l1RA4G2bViLTd7_IXojHjhLm0cBDpg8gddMsJYwXcKdTDhE5Ltj1e-QO6Mw" }}
              style={styles.avatar}
            />
          ) : (
            <View style={[styles.avatar, { backgroundColor: Colors.primary, justifyContent: "center", alignItems: "center" }]}>
              <Text style={{ color: Colors.onPrimary, fontSize: 16, fontFamily: FontFamily.headlineBold }}>
                {userName.split(" ").filter(Boolean).map((w) => w[0]).join("").slice(0, 2).toUpperCase()}
              </Text>
            </View>
          )}
          <View style={[styles.statusDot, { backgroundColor: isDemoFlagged ? Colors.error : Colors.secondary }]} />
        </View>
        <View style={{ flex: 1 }}>
          <Text style={styles.greeting}>{getTimeOfDayGreeting()}, {firstName}</Text>
          <Text style={styles.uhid}>Patient <Text style={styles.uhidCode}>UHID: {userUhid}</Text></Text>
        </View>
        <TouchableOpacity style={styles.chatHeaderBtn} onPress={openChat}>
          <MessageSquare size={18} color={Colors.primary} />
          {inbox.unreadDoctorMessages > 0 && (
            <View style={styles.chatBadge}>
              <Text style={styles.chatBadgeText}>{inbox.unreadDoctorMessages}</Text>
            </View>
          )}
        </TouchableOpacity>
      </View>

      {inbox.unreadDoctorMessages > 0 && (
        <TouchableOpacity style={styles.doctorMsgBanner} onPress={openChat} activeOpacity={0.85}>
          <MessageSquare size={20} color={Colors.primary} />
          <View style={{ flex: 1 }}>
            <Text style={styles.doctorMsgTitle}>
              New message from {inbox.lastDoctorName || "your doctor"}
            </Text>
            <Text style={styles.doctorMsgPreview} numberOfLines={2}>
              {inbox.lastMessagePreview || "Tap to read in live chat"}
            </Text>
          </View>
          <ChevronRight size={18} color={Colors.primary} />
        </TouchableOpacity>
      )}

      {/* AI Flag Alert */}
      {isDemoFlagged && (
        <View style={styles.alertBanner}>
          <AlertTriangle size={20} color={Colors.error} />
          <View style={{ flex: 1 }}>
            <Text style={styles.alertTitle}>Biomarker Assessment Flag</Text>
            <Text style={styles.alertBody}>Neural scan detected elevated biomarkers in your last CBC. View details in Records or chat with Dr. Taylor.</Text>
          </View>
        </View>
      )}

      {/* Upcoming Appointment */}
      <View style={styles.card}>
        <View style={styles.cardHeaderRow}>
          <Text style={styles.cardLabel}>NEXT APPOINTMENT</Text>
          {clinicalLoading && !nextAppointment ? (
            <View style={[styles.confirmedBadge, { backgroundColor: Colors.surfaceContainerHigh }]}>
              <ActivityIndicator size="small" color={Colors.primary} style={{ transform: [{ scale: 0.7 }], marginRight: 4 }} />
              <Text style={[styles.confirmedText, { color: Colors.primary }]}>Syncing...</Text>
            </View>
          ) : nextAppointment ? (
            <View style={styles.confirmedBadge}>
              <View style={styles.confirmedDot} />
              <Text style={styles.confirmedText}>Confirmed</Text>
            </View>
          ) : (
            <View style={[styles.confirmedBadge, { backgroundColor: Colors.surfaceContainerHigh }]}>
              <Text style={[styles.confirmedText, { color: Colors.onSurfaceVariant }]}>None Scheduled</Text>
            </View>
          )}
        </View>
        <View style={styles.apptRow}>
          <DoctorAvatar
            name={nextAppointment?.doctorName ?? "Your physician"}
            avatar={nextAppointment?.initials ?? nextDoctorRecord?.avatar}
            profilePhotoUrl={nextDoctorRecord?.profilePhotoUrl}
            size={44}
            active={!!nextAppointment}
          />
          <View style={{ flex: 1 }}>
            <Text style={styles.doctorName}>
              {nextAppointment?.doctorName ?? "No confirmed visit scheduled"}
            </Text>
            <Text style={styles.doctorSpecialty}>
              {nextAppointment?.specialty ?? "Book a specialist below to schedule a visit"}
            </Text>
          </View>
          {nextAppointment ? (
            <View style={{ alignItems: "flex-end" }}>
              <Text style={styles.apptDate}>{nextAppointment.date ?? ""}</Text>
              <Text style={styles.apptTime}>{nextAppointment.time ?? "—"}</Text>
              <View style={{ flexDirection: "row", alignItems: "center", gap: 4 }}>
                {nextAppointment.type === "Live Chat Consultation" ? (
                  <MessageSquare size={12} color={Colors.onSurfaceVariant} />
                ) : (
                  <Building2 size={12} color={Colors.onSurfaceVariant} />
                )}
                <Text style={styles.apptType}>{nextAppointment.type ?? "—"}</Text>
              </View>
            </View>
          ) : null}
        </View>

        {nextAppointment ? (
          <View style={styles.apptActionRow}>
            {nextAppointment.type === "In-Clinic" ? (
              <TouchableOpacity style={styles.directionsBtn} onPress={() => setDirectionsModalOpen(true)}>
                <Navigation size={14} color={Colors.primary} />
                <Text style={styles.directionsBtnText}>Directions</Text>
              </TouchableOpacity>
            ) : (
              <TouchableOpacity style={styles.directionsBtn} onPress={openChat}>
                <Calendar size={14} color={Colors.primary} />
                <Text style={styles.directionsBtnText}>Chat Room</Text>
              </TouchableOpacity>
            )}

            <TouchableOpacity style={styles.chatBtn} onPress={openChat}>
              <MessageSquare size={14} color={Colors.secondary} />
              <Text style={styles.chatBtnText}>Message</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.cancelApptBtn}
              onPress={() => setCancelConfirmAppt(nextAppointment)}
              disabled={cancelling}
            >
              <Trash2 size={14} color="#DC2626" />
              <Text style={styles.cancelApptBtnText}>Cancel</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <TouchableOpacity
            style={styles.quickBookBtn}
            onPress={() => {
              if (doctors.length > 0) {
                setBookingDoctor(doctors[0]);
              }
            }}
          >
            <Calendar size={14} color={Colors.primary} />
            <Text style={styles.quickBookBtnText}>Book an Appointment</Text>
          </TouchableOpacity>
        )}
      </View>

      {/* Active Medications & Care Plan (Replaced Vitals sensor block) */}
      <View style={styles.sectionHeaderRow}>
        <View style={{ flex: 1 }}>
          <Text style={styles.sectionTitle}>Prescribed Care Regimen</Text>
          <Text style={styles.sectionSubtitle}>
            {meds.length
              ? `${takenCount} of ${meds.length} doses logged today (${progressPercent}%) · Tap a medicine when taken`
              : "Medicines from your doctor appear here"}
          </Text>
        </View>
        <TouchableOpacity
          style={styles.scanRxHeaderBtn}
          onPress={() => setRxScanOpen(true)}
          activeOpacity={0.8}
        >
          <Camera size={13} color={Colors.primary} strokeWidth={2.4} />
          <Text style={styles.scanRxHeaderBtnText}>Scan Rx</Text>
        </TouchableOpacity>
      </View>

      {/* Medication Adherence Progress */}
      <View style={styles.medProgressBar}>
        <View style={[styles.medProgressFill, { width: `${progressPercent}%` }]} />
      </View>

      {/* Medication Cards List */}
      <View style={{ gap: Spacing.xs }}>
        {clinicalLoading && meds.length === 0 ? (
          <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 8, paddingVertical: 14 }}>
            <ActivityIndicator size="small" color={Colors.primary} />
            <Text style={styles.doctorsLoadingText}>Syncing prescribed medications...</Text>
          </View>
        ) : meds.length === 0 ? (
          <Text style={styles.doctorsEmptyText}>
            Your care regimen will appear here when your doctor prescribes medications.
          </Text>
        ) : null}
        {meds.map((med) => (
          <TouchableOpacity
            key={med.id}
            style={[styles.medCard, med.taken && styles.medCardTaken]}
            onPress={() => onToggleMed(med.id, med.taken)}
            activeOpacity={0.7}
          >
            <View style={[styles.checkCircle, med.taken && styles.checkCircleActive]}>
              {med.taken ? <Check size={13} color={Colors.onPrimary} strokeWidth={3} /> : null}
            </View>
            <View style={{ flex: 1, minWidth: 0, gap: 4 }}>
              <View style={styles.medHeaderRow}>
                <Text style={[styles.medName, med.taken && styles.medNameCrossed]} numberOfLines={2}>
                  {med.name}
                </Text>
                {med.dosage ? (
                  <View style={styles.medDoseBadge}>
                    <Text style={styles.medDoseBadgeText}>{med.dosage}</Text>
                  </View>
                ) : null}
              </View>
              <Text style={styles.medInstructions} numberOfLines={2}>
                {med.instructions}{med.purpose ? ` · ${med.purpose}` : ""}
              </Text>
              <View style={styles.medMetaRow}>
                <View style={styles.medTimeBadge}>
                  <Clock size={11} color={Colors.primary} />
                  <Text style={styles.medTimeBadgeText}>{med.timeSlot}</Text>
                </View>
                {med.doctorName && med.doctorName !== "Prescribing Physician" ? (
                  <Text style={styles.medDoctorText} numberOfLines={1}>
                    {med.doctorName}
                  </Text>
                ) : null}
              </View>
            </View>
          </TouchableOpacity>
        ))}
      </View>

      {/* AI Health Tools */}
      <Text style={styles.sectionTitle}>AI Health Assistant & OCR</Text>
      <View style={styles.aiRow}>
        <TouchableOpacity
          onPress={() => { setAiModalType("symptom"); setAiModalOpen(true); }}
          style={[styles.aiBtn, { backgroundColor: Colors.primary }]}
        >
          <Stethoscope size={22} color={Colors.onPrimary} strokeWidth={2.2} />
          <Text style={styles.aiBtnTitle}>Symptom Check</Text>
          <Text style={styles.aiBtnSubtitle}>Describe symptoms</Text>
        </TouchableOpacity>
        <TouchableOpacity
          onPress={() => { setAiModalType("report"); setAiModalOpen(true); }}
          style={[styles.aiBtn, { backgroundColor: Colors.tertiary }]}
        >
          <FileText size={22} color={Colors.onPrimary} strokeWidth={2.2} />
          <Text style={styles.aiBtnTitle}>Analyze Report</Text>
          <Text style={styles.aiBtnSubtitle}>Upload lab or PDF</Text>
        </TouchableOpacity>
        <TouchableOpacity
          onPress={() => setRxScanOpen(true)}
          style={[styles.aiBtn, { backgroundColor: "#0284C7" }]}
        >
          <Camera size={22} color={Colors.onPrimary} strokeWidth={2.2} />
          <Text style={styles.aiBtnTitle}>Scan Rx Pad</Text>
          <Text style={styles.aiBtnSubtitle}>Auto-populate meds</Text>
        </TouchableOpacity>
      </View>

      {/* Available Doctors — fetched from backend */}
      <View style={styles.sectionHeaderRow}>
        <Text style={styles.sectionTitle}>Available Doctors</Text>
        <TouchableOpacity onPress={fetchDoctors} style={styles.refreshBadge}>
          <RefreshCw size={11} color={Colors.primary} />
          <Text style={styles.refreshText}>Refresh</Text>
        </TouchableOpacity>
      </View>

      {doctorsLoading ? (
        <View style={styles.doctorsLoading}>
          <ActivityIndicator color={Colors.primary} />
          <Text style={styles.doctorsLoadingText}>Loading doctors...</Text>
        </View>
      ) : doctors.length === 0 ? (
        <View style={styles.doctorsEmpty}>
          <Text style={styles.doctorsEmptyText}>
            {doctorsError
              ? "Unable to load healthcare providers right now. Please tap Refresh or try again later."
              : "No doctors currently scheduled. Please check back shortly."}
          </Text>
        </View>
      ) : (
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.doctorsScroll} contentContainerStyle={styles.doctorsScrollContent}>
          {doctors.map((doc) => (
            <View key={doc.id} style={styles.doctorCard}>
              <View style={styles.doctorAvailDot}>
                <View style={[styles.doctorAvailInner, { backgroundColor: doc.availableToday ? Colors.secondary : Colors.outline }]} />
              </View>
              <DoctorAvatar
                name={doc.name}
                avatar={doc.avatar}
                profilePhotoUrl={doc.profilePhotoUrl}
                size={52}
                active={doc.availableToday}
                style={{ alignSelf: "center", marginTop: 4 }}
              />
              <Text style={styles.doctorCardName} numberOfLines={1}>{doc.name}</Text>
              <Text style={styles.doctorCardSpecialty} numberOfLines={1}>{doc.specialty}</Text>
              {doc.rating > 0 ? (
                <View style={styles.ratingRow}>
                  <Star size={11} color={Colors.primary} fill={Colors.primary} />
                  <Text style={styles.ratingText}>{doc.rating.toFixed(1)}</Text>
                  <Text style={styles.reviewCount}>({doc.reviewsCount})</Text>
                </View>
              ) : (
                <View style={styles.ratingRow}>
                  <Star size={11} color={Colors.outline} />
                  <Text style={[styles.reviewCount, { color: Colors.primary, fontFamily: FontFamily.bodySemiBold }]}>New</Text>
                </View>
              )}
              <Text style={styles.hospitalName} numberOfLines={1}>{doc.hospital}</Text>
              <TouchableOpacity
                style={[styles.bookDoctorBtn, !doc.availableToday && styles.bookDoctorBtnDisabled]}
                disabled={!doc.availableToday}
                onPress={() => {
                  setBookingSuccess(false);
                  setBookingDoctor(doc);
                  setBookingSuccess(false);
                }}
              >
                <Text style={[styles.bookDoctorBtnText, !doc.availableToday && { color: Colors.outline }]}>
                  {doc.availableToday ? "Book Appointment" : "Unavailable"}
                </Text>
              </TouchableOpacity>
            </View>
          ))}
        </ScrollView>
      )}

      {/* Hydration Tracker */}
      <View style={styles.card}>
        <View style={styles.cardHeaderRow}>
          <Text style={styles.cardLabel}>HYDRATION TRACKER</Text>
          <Text style={styles.waterValue}>{waterAmount.toFixed(1)}L / 2.5L</Text>
        </View>
        <View style={styles.waterBar}>
          <View style={[styles.waterFill, { width: `${Math.min((waterAmount / 2.5) * 100, 100)}%` as any }]} />
        </View>
        <View style={styles.waterBtns}>
          <TouchableOpacity onPress={() => setWaterAmount(Math.max(0, waterAmount - 0.25))} style={styles.waterBtn}>
            <Minus size={16} color={Colors.onSurface} />
          </TouchableOpacity>
          <TouchableOpacity onPress={() => setWaterAmount(Math.min(3, waterAmount + 0.25))} style={[styles.waterBtn, { backgroundColor: Colors.primary }]}>
            <Plus size={16} color={Colors.onPrimary} />
            <Text style={[styles.waterBtnText, { color: Colors.onPrimary }]}>250ml</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* AI Scan Modal — fullScreen presentation without rounded corners */}
      <Modal visible={aiModalOpen} animationType="slide" presentationStyle="fullScreen" onRequestClose={() => setAiModalOpen(false)}>
        <AIScanScreen
          type={aiModalType}
          patientUhid={userUhid}
          onClose={() => {
            setAiModalOpen(false);
            refreshClinical();
          }}
          onRecordSaved={() => {
            refreshClinical();
          }}
        />
      </Modal>

      {/* Prescription Pad (Rx) OCR Scanner Modal */}
      <PrescriptionScanModal
        visible={rxScanOpen}
        onClose={() => setRxScanOpen(false)}
        patientUhid={userUhid}
        onMedicationsAdded={() => {
          refreshClinical();
        }}
      />

      {/* Appointment Booking Modal */}
      <Modal
        visible={!!bookingDoctor}
        transparent
        animationType="fade"
        onRequestClose={() => {
          setBookingDoctor(null);
          setBookingSuccess(false);
        }}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.bookingModal}>
            {bookingSuccess ? (
              <View style={styles.bookingSuccessView}>
                <View style={styles.bookingSuccessHeader}>
                  <View style={{ width: 36 }} />
                  <Text style={styles.bookingSuccessTitle}>Appointment Confirmed</Text>
                  <TouchableOpacity
                    onPress={() => {
                      setBookingDoctor(null);
                      setBookingSuccess(false);
                    }}
                    style={styles.bookingCloseBtn}
                    accessibilityLabel="Close"
                  >
                    <X size={20} color={Colors.outline} />
                  </TouchableOpacity>
                </View>
                <CheckCircle2 size={44} color={Colors.secondary} />
                <Text style={styles.bookingSuccessBody}>
                  Your appointment with {bookingDoctor?.name} has been booked for {selectedSlot} at MedSync Clinic.
                </Text>
                <TouchableOpacity
                  style={styles.confirmBookingBtn}
                  onPress={() => {
                    setBookingDoctor(null);
                    setBookingSuccess(false);
                  }}
                >
                  <Text style={styles.confirmBookingBtnText}>Done</Text>
                </TouchableOpacity>
              </View>
            ) : (
              <>
                <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center" }}>
                  <Text style={styles.bookingModalTitle}>Book Consultation</Text>
                  <TouchableOpacity onPress={() => setBookingDoctor(null)}>
                    <X size={20} color={Colors.outline} />
                  </TouchableOpacity>
                </View>
                <Text style={styles.bookingDocName}>{bookingDoctor?.name}</Text>
                <Text style={styles.bookingDocSpecialty}>{bookingDoctor?.specialty}</Text>
                <Text style={styles.bookingHospital}>{bookingDoctor?.hospital}</Text>

                <Text style={[styles.inputLabel, { marginTop: 6 }]}>Select Time Slot</Text>
                <View style={styles.slotOptionRow}>
                  {BOOKING_TIME_SLOTS.map((s) => (
                    <TouchableOpacity
                      key={s}
                      onPress={() => setSelectedSlot(s)}
                      style={[styles.slotChip, selectedSlot === s && styles.slotChipActive]}
                    >
                      <Text style={[styles.slotChipText, selectedSlot === s && styles.slotChipTextActive]}>{s}</Text>
                    </TouchableOpacity>
                  ))}
                </View>

                <View style={styles.bookingBtnRow}>
                  <TouchableOpacity
                    style={styles.cancelBookingBtn}
                    onPress={() => setBookingDoctor(null)}
                  >
                    <Text style={styles.cancelBookingBtnText}>Cancel</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={styles.confirmBookingBtn}
                    onPress={handleConfirmBooking}
                    disabled={bookingSubmitting}
                  >
                    {bookingSubmitting ? (
                      <ActivityIndicator color={Colors.onPrimary} size="small" />
                    ) : (
                      <Text style={styles.confirmBookingBtnText}>Confirm Slot</Text>
                    )}
                  </TouchableOpacity>
                </View>
              </>
            )}
          </View>
        </View>
      </Modal>

      {/* Clinic Directions Modal */}
      <Modal visible={directionsModalOpen} transparent animationType="slide" onRequestClose={() => setDirectionsModalOpen(false)}>
        <View style={styles.modalOverlay}>
          <View style={styles.bookingModal}>
            <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center" }}>
              <View style={{ flexDirection: "row", alignItems: "center", gap: 6 }}>
                <MapPin size={20} color={Colors.primary} />
                <Text style={styles.bookingModalTitle}>Clinic Location</Text>
              </View>
              <TouchableOpacity onPress={() => setDirectionsModalOpen(false)}>
                <X size={20} color={Colors.outline} />
              </TouchableOpacity>
            </View>

            <View style={styles.mapVisualCard}>
              <Text style={styles.mapVisualHeader}>MEDSYNC SPECIALTY CLINIC</Text>
              <Text style={styles.mapAddress}>452 Medical Parkway, Suite 300</Text>
              <Text style={styles.mapCity}>San Francisco, CA 94107</Text>
              <View style={styles.mapDivider} />
              <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center" }}>
                <Text style={styles.mapInfo}>Floor 3 · Room 312</Text>
                <Text style={styles.mapHours}>Open 8:00 AM – 6:00 PM</Text>
              </View>
            </View>

            <View style={{ flexDirection: "row", gap: Spacing.xs }}>
              <TouchableOpacity style={styles.callClinicBtn}>
                <Phone size={16} color={Colors.primary} />
                <Text style={styles.callClinicText}>Call Clinic</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.openMapsBtn} onPress={() => setDirectionsModalOpen(false)}>
                <Navigation size={16} color={Colors.onPrimary} />
                <Text style={styles.openMapsText}>Navigate</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* Real-Time WebSocket Consultation Chat Modal */}
      <ConsultationChatModal
        visible={chatModalOpen}
        onClose={() => {
          setChatModalOpen(false);
          refreshClinical();
        }}
        room={DEFAULT_CHAT_ROOM}
        patientUhid={userUhid}
        currentUser={{
          name: userName,
          role: "patient",
        }}
        otherParticipant={{
          name: nextAppointment?.doctorName ?? "Dr. Taylor Reynolds",
          role: "doctor",
          specialty: nextAppointment?.specialty ?? "Cardiology & Electrophysiology",
          avatar: nextAppointment?.initials ?? "TR",
        }}
      />

      {/* Themed Appointment Cancellation Confirmation Modal */}
      <ThemedAlertModal
        visible={!!cancelConfirmAppt}
        type="warning"
        title="Cancel Appointment?"
        message={`Are you sure you want to cancel your consultation with ${
          cancelConfirmAppt?.doctorName || "your doctor"
        }${
          cancelConfirmAppt?.date
            ? ` scheduled for ${cancelConfirmAppt.date} (${cancelConfirmAppt.time || "scheduled slot"})`
            : ""
        }?`}
        onClose={() => setCancelConfirmAppt(null)}
        buttons={[
          {
            text: "Keep Appointment",
            style: "cancel",
            onPress: () => setCancelConfirmAppt(null),
          },
          {
            text: "Yes, Cancel",
            style: "destructive",
            onPress: async () => {
              const target = cancelConfirmAppt;
              setCancelConfirmAppt(null);
              setCancelling(true);
              try {
                await cancelAppointment(target?.id);
                setHomeAlert({
                  visible: true,
                  type: "success",
                  title: "Appointment Cancelled",
                  message:
                    "Your consultation has been removed from your active schedule. You can book a new appointment at any time.",
                });
              } catch {
                setHomeAlert({
                  visible: true,
                  type: "error",
                  title: "Cancellation Error",
                  message:
                    "Could not complete cancellation with the server. Please check your network.",
                });
              } finally {
                setCancelling(false);
              }
            },
          },
        ]}
      />

      {/* Themed Home Alert Modal */}
      <ThemedAlertModal
        visible={homeAlert.visible}
        type={homeAlert.type || "info"}
        title={homeAlert.title}
        message={homeAlert.message}
        onClose={() => setHomeAlert((prev) => ({ ...prev, visible: false }))}
      />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.surface },
  content: { padding: Spacing.margin, gap: Spacing.md, paddingBottom: 150 },
  greetingRow: { flexDirection: "row", alignItems: "center", gap: Spacing.sm },
  avatarWrap: { position: "relative" },
  avatar: { width: 48, height: 48, borderRadius: 24 },
  statusDot: { position: "absolute", bottom: 0, right: 0, width: 14, height: 14, borderRadius: 7, borderWidth: 2, borderColor: Colors.surface },
  greeting: { fontSize: FontSize.headlineSm, color: Colors.onSurface, fontFamily: FontFamily.headlineSemiBold },
  uhid: { fontSize: FontSize.bodySm, color: Colors.onSurfaceVariant, fontFamily: FontFamily.bodyRegular },
  uhidCode: { fontFamily: FontFamily.dataMono },
  chatHeaderBtn: { width: 40, height: 40, borderRadius: 20, backgroundColor: Colors.primaryFixed + "33", justifyContent: "center", alignItems: "center", position: "relative" },
  chatBadge: { position: "absolute", top: -2, right: -2, minWidth: 18, height: 18, borderRadius: 9, backgroundColor: Colors.error, justifyContent: "center", alignItems: "center", paddingHorizontal: 4 },
  chatBadgeText: { fontSize: 10, color: Colors.onError, fontFamily: FontFamily.dataMonoBold },
  doctorMsgBanner: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.xs,
    backgroundColor: Colors.primaryFixed + "33",
    borderRadius: Radius.lg,
    padding: Spacing.sm,
    borderWidth: 1,
    borderColor: Colors.primary + "33",
  },
  doctorMsgTitle: { fontSize: FontSize.labelMd, color: Colors.onSurface, fontFamily: FontFamily.bodySemiBold },
  doctorMsgPreview: { fontSize: FontSize.bodySm, color: Colors.onSurfaceVariant, fontFamily: FontFamily.bodyRegular, marginTop: 2 },
  alertBanner: { flexDirection: "row", alignItems: "flex-start", gap: Spacing.xs, backgroundColor: Colors.errorContainer, borderRadius: Radius.lg, padding: Spacing.xs, borderWidth: 1, borderColor: Colors.error + "1A" },
  alertTitle: { fontSize: FontSize.labelLg, color: Colors.onErrorContainer, fontFamily: FontFamily.bodySemiBold },
  alertBody: { fontSize: FontSize.bodySm, color: Colors.onErrorContainer, fontFamily: FontFamily.bodyRegular, marginTop: 2, opacity: 0.9 },
  card: { backgroundColor: Colors.surfaceContainerLowest, borderRadius: Radius.xl, padding: Spacing.md, paddingBottom: 20, shadowColor: "#000", shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.05, shadowRadius: 8, elevation: 2, gap: Spacing.sm, marginBottom: 6 },
  cardHeaderRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
  cardLabel: { fontSize: FontSize.dataMono, color: Colors.outline, fontFamily: FontFamily.dataMonoBold, textTransform: "uppercase", letterSpacing: 1 },
  confirmedBadge: { flexDirection: "row", alignItems: "center", gap: 6, backgroundColor: Colors.secondaryContainer + "55", paddingHorizontal: 8, paddingVertical: 3, borderRadius: Radius.full },
  confirmedDot: { width: 6, height: 6, borderRadius: 3, backgroundColor: Colors.secondary },
  confirmedText: { fontSize: FontSize.dataMono, color: Colors.secondary, fontFamily: FontFamily.dataMonoBold },
  apptRow: { flexDirection: "row", alignItems: "center", gap: Spacing.xs },
  doctorAvatar: { width: 44, height: 44, borderRadius: 22 },
  doctorName: { fontSize: FontSize.labelLg, color: Colors.onSurface, fontFamily: FontFamily.bodySemiBold },
  doctorSpecialty: { fontSize: FontSize.bodySm, color: Colors.onSurfaceVariant, fontFamily: FontFamily.bodyRegular },
  apptDate: { fontSize: 10, color: Colors.outline, fontFamily: FontFamily.dataMono },
  apptTime: { fontSize: FontSize.labelMd, color: Colors.onSurface, fontFamily: FontFamily.bodySemiBold },
  apptType: { fontSize: FontSize.bodySm, color: Colors.onSurfaceVariant, fontFamily: FontFamily.bodyRegular },
  apptActionRow: { flexDirection: "row", gap: Spacing.xs, marginTop: 8, marginBottom: 2 },
  directionsBtn: { flex: 1, height: 38, backgroundColor: Colors.primaryFixed + "33", borderRadius: Radius.md, flexDirection: "row", justifyContent: "center", alignItems: "center", gap: 6 },
  directionsBtnText: { fontSize: FontSize.labelMd, color: Colors.primary, fontFamily: FontFamily.bodySemiBold },
  chatBtn: { flex: 1, height: 38, backgroundColor: Colors.secondaryContainer + "33", borderRadius: Radius.md, flexDirection: "row", justifyContent: "center", alignItems: "center", gap: 6 },
  chatBtnText: { fontSize: FontSize.labelMd, color: Colors.secondary, fontFamily: FontFamily.bodySemiBold },
  cancelApptBtn: {
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
  cancelApptBtnText: {
    fontSize: FontSize.labelMd,
    color: "#DC2626",
    fontFamily: FontFamily.bodySemiBold,
  },
  quickBookBtn: {
    height: 40,
    borderRadius: Radius.md,
    backgroundColor: Colors.primaryFixed + "33",
    borderWidth: 1,
    borderColor: Colors.primary + "44",
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    gap: 8,
    marginTop: 4,
  },
  quickBookBtnText: {
    fontSize: FontSize.labelMd,
    color: Colors.primary,
    fontFamily: FontFamily.bodySemiBold,
  },
  sectionTitle: { fontSize: FontSize.labelLg, color: Colors.onSurface, fontFamily: FontFamily.headlineSemiBold },
  sectionSubtitle: { fontSize: 11, color: Colors.onSurfaceVariant, fontFamily: FontFamily.bodyRegular },
  sectionHeaderRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginTop: Spacing.sm, marginBottom: 4 },
  scanRxHeaderBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: Radius.full,
    backgroundColor: Colors.primaryFixed + "33",
    borderWidth: 1,
    borderColor: Colors.primary + "44",
  },
  scanRxHeaderBtnText: {
    fontSize: 11,
    color: Colors.primary,
    fontFamily: FontFamily.bodySemiBold,
  },
  medProgressBar: { height: 6, backgroundColor: Colors.surfaceContainerHigh, borderRadius: 3, overflow: "hidden", marginVertical: 4 },
  medProgressFill: { height: "100%", backgroundColor: Colors.secondary, borderRadius: 3 },
  medCard: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 12,
    backgroundColor: Colors.surfaceContainerLowest,
    borderRadius: Radius.lg,
    padding: 12,
    borderWidth: 1,
    borderColor: Colors.outlineVariant,
    marginBottom: 6,
    overflow: "hidden",
  },
  medCardTaken: {
    opacity: 0.65,
    backgroundColor: Colors.surfaceContainerLow,
  },
  checkCircle: {
    width: 24,
    height: 24,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: Colors.outlineVariant,
    justifyContent: "center",
    alignItems: "center",
    marginTop: 2,
    flexShrink: 0,
  },
  checkCircleActive: {
    backgroundColor: Colors.secondary,
    borderColor: Colors.secondary,
  },
  medHeaderRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    justifyContent: "space-between",
    gap: 8,
    width: "100%",
  },
  medName: {
    flex: 1,
    minWidth: 0,
    fontSize: FontSize.labelMd,
    color: Colors.onSurface,
    fontFamily: FontFamily.bodySemiBold,
    flexShrink: 1,
  },
  medNameCrossed: {
    textDecorationLine: "line-through",
    color: Colors.onSurfaceVariant,
  },
  medDoseBadge: {
    flexShrink: 0,
    backgroundColor: Colors.primaryFixed + "33",
    paddingHorizontal: 7,
    paddingVertical: 2,
    borderRadius: Radius.full,
    alignSelf: "flex-start",
  },
  medDoseBadgeText: {
    fontSize: 11,
    color: Colors.primary,
    fontFamily: FontFamily.dataMonoBold,
  },
  medInstructions: {
    fontSize: 11,
    color: Colors.onSurfaceVariant,
    fontFamily: FontFamily.bodyRegular,
    lineHeight: 16,
  },
  medMetaRow: {
    flexDirection: "row",
    alignItems: "center",
    flexWrap: "wrap",
    gap: 6,
    marginTop: 3,
  },
  medTimeBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    backgroundColor: Colors.surfaceContainerLow,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: Radius.full,
    maxWidth: "100%",
  },
  medTimeBadgeText: {
    fontSize: 10,
    color: Colors.primary,
    fontFamily: FontFamily.dataMonoBold,
    flexShrink: 1,
  },
  medDoctorText: {
    fontSize: 10,
    color: Colors.outline,
    fontFamily: FontFamily.bodyMedium,
    flexShrink: 1,
  },
  aiRow: { flexDirection: "row", gap: Spacing.xs, marginBottom: 6 },
  aiBtn: {
    flex: 1,
    borderRadius: Radius.xl,
    padding: Spacing.sm,
    paddingBottom: 16,
    gap: 6,
    overflow: "hidden",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 10,
    elevation: 3,
  },
  aiBtnTitle: { fontSize: FontSize.labelLg, color: Colors.onPrimary, fontFamily: FontFamily.headlineSemiBold },
  aiBtnSubtitle: { fontSize: FontSize.bodySm, color: "rgba(255,255,255,0.8)", fontFamily: FontFamily.bodyRegular },
  refreshBadge: { flexDirection: "row", alignItems: "center", gap: 4, paddingHorizontal: 8, paddingVertical: 4, borderRadius: Radius.full, backgroundColor: Colors.surfaceContainerHigh },
  refreshText: { fontSize: 11, color: Colors.primary, fontFamily: FontFamily.bodyMedium },
  doctorsLoading: { flexDirection: "row", alignItems: "center", gap: 8, paddingVertical: 12 },
  doctorsLoadingText: { fontSize: FontSize.bodyMd, color: Colors.onSurfaceVariant, fontFamily: FontFamily.bodyRegular },
  doctorsEmpty: { backgroundColor: Colors.surfaceContainerLow, borderRadius: Radius.lg, padding: Spacing.sm },
  doctorsEmptyText: { fontSize: FontSize.bodySm, color: Colors.onSurfaceVariant, fontFamily: FontFamily.bodyRegular, textAlign: "center" },
  doctorsScroll: { marginHorizontal: -Spacing.margin, marginBottom: 6 },
  doctorsScrollContent: { paddingHorizontal: Spacing.margin, gap: Spacing.xs, paddingBottom: 6 },
  doctorCard: { width: 154, backgroundColor: Colors.surfaceContainerLowest, borderRadius: Radius.xl, padding: Spacing.sm, paddingBottom: 14, gap: 4, shadowColor: "#000", shadowOffset: { width: 0, height: 3 }, shadowOpacity: 0.06, shadowRadius: 10, elevation: 3, position: "relative" },
  doctorAvailDot: { position: "absolute", top: 10, right: 10, width: 12, height: 12, borderRadius: 6, backgroundColor: Colors.surface, justifyContent: "center", alignItems: "center" },
  doctorAvailInner: { width: 8, height: 8, borderRadius: 4 },
  cardDoctorAvatar: { width: 52, height: 52, borderRadius: 26, justifyContent: "center", alignItems: "center", alignSelf: "center", marginTop: 4 },
  doctorAvatarText: { fontSize: FontSize.headlineSm, fontFamily: FontFamily.headlineBold },
  doctorCardName: { fontSize: FontSize.labelMd, color: Colors.onSurface, fontFamily: FontFamily.bodySemiBold, textAlign: "center" },
  doctorCardSpecialty: { fontSize: 10, color: Colors.onSurfaceVariant, fontFamily: FontFamily.bodyRegular, textAlign: "center" },
  ratingRow: { flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 4 },
  ratingText: { fontSize: FontSize.dataMono, color: Colors.onSurface, fontFamily: FontFamily.dataMonoBold },
  reviewCount: { fontSize: 10, color: Colors.outline, fontFamily: FontFamily.dataMono },
  hospitalName: { fontSize: 10, color: Colors.primary, fontFamily: FontFamily.bodyMedium, textAlign: "center" },
  bookDoctorBtn: { height: 32, borderRadius: Radius.md, backgroundColor: Colors.primary, justifyContent: "center", alignItems: "center", marginTop: 4 },
  bookDoctorBtnDisabled: { backgroundColor: Colors.surfaceContainerHigh },
  bookDoctorBtnText: { fontSize: 11, color: Colors.onPrimary, fontFamily: FontFamily.bodySemiBold },
  waterBar: { height: 8, backgroundColor: Colors.surfaceContainerHigh, borderRadius: 4, overflow: "hidden", marginVertical: 4 },
  waterFill: { height: "100%", backgroundColor: Colors.primary, borderRadius: 4 },
  waterBtns: { flexDirection: "row", gap: Spacing.xs, marginTop: 8, marginBottom: 2 },
  waterBtn: { flex: 1, height: 38, borderRadius: Radius.md, backgroundColor: Colors.surfaceContainer, flexDirection: "row", justifyContent: "center", alignItems: "center", gap: 4 },
  waterBtnText: { fontSize: FontSize.labelMd, color: Colors.onSurface, fontFamily: FontFamily.bodySemiBold },
  waterValue: { fontSize: FontSize.labelMd, color: Colors.primary, fontFamily: FontFamily.dataMonoBold },
  // Modals
  modalOverlay: { flex: 1, backgroundColor: "rgba(0,0,0,0.5)", justifyContent: "center", alignItems: "center", padding: Spacing.md },
  bookingModal: { width: "100%", maxWidth: 360, backgroundColor: Colors.surfaceContainerLowest, borderRadius: Radius.xxl, padding: Spacing.md, gap: Spacing.xs },
  bookingModalTitle: { fontSize: FontSize.headlineSm, color: Colors.onSurface, fontFamily: FontFamily.headlineSemiBold },
  bookingDocName: { fontSize: FontSize.labelLg, color: Colors.primary, fontFamily: FontFamily.bodySemiBold },
  bookingDocSpecialty: { fontSize: FontSize.bodySm, color: Colors.onSurfaceVariant, fontFamily: FontFamily.bodyRegular },
  bookingHospital: { fontSize: FontSize.bodySm, color: Colors.outline, fontFamily: FontFamily.bodyRegular },
  inputLabel: { fontSize: 11, color: Colors.onSurfaceVariant, fontFamily: FontFamily.bodyMedium },
  slotOptionRow: { gap: 6, marginVertical: 4 },
  slotChip: { padding: 10, borderRadius: Radius.md, borderWidth: 1, borderColor: Colors.outlineVariant, backgroundColor: Colors.surfaceContainerLow },
  slotChipActive: { borderColor: Colors.primary, backgroundColor: Colors.primaryFixed + "33" },
  slotChipText: { fontSize: FontSize.bodySm, color: Colors.onSurface, fontFamily: FontFamily.bodyRegular },
  slotChipTextActive: { color: Colors.primary, fontFamily: FontFamily.bodySemiBold },
  bookingBtnRow: { flexDirection: "row", gap: Spacing.xs, marginTop: Spacing.xs },
  cancelBookingBtn: { flex: 1, height: 42, borderRadius: Radius.lg, borderWidth: 1, borderColor: Colors.outlineVariant, justifyContent: "center", alignItems: "center" },
  cancelBookingBtnText: { fontSize: FontSize.labelMd, color: Colors.onSurfaceVariant, fontFamily: FontFamily.bodyMedium },
  confirmBookingBtn: { flex: 1, height: 42, borderRadius: Radius.lg, backgroundColor: Colors.primary, justifyContent: "center", alignItems: "center" },
  confirmBookingBtnText: { fontSize: FontSize.labelMd, color: Colors.onPrimary, fontFamily: FontFamily.bodySemiBold },
  bookingSuccessView: { alignItems: "center", gap: Spacing.xs, paddingVertical: Spacing.sm, width: "100%" },
  bookingSuccessHeader: {
    width: "100%",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 4,
  },
  bookingCloseBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: Colors.surfaceContainerHigh,
    justifyContent: "center",
    alignItems: "center",
  },
  bookingSuccessTitle: {
    flex: 1,
    fontSize: FontSize.headlineSm,
    color: Colors.onSurface,
    fontFamily: FontFamily.headlineSemiBold,
    textAlign: "center",
  },
  bookingSuccessBody: { fontSize: FontSize.bodySm, color: Colors.onSurfaceVariant, fontFamily: FontFamily.bodyRegular, textAlign: "center", lineHeight: 18 },
  // Map Directions
  mapVisualCard: { backgroundColor: Colors.surfaceContainerLow, borderRadius: Radius.lg, padding: Spacing.sm, gap: 4, marginVertical: Spacing.xs, borderWidth: 1, borderColor: Colors.outlineVariant },
  mapVisualHeader: { fontSize: 9, color: Colors.outline, fontFamily: FontFamily.dataMonoBold, letterSpacing: 0.5 },
  mapAddress: { fontSize: FontSize.bodyMd, color: Colors.onSurface, fontFamily: FontFamily.bodySemiBold },
  mapCity: { fontSize: FontSize.bodySm, color: Colors.onSurfaceVariant, fontFamily: FontFamily.bodyRegular },
  mapDivider: { height: 1, backgroundColor: Colors.outlineVariant, marginVertical: 4 },
  mapInfo: { fontSize: 11, color: Colors.primary, fontFamily: FontFamily.bodyMedium },
  mapHours: { fontSize: 11, color: Colors.outline, fontFamily: FontFamily.dataMono },
  callClinicBtn: { flex: 1, height: 42, borderRadius: Radius.lg, borderWidth: 1, borderColor: Colors.primary, flexDirection: "row", justifyContent: "center", alignItems: "center", gap: 6 },
  callClinicText: { fontSize: FontSize.labelMd, color: Colors.primary, fontFamily: FontFamily.bodySemiBold },
  openMapsBtn: { flex: 1, height: 42, borderRadius: Radius.lg, backgroundColor: Colors.primary, flexDirection: "row", justifyContent: "center", alignItems: "center", gap: 6 },
  openMapsText: { fontSize: FontSize.labelMd, color: Colors.onPrimary, fontFamily: FontFamily.bodySemiBold },
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
  chatBubblePatient: { alignSelf: "flex-end", backgroundColor: Colors.primary },
  chatBubbleDoctor: { alignSelf: "flex-start", backgroundColor: Colors.surfaceContainerLowest, borderWidth: 1, borderColor: Colors.outlineVariant },
  chatMsgText: { fontSize: FontSize.bodyMd, lineHeight: 20 },
  chatMsgTextPatient: { color: Colors.onPrimary, fontFamily: FontFamily.bodyRegular },
  chatMsgTextDoctor: { color: Colors.onSurface, fontFamily: FontFamily.bodyRegular },
  chatTimeText: { fontSize: 9, fontFamily: FontFamily.dataMono, alignSelf: "flex-end" },
  chatInputBar: { flexDirection: "row", gap: Spacing.xs, padding: Spacing.sm, borderTopWidth: 1, borderTopColor: Colors.outlineVariant, backgroundColor: Colors.surfaceContainerLowest },
  chatTextInput: { flex: 1, height: 44, backgroundColor: Colors.surfaceContainerLow, borderRadius: Radius.full, paddingHorizontal: 16, fontSize: FontSize.bodyMd, color: Colors.onSurface, fontFamily: FontFamily.bodyRegular },
  chatSendBtn: { backgroundColor: Colors.primary, paddingHorizontal: 18, borderRadius: Radius.full, justifyContent: "center", alignItems: "center" },
  chatSendBtnText: { fontSize: FontSize.labelMd, color: Colors.onPrimary, fontFamily: FontFamily.bodySemiBold },
});
