import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import * as Haptics from "expo-haptics";
import { MessageCircle, Target, Sparkles, Settings } from "lucide-react-native";

import type { BottomTabParamList, RootStackParamList } from "@/navigation/types";
import OnboardingWelcomeScreen from "@/screens/OnboardingWelcomeScreen";
import OnboardingNameScreen from "@/screens/OnboardingNameScreen";
import PixieVoltIntroScreen from "@/screens/PixieVoltIntroScreen";
import PixieVoltNameScreen from "@/screens/PixieVoltNameScreen";
import ChatScreen from "@/screens/ChatScreen";
import BondScreen from "@/screens/BondScreen";
import PixieVoltScreen from "@/screens/PixieVoltScreen";
import SettingsScreen from "@/screens/SettingsScreen";
import LoginModalScreen from "@/screens/LoginModalScreen";

const RootStack = createNativeStackNavigator<RootStackParamList>();

const RootNavigator = () => {
  return (
    <RootStack.Navigator
      initialRouteName="OnboardingWelcome"
      screenOptions={{
        contentStyle: { backgroundColor: "#F9FAFB" },
      }}
    >
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
        name="PixieVoltIntro"
        component={PixieVoltIntroScreen}
        options={{ headerShown: false }}
      />
      <RootStack.Screen
        name="PixieVoltName"
        component={PixieVoltNameScreen}
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
          headerShown: false,
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
        name="PixieVoltTab"
        component={PixieVoltScreen}
        options={{
          title: "PixieVolt",
          headerShown: false,
          tabBarIcon: ({ color, size }) => <Sparkles size={size} color={color} />,
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
