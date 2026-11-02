import React from "react";
import {
  View,
  Text,
  Modal,
  TouchableOpacity,
  StyleSheet,
  Pressable,
} from "react-native";
import {
  CheckCircle2,
  AlertTriangle,
  AlertCircle,
  Sparkles,
  Info,
  X,
  Stethoscope,
} from "lucide-react-native";
import { Colors } from "../theme/colors";
import { FontFamily, FontSize, Radius, Spacing } from "../theme/typography";

export interface ThemedAlertButton {
  text: string;
  onPress?: () => void;
  style?: "default" | "cancel" | "destructive" | "primary";
}

export interface ThemedAlertModalProps {
  visible: boolean;
  type?: "info" | "success" | "warning" | "error" | "ai" | "clinical";
  title: string;
  message?: string;
  buttons?: ThemedAlertButton[];
  onClose?: () => void;
  children?: React.ReactNode;
}

export default function ThemedAlertModal({
  visible,
  type = "info",
  title,
  message,
  buttons = [{ text: "OK", style: "primary" }],
  onClose,
  children,
}: ThemedAlertModalProps) {
  const getIcon = () => {
    switch (type) {
      case "success":
        return <CheckCircle2 size={26} color="#059669" strokeWidth={2.4} />;
      case "warning":
        return <AlertTriangle size={26} color="#D97706" strokeWidth={2.4} />;
      case "error":
        return <AlertCircle size={26} color="#DC2626" strokeWidth={2.4} />;
      case "ai":
        return <Sparkles size={26} color="#7C3AED" strokeWidth={2.2} />;
      case "clinical":
        return <Stethoscope size={26} color="#7C3AED" strokeWidth={2.2} />;
      default:
        return <Info size={26} color="#7C3AED" strokeWidth={2.2} />;
    }
  };

  const getIconBg = () => {
    switch (type) {
      case "success":
        return "#ECFDF5";
      case "warning":
        return "#FFFBEB";
      case "error":
        return "#FEF2F2";
      case "ai":
      case "clinical":
      default:
        return "#F5F3FF";
    }
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onClose}
    >
      <Pressable style={styles.backdrop} onPress={onClose}>
        <Pressable style={styles.card} onPress={(e) => e.stopPropagation()}>
          {onClose && (
            <TouchableOpacity style={styles.closeBtn} onPress={onClose}>
              <X size={18} color="#9CA3AF" />
            </TouchableOpacity>
          )}

          {/* Centered Themed Icon Badge */}
          <View style={[styles.iconCircle, { backgroundColor: getIconBg() }]}>
            {getIcon()}
          </View>

          {/* Title & Message */}
          <Text style={styles.title}>{title}</Text>
          {message ? <Text style={styles.message}>{message}</Text> : null}

          {/* Custom Body / Children */}
          {children}

          {/* Action Buttons */}
          {buttons && buttons.length > 0 && (
            <View
              style={[
                styles.buttonsContainer,
                buttons.length === 2 && styles.buttonsRow,
              ]}
            >
              {buttons.map((btn, idx) => {
                const isCancel = btn.style === "cancel";
                const isDestructive = btn.style === "destructive";
                const isPrimary = btn.style === "primary" || (!isCancel && !isDestructive);

                return (
                  <TouchableOpacity
                    key={idx}
                    style={[
                      styles.btn,
                      buttons.length === 2 && styles.btnHalf,
                      isCancel && styles.btnCancel,
                      isDestructive && styles.btnDestructive,
                      isPrimary && styles.btnPrimary,
                    ]}
                    onPress={() => {
                      if (btn.onPress) btn.onPress();
                      else if (onClose) onClose();
                    }}
                    activeOpacity={0.8}
                  >
                    <Text
                      style={[
                        styles.btnText,
                        isCancel && styles.btnTextCancel,
                        isDestructive && styles.btnTextDestructive,
                        isPrimary && styles.btnTextPrimary,
                      ]}
                    >
                      {btn.text}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>
          )}
        </Pressable>
      </Pressable>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: "rgba(15, 23, 42, 0.65)",
    justifyContent: "center",
    alignItems: "center",
    padding: Spacing.md,
  },
  card: {
    width: "100%",
    maxWidth: 380,
    backgroundColor: "#FFFFFF",
    borderRadius: Radius.xl,
    paddingHorizontal: 22,
    paddingTop: 24,
    paddingBottom: 20,
    alignItems: "center",
    shadowColor: "#4C1D95",
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.18,
    shadowRadius: 24,
    elevation: 8,
    borderWidth: 1,
    borderColor: "rgba(224, 231, 255, 0.8)",
    position: "relative",
  },
  closeBtn: {
    position: "absolute",
    top: 14,
    right: 14,
    padding: 6,
    zIndex: 10,
  },
  iconCircle: {
    width: 56,
    height: 56,
    borderRadius: 28,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 14,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 6,
  },
  title: {
    fontSize: 18,
    fontFamily: FontFamily.headlineBold,
    color: "#18181B",
    textAlign: "center",
    letterSpacing: -0.3,
  },
  message: {
    fontSize: 14,
    fontFamily: FontFamily.bodyRegular,
    color: "#71717A",
    textAlign: "center",
    lineHeight: 21,
    marginTop: 8,
    paddingHorizontal: 4,
  },
  buttonsContainer: {
    width: "100%",
    marginTop: 20,
    gap: 10,
  },
  buttonsRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  btn: {
    height: 46,
    borderRadius: 14,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 16,
  },
  btnHalf: {
    flex: 1,
  },
  btnPrimary: {
    backgroundColor: Colors.primary,
    shadowColor: Colors.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 8,
    elevation: 3,
  },
  btnCancel: {
    backgroundColor: "#F4F4F5",
    borderWidth: 1,
    borderColor: "#E4E4E7",
  },
  btnDestructive: {
    backgroundColor: "#FEF2F2",
    borderWidth: 1,
    borderColor: "#FCA5A5",
  },
  btnText: {
    fontSize: 14,
    fontFamily: FontFamily.bodySemiBold,
  },
  btnTextPrimary: {
    color: "#FFFFFF",
  },
  btnTextCancel: {
    color: "#52525B",
  },
  btnTextDestructive: {
    color: "#DC2626",
  },
});
