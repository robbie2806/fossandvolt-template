import React, { useEffect, useState } from "react";
import { View, Text, Pressable, ActivityIndicator } from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { Sparkles } from "lucide-react-native";
import { useFocusEffect } from "@react-navigation/native";
import type { RootStackScreenProps } from "@/navigation/types";
import { authClient } from "@/lib/authClient";
import { api } from "@/lib/api";

type Props = RootStackScreenProps<"OnboardingWelcome">;

const OnboardingWelcomeScreen = ({ navigation }: Props) => {
  const [isChecking, setIsChecking] = useState(true);
  const [isCreatingAccount, setIsCreatingAccount] = useState(false);

  useFocusEffect(
    React.useCallback(() => {
      let isActive = true;

      async function checkAuthStatus() {
        // Small delay to ensure navigation context is ready
        await new Promise(resolve => setTimeout(resolve, 100));

        try {
          const session = await authClient.getSession();

          if (!isActive) return;

          if (session?.data?.user) {
            // User is logged in, check if they have a companion AND Blipkin
            let hasCompanion = false;
            let hasBlipkin = false;

            try {
              await api.get("/api/companion");
              hasCompanion = true;
            } catch (error) {
              console.log("[OnboardingWelcome] No companion found:", error);
            }

            try {
              await api.get("/api/blipkin");
              hasBlipkin = true;
            } catch (error) {
              console.log("[OnboardingWelcome] No Blipkin found:", error);
            }

            if (!isActive) return;

            // If they have both, go to tabs
            if (hasCompanion && hasBlipkin) {
              navigation.replace("Tabs");
              return;
            }

            // If they have companion but no Blipkin, show PixieVolt onboarding
            if (hasCompanion && !hasBlipkin) {
              navigation.replace("PixieVoltIntro");
              return;
            }

            // If they have neither, stay on welcome screen
          }
        } catch (error) {
          console.log("[OnboardingWelcome] Auth check error:", error);
        } finally {
          if (isActive) {
            setIsChecking(false);
          }
        }
      }

      checkAuthStatus();

      return () => {
        isActive = false;
      };
    }, [navigation])
  );

  if (isChecking) {
    return (
      <View style={{ flex: 1 }}>
        <LinearGradient
          colors={["#8B5CF6", "#EC4899"]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={{ flex: 1, justifyContent: "center", alignItems: "center" }}
        >
          <ActivityIndicator size="large" color="#FFFFFF" />
        </LinearGradient>
      </View>
    );
  }

  const handleStart = async () => {
    setIsCreatingAccount(true);
    try {
      // Check if already logged in
      const session = await authClient.getSession();
      if (session?.data?.user) {
        // Already logged in, proceed to name screen
        navigation.navigate("OnboardingName");
        return;
      }

      // Create anonymous account
      const uniqueId = `guest_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
      const email = `${uniqueId}@pixievolt.app`;
      const password = Math.random().toString(36).substring(2) + Math.random().toString(36).substring(2);

      await authClient.signUp.email({
        email,
        password,
        name: "Guest",
      });

      // Navigate to name screen
      navigation.navigate("OnboardingName");
    } catch (error) {
      console.error("Failed to create account:", error);
      alert("Failed to start. Please try again.");
    } finally {
      setIsCreatingAccount(false);
    }
  };

  return (
    <View style={{ flex: 1 }}>
      <LinearGradient
        colors={["#8B5CF6", "#EC4899"]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={{ flex: 1 }}
      >
        <View className="flex-1 justify-center items-center px-8">
          {/* Icon */}
          <View className="mb-8 bg-white/20 rounded-full p-6">
            <Sparkles size={64} color="#FFFFFF" />
          </View>

          {/* Title */}
          <Text className="text-4xl font-bold text-white text-center mb-4">
            Welcome to PixieVolt AI
          </Text>

          {/* Subtitle */}
          <Text className="text-lg text-white/90 text-center mb-12 leading-relaxed">
            Create your own personal AI companion and digital pet. Watch them grow stronger every day
          </Text>

          {/* Start Button */}
          <Pressable
            onPress={handleStart}
            disabled={isCreatingAccount}
            className={`rounded-2xl px-12 py-4 shadow-lg ${isCreatingAccount ? "bg-white/30" : "bg-white active:scale-95"}`}
            style={{ transform: [{ scale: 1 }] }}
          >
            {isCreatingAccount ? (
              <ActivityIndicator color="#8B5CF6" />
            ) : (
              <Text className="text-purple-600 text-xl font-semibold">Start</Text>
            )}
          </Pressable>

          {/* Legal text */}
          <Text className="text-white/60 text-xs text-center mt-16 px-8 leading-relaxed">
            This app is for entertainment and productivity only.{"\n"}
            Not a therapist or medical service.
          </Text>
        </View>
      </LinearGradient>
    </View>
  );
};

export default OnboardingWelcomeScreen;
