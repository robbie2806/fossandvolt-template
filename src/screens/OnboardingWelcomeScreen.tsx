import React from "react";
import { View, Text, Pressable } from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { Sparkles } from "lucide-react-native";
import type { RootStackScreenProps } from "@/navigation/types";

type Props = RootStackScreenProps<"OnboardingWelcome">;

const OnboardingWelcomeScreen = ({ navigation }: Props) => {
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
            Welcome to BondNode
          </Text>

          {/* Subtitle */}
          <Text className="text-lg text-white/90 text-center mb-12 leading-relaxed">
            Create your own personal AI companion and watch your bond grow stronger every day
          </Text>

          {/* Start Button */}
          <Pressable
            onPress={() => navigation.navigate("OnboardingName")}
            className="bg-white rounded-2xl px-12 py-4 shadow-lg active:scale-95"
            style={{ transform: [{ scale: 1 }] }}
          >
            <Text className="text-purple-600 text-xl font-semibold">Start</Text>
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
