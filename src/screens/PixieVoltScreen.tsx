import React from "react";
import { View, Text, Pressable, ScrollView, ActivityIndicator, Alert, Image } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { LinearGradient } from "expo-linear-gradient";
import { Sparkles, Apple, Gamepad2, MessageCircle } from "lucide-react-native";
import * as Haptics from "expo-haptics";
import type { BottomTabScreenProps } from "@/navigation/types";
import { api } from "@/lib/api";
import type {
  GetBlipkinResponse,
  FeedBlipkinResponse,
  PlayBlipkinResponse,
} from "@/shared/contracts";

type Props = BottomTabScreenProps<"PixieVoltTab">;

// Helper function to get the correct Blipkin image based on evolution stage
const getBlipkinImage = (evolutionStage: string, megaForm?: string | null) => {
  if (evolutionStage === "mega" && megaForm) {
    const megaImages: Record<string, any> = {
      nurturer: require("../../assets/blipkin-mega-nurturer.png"),
      explorer: require("../../assets/blipkin-mega-nurturer.png"), // Using nurturer for explorer (you can add explorer later)
      chaos: require("../../assets/blipkin-mega-chaos.png"),
      calm: require("../../assets/blipkin-mega-calm.png"),
    };
    return megaImages[megaForm] || require("../../assets/blipkin-adult.png");
  }

  const stageImages: Record<string, any> = {
    baby: require("../../assets/blipkin-baby.png"),
    child: require("../../assets/blipkin-child.png"),
    teen: require("../../assets/blipkin-teen.png"),
    adult: require("../../assets/blipkin-adult.png"),
    elder: require("../../assets/blipkin-elder.png"),
  };

  return stageImages[evolutionStage] || require("../../assets/blipkin-baby.png");
};

const PixieVoltScreen = ({ navigation }: Props) => {
  const queryClient = useQueryClient();

  // Fetch Blipkin data
  const { data: blipkin, isLoading } = useQuery({
    queryKey: ["blipkin"],
    queryFn: () => api.get<GetBlipkinResponse>("/api/blipkin"),
  });

  // Feed mutation
  const feedMutation = useMutation({
    mutationFn: () => api.post<FeedBlipkinResponse>("/api/blipkin/feed"),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["blipkin"] });
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);

      if (data.leveledUp) {
        Alert.alert(
          "Level Up! 🎉",
          `${blipkin?.name} reached Level ${data.blipkin.level}!`,
          [{ text: "Awesome!" }]
        );
      } else {
        Alert.alert("Fed!", data.message, [{ text: "OK" }]);
      }
    },
  });

  // Play mutation
  const playMutation = useMutation({
    mutationFn: () => api.post<PlayBlipkinResponse>("/api/blipkin/play"),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["blipkin"] });
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);

      if (data.leveledUp) {
        Alert.alert(
          "Level Up! 🎉",
          `${blipkin?.name} reached Level ${data.blipkin.level}!`,
          [{ text: "Awesome!" }]
        );
      } else {
        Alert.alert("Fun!", data.message, [{ text: "OK" }]);
      }
    },
  });

  const handleChat = () => {
    navigation.navigate("ChatTab");
  };

  if (isLoading) {
    return (
      <View style={{ flex: 1, backgroundColor: "#F9FAFB" }} className="justify-center items-center">
        <ActivityIndicator size="large" color="#8B5CF6" />
      </View>
    );
  }

  if (!blipkin) {
    return (
      <View style={{ flex: 1, backgroundColor: "#F9FAFB" }} className="justify-center items-center px-8">
        <Sparkles size={64} color="#D1D5DB" />
        <Text className="text-gray-400 text-center mt-4 text-lg">
          No Blipkin found. Complete PixieVolt onboarding first.
        </Text>
      </View>
    );
  }

  // Calculate XP progress
  const xpForNextLevel = blipkin.level * 100;
  const xpProgress = (blipkin.xp / xpForNextLevel) * 100;

  // Mood emoji mapping
  const moodEmoji: Record<string, string> = {
    Happy: "😊",
    Sleepy: "😴",
    Lonely: "😔",
    Excited: "🤩",
    Hungry: "😋",
    Content: "😌",
    Joyful: "😄",
  };

  return (
    <View style={{ flex: 1, backgroundColor: "#F9FAFB" }}>
      <SafeAreaView edges={["top"]} style={{ backgroundColor: "#FFFFFF" }}>
        {/* Header */}
        <View className="bg-white px-6 py-4 border-b border-gray-200">
          <Text className="text-2xl font-bold text-gray-900">PixieVolt AI</Text>
          <Text className="text-sm text-gray-500 mt-1">Your digital companion</Text>
        </View>
      </SafeAreaView>

      <ScrollView
        contentContainerStyle={{ paddingBottom: 100 }}
        showsVerticalScrollIndicator={false}
      >
        <View className="px-6 pt-6">
          {/* Blipkin Card */}
          <View className="bg-white rounded-3xl shadow-lg overflow-hidden mb-6">
            <LinearGradient
              colors={["#6366F1", "#8B5CF6", "#EC4899"]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={{ padding: 24 }}
            >
              {/* Blipkin Avatar - Pixel Art Image */}
              <View className="items-center mb-6">
                <View className="bg-white/20 rounded-3xl p-6 mb-4">
                  <Image
                    source={getBlipkinImage(blipkin.evolutionStage, blipkin.megaForm)}
                    style={{ width: 120, height: 120 }}
                    resizeMode="contain"
                  />
                </View>

                {/* Name */}
                <Text className="text-3xl font-bold text-white mb-2">{blipkin.name}</Text>

                {/* Status */}
                <Text className="text-white/90 text-lg">
                  {moodEmoji[blipkin.mood] || "✨"} {blipkin.mood} • Level {blipkin.level}
                </Text>

                {/* Evolution Stage Badge */}
                <View className="bg-white/20 rounded-full px-4 py-1 mt-2">
                  <Text className="text-white/90 text-sm font-medium capitalize">
                    {blipkin.evolutionStage === "mega" && blipkin.megaForm
                      ? `Mega ${blipkin.megaForm}`
                      : blipkin.evolutionStage}
                  </Text>
                </View>
              </View>

              {/* XP Progress Bar */}
              <View className="mb-4">
                <View className="flex-row justify-between mb-2">
                  <Text className="text-white/80 text-sm font-medium">Level {blipkin.level}</Text>
                  <Text className="text-white/80 text-sm font-medium">
                    {blipkin.xp}/{xpForNextLevel} XP
                  </Text>
                </View>
                <View className="bg-white/20 rounded-full h-3 overflow-hidden">
                  <View
                    className="bg-white rounded-full h-full"
                    style={{ width: `${xpProgress}%` }}
                  />
                </View>
              </View>

              {/* Stats Row */}
              <View className="flex-row justify-between">
                <View className="flex-1">
                  <Text className="text-white/70 text-xs mb-1">Bond</Text>
                  <Text className="text-white text-lg font-bold">{blipkin.bond}/100</Text>
                </View>
                <View className="flex-1">
                  <Text className="text-white/70 text-xs mb-1">Energy</Text>
                  <Text className="text-white text-lg font-bold">{blipkin.energy}/100</Text>
                </View>
                <View className="flex-1">
                  <Text className="text-white/70 text-xs mb-1">Hunger</Text>
                  <Text className="text-white text-lg font-bold">{blipkin.hunger}/100</Text>
                </View>
              </View>
            </LinearGradient>
          </View>

          {/* Missed You Message */}
          {blipkin.missedYou && (
            <View className="bg-purple-50 rounded-2xl p-4 mb-6 border border-purple-200">
              <Text className="text-purple-900 text-center font-medium">
                💜 Your Blipkin missed you!
              </Text>
            </View>
          )}

          {/* Action Buttons */}
          <View className="gap-4 mb-6">
            {/* Feed Button */}
            <Pressable
              onPress={() => feedMutation.mutate()}
              disabled={feedMutation.isPending}
              className="bg-white rounded-2xl shadow-md active:scale-95 border border-gray-100"
              style={{ transform: [{ scale: 1 }] }}
            >
              <View className="flex-row items-center justify-between p-5">
                <View className="flex-row items-center gap-4">
                  <View className="bg-purple-100 rounded-full p-3">
                    <Apple size={28} color="#8B5CF6" strokeWidth={2} />
                  </View>
                  <View>
                    <Text className="text-purple-600 text-lg font-bold">Feed</Text>
                    <Text className="text-purple-400 text-sm">-25 Hunger • +5 XP • +3 Bond</Text>
                  </View>
                </View>
                {feedMutation.isPending && <ActivityIndicator color="#8B5CF6" />}
              </View>
            </Pressable>

            {/* Play Button */}
            <Pressable
              onPress={() => playMutation.mutate()}
              disabled={playMutation.isPending}
              className="bg-white rounded-2xl shadow-md active:scale-95 border border-gray-100"
              style={{ transform: [{ scale: 1 }] }}
            >
              <View className="flex-row items-center justify-between p-5">
                <View className="flex-row items-center gap-4">
                  <View className="bg-purple-100 rounded-full p-3">
                    <Gamepad2 size={28} color="#8B5CF6" strokeWidth={2} />
                  </View>
                  <View>
                    <Text className="text-purple-600 text-lg font-bold">Play</Text>
                    <Text className="text-purple-400 text-sm">-10 Energy • +8 XP • +5 Bond</Text>
                  </View>
                </View>
                {playMutation.isPending && <ActivityIndicator color="#8B5CF6" />}
              </View>
            </Pressable>

            {/* Chat Button */}
            <Pressable
              onPress={handleChat}
              className="bg-white rounded-2xl shadow-md active:scale-95 border border-gray-100"
              style={{ transform: [{ scale: 1 }] }}
            >
              <View className="flex-row items-center justify-between p-5">
                <View className="flex-row items-center gap-4">
                  <View className="bg-purple-100 rounded-full p-3">
                    <MessageCircle size={28} color="#8B5CF6" strokeWidth={2} />
                  </View>
                  <View>
                    <Text className="text-purple-600 text-lg font-bold">Chat</Text>
                    <Text className="text-purple-400 text-sm">Talk with {blipkin.name}</Text>
                  </View>
                </View>
              </View>
            </Pressable>
          </View>
        </View>
      </ScrollView>
    </View>
  );
};

export default PixieVoltScreen;
