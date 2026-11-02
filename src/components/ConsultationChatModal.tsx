import React, { useState, useEffect, useRef } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
  Modal,
  KeyboardAvoidingView,
  Platform,
  Animated,
} from "react-native";
import {
  Send,
  X,
  Lock,
  Clock,
  CheckCheck,
  Sparkles,
  Paperclip,
  Stethoscope,
  User,
  Wifi,
  Pill,
  FlaskConical,
  Microscope,
  Activity,
  CheckCircle2,
} from "lucide-react-native";
import { Colors } from "../theme/colors";
import { Spacing, Radius, FontSize, FontFamily } from "../theme/typography";
import { Config } from "../config";
import AIScanScreen from "../screens/AIScanScreen";
import ThemedAlertModal, { ThemedAlertButton } from "./ThemedAlertModal";

export interface ChatMessage {
  id: string;
  room: string;
  senderName: string;
  senderRole: "patient" | "doctor" | "system";
  text: string;
  timestamp: string;
}

interface ConsultationChatModalProps {
  visible: boolean;
  onClose: () => void;
  room?: string;
  patientUhid?: string;
  doctorId?: string;
  doctorName?: string;
  onPrescriptionAdded?: () => void;
  currentUser: {
    name: string;
    role: "patient" | "doctor";
  };
  otherParticipant: {
    name: string;
    role: "patient" | "doctor";
    specialty?: string;
    avatar?: string;
  };
}

export default function ConsultationChatModal({
  visible,
  onClose,
  room = "consultation-general",
  patientUhid,
  doctorId,
  doctorName,
  onPrescriptionAdded,
  currentUser,
  otherParticipant,
}: ConsultationChatModalProps) {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [inputText, setInputText] = useState("");
  const [isConnected, setIsConnected] = useState(false);
  const [otherOnline, setOtherOnline] = useState(true);
  const [durationSeconds, setDurationSeconds] = useState(145); // Active timer
  const [chatReportScannerVisible, setChatReportScannerVisible] = useState(false);
  const [attachmentModalVisible, setAttachmentModalVisible] = useState(false);
  const [endConsultationModalVisible, setEndConsultationModalVisible] = useState(false);
  const [chatAlertConfig, setChatAlertConfig] = useState<{
    visible: boolean;
    type?: "info" | "success" | "warning" | "error" | "ai" | "clinical";
    title: string;
    message?: string;
    buttons?: ThemedAlertButton[];
  }>({
    visible: false,
    title: "",
  });
  const wsRef = useRef<WebSocket | null>(null);
  const scrollViewRef = useRef<ScrollView>(null);
  const pulseAnim = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    if (!visible || !isConnected) return;
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, { toValue: 1.35, duration: 800, useNativeDriver: true }),
        Animated.timing(pulseAnim, { toValue: 1, duration: 800, useNativeDriver: true }),
      ])
    );
    loop.start();
    return () => loop.stop();
  }, [visible, isConnected, pulseAnim]);

  // Quick suggestions based on user role
  const suggestions =
    currentUser.role === "doctor"
      ? [
          "How are your symptoms since starting Lisinopril?",
          "Your latest ECG rhythm shows normal sinus rhythm.",
          "Let's order a follow-up lipid panel in 4 weeks.",
          "Please log morning and evening blood pressure.",
        ]
      : [
          "My morning blood pressure was 122/80.",
          "I'm feeling well with no side effects.",
          "Can I confirm I took my morning dose?",
          "Should I continue taking this with breakfast?",
        ];

  // Consultation Session Timer
  useEffect(() => {
    if (!visible) return;
    const timer = setInterval(() => {
      setDurationSeconds((prev) => prev + 1);
    }, 1000);
    return () => clearInterval(timer);
  }, [visible]);

  const formatTimer = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
  };

  // ─── WebSocket Connection & REST Fallback ────────────────────────────────────
  useEffect(() => {
    if (!visible) {
      if (wsRef.current) {
        wsRef.current.close();
        wsRef.current = null;
      }
      setIsConnected(false);
      return;
    }

    // 1. Initial REST fetch for instant history load
    fetch(Config.apiChatRoom(room))
      .then((res) => res.json())
      .then((data) => {
        if (data.messages && Array.isArray(data.messages) && data.messages.length > 0) {
          setMessages(data.messages);
        }
      })
      .catch(() => {});

    // 2. Establish WebSocket connection
    try {
      const ws = new WebSocket(Config.wsChatUrl);
      wsRef.current = ws;

      ws.onopen = () => {
        setIsConnected(true);
        // Send join packet
        ws.send(
          JSON.stringify({
            type: "join",
            room,
            senderName: currentUser.name,
            senderRole: currentUser.role,
          })
        );
      };

      ws.onmessage = (event) => {
        try {
          const payload = JSON.parse(event.data);

          if (payload.type === "history" && Array.isArray(payload.messages)) {
            setMessages(payload.messages);
          } else if (payload.type === "message" && payload.message) {
            setMessages((prev) => {
              // Avoid duplicate if already added
              if (prev.some((m) => m.id === payload.message.id)) return prev;
              return [...prev, payload.message];
            });
          } else if (payload.type === "user_status") {
            if (payload.senderRole !== currentUser.role) {
              setOtherOnline(payload.status === "online");
            }
          }
        } catch {
          // ignore
        }
      };

      ws.onerror = () => {
        setIsConnected(false);
      };

      ws.onclose = () => {
        setIsConnected(false);
      };
    } catch {
      setIsConnected(false);
    }

    return () => {
      if (wsRef.current) {
        wsRef.current.close();
        wsRef.current = null;
      }
    };
  }, [visible, room, currentUser.name, currentUser.role]);

  // Auto-scroll on new message
  useEffect(() => {
    if (visible) {
      setTimeout(() => {
        scrollViewRef.current?.scrollToEnd({ animated: true });
      }, 100);
    }
  }, [messages, visible]);

  // ─── Send Message ───────────────────────────────────────────────────────────
  const handleSend = (textToSend?: string) => {
    const text = (textToSend || inputText).trim();
    if (!text) return;

    if (!textToSend) setInputText("");

    const wsOpen = wsRef.current?.readyState === WebSocket.OPEN;

    if (wsOpen) {
      wsRef.current!.send(
        JSON.stringify({
          type: "message",
          room,
          senderName: currentUser.name,
          senderRole: currentUser.role,
          text,
        })
      );
    } else {
      const optimisticMsg: ChatMessage = {
        id: `msg-opt-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
        room,
        senderName: currentUser.name,
        senderRole: currentUser.role,
        text,
        timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
      };
      setMessages((prev) => [...prev, optimisticMsg]);
      fetch(Config.apiChatRoom(room), {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          senderName: currentUser.name,
          senderRole: currentUser.role,
          text,
        }),
      }).catch(() => {});
    }
  };

  const prescribeMedication = async (payload: {
    name: string;
    dosage: string;
    instructions: string;
    purpose: string;
    timeSlot?: string;
  }) => {
    const uhid = patientUhid;
    const docId = doctorId;
    if (!uhid || !docId) {
      setChatAlertConfig({
        visible: true,
        type: "warning",
        title: "Cannot Prescribe",
        message: "Patient chart link is missing for this chat session.",
        buttons: [{ text: "Understood", style: "primary", onPress: () => setChatAlertConfig(prev => ({ ...prev, visible: false })) }],
      });
      return;
    }
    try {
      const res = await fetch(Config.apiPatientMedications(uhid), {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          doctorId: docId,
          doctorName: doctorName || currentUser.name,
          ...payload,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setChatAlertConfig({
          visible: true,
          type: "error",
          title: "Prescription Failed",
          message: data.error || "Could not add to care regimen.",
          buttons: [{ text: "Dismiss", style: "primary", onPress: () => setChatAlertConfig(prev => ({ ...prev, visible: false })) }],
        });
        return;
      }
      onPrescriptionAdded?.();
      handleSend(
        `Prescription Issued: ${payload.name} ${payload.dosage} — ${payload.instructions}`
      );
      setChatAlertConfig({
        visible: true,
        type: "success",
        title: "Prescription Recorded",
        message: `${payload.name} ${payload.dosage} added to patient's active care regimen.`,
        buttons: [{ text: "Done", style: "primary", onPress: () => setChatAlertConfig(prev => ({ ...prev, visible: false })) }],
      });
    } catch {
      setChatAlertConfig({
        visible: true,
        type: "error",
        title: "Connection Error",
        message: "Unable to record prescription at this time. Please check your network connection and try again.",
        buttons: [{ text: "OK", style: "primary", onPress: () => setChatAlertConfig(prev => ({ ...prev, visible: false })) }],
      });
    }
  };

  const handleAttachClinicalRx = () => {
    setAttachmentModalVisible(true);
  };

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="fullScreen"
      onRequestClose={onClose}
    >
      <KeyboardAvoidingView
        style={styles.container}
        behavior={Platform.OS === "ios" ? "padding" : undefined}
      >
        {/* ─── Header ────────────────────────────────────────────────────── */}
        <View style={styles.header}>
          <View style={styles.headerLeft}>
            <View style={styles.avatarCircle}>
              <Text style={styles.avatarText}>
                {otherParticipant.avatar ||
                  otherParticipant.name
                    .replace("Dr. ", "")
                    .split(" ")
                    .map((n) => n[0])
                    .join("")
                    .slice(0, 2)
                    .toUpperCase()}
              </Text>
              {otherOnline && isConnected ? (
                <Animated.View
                  style={[
                    styles.onlineDotPulse,
                    {
                      transform: [{ scale: pulseAnim }],
                      backgroundColor: Colors.secondary + "44",
                    },
                  ]}
                />
              ) : null}
              <View
                style={[
                  styles.onlineDot,
                  { backgroundColor: otherOnline && isConnected ? Colors.secondary : Colors.outline },
                ]}
              />
            </View>

            <View style={{ flex: 1 }}>
              <View style={{ flexDirection: "row", alignItems: "center", gap: 6 }}>
                <Text style={styles.headerName} numberOfLines={1}>
                  {otherParticipant.name}
                </Text>
                {otherParticipant.role === "doctor" && (
                  <View style={styles.roleBadge}>
                    <Stethoscope size={10} color={Colors.primary} />
                    <Text style={styles.roleBadgeText}>MD</Text>
                  </View>
                )}
              </View>
              <Text style={styles.headerSub} numberOfLines={2}>
                {otherParticipant.specialty || "Active Consultation"} ·{" "}
                {otherOnline ? "In Room" : "Connecting..."}
              </Text>
            </View>
          </View>

          {/* Session Timer & Close */}
          <View style={styles.headerRight}>
            <View style={styles.timerBadge}>
              <Clock size={12} color={Colors.secondary} />
              <Text style={styles.timerText}>{formatTimer(durationSeconds)}</Text>
            </View>

            <TouchableOpacity
              onPress={() => setEndConsultationModalVisible(true)}
              style={styles.closeBtn}
            >
              <X size={18} color={Colors.onSurface} />
            </TouchableOpacity>
          </View>
        </View>

        {/* ─── Encryption Banner ─────────────────────────────────────────── */}
        <View style={styles.encryptionBanner}>
          <Lock size={12} color={Colors.primary} />
          <Text style={styles.encryptionText}>
            Encrypted live chat · Room: {room}
          </Text>
          <View
            style={[
              styles.liveBadge,
              { backgroundColor: isConnected ? Colors.secondaryContainer + "88" : Colors.errorContainer },
            ]}
          >
            <Wifi size={10} color={isConnected ? Colors.secondary : Colors.error} />
            <Text
              style={[
                styles.liveBadgeText,
                { color: isConnected ? Colors.secondary : Colors.onErrorContainer },
              ]}
            >
              {isConnected ? "Live" : "Reconnecting…"}
            </Text>
          </View>
        </View>

        {/* ─── Chat Message Stream ───────────────────────────────────────── */}
        <ScrollView
          ref={scrollViewRef}
          style={styles.messageList}
          contentContainerStyle={styles.messageListContent}
          showsVerticalScrollIndicator={false}
        >
          {messages.map((msg) => {
            const isMe = msg.senderRole === currentUser.role;
            const isSystem = msg.senderRole === "system";

            if (isSystem) {
              return (
                <View key={msg.id} style={styles.systemMessageRow}>
                  <View style={styles.systemBubble}>
                    <Sparkles size={13} color={Colors.primary} />
                    <Text style={styles.systemText}>{msg.text}</Text>
                  </View>
                </View>
              );
            }

            return (
              <View
                key={msg.id}
                style={[
                  styles.messageRow,
                  isMe ? styles.messageRowRight : styles.messageRowLeft,
                  isMe ? styles.messageRowPadRight : styles.messageRowPadLeft,
                ]}
              >
                {!isMe && (
                  <View style={styles.messageAvatar}>
                    <Text style={styles.messageAvatarText}>
                      {msg.senderName
                        .replace("Dr. ", "")
                        .slice(0, 2)
                        .toUpperCase()}
                    </Text>
                  </View>
                )}

                <View
                  style={[
                    styles.messageBubble,
                    isMe ? styles.bubbleRight : styles.bubbleLeft,
                  ]}
                >
                  {!isMe && (
                    <Text style={styles.senderLabel}>
                      {msg.senderName} ({msg.senderRole === "doctor" ? "Physician" : "Patient"})
                    </Text>
                  )}
                  <Text
                    style={[
                      styles.messageText,
                      isMe ? styles.messageTextRight : styles.messageTextLeft,
                    ]}
                  >
                    {msg.text}
                  </Text>
                  <View style={styles.bubbleFooter}>
                    <Text
                      style={[
                        styles.bubbleTime,
                        isMe ? { color: "rgba(255,255,255,0.85)" } : { color: Colors.outline },
                      ]}
                    >
                      {msg.timestamp}
                    </Text>
                    {isMe && (
                      <View style={styles.readReceipt}>
                        <CheckCheck size={14} color="#FFFFFF" strokeWidth={2.4} />
                      </View>
                    )}
                  </View>
                </View>
              </View>
            );
          })}
        </ScrollView>

        {/* ─── Quick Clinical Suggestions ───────────────────────────────── */}
        <View style={styles.suggestionsContainer}>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.suggestionsList}
          >
            {suggestions.map((s, idx) => (
              <TouchableOpacity
                key={idx}
                style={styles.suggestionChip}
                onPress={() => handleSend(s)}
                activeOpacity={0.7}
              >
                <Text style={styles.suggestionText} numberOfLines={1}>
                  {s}
                </Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>

        {/* ─── Input Bar ─────────────────────────────────────────────────── */}
        <View style={styles.inputBar}>
          <TouchableOpacity
            style={styles.attachBtn}
            onPress={handleAttachClinicalRx}
            activeOpacity={0.7}
          >
            <Paperclip size={20} color={Colors.primary} />
          </TouchableOpacity>

          <TextInput
            style={styles.textInput}
            value={inputText}
            onChangeText={setInputText}
            placeholder={
              currentUser.role === "doctor"
                ? "Type clinical note or advice..."
                : "Type your health query..."
            }
            placeholderTextColor={Colors.outline}
            multiline
            maxLength={1000}
          />

          <TouchableOpacity
            style={[
              styles.sendBtn,
              !inputText.trim() && { opacity: 0.5 },
            ]}
            onPress={() => handleSend()}
            disabled={!inputText.trim()}
            activeOpacity={0.8}
          >
            <Send size={18} color={Colors.onPrimary} />
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>

      {/* Embedded Clinical Report Scanner — fullScreen with sharp corners */}
      <Modal
        visible={chatReportScannerVisible}
        animationType="slide"
        presentationStyle="fullScreen"
        onRequestClose={() => setChatReportScannerVisible(false)}
      >
        <AIScanScreen
          type="report"
          onClose={() => setChatReportScannerVisible(false)}
        />
      </Modal>

      {/* Themed End Consultation Confirmation */}
      <ThemedAlertModal
        visible={endConsultationModalVisible}
        type="warning"
        title="End Consultation?"
        message="Are you sure you want to end this clinical session? Chat history and clinical telemetry will be securely saved to the patient record."
        onClose={() => setEndConsultationModalVisible(false)}
        buttons={[
          {
            text: "Stay in Session",
            style: "cancel",
            onPress: () => setEndConsultationModalVisible(false),
          },
          {
            text: "End & Save",
            style: "destructive",
            onPress: () => {
              setEndConsultationModalVisible(false);
              onClose();
            },
          },
        ]}
      />

      {/* Themed Clinical Actions / Attachments Modal */}
      <ThemedAlertModal
        visible={attachmentModalVisible}
        type="clinical"
        title={
          currentUser.role === "doctor"
            ? "Clinical Prescriptions & Orders"
            : "Share Health Data"
        }
        message={
          currentUser.role === "doctor"
            ? "Issue an authorized prescription or order diagnostic work directly into the patient's record:"
            : "Select verified diagnostic telemetry to share in this consultation:"
        }
        onClose={() => setAttachmentModalVisible(false)}
        buttons={[
          {
            text: "Cancel",
            style: "cancel",
            onPress: () => setAttachmentModalVisible(false),
          },
        ]}
      >
        <View style={styles.attachmentOptionsContainer}>
          {currentUser.role === "doctor" ? (
            <>
              <TouchableOpacity
                style={styles.attachmentOptionRow}
                onPress={() => {
                  setAttachmentModalVisible(false);
                  prescribeMedication({
                    name: "Lisinopril",
                    dosage: "10 mg",
                    instructions: "1 tablet daily with water",
                    purpose: "ACE inhibition / BP control",
                    timeSlot: "8:00 AM",
                  });
                }}
                activeOpacity={0.7}
              >
                <View style={[styles.attachmentOptionIcon, { backgroundColor: "#EDE9FE" }]}>
                  <Pill size={18} color="#7C3AED" />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={styles.attachmentOptionTitle}>Lisinopril 10 mg</Text>
                  <Text style={styles.attachmentOptionSub}>Daily morning dose · ACE inhibitor</Text>
                </View>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.attachmentOptionRow}
                onPress={() => {
                  setAttachmentModalVisible(false);
                  prescribeMedication({
                    name: "Atorvastatin Calcium",
                    dosage: "20 mg",
                    instructions: "1 tablet at bedtime",
                    purpose: "Lipid management",
                    timeSlot: "9:00 PM",
                  });
                }}
                activeOpacity={0.7}
              >
                <View style={[styles.attachmentOptionIcon, { backgroundColor: "#EDE9FE" }]}>
                  <Pill size={18} color="#7C3AED" />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={styles.attachmentOptionTitle}>Atorvastatin 20 mg</Text>
                  <Text style={styles.attachmentOptionSub}>Bedtime dose · Statin / Lipid control</Text>
                </View>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.attachmentOptionRow}
                onPress={() => {
                  setAttachmentModalVisible(false);
                  handleSend("Diagnostic Order: Fasting Lipid & Cholesterol panel scheduled for Central Pathology Lab.");
                }}
                activeOpacity={0.7}
              >
                <View style={[styles.attachmentOptionIcon, { backgroundColor: "#FEF3C7" }]}>
                  <Microscope size={18} color="#D97706" />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={styles.attachmentOptionTitle}>Lab: Lipid Panel</Text>
                  <Text style={styles.attachmentOptionSub}>Diagnostic order to Central Pathology Lab</Text>
                </View>
              </TouchableOpacity>
            </>
          ) : (
            <>
              <TouchableOpacity
                style={styles.attachmentOptionRow}
                onPress={() => {
                  setAttachmentModalVisible(false);
                  setChatReportScannerVisible(true);
                }}
                activeOpacity={0.7}
              >
                <View style={[styles.attachmentOptionIcon, { backgroundColor: "#EDE9FE" }]}>
                  <Sparkles size={18} color="#7C3AED" />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={styles.attachmentOptionTitle}>AI Report Scanner</Text>
                  <Text style={styles.attachmentOptionSub}>Scan or paste lab test results to verify</Text>
                </View>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.attachmentOptionRow}
                onPress={() => {
                  setAttachmentModalVisible(false);
                  handleSend("Home Vitals Check: Blood Pressure 124/82 mmHg, Resting Pulse 68 bpm.");
                }}
                activeOpacity={0.7}
              >
                <View style={[styles.attachmentOptionIcon, { backgroundColor: "#ECFDF5" }]}>
                  <Activity size={18} color="#059669" />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={styles.attachmentOptionTitle}>Share Vitals: 124/82</Text>
                  <Text style={styles.attachmentOptionSub}>Home BP cuff reading with 68 bpm pulse</Text>
                </View>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.attachmentOptionRow}
                onPress={() => {
                  setAttachmentModalVisible(false);
                  handleSend("Morning dose completed as prescribed today.");
                }}
                activeOpacity={0.7}
              >
                <View style={[styles.attachmentOptionIcon, { backgroundColor: "#E0F2FE" }]}>
                  <CheckCircle2 size={18} color="#0284C7" />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={styles.attachmentOptionTitle}>Confirm Dose Adherence</Text>
                  <Text style={styles.attachmentOptionSub}>Report morning medication taken</Text>
                </View>
              </TouchableOpacity>
            </>
          )}
        </View>
      </ThemedAlertModal>

      {/* General Themed Alert Modal */}
      <ThemedAlertModal
        visible={chatAlertConfig.visible}
        type={chatAlertConfig.type || "info"}
        title={chatAlertConfig.title}
        message={chatAlertConfig.message}
        buttons={
          chatAlertConfig.buttons || [
            {
              text: "OK",
              style: "primary",
              onPress: () => setChatAlertConfig((prev) => ({ ...prev, visible: false })),
            },
          ]
        }
        onClose={() => setChatAlertConfig((prev) => ({ ...prev, visible: false }))}
      />
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
    paddingTop: Platform.OS === "ios" ? 54 : 16,
    paddingBottom: 14,
    backgroundColor: Colors.surfaceContainerLowest,
    borderBottomWidth: 1,
    borderBottomColor: Colors.surfaceContainerHigh,
  },
  headerLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    flex: 1,
  },
  avatarCircle: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: Colors.primary,
    justifyContent: "center",
    alignItems: "center",
    position: "relative",
  },
  avatarText: {
    fontSize: 16,
    color: Colors.onPrimary,
    fontFamily: FontFamily.headlineBold,
  },
  onlineDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    borderWidth: 2,
    borderColor: Colors.surfaceContainerLowest,
    position: "absolute",
    bottom: 0,
    right: 0,
  },
  headerName: {
    fontSize: FontSize.labelLg,
    color: Colors.onSurface,
    fontFamily: FontFamily.headlineSemiBold,
  },
  roleBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 2,
    backgroundColor: Colors.primaryFixed + "44",
    paddingHorizontal: 6,
    paddingVertical: 1,
    borderRadius: Radius.sm,
  },
  roleBadgeText: {
    fontSize: 9,
    color: Colors.primary,
    fontFamily: FontFamily.dataMonoBold,
  },
  headerSub: {
    fontSize: 11,
    color: Colors.onSurfaceVariant,
    fontFamily: FontFamily.bodyRegular,
    flexShrink: 1,
    paddingRight: 4,
  },
  headerRight: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  timerBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    backgroundColor: Colors.secondaryContainer + "44",
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: Radius.full,
  },
  timerText: {
    fontSize: 11,
    color: Colors.secondary,
    fontFamily: FontFamily.dataMonoBold,
  },
  closeBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: Colors.surfaceContainerHigh,
    justifyContent: "center",
    alignItems: "center",
  },
  encryptionBanner: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    flexWrap: "wrap",
    gap: 6,
    paddingVertical: 6,
    backgroundColor: Colors.primaryFixed + "22",
  },
  liveBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: Radius.full,
  },
  liveBadgeText: {
    fontSize: 9,
    fontFamily: FontFamily.dataMonoBold,
  },
  onlineDotPulse: {
    width: 12,
    height: 12,
    borderRadius: 6,
    position: "absolute",
    bottom: 0,
    right: 0,
  },
  encryptionText: {
    fontSize: 10,
    color: Colors.primary,
    fontFamily: FontFamily.dataMono,
  },
  messageList: {
    flex: 1,
  },
  messageListContent: {
    paddingHorizontal: Spacing.md,
    paddingTop: Spacing.md,
    paddingBottom: Spacing.lg,
    gap: 12,
  },
  systemMessageRow: {
    alignItems: "center",
    marginVertical: 4,
  },
  systemBubble: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    backgroundColor: Colors.surfaceContainerLow,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: Radius.full,
    maxWidth: "90%",
  },
  systemText: {
    fontSize: 11,
    color: Colors.onSurfaceVariant,
    fontFamily: FontFamily.bodyRegular,
    textAlign: "center",
  },
  messageRow: {
    flexDirection: "row",
    alignItems: "flex-end",
    gap: 8,
  },
  messageRowLeft: {
    justifyContent: "flex-start",
    alignSelf: "stretch",
  },
  messageRowRight: {
    justifyContent: "flex-end",
    alignSelf: "stretch",
  },
  messageRowPadLeft: {
    paddingRight: 8,
  },
  messageRowPadRight: {
    paddingLeft: 40,
    paddingRight: 8,
  },
  messageAvatar: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: Colors.surfaceContainerHigh,
    justifyContent: "center",
    alignItems: "center",
  },
  messageAvatarText: {
    fontSize: 10,
    color: Colors.onSurface,
    fontFamily: FontFamily.headlineBold,
  },
  messageBubble: {
    maxWidth: "100%",
    minWidth: 92,
    flexShrink: 1,
    borderRadius: Radius.xl,
    paddingLeft: 14,
    paddingRight: 16,
    paddingTop: 10,
    paddingBottom: 10,
  },
  bubbleLeft: {
    backgroundColor: Colors.surfaceContainerLowest,
    borderBottomLeftRadius: 4,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 4,
    elevation: 1,
  },
  bubbleRight: {
    backgroundColor: Colors.primary,
    borderBottomRightRadius: 4,
  },
  senderLabel: {
    fontSize: 10,
    color: Colors.primary,
    fontFamily: FontFamily.bodySemiBold,
    marginBottom: 4,
    flexWrap: "wrap",
  },
  messageText: {
    fontSize: FontSize.bodyMd,
    lineHeight: 22,
    flexShrink: 1,
  },
  messageTextLeft: {
    color: Colors.onSurface,
    fontFamily: FontFamily.bodyRegular,
  },
  messageTextRight: {
    color: Colors.onPrimary,
    fontFamily: FontFamily.bodyRegular,
  },
  bubbleFooter: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "flex-end",
    flexWrap: "nowrap",
    gap: 4,
    marginTop: 6,
    paddingTop: 2,
    paddingRight: 2,
    minHeight: 18,
  },
  bubbleTime: {
    fontSize: 10,
    fontFamily: FontFamily.dataMono,
    flexShrink: 1,
  },
  readReceipt: {
    flexShrink: 0,
    width: 20,
    height: 16,
    marginLeft: 3,
    alignItems: "center",
    justifyContent: "center",
    overflow: "visible",
  },
  suggestionsContainer: {
    backgroundColor: Colors.surfaceContainerLowest,
    borderTopWidth: 1,
    borderTopColor: Colors.surfaceContainerLow,
    paddingVertical: 6,
  },
  suggestionsList: {
    paddingHorizontal: Spacing.md,
    gap: 8,
  },
  suggestionChip: {
    backgroundColor: Colors.surfaceContainerLow,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: Radius.full,
    borderWidth: 1,
    borderColor: Colors.outlineVariant,
  },
  suggestionText: {
    fontSize: 11,
    color: Colors.onSurfaceVariant,
    fontFamily: FontFamily.bodyMedium,
  },
  inputBar: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    paddingHorizontal: Spacing.md,
    paddingVertical: 10,
    backgroundColor: Colors.surfaceContainerLowest,
    borderTopWidth: 1,
    borderTopColor: Colors.surfaceContainerHigh,
    paddingBottom: Platform.OS === "ios" ? 30 : 10,
  },
  attachBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: Colors.surfaceContainerLow,
    justifyContent: "center",
    alignItems: "center",
  },
  textInput: {
    flex: 1,
    minHeight: 40,
    maxHeight: 100,
    backgroundColor: Colors.surfaceContainerLow,
    borderRadius: Radius.xl,
    paddingHorizontal: 14,
    paddingVertical: 8,
    fontSize: FontSize.bodyMd,
    color: Colors.onSurface,
    fontFamily: FontFamily.bodyRegular,
  },
  sendBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: Colors.primary,
    justifyContent: "center",
    alignItems: "center",
  },
  attachmentOptionsContainer: {
    width: "100%",
    gap: 8,
    marginVertical: 4,
  },
  attachmentOptionRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    backgroundColor: "#F8FAFC",
    padding: 12,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: "#E2E8F0",
  },
  attachmentOptionIcon: {
    width: 38,
    height: 38,
    borderRadius: 12,
    justifyContent: "center",
    alignItems: "center",
  },
  attachmentOptionTitle: {
    fontSize: 14,
    fontFamily: FontFamily.headlineSemiBold,
    color: "#0F172A",
    marginBottom: 2,
  },
  attachmentOptionSub: {
    fontSize: 11,
    fontFamily: FontFamily.bodyRegular,
    color: "#64748B",
  },
});
