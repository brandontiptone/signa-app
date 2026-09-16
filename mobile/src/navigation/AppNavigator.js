import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Text } from 'react-native';
import { useAuth } from '../context/AuthContext';

import LoginScreen from '../screens/LoginScreen';
import HomeScreen from '../screens/HomeScreen';
import PlanningWeekScreen from '../screens/PlanningWeekScreen';
import PlanningListScreen from '../screens/PlanningListScreen';
import RdvDetailScreen from '../screens/RdvDetailScreen';
import VisiteScreen from '../screens/VisiteScreen';
import ClientDetailScreen from '../screens/ClientDetailScreen';

import AdminDashboardScreen from '../screens/admin/AdminDashboardScreen';
import AdminPlanningScreen from '../screens/admin/AdminPlanningScreen';
import AdminCreateRdvScreen from '../screens/admin/AdminCreateRdvScreen';
import AdminTeamScreen from '../screens/admin/AdminTeamScreen';
import AdminAddTechnicienScreen from '../screens/admin/AdminAddTechnicienScreen';
import AdminSettingsScreen from '../screens/admin/AdminSettingsScreen';
import AdminAddResultatScreen from '../screens/admin/AdminAddResultatScreen';
import AdminAddChampScreen from '../screens/admin/AdminAddChampScreen';

import OrganisationsScreen from '../screens/superadmin/OrganisationsScreen';
import CreateOrganisationScreen from '../screens/superadmin/CreateOrganisationScreen';
import OrganisationDetailScreen from '../screens/superadmin/OrganisationDetailScreen';

const Stack = createNativeStackNavigator();
const Tab = createBottomTabNavigator();

function PlanningTabs() {
  return (
    <Tab.Navigator screenOptions={{ headerShown: false, tabBarActiveTintColor: '#FF6B4A' }}>
      <Tab.Screen name="Accueil" component={HomeScreen} options={{ tabBarIcon: ({ color }) => <Text style={{ color }}>🏠</Text> }} />
      <Tab.Screen name="Planning" component={PlanningWeekScreen} options={{ tabBarIcon: ({ color }) => <Text style={{ color }}>📅</Text> }} />
      <Tab.Screen name="Mes RDV" component={PlanningListScreen} options={{ tabBarIcon: ({ color }) => <Text style={{ color }}>📋</Text> }} />
    </Tab.Navigator>
  );
}

function AdminTabs() {
  return (
    <Tab.Navigator screenOptions={{ headerShown: false, tabBarActiveTintColor: '#FF6B4A' }}>
      <Tab.Screen name="Tableau de bord" component={AdminDashboardScreen} options={{ tabBarIcon: ({ color }) => <Text style={{ color }}>📊</Text> }} />
      <Tab.Screen name="Planning équipe" component={AdminPlanningScreen} options={{ tabBarIcon: ({ color }) => <Text style={{ color }}>🗓️</Text> }} />
      <Tab.Screen name="Mon équipe" component={AdminTeamScreen} options={{ tabBarIcon: ({ color }) => <Text style={{ color }}>👥</Text> }} />
      <Tab.Screen name="Paramètres" component={AdminSettingsScreen} options={{ tabBarIcon: ({ color }) => <Text style={{ color }}>⚙️</Text> }} />
    </Tab.Navigator>
  );
}

export default function AppNavigator() {
  const { user, loading } = useAuth();

  if (loading) return null;

  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      {!user ? (
        <Stack.Screen name="Login" component={LoginScreen} />
      ) : user.role === 'SUPER_ADMIN' ? (
        <>
          <Stack.Screen name="PlanningTabs" component={OrganisationsScreen} />
          <Stack.Screen
            name="CreateOrganisation"
            component={CreateOrganisationScreen}
            options={{ headerShown: true, title: 'Nouvelle entreprise' }}
          />
          <Stack.Screen
            name="OrganisationDetail"
            component={OrganisationDetailScreen}
            options={{ headerShown: true, title: "Fiche entreprise" }}
          />
        </>
      ) : user.role === 'ADMIN' ? (
        <>
          <Stack.Screen name="PlanningTabs" component={AdminTabs} />
          <Stack.Screen name="AdminCreateRdv" component={AdminCreateRdvScreen} options={{ headerShown: true, title: 'Nouveau rendez-vous' }} />
          <Stack.Screen name="AdminAddTechnicien" component={AdminAddTechnicienScreen} options={{ headerShown: true, title: 'Nouveau technicien' }} />
          <Stack.Screen name="AdminAddResultat" component={AdminAddResultatScreen} options={{ headerShown: true, title: 'Nouveau résultat' }} />
          <Stack.Screen name="AdminAddChamp" component={AdminAddChampScreen} options={{ headerShown: true, title: 'Nouveau champ' }} />
          <Stack.Screen name="RdvDetail" component={RdvDetailScreen} options={{ headerShown: true, title: 'Détail du rendez-vous' }} />
          <Stack.Screen name="ClientDetail" component={ClientDetailScreen} options={{ headerShown: true, title: 'Fiche client' }} />
        </>
      ) : (
        <>
          <Stack.Screen name="PlanningTabs" component={PlanningTabs} />
          <Stack.Screen name="RdvDetail" component={RdvDetailScreen} options={{ headerShown: true, title: 'Détail du rendez-vous' }} />
          <Stack.Screen name="Visite" component={VisiteScreen} options={{ headerShown: true, title: 'Visite en cours' }} />
          <Stack.Screen name="ClientDetail" component={ClientDetailScreen} options={{ headerShown: true, title: 'Fiche client' }} />
        </>
      )}
    </Stack.Navigator>
  );
}
