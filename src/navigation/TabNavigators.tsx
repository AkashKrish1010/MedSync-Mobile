import React from "react";
import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";
import { Text, StyleSheet } from "react-native";
import {
  Home,
  Calendar,
  FileText,
  User,
  Stethoscope,
  Users,
  Settings,
} from "lucide-react-native";
import { Colors } from "../theme/colors";
import { FontSize, FontFamily } from "../theme/typography";

import AppTopNavbar from "../components/AppTopNavbar";
import type { AuthDoctorProfile } from "../screens/AuthScreen";

import type { AuthUserProfile } from "../types";

// Patient Screens
import PatientHome from "../screens/patient/HomeScreen";
import PatientVisits from "../screens/patient/VisitsScreen";
import PatientRecords from "../screens/patient/RecordsScreen";
import PatientProfile from "../screens/patient/ProfileScreen";

// Doctor Screens
import DoctorHome from "../screens/doctor/HomeScreen";
import DoctorVisits from "../screens/doctor/VisitsScreen";
import DoctorPatients from "../screens/doctor/PatientsScreen";
import DoctorProfile from "../screens/doctor/ProfileScreen";

// Admin Screens
import {
  AdminHome,
  AdminDoctors,
  AdminVisits,
  AdminPatients,
  AdminProfile,
} from "../screens/admin/AdminScreens";

const Tab = createBottomTabNavigator();

const styles = StyleSheet.create({
  tabBarStyle: {
    backgroundColor: Colors.surfaceContainerLowest,
    borderTopWidth: 1,
    borderTopColor: Colors.surfaceContainerHigh,
    height: 70,
    paddingBottom: 10,
    paddingTop: 8,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.05,
    shadowRadius: 12,
    elevation: 10,
  },
  tabLabel: {
    fontSize: FontSize.dataMono,
    color: Colors.onSurfaceVariant,
    fontFamily: FontFamily.bodyMedium,
    marginTop: 2,
  },
  tabLabelActive: {
    color: Colors.primary,
    fontFamily: FontFamily.bodySemiBold,
  },
});

const makeTabBar = (IconComponent: any, label: string) => ({
  tabBarLabel: ({ focused }: { focused: boolean }) => (
    <Text style={[styles.tabLabel, focused && styles.tabLabelActive]}>{label}</Text>
  ),
  tabBarIcon: ({ focused }: { focused: boolean }) => (
    <IconComponent
      size={20}
      color={focused ? Colors.primary : Colors.onSurfaceVariant}
      strokeWidth={focused ? 2.3 : 1.8}
    />
  ),
});

const tabBarStyle = {
  tabBarStyle: styles.tabBarStyle,
  tabBarActiveTintColor: Colors.primary,
  tabBarInactiveTintColor: Colors.onSurfaceVariant,
};

// ─── Patient Tab Navigator ────────────────────────────────────────────────────
export function PatientNavigator({
  patientProfile,
  onUpdateProfile,
  onSignOut,
  isDemoFlagged,
}: {
  patientProfile?: AuthUserProfile | null;
  onUpdateProfile?: (updated: Partial<AuthUserProfile>) => void;
  onSignOut: () => void;
  isDemoFlagged: boolean;
}) {
  return (
    <Tab.Navigator
      screenOptions={{
        headerShown: true,
        header: ({ route }) => (
          <AppTopNavbar
            roleBadge="PATIENT"
            subtitle={`Patient Portal · ${route.name}`}
          />
        ),
        ...tabBarStyle,
      }}
    >
      <Tab.Screen name="Home" options={makeTabBar(Home, "Home")}>
        {() => <PatientHome isDemoFlagged={isDemoFlagged} patientProfile={patientProfile} />}
      </Tab.Screen>
      <Tab.Screen name="Visits" options={makeTabBar(Calendar, "Visits")}>
        {() => <PatientVisits patientProfile={patientProfile} />}
      </Tab.Screen>
      <Tab.Screen name="Records" options={makeTabBar(FileText, "Records")}>
        {() => <PatientRecords patientProfile={patientProfile} />}
      </Tab.Screen>
      <Tab.Screen name="Profile" options={makeTabBar(User, "Profile")}>
        {() => (
          <PatientProfile
            patientProfile={patientProfile}
            onUpdateProfile={onUpdateProfile}
            onSignOut={onSignOut}
          />
        )}
      </Tab.Screen>
    </Tab.Navigator>
  );
}

// ─── Doctor Tab Navigator ─────────────────────────────────────────────────────
export function DoctorNavigator({
  onSignOut,
  doctorProfile,
}: {
  onSignOut: () => void;
  doctorProfile: AuthDoctorProfile | null;
}) {
  return (
    <Tab.Navigator
      screenOptions={{
        headerShown: true,
        header: ({ route }) => (
          <AppTopNavbar
            roleBadge="PHYSICIAN"
            roleBadgeColor={Colors.secondary}
            subtitle={`Clinical Suite · ${route.name}`}
          />
        ),
        ...tabBarStyle,
      }}
    >
      <Tab.Screen name="Home" options={makeTabBar(Home, "Home")}>
        {() => <DoctorHome doctorProfile={doctorProfile} />}
      </Tab.Screen>
      <Tab.Screen name="Visits" options={makeTabBar(Calendar, "Visits")}>
        {() => <DoctorVisits doctorProfile={doctorProfile} />}
      </Tab.Screen>
      <Tab.Screen name="Patients" options={makeTabBar(Users, "Patients")}>
        {() => <DoctorPatients doctorProfile={doctorProfile} />}
      </Tab.Screen>
      <Tab.Screen name="Profile" options={makeTabBar(User, "Profile")}>
        {() => <DoctorProfile onSignOut={onSignOut} doctorProfile={doctorProfile} />}
      </Tab.Screen>
    </Tab.Navigator>
  );
}

// ─── Admin Tab Navigator ──────────────────────────────────────────────────────
export function AdminNavigator({ onSignOut }: { onSignOut: () => void }) {
  return (
    <Tab.Navigator
      screenOptions={{
        headerShown: true,
        header: ({ route }) => (
          <AppTopNavbar
            roleBadge="ADMIN"
            roleBadgeColor={Colors.tertiary}
            subtitle={`Hospital Ops · ${route.name}`}
          />
        ),
        ...tabBarStyle,
      }}
    >
      <Tab.Screen name="Home" options={makeTabBar(Home, "Home")}>
        {() => <AdminHome onSignOut={onSignOut} />}
      </Tab.Screen>
      <Tab.Screen name="Doctors" component={AdminDoctors} options={makeTabBar(Stethoscope, "Doctors")} />
      <Tab.Screen name="Visits" component={AdminVisits} options={makeTabBar(Calendar, "Visits")} />
      <Tab.Screen name="Patients" component={AdminPatients} options={makeTabBar(Users, "Patients")} />
      <Tab.Screen name="Profile" options={makeTabBar(Settings, "Settings")}>
        {() => <AdminProfile onSignOut={onSignOut} />}
      </Tab.Screen>
    </Tab.Navigator>
  );
}
