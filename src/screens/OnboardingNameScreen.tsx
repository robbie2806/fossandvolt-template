import React, { useState } from "react";
import { View, Text, TextInput, Pressable, KeyboardAvoidingView, Platform, ActivityIndicator } from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { useMutation } from "@tanstack/react-query";
import type { RootStackScreenProps } from "@/navigation/types";
import { api } from "@/lib/api";
import type { CreateCompanionResponse } from "@/shared/contracts";

type Props = RootStackScreenProps<"OnboardingName">;

const OnboardingNameScreen = ({ navigation }: Props) => {
  const [aiName, setAiName] = useState("Nova");

  const createCompanionMutation = useMutation({
    mutationFn: async () => {
      if (!aiName.trim()) throw new Error("Name is required");
      return api.post<CreateCompanionResponse>("/api/companion", {
        name: aiName.trim(),
        vibe: "chill", // Default vibe
      });
    },
    onSuccess: () => {
      // After creating companion, go to PixieVolt onboarding
      navigation.navigate("PixieVoltIntro");
    },
    onError: (error: any) => {
      console.error("Failed to create companion:", error);
      alert("Failed to create your AI companion. Please try again.");
    },
  });

  const handleContinue = () => {
    if (aiName.trim()) {
      createCompanionMutation.mutate();
    }
  };

  return (
    <KeyboardAvoidingView
      style={{ flex: 1 }}
      behavior={Platform.OS === "ios" ? "padding" : "height"}
    >
      <LinearGradient
        colors={["#8B5CF6", "#EC4899"]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={{ flex: 1 }}
      >
        <View className="flex-1 justify-center items-center px-8">
          {/* Progress indicator */}
          <View className="flex-row gap-2 mb-12">
            <View className="w-8 h-1 bg-white/40 rounded-full" />
            <View className="w-8 h-1 bg-white rounded-full" />
          </View>

          {/* Title */}
          <Text className="text-3xl font-bold text-white text-center mb-4">
            Name your Blipkin
          </Text>

          {/* Subtitle */}
          <Text className="text-base text-white/80 text-center mb-8">
            Choose a name that feels right to you
          </Text>

          {/* Input */}
          <View className="w-full mb-8">
            <TextInput
              value={aiName}
              onChangeText={setAiName}
              placeholder="Enter name..."
              placeholderTextColor="rgba(255,255,255,0.5)"
              className="bg-white/20 text-white text-2xl font-semibold rounded-2xl px-6 py-4 text-center"
              autoFocus
              maxLength={20}
              onSubmitEditing={handleContinue}
              editable={!createCompanionMutation.isPending}
            />
            <Text className="text-white/60 text-sm text-center mt-3">
              You can change this later in settings
            </Text>
          </View>

          {/* Continue Button */}
          <Pressable
            onPress={handleContinue}
            disabled={!aiName.trim() || createCompanionMutation.isPending}
            className={`rounded-2xl px-12 py-4 shadow-lg ${aiName.trim() && !createCompanionMutation.isPending ? "bg-white active:scale-95" : "bg-white/30"}`}
            style={{ transform: [{ scale: 1 }] }}
          >
            {createCompanionMutation.isPending ? (
              <ActivityIndicator color="#8B5CF6" />
            ) : (
              <Text
                className={`text-xl font-semibold ${aiName.trim() ? "text-purple-600" : "text-white/50"}`}
              >
                Continue
              </Text>
            )}
          </Pressable>
        </View>
      </LinearGradient>
    </KeyboardAvoidingView>
  );
};

export default OnboardingNameScreen;
