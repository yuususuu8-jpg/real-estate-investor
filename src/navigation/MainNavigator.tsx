import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator, NativeStackNavigationProp } from '@react-navigation/native-stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';

// Import screens
import HomeScreen from '../screens/HomeScreen';
import CalculationScreen from '../screens/CalculationScreen';
import HistoryScreen from '../screens/HistoryScreen';
import SettingsScreen from '../screens/SettingsScreen';

// Import settings sub-screens
import ProfileScreen from '../screens/settings/ProfileScreen';
import ThemeScreen from '../screens/settings/ThemeScreen';
import LanguageScreen from '../screens/settings/LanguageScreen';
import HelpScreen from '../screens/settings/HelpScreen';
import AboutScreen from '../screens/settings/AboutScreen';
import PrivacyPolicyScreen from '../screens/settings/PrivacyPolicyScreen';

// Import AI evaluation screen
import AIEvaluationScreen from '../screens/AIEvaluationScreen';

// Import comparison screen
import ComparisonScreen from '../screens/ComparisonScreen';
import SimulationScreen from '../screens/SimulationScreen';
import PortfolioScreen from '../screens/PortfolioScreen';
import { SavedCalculation } from '../store/calculationStore';

// Tab screen names (for navigation from anywhere)
export type TabParamList = {
  Home: undefined;
  Calculation: undefined;
  History: undefined;
  Settings: undefined;
};

export type RootStackParamList = {
  MainTabs: undefined;
  Profile: undefined;
  Theme: undefined;
  Language: undefined;
  Help: undefined;
  About: undefined;
  PrivacyPolicy: undefined;
  AIEvaluation: undefined;
  Comparison: { calculations: SavedCalculation[] };
  Simulation: { calculation: SavedCalculation };
  Portfolio: undefined;
} & TabParamList;

export type NavigationProp = NativeStackNavigationProp<RootStackParamList>;

const Tab = createBottomTabNavigator();
const Stack = createNativeStackNavigator<RootStackParamList>();

// Wrapper components to pass navigation props
function ProfileScreenWrapper() {
  const navigation = useNavigation<NavigationProp>();
  return <ProfileScreen onGoBack={() => navigation.goBack()} />;
}

function ThemeScreenWrapper() {
  const navigation = useNavigation<NavigationProp>();
  return <ThemeScreen onGoBack={() => navigation.goBack()} />;
}

function LanguageScreenWrapper() {
  const navigation = useNavigation<NavigationProp>();
  return <LanguageScreen onGoBack={() => navigation.goBack()} />;
}

function HelpScreenWrapper() {
  const navigation = useNavigation<NavigationProp>();
  return <HelpScreen onGoBack={() => navigation.goBack()} />;
}

function AboutScreenWrapper() {
  const navigation = useNavigation<NavigationProp>();
  return <AboutScreen onGoBack={() => navigation.goBack()} />;
}

function PrivacyPolicyScreenWrapper() {
  const navigation = useNavigation<NavigationProp>();
  return <PrivacyPolicyScreen onGoBack={() => navigation.goBack()} />;
}

function ComparisonScreenWrapper({ route }: { route: { params: { calculations: SavedCalculation[] } } }) {
  const navigation = useNavigation<NavigationProp>();
  return (
    <ComparisonScreen
      calculations={route.params.calculations}
      onGoBack={() => navigation.goBack()}
    />
  );
}

function SimulationScreenWrapper({ route }: { route: { params: { calculation: SavedCalculation } } }) {
  const navigation = useNavigation<NavigationProp>();
  return (
    <SimulationScreen
      calculation={route.params.calculation}
      onGoBack={() => navigation.goBack()}
    />
  );
}

function HomeTabs() {
  return (
    <Tab.Navigator
      screenOptions={{
        tabBarActiveTintColor: '#3B82F6',
        tabBarInactiveTintColor: '#9CA3AF',
        tabBarStyle: {
          backgroundColor: '#FFFFFF',
          borderTopColor: '#F3F4F6',
          height: 60,
          paddingBottom: 8,
          paddingTop: 8,
        },
        tabBarLabelStyle: {
          fontSize: 12,
          fontWeight: '600',
        },
        headerShown: false,
      }}
    >
      <Tab.Screen
        name="Home"
        component={HomeScreen}
        options={{
          title: 'ホーム',
          tabBarIcon: ({ color, size }) => (
            <MaterialCommunityIcons name="home" size={size} color={color} />
          ),
        }}
      />
      <Tab.Screen
        name="Calculation"
        component={CalculationScreen}
        options={{
          title: '計算',
          tabBarIcon: ({ color, size }) => (
            <MaterialCommunityIcons name="calculator" size={size} color={color} />
          ),
        }}
      />
      <Tab.Screen
        name="History"
        component={HistoryScreen}
        options={{
          title: '履歴',
          tabBarIcon: ({ color, size }) => (
            <MaterialCommunityIcons name="history" size={size} color={color} />
          ),
        }}
      />
      <Tab.Screen
        name="Settings"
        component={SettingsScreen}
        options={{
          title: '設定',
          tabBarIcon: ({ color, size }) => (
            <MaterialCommunityIcons name="cog" size={size} color={color} />
          ),
        }}
      />
    </Tab.Navigator>
  );
}

export default function MainNavigator() {
  return (
    <NavigationContainer>
      <Stack.Navigator screenOptions={{ headerShown: false }}>
        <Stack.Screen name="MainTabs" component={HomeTabs} />
        <Stack.Screen name="Profile" component={ProfileScreenWrapper} />
        <Stack.Screen name="Theme" component={ThemeScreenWrapper} />
        <Stack.Screen name="Language" component={LanguageScreenWrapper} />
        <Stack.Screen name="Help" component={HelpScreenWrapper} />
        <Stack.Screen name="About" component={AboutScreenWrapper} />
        <Stack.Screen name="PrivacyPolicy" component={PrivacyPolicyScreenWrapper} />
        <Stack.Screen name="AIEvaluation" component={AIEvaluationScreen} />
        <Stack.Screen name="Comparison" component={ComparisonScreenWrapper} />
        <Stack.Screen name="Simulation" component={SimulationScreenWrapper} />
        <Stack.Screen name="Portfolio" component={PortfolioScreen} />
      </Stack.Navigator>
    </NavigationContainer>
  );
}
