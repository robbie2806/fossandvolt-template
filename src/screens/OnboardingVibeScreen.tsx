import React, { useState } from "react";
import { View, Text, Pressable, ScrollView, ActivityIndicator } from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { useMutation } from "@tanstack/react-query";
import { Zap, Target, Smile, Leaf } from "lucide-react-native";
import type { RootStackScreenProps } from "@/navigation/types";
import { api } from "@/lib/api";
import type { CreateCompanionResponse } from "@/shared/contracts";

type Props = RootStackScreenProps<"OnboardingVibe">;

type VibeOption = "chill" | "productive" | "playful" | "calm";

const VIBE_OPTIONS: Array<{
  id: VibeOption;
  label: string;
  description: string;
  icon: React.ReactNode;
  colors: string[];
}> = [
  {
    id: "chill",
    label: "Chill & Supportive",
    description: "Relaxed, friendly, and always understanding",
    icon: <Leaf size={32} color="#FFFFFF" />,
    colors: ["#34D399", "#10B981"],
  },
  {
    id: "productive",
    label: "Productive & Direct",
    description: "Focused, efficient, and motivating",
    icon: <Target size={32} color="#FFFFFF" />,
    colors: ["#3B82F6", "#2563EB"],
  },
  {
    id: "playful",
    label: "Playful & Cheeky",
    description: "Fun, lighthearted, and witty",
    icon: <Smile size={32} color="#FFFFFF" />,
    colors: ["#F59E0B", "#F97316"],
  },
  {
    id: "calm",
    label: "Calm & Reflective",
    description: "Peaceful, thoughtful, and mindful",
    icon: <Zap size={32} color="#FFFFFF" />,
    colors: ["#8B5CF6", "#7C3AED"],
  },
];

const OnboardingVibeScreen = ({ navigation, route }: Props) => {
  const { aiName } = route.params;
  const [selectedVibe, setSelectedVibe] = useState<VibeOption | null>(null);

  const createCompanionMutation = useMutation({
    mutationFn: async () => {
      if (!selectedVibe) throw new Error("No vibe selected");
      return api.post<CreateCompanionResponse>("/api/companion", {
        name: aiName,
        vibe: selectedVibe,
      });
    },
    onSuccess: () => {
      navigation.reset({
        index: 0,
        routes: [{ name: "Tabs" }],
      });
    },
    onError: (error: any) => {
      console.error("Failed to create companion:", error);
      alert("Failed to create your AI companion. Please try again.");
    },
  });

  const handleFinish = () => {
    if (selectedVibe) {
      createCompanionMutation.mutate();
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
        <ScrollView
          contentContainerStyle={{ flexGrow: 1, paddingHorizontal: 32, paddingVertical: 60 }}
          showsVerticalScrollIndicator={false}
        >
          {/* Progress indicator */}
          <View className="flex-row gap-2 mb-8 self-center">
            <View className="w-8 h-1 bg-white/40 rounded-full" />
            <View className="w-8 h-1 bg-white/40 rounded-full" />
            <View className="w-8 h-1 bg-white rounded-full" />
          </View>

          {/* Title */}
          <Text className="text-3xl font-bold text-white text-center mb-3">
            Choose {aiName}&apos;s vibe
          </Text>

          {/* Subtitle */}
          <Text className="text-base text-white/80 text-center mb-10">
            How should {aiName} communicate with you?
          </Text>

          {/* Vibe options */}
          <View className="gap-4 mb-8">
            {VIBE_OPTIONS.map((option) => (
              <Pressable
                key={option.id}
                onPress={() => setSelectedVibe(option.id)}
                className={`rounded-2xl overflow-hidden active:scale-98 ${
                  selectedVibe === option.id ? "ring-4 ring-white" : ""
                }`}
                style={{ transform: [{ scale: 1 }] }}
              >
                <LinearGradient
                  colors={
                    selectedVibe === option.id
                      ? (option.colors as [string, string])
                      : ["rgba(255,255,255,0.2)", "rgba(255,255,255,0.1)"]
                  }
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 1 }}
                  style={{ padding: 20 }}
                >
                  <View className="flex-row items-center gap-4">
                    <View className="bg-white/20 rounded-full p-3">{option.icon}</View>
                    <View className="flex-1">
                      <Text className="text-white text-lg font-bold mb-1">{option.label}</Text>
                      <Text className="text-white/80 text-sm">{option.description}</Text>
                    </View>
                  </View>
                </LinearGradient>
              </Pressable>
            ))}
          </View>

          {/* Finish Button */}
          <Pressable
            onPress={handleFinish}
            disabled={!selectedVibe || createCompanionMutation.isPending}
            className={`rounded-2xl px-12 py-5 shadow-lg self-center ${
              selectedVibe && !createCompanionMutation.isPending
                ? "bg-white active:scale-95"
                : "bg-white/30"
            }`}
            style={{ transform: [{ scale: 1 }] }}
          >
            {createCompanionMutation.isPending ? (
              <ActivityIndicator color="#8B5CF6" />
            ) : (
              <Text
                className={`text-xl font-semibold ${
                  selectedVibe ? "text-purple-600" : "text-white/50"
                }`}
              >
                Finish Setup
              </Text>
            )}
          </Pressable>
        </ScrollView>
      </LinearGradient>
    </View>
  );
};

export default OnboardingVibeScreen;
