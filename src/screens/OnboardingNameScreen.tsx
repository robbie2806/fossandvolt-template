import React, { useState } from "react";
import { View, Text, TextInput, Pressable, KeyboardAvoidingView, Platform, ActivityIndicator } from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import type { RootStackScreenProps } from "@/navigation/types";
import { api } from "@/lib/api";
import type { CreateCompanionResponse, CreateBlipkinResponse } from "@/shared/contracts";

type Props = RootStackScreenProps<"OnboardingName">;

const OnboardingNameScreen = ({ navigation }: Props) => {
  const [blipkinName, setBlipkinName] = useState("");
  const queryClient = useQueryClient();

  const createBlipkinMutation = useMutation({
    mutationFn: async () => {
      if (!blipkinName.trim()) throw new Error("Name is required");

      // Create companion first (backend requirement)
      await api.post<CreateCompanionResponse>("/api/companion", {
        name: blipkinName.trim(),
        vibe: "chill",
      });

      // Then create Blipkin with same name
      return api.post<CreateBlipkinResponse>("/api/blipkin", {
        name: blipkinName.trim(),
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["companion"] });
      queryClient.invalidateQueries({ queryKey: ["blipkin"] });
      // Go straight to tabs
      navigation.replace("Tabs");
    },
    onError: (error: any) => {
      console.error("Failed to create Blipkin:", error);
      alert("Failed to create your Blipkin. Please try again.");
    },
  });

  const handleContinue = () => {
    if (blipkinName.trim()) {
      createBlipkinMutation.mutate();
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
              value={blipkinName}
              onChangeText={setBlipkinName}
              placeholder="Enter name..."
              placeholderTextColor="rgba(255,255,255,0.5)"
              className="bg-white/20 text-white text-2xl font-semibold rounded-2xl px-6 py-4 text-center"
              autoFocus
              maxLength={20}
              onSubmitEditing={handleContinue}
              editable={!createBlipkinMutation.isPending}
            />
            <Text className="text-white/60 text-sm text-center mt-3">
              You can change this later in settings
            </Text>
          </View>

          {/* Continue Button */}
          <Pressable
            onPress={handleContinue}
            disabled={!blipkinName.trim() || createBlipkinMutation.isPending}
            className={`rounded-2xl px-12 py-4 shadow-lg ${blipkinName.trim() && !createBlipkinMutation.isPending ? "bg-white active:scale-95" : "bg-white/30"}`}
            style={{ transform: [{ scale: 1 }] }}
          >
            {createBlipkinMutation.isPending ? (
              <ActivityIndicator color="#8B5CF6" />
            ) : (
              <Text
                className={`text-xl font-semibold ${blipkinName.trim() ? "text-purple-600" : "text-white/50"}`}
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
