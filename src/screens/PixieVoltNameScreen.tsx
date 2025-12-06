import React, { useState } from "react";
import { View, Text, TextInput, Pressable, KeyboardAvoidingView, Platform, ActivityIndicator, Alert } from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { SafeAreaView } from "react-native-safe-area-context";
import { Sparkles } from "lucide-react-native";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import type { RootStackScreenProps } from "@/navigation/types";
import { api } from "@/lib/api";
import type { CreateBlipkinResponse } from "@/shared/contracts";

type Props = RootStackScreenProps<"PixieVoltName">;

const PixieVoltNameScreen = ({ navigation }: Props) => {
  const [name, setName] = useState("");
  const queryClient = useQueryClient();

  const createBlipkinMutation = useMutation({
    mutationFn: (blipkinName: string) =>
      api.post<CreateBlipkinResponse>("/api/blipkin", { name: blipkinName }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["blipkin"] });
      // Navigate to main tabs (PixieVolt tab)
      navigation.replace("Tabs", { screen: "PixieVoltTab" });
    },
    onError: (error: any) => {
      Alert.alert("Error", "Failed to create your Blipkin. Please try again.");
      console.error("Failed to create Blipkin:", error);
    },
  });

  const handleContinue = () => {
    const trimmedName = name.trim();
    if (trimmedName && !createBlipkinMutation.isPending) {
      createBlipkinMutation.mutate(trimmedName);
    }
  };

  const isValid = name.trim().length > 0 && name.trim().length <= 20;

  return (
    <View style={{ flex: 1, backgroundColor: "#FFFFFF" }}>
      <LinearGradient
        colors={["#6366F1", "#8B5CF6"]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={{ flex: 0.4 }}
      >
        <SafeAreaView edges={["top"]} style={{ flex: 1 }}>
          <View className="flex-1 justify-center items-center px-8">
            {/* Icon */}
            <View className="bg-white/20 rounded-full p-5 mb-6">
              <Sparkles size={56} color="#FFFFFF" strokeWidth={1.5} />
            </View>

            {/* Title */}
            <Text className="text-3xl font-bold text-white text-center">
              Name your Blipkin
            </Text>
          </View>
        </SafeAreaView>
      </LinearGradient>

      <KeyboardAvoidingView
        style={{ flex: 0.6 }}
        behavior={Platform.OS === "ios" ? "padding" : "height"}
      >
        <View className="flex-1 px-8 pt-12">
          {/* Description */}
          <Text className="text-gray-600 text-center text-base mb-8 leading-relaxed">
            This is your own PixieVolt companion.{"\n"}
            Give them a name and they&apos;ll grow with you.
          </Text>

          {/* Name Input */}
          <View className="mb-6">
            <TextInput
              value={name}
              onChangeText={setName}
              placeholder="Enter a name..."
              placeholderTextColor="#9CA3AF"
              className="bg-gray-100 rounded-2xl px-6 py-4 text-lg text-gray-900 text-center font-medium"
              maxLength={20}
              autoFocus
              editable={!createBlipkinMutation.isPending}
              returnKeyType="done"
              onSubmitEditing={handleContinue}
            />
            <Text className="text-gray-400 text-sm text-center mt-2">
              {name.length}/20 characters
            </Text>
          </View>

          {/* Continue Button */}
          <Pressable
            onPress={handleContinue}
            disabled={!isValid || createBlipkinMutation.isPending}
            className={`rounded-2xl px-8 py-5 shadow-lg ${
              isValid && !createBlipkinMutation.isPending
                ? "bg-purple-600 active:bg-purple-700"
                : "bg-gray-300"
            }`}
            style={{ transform: [{ scale: 1 }] }}
          >
            {createBlipkinMutation.isPending ? (
              <ActivityIndicator color="#FFFFFF" />
            ) : (
              <Text
                className={`text-center text-lg font-bold ${
                  isValid ? "text-white" : "text-gray-500"
                }`}
              >
                Continue
              </Text>
            )}
          </Pressable>
        </View>
      </KeyboardAvoidingView>
    </View>
  );
};

export default PixieVoltNameScreen;
