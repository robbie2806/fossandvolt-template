import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import * as Haptics from "expo-haptics";
import { MessageCircle, Target, Settings } from "lucide-react-native";
import { useEffect, useState } from "react";
import { View, ActivityIndicator } from "react-native";

import type { BottomTabParamList, RootStackParamList } from "@/navigation/types";
import OnboardingWelcomeScreen from "@/screens/OnboardingWelcomeScreen";
import OnboardingNameScreen from "@/screens/OnboardingNameScreen";
import OnboardingVibeScreen from "@/screens/OnboardingVibeScreen";
import ChatScreen from "@/screens/ChatScreen";
import BondScreen from "@/screens/BondScreen";
import SettingsScreen from "@/screens/SettingsScreen";
import LoginModalScreen from "@/screens/LoginModalScreen";
import { authClient } from "@/lib/authClient";
import { api } from "@/lib/api";

const RootStack = createNativeStackNavigator<RootStackParamList>();

// Loading screen component
const LoadingScreen = () => {
  return (
    <View style={{ flex: 1, justifyContent: "center", alignItems: "center", backgroundColor: "#8B5CF6" }}>
      <ActivityIndicator size="large" color="#FFFFFF" />
    </View>
  );
};

const RootNavigator = () => {
  const [isReady, setIsReady] = useState(false);
  const [showTabs, setShowTabs] = useState(false);

  useEffect(() => {
    async function checkAuth() {
      try {
        const session = await authClient.getSession();
        if (session?.data?.user) {
          try {
            await api.get("/api/companion");
            setShowTabs(true);
          } catch (error) {
            setShowTabs(false);
          }
        } else {
          setShowTabs(false);
        }
      } catch (error) {
        console.error("Auth check error:", error);
        setShowTabs(false);
      } finally {
        setIsReady(true);
      }
    }

    checkAuth();
  }, []);

  return (
    <RootStack.Navigator
      initialRouteName={showTabs ? "Tabs" : "OnboardingWelcome"}
      screenOptions={{
        contentStyle: { backgroundColor: "#F9FAFB" },
      }}
    >
      {!isReady ? (
        <RootStack.Screen
          name="OnboardingWelcome"
          component={LoadingScreen}
          options={{ headerShown: false }}
        />
      ) : (
        <>
          <RootStack.Screen
            name="OnboardingWelcome"
            component={OnboardingWelcomeScreen}
            options={{ headerShown: false }}
          />
          <RootStack.Screen
            name="OnboardingName"
            component={OnboardingNameScreen}
            options={{ headerShown: false }}
          />
          <RootStack.Screen
            name="OnboardingVibe"
            component={OnboardingVibeScreen}
            options={{ headerShown: false }}
          />
          <RootStack.Screen
            name="Tabs"
            component={BottomTabNavigator}
            options={{ headerShown: false }}
          />
          <RootStack.Screen
            name="LoginModalScreen"
            component={LoginModalScreen}
            options={{ presentation: "modal", title: "Login" }}
          />
        </>
      )}
    </RootStack.Navigator>
  );
};

const BottomTab = createBottomTabNavigator<BottomTabParamList>();
const BottomTabNavigator = () => {
  return (
    <BottomTab.Navigator
      initialRouteName="ChatTab"
      screenOptions={{
        tabBarStyle: {
          position: "absolute",
          backgroundColor: "rgba(255, 255, 255, 0.9)",
          borderTopWidth: 0,
          elevation: 0,
          shadowOpacity: 0.1,
          shadowRadius: 10,
          shadowOffset: { width: 0, height: -3 },
        },
        tabBarActiveTintColor: "#8B5CF6",
        tabBarInactiveTintColor: "#9CA3AF",
      }}
      screenListeners={() => ({
        transitionStart: () => {
          Haptics.selectionAsync();
        },
      })}
    >
      <BottomTab.Screen
        name="ChatTab"
        component={ChatScreen}
        options={{
          title: "Chat",
          tabBarIcon: ({ color, size }) => <MessageCircle size={size} color={color} />,
        }}
      />
      <BottomTab.Screen
        name="BondTab"
        component={BondScreen}
        options={{
          title: "Bond",
          tabBarIcon: ({ color, size }) => <Target size={size} color={color} />,
        }}
      />
      <BottomTab.Screen
        name="SettingsTab"
        component={SettingsScreen}
        options={{
          title: "Settings",
          tabBarIcon: ({ color, size }) => <Settings size={size} color={color} />,
        }}
      />
    </BottomTab.Navigator>
  );
};

export default RootNavigator;
