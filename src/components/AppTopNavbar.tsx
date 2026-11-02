import React from "react";
import { View, Text, StyleSheet, TouchableOpacity, Platform, Image } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import Colors, { Colors as ThemeColors } from "../theme/colors";
import { Spacing, Radius, FontSize, FontFamily } from "../theme/typography";

const appColors = Colors || ThemeColors || {
  surfaceContainerLowest: "#FFFFFF",
  surfaceContainerHigh: "#EAE7EA",
  primary: "#005AB3",
  onPrimary: "#FFFFFF",
  primaryFixed: "#D6E3FF",
  onSurface: "#1B1B1D",
  onSurfaceVariant: "#414754",
};

export interface AppTopNavbarProps {
  title?: string;
  subtitle?: string;
  roleBadge?: string;
  roleBadgeColor?: string;
  rightElement?: React.ReactNode;
  onLogoPress?: () => void;
  hideBorder?: boolean;
}

export default function AppTopNavbar({
  title = "MedSync",
  subtitle,
  roleBadge,
  roleBadgeColor,
  rightElement,
  onLogoPress,
  hideBorder = false,
}: AppTopNavbarProps) {
  const insets = useSafeAreaInsets();
  const topPadding = Math.max(insets.top, Platform.OS === "android" ? 12 : 8);

  const badgeBg = roleBadgeColor || appColors.primaryFixed + "55";
  const badgeTextColor = roleBadgeColor ? appColors.onPrimary : appColors.primary;

  return (
    <View
      style={[
        styles.wrapper,
        { paddingTop: topPadding },
        hideBorder && styles.noBorder,
      ]}
    >
      <View style={styles.navContent}>
        {/* Left: App Logo & Name */}
        <TouchableOpacity
          style={styles.brandRow}
          onPress={onLogoPress}
          activeOpacity={onLogoPress ? 0.7 : 1}
        >
          <View style={styles.logoBox}>
            <Image
              source={require("../../assets/medsync-logo-Photoroom.png")}
              style={styles.logoImg}
              resizeMode="contain"
            />
          </View>
          <View style={styles.titleColumn}>
            <View style={styles.titleRow}>
              <Text style={styles.appName}>{title}</Text>
              {roleBadge && (
                <View style={[styles.roleBadge, { backgroundColor: badgeBg }]}>
                  <Text style={[styles.roleBadgeText, { color: badgeTextColor }]}>
                    {roleBadge}
                  </Text>
                </View>
              )}
            </View>
            {subtitle ? (
              <Text style={styles.appSubtitle}>{subtitle}</Text>
            ) : (
              <Text style={styles.appSubtitle}>Live Chat & Clinical AI</Text>
            )}
          </View>
        </TouchableOpacity>

        {/* Right: Custom element if provided (HIPAA pill removed per user request) */}
        <View style={styles.rightContainer}>
          {rightElement !== undefined ? rightElement : null}
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    backgroundColor: appColors.surfaceContainerLowest,
    borderBottomWidth: 1,
    borderBottomColor: appColors.surfaceContainerHigh,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.03,
    shadowRadius: 6,
    elevation: 3,
    zIndex: 100,
  },
  noBorder: {
    borderBottomWidth: 0,
    shadowOpacity: 0,
    elevation: 0,
  },
  navContent: {
    height: 52,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: Spacing.margin,
  },
  brandRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  logoBox: {
    width: 36,
    height: 36,
    borderRadius: Radius.md,
    backgroundColor: appColors.surfaceContainerLowest,
    justifyContent: "center",
    alignItems: "center",
    shadowColor: "#0A84FF",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.12,
    shadowRadius: 4,
    elevation: 2,
    overflow: "hidden",
  },
  logoImg: {
    width: 30,
    height: 30,
  },
  titleColumn: {
    justifyContent: "center",
  },
  titleRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  appName: {
    fontSize: FontSize.headlineSm,
    color: appColors.onSurface,
    fontFamily: FontFamily.headlineBold,
    letterSpacing: -0.3,
  },
  appSubtitle: {
    fontSize: 10,
    color: appColors.onSurfaceVariant,
    fontFamily: FontFamily.dataMono,
    marginTop: -1,
  },
  roleBadge: {
    paddingHorizontal: 7,
    paddingVertical: 2,
    borderRadius: Radius.full,
  },
  roleBadgeText: {
    fontSize: 9,
    fontFamily: FontFamily.dataMonoBold,
    letterSpacing: 0.4,
    textTransform: "uppercase",
  },
  rightContainer: {
    flexDirection: "row",
    alignItems: "center",
  },
});
