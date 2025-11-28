import { StatusBar } from "expo-status-bar";
import { SafeAreaProvider } from "react-native-safe-area-context";
import { NavigationContainer } from "@react-navigation/native";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { queryClient } from "@/lib/queryClient";
import RootStackNavigator from "@/navigation/RootNavigator";
import { KeyboardProvider } from "react-native-keyboard-controller";
import { QueryClientProvider } from "@tanstack/react-query";
import { useEffect, useState } from "react";
import { View, ActivityIndicator } from "react-native";
import { authClient } from "@/lib/authClient";
import { api } from "@/lib/api";

function AppNavigator() {
  const [isReady, setIsReady] = useState(false);
  const [initialRoute, setInitialRoute] = useState<"OnboardingWelcome" | "Tabs">("OnboardingWelcome");

  useEffect(() => {
    async function checkAuthAndCompanion() {
      try {
        // Check if user is logged in
        const session = await authClient.getSession();

        if (session?.data?.user) {
          // User is logged in, check if they have a companion
          try {
            await api.get("/api/companion");
            // Has companion, go to main tabs
            setInitialRoute("Tabs");
          } catch (error) {
            // No companion, go to onboarding
            setInitialRoute("OnboardingWelcome");
          }
        } else {
          // Not logged in, go to onboarding (which will show login if needed)
          setInitialRoute("OnboardingWelcome");
        }
      } catch (error) {
        console.error("Error checking auth:", error);
        setInitialRoute("OnboardingWelcome");
      } finally {
        setIsReady(true);
      }
    }

    checkAuthAndCompanion();
  }, []);

  if (!isReady) {
    return (
      <View style={{ flex: 1, justifyContent: "center", alignItems: "center", backgroundColor: "#8B5CF6" }}>
        <ActivityIndicator size="large" color="#FFFFFF" />
      </View>
    );
  }

  return (
    <NavigationContainer>
      <RootStackNavigator key={initialRoute} />
      <StatusBar style="auto" />
    </NavigationContainer>
  );
}

export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <KeyboardProvider>
        <GestureHandlerRootView>
          <SafeAreaProvider>
            <AppNavigator />
          </SafeAreaProvider>
        </GestureHandlerRootView>
      </KeyboardProvider>
    </QueryClientProvider>
  );
}
