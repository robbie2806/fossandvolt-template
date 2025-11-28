import React, { useState } from "react";
import {
  View,
  Text,
  ScrollView,
  Pressable,
  TextInput,
  ActivityIndicator,
  Modal,
} from "react-native";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { LinearGradient } from "expo-linear-gradient";
import { Target, CheckCircle2, Heart, Trophy, Calendar } from "lucide-react-native";
import type { BottomTabScreenProps } from "@/navigation/types";
import { api } from "@/lib/api";
import type {
  GetBondStatusResponse,
  GetCompanionResponse,
  SubmitCheckInResponse,
  SubmitGratitudeResponse,
  SubmitGoalResponse,
} from "@/shared/contracts";

type Props = BottomTabScreenProps<"BondTab">;

const BondScreen = ({ navigation }: Props) => {
  const queryClient = useQueryClient();
  const [checkInModalVisible, setCheckInModalVisible] = useState(false);
  const [selectedMood, setSelectedMood] = useState<number | null>(null);
  const [reflection, setReflection] = useState("");
  const [gratitudeModalVisible, setGratitudeModalVisible] = useState(false);
  const [gratitudeText, setGratitudeText] = useState("");
  const [goalModalVisible, setGoalModalVisible] = useState(false);
  const [goalText, setGoalText] = useState("");

  const { data: companion } = useQuery({
    queryKey: ["companion"],
    queryFn: () => api.get<GetCompanionResponse>("/api/companion"),
  });

  const { data: bondStatus, isLoading } = useQuery({
    queryKey: ["bond"],
    queryFn: () => api.get<GetBondStatusResponse>("/api/bond"),
  });

  const checkInMutation = useMutation({
    mutationFn: ({ mood, reflection }: { mood: number; reflection?: string }) =>
      api.post<SubmitCheckInResponse>("/api/bond/check-in", { mood, reflection }),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["bond"] });
      queryClient.invalidateQueries({ queryKey: ["companion"] });
      setCheckInModalVisible(false);
      setSelectedMood(null);
      setReflection("");
      alert(`${data.aiResponse}\n\n+${data.xpAwarded} XP!`);
    },
  });

  const gratitudeMutation = useMutation({
    mutationFn: (content: string) =>
      api.post<SubmitGratitudeResponse>("/api/bond/gratitude", { content }),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["bond"] });
      queryClient.invalidateQueries({ queryKey: ["companion"] });
      setGratitudeModalVisible(false);
      setGratitudeText("");
      alert(`Gratitude saved! +${data.xpAwarded} XP`);
    },
  });

  const goalMutation = useMutation({
    mutationFn: (content: string) =>
      api.post<SubmitGoalResponse>("/api/bond/goal", { content }),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["bond"] });
      queryClient.invalidateQueries({ queryKey: ["companion"] });
      setGoalModalVisible(false);
      setGoalText("");
      alert(`Goal set! +${data.xpAwarded} XP`);
    },
  });

  const bondProgress = bondStatus
    ? (bondStatus.bondXP / bondStatus.xpForNextLevel) * 100
    : 0;

  const MOOD_EMOJIS = ["😢", "😕", "😐", "😊", "😄"];

  return (
    <View style={{ flex: 1, backgroundColor: "#F9FAFB" }}>
      <ScrollView contentContainerStyle={{ paddingBottom: 100 }}>
        {/* Header */}
        <LinearGradient
          colors={["#8B5CF6", "#EC4899"]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={{ paddingHorizontal: 20, paddingVertical: 40 }}
        >
          <View className="items-center">
            <View className="bg-white/20 rounded-full p-4 mb-4">
              <Target size={48} color="#FFFFFF" />
            </View>
            <Text className="text-white text-2xl font-bold mb-2">
              {companion?.name || "AI Companion"}
            </Text>
            <Text className="text-white/90 text-lg mb-6">
              Bond Level {bondStatus?.bondLevel || 1}
            </Text>

            {/* Progress Bar */}
            <View className="w-full bg-white/30 rounded-full h-3 mb-2">
              <View
                className="bg-white rounded-full h-3"
                style={{ width: `${bondProgress}%` }}
              />
            </View>
            <Text className="text-white/80 text-sm">
              {bondStatus?.bondXP || 0} / {bondStatus?.xpForNextLevel || 100} XP
            </Text>
          </View>
        </LinearGradient>

        {/* Today's Actions */}
        <View className="px-4 py-6">
          <Text className="text-gray-900 text-xl font-bold mb-4">
            Today&apos;s Actions
          </Text>
          <View className="gap-3">
            {/* Check-in */}
            <Pressable
              onPress={() => setCheckInModalVisible(true)}
              disabled={bondStatus?.todayActions.hasCheckedIn}
              className={`rounded-2xl p-5 flex-row items-center justify-between ${
                bondStatus?.todayActions.hasCheckedIn
                  ? "bg-green-100 border-2 border-green-300"
                  : "bg-white border-2 border-gray-200"
              }`}
            >
              <View className="flex-row items-center gap-3">
                <View className={`rounded-full p-2 ${bondStatus?.todayActions.hasCheckedIn ? "bg-green-500" : "bg-purple-100"}`}>
                  <Calendar size={24} color={bondStatus?.todayActions.hasCheckedIn ? "#FFFFFF" : "#8B5CF6"} />
                </View>
                <View>
                  <Text className="text-gray-900 font-semibold text-base">
                    Daily Check-in
                  </Text>
                  <Text className="text-gray-500 text-sm">+20 XP</Text>
                </View>
              </View>
              {bondStatus?.todayActions.hasCheckedIn && (
                <CheckCircle2 size={24} color="#10B981" />
              )}
            </Pressable>

            {/* Gratitude */}
            <Pressable
              onPress={() => setGratitudeModalVisible(true)}
              disabled={bondStatus?.todayActions.hasGratitude}
              className={`rounded-2xl p-5 flex-row items-center justify-between ${
                bondStatus?.todayActions.hasGratitude
                  ? "bg-green-100 border-2 border-green-300"
                  : "bg-white border-2 border-gray-200"
              }`}
            >
              <View className="flex-row items-center gap-3">
                <View className={`rounded-full p-2 ${bondStatus?.todayActions.hasGratitude ? "bg-green-500" : "bg-pink-100"}`}>
                  <Heart size={24} color={bondStatus?.todayActions.hasGratitude ? "#FFFFFF" : "#EC4899"} />
                </View>
                <View>
                  <Text className="text-gray-900 font-semibold text-base">
                    Gratitude Note
                  </Text>
                  <Text className="text-gray-500 text-sm">+10 XP</Text>
                </View>
              </View>
              {bondStatus?.todayActions.hasGratitude && (
                <CheckCircle2 size={24} color="#10B981" />
              )}
            </Pressable>

            {/* Goal */}
            <Pressable
              onPress={() => setGoalModalVisible(true)}
              disabled={bondStatus?.todayActions.hasGoal}
              className={`rounded-2xl p-5 flex-row items-center justify-between ${
                bondStatus?.todayActions.hasGoal
                  ? "bg-green-100 border-2 border-green-300"
                  : "bg-white border-2 border-gray-200"
              }`}
            >
              <View className="flex-row items-center gap-3">
                <View className={`rounded-full p-2 ${bondStatus?.todayActions.hasGoal ? "bg-green-500" : "bg-blue-100"}`}>
                  <Trophy size={24} color={bondStatus?.todayActions.hasGoal ? "#FFFFFF" : "#3B82F6"} />
                </View>
                <View>
                  <Text className="text-gray-900 font-semibold text-base">
                    Mini Goal
                  </Text>
                  <Text className="text-gray-500 text-sm">+10 XP</Text>
                </View>
              </View>
              {bondStatus?.todayActions.hasGoal && (
                <CheckCircle2 size={24} color="#10B981" />
              )}
            </Pressable>
          </View>
        </View>
      </ScrollView>

      {/* Check-in Modal */}
      <Modal
        visible={checkInModalVisible}
        animationType="slide"
        transparent
        onRequestClose={() => setCheckInModalVisible(false)}
      >
        <View className="flex-1 bg-black/50 justify-end">
          <View className="bg-white rounded-t-3xl p-6">
            <Text className="text-2xl font-bold text-gray-900 mb-4">Daily Check-in</Text>
            <Text className="text-gray-600 mb-4">How are you feeling today?</Text>
            <View className="flex-row justify-between mb-6">
              {MOOD_EMOJIS.map((emoji, idx) => (
                <Pressable
                  key={idx}
                  onPress={() => setSelectedMood(idx + 1)}
                  className={`p-4 rounded-2xl ${selectedMood === idx + 1 ? "bg-purple-100" : "bg-gray-100"}`}
                >
                  <Text className="text-3xl">{emoji}</Text>
                </Pressable>
              ))}
            </View>
            <TextInput
              value={reflection}
              onChangeText={setReflection}
              placeholder="Anything you want to share? (optional)"
              placeholderTextColor="#9CA3AF"
              className="bg-gray-100 rounded-2xl p-4 mb-4 text-gray-900"
              multiline
              numberOfLines={3}
            />
            <View className="flex-row gap-3">
              <Pressable
                onPress={() => setCheckInModalVisible(false)}
                className="flex-1 bg-gray-200 rounded-2xl py-4"
              >
                <Text className="text-gray-700 text-center font-semibold">Cancel</Text>
              </Pressable>
              <Pressable
                onPress={() => {
                  if (selectedMood) {
                    checkInMutation.mutate({ mood: selectedMood, reflection });
                  }
                }}
                disabled={!selectedMood || checkInMutation.isPending}
                className={`flex-1 rounded-2xl py-4 ${selectedMood ? "bg-purple-600" : "bg-gray-300"}`}
              >
                {checkInMutation.isPending ? (
                  <ActivityIndicator color="#FFFFFF" />
                ) : (
                  <Text className="text-white text-center font-semibold">Submit</Text>
                )}
              </Pressable>
            </View>
          </View>
        </View>
      </Modal>

      {/* Gratitude Modal */}
      <Modal
        visible={gratitudeModalVisible}
        animationType="slide"
        transparent
        onRequestClose={() => setGratitudeModalVisible(false)}
      >
        <View className="flex-1 bg-black/50 justify-end">
          <View className="bg-white rounded-t-3xl p-6">
            <Text className="text-2xl font-bold text-gray-900 mb-4">Gratitude Note</Text>
            <Text className="text-gray-600 mb-4">What are you grateful for today?</Text>
            <TextInput
              value={gratitudeText}
              onChangeText={setGratitudeText}
              placeholder="I'm grateful for..."
              placeholderTextColor="#9CA3AF"
              className="bg-gray-100 rounded-2xl p-4 mb-4 text-gray-900"
              multiline
              numberOfLines={4}
            />
            <View className="flex-row gap-3">
              <Pressable
                onPress={() => setGratitudeModalVisible(false)}
                className="flex-1 bg-gray-200 rounded-2xl py-4"
              >
                <Text className="text-gray-700 text-center font-semibold">Cancel</Text>
              </Pressable>
              <Pressable
                onPress={() => gratitudeMutation.mutate(gratitudeText)}
                disabled={!gratitudeText.trim() || gratitudeMutation.isPending}
                className={`flex-1 rounded-2xl py-4 ${gratitudeText.trim() ? "bg-pink-600" : "bg-gray-300"}`}
              >
                {gratitudeMutation.isPending ? (
                  <ActivityIndicator color="#FFFFFF" />
                ) : (
                  <Text className="text-white text-center font-semibold">Save</Text>
                )}
              </Pressable>
            </View>
          </View>
        </View>
      </Modal>

      {/* Goal Modal */}
      <Modal
        visible={goalModalVisible}
        animationType="slide"
        transparent
        onRequestClose={() => setGoalModalVisible(false)}
      >
        <View className="flex-1 bg-black/50 justify-end">
          <View className="bg-white rounded-t-3xl p-6">
            <Text className="text-2xl font-bold text-gray-900 mb-4">Mini Goal</Text>
            <Text className="text-gray-600 mb-4">What&apos;s one thing you want to accomplish today?</Text>
            <TextInput
              value={goalText}
              onChangeText={setGoalText}
              placeholder="Today I will..."
              placeholderTextColor="#9CA3AF"
              className="bg-gray-100 rounded-2xl p-4 mb-4 text-gray-900"
              multiline
              numberOfLines={3}
            />
            <View className="flex-row gap-3">
              <Pressable
                onPress={() => setGoalModalVisible(false)}
                className="flex-1 bg-gray-200 rounded-2xl py-4"
              >
                <Text className="text-gray-700 text-center font-semibold">Cancel</Text>
              </Pressable>
              <Pressable
                onPress={() => goalMutation.mutate(goalText)}
                disabled={!goalText.trim() || goalMutation.isPending}
                className={`flex-1 rounded-2xl py-4 ${goalText.trim() ? "bg-blue-600" : "bg-gray-300"}`}
              >
                {goalMutation.isPending ? (
                  <ActivityIndicator color="#FFFFFF" />
                ) : (
                  <Text className="text-white text-center font-semibold">Set Goal</Text>
                )}
              </Pressable>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
};

export default BondScreen;
