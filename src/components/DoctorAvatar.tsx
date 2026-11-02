import React, { useState } from "react";
import { View, Image, StyleSheet, ViewStyle } from "react-native";
import { User } from "lucide-react-native";
import { Colors } from "../theme/colors";
import { FontFamily } from "../theme/typography";
import { Text } from "react-native";

export interface DoctorAvatarProps {
  name: string;
  /** Initials when no photo (e.g. "TR") */
  avatar?: string;
  profilePhotoUrl?: string | null;
  size?: number;
  style?: ViewStyle;
  /** Show initials instead of generic user icon when no photo */
  preferInitials?: boolean;
  active?: boolean;
}

function initialsFor(name: string, avatar?: string): string {
  if (avatar && avatar.length <= 4 && !avatar.includes("/")) {
    return avatar.toUpperCase();
  }
  return name
    .replace(/^Dr\.\s*/i, "")
    .split(/\s+/)
    .filter(Boolean)
    .map((w) => w[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();
}

export default function DoctorAvatar({
  name,
  avatar,
  profilePhotoUrl,
  size = 44,
  style,
  preferInitials = false,
  active = true,
}: DoctorAvatarProps) {
  const [imgFailed, setImgFailed] = useState(false);
  const radius = size / 2;
  const bg = active ? Colors.primary : Colors.surfaceContainerHigh;
  const fg = active ? Colors.onPrimary : Colors.onSurfaceVariant;

  const hasPhoto =
    !!profilePhotoUrl &&
    !imgFailed &&
    (profilePhotoUrl.startsWith("http") || profilePhotoUrl.startsWith("data:"));

  if (hasPhoto) {
    return (
      <Image
        source={{ uri: profilePhotoUrl! }}
        onError={() => setImgFailed(true)}
        style={[
          { width: size, height: size, borderRadius: radius, backgroundColor: Colors.surfaceContainerHigh },
          style as any,
        ]}
      />
    );
  }

  const initials = initialsFor(name, avatar);

  if (preferInitials && initials) {
    return (
      <View
        style={[
          styles.fallback,
          { width: size, height: size, borderRadius: radius, backgroundColor: bg },
          style,
        ]}
      >
        <Text style={[styles.initials, { color: fg, fontSize: size * 0.32 }]}>{initials}</Text>
      </View>
    );
  }

  return (
    <View
      style={[
        styles.fallback,
        { width: size, height: size, borderRadius: radius, backgroundColor: bg },
        style,
      ]}
    >
      <User size={size * 0.45} color={fg} strokeWidth={2} />
    </View>
  );
}

const styles = StyleSheet.create({
  fallback: {
    justifyContent: "center",
    alignItems: "center",
  },
  initials: {
    fontFamily: FontFamily.headlineBold,
  },
});
