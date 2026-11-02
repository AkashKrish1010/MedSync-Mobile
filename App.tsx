import React, { useState } from "react";
import { NavigationContainer } from "@react-navigation/native";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import { StatusBar } from "expo-status-bar";
import {
  useFonts,
  Inter_400Regular,
  Inter_500Medium,
  Inter_600SemiBold,
} from "@expo-google-fonts/inter";
import {
  PlusJakartaSans_500Medium,
  PlusJakartaSans_600SemiBold,
  PlusJakartaSans_700Bold,
} from "@expo-google-fonts/plus-jakarta-sans";
import {
  JetBrainsMono_400Regular,
  JetBrainsMono_700Bold,
} from "@expo-google-fonts/jetbrains-mono";
import { View, Text, StyleSheet, ActivityIndicator } from "react-native";
import { SafeAreaProvider } from "react-native-safe-area-context";

import OnboardingScreen from "./src/screens/OnboardingScreen";
import AuthScreen, { AuthDoctorProfile } from "./src/screens/AuthScreen";
import { PatientNavigator, DoctorNavigator, AdminNavigator } from "./src/navigation/TabNavigators";
import { Colors } from "./src/theme/colors";
import type { AuthUserProfile } from "./src/types";

type UserRole = "onboarding" | "auth" | "patient" | "doctor" | "admin";

export default function App() {
  const [role, setRole] = useState<UserRole>("onboarding");
  const [isDemoFlagged, setIsDemoFlagged] = useState(false);
  const [patientSession, setPatientSession] = useState<AuthUserProfile | null>(null);
  const [doctorSession, setDoctorSession] = useState<AuthDoctorProfile | null>(null);

  const [fontsLoaded] = useFonts({
    Inter_400Regular,
    Inter_500Medium,
    Inter_600SemiBold,
    PlusJakartaSans_500Medium,
    PlusJakartaSans_600SemiBold,
    PlusJakartaSans_700Bold,
    JetBrainsMono_400Regular,
    JetBrainsMono_700Bold,
  });

  if (!fontsLoaded) {
    return (
      <View style={styles.loadingScreen}>
        <ActivityIndicator size="large" color={Colors.primary} />
        <Text style={styles.loadingText}>Loading MedSync...</Text>
      </View>
    );
  }

  return (
    <SafeAreaProvider>
      <NavigationContainer>
        <StatusBar style="dark" />
        {role === "onboarding" && (
          <OnboardingScreen onComplete={() => setRole("auth")} />
        )}
        {role === "auth" && (
          <AuthScreen
            onSuccess={(r, profile) => {
              if (r === "doctor" && profile) {
                setDoctorSession(profile as AuthDoctorProfile);
              } else if (r === "patient" && profile) {
                setPatientSession(profile);
                setIsDemoFlagged(profile.email?.toLowerCase().includes("sarah") ?? false);
              }
              setRole(r);
            }}
          />
        )}
        {role === "patient" && (
          <PatientNavigator
            patientProfile={patientSession}
            onUpdateProfile={(updated) => {
              setPatientSession((prev) => (prev ? { ...prev, ...updated } : (updated as AuthUserProfile)));
            }}
            onSignOut={() => {
              setPatientSession(null);
              setRole("auth");
            }}
            isDemoFlagged={isDemoFlagged}
          />
        )}
        {role === "doctor" && (
          <DoctorNavigator
            doctorProfile={doctorSession}
            onSignOut={() => {
              setDoctorSession(null);
              setRole("auth");
            }}
          />
        )}
        {role === "admin" && (
          <AdminNavigator onSignOut={() => setRole("auth")} />
        )}
      </NavigationContainer>
    </SafeAreaProvider>
  );
}

const styles = StyleSheet.create({
  loadingScreen: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: Colors.surface,
    gap: 16,
  },
  loadingText: {
    fontSize: 16,
    color: Colors.onSurfaceVariant,
    fontFamily: "System",
  },
});
