import React, { useState } from "react";
import { View, Text, ScrollView, Pressable, TextInput, Switch, Alert } from "react-native";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Settings as SettingsIcon, User, Bell, Info, LogOut, Sparkles } from "lucide-react-native";
import type { BottomTabScreenProps } from "@/navigation/types";
import { api } from "@/lib/api";
import { authClient } from "@/lib/authClient";
import type { GetCompanionResponse, GetSettingsResponse, UpdateSettingsResponse, GetBlipkinResponse } from "@/shared/contracts";

type Props = BottomTabScreenProps<"SettingsTab">;

const SettingsScreen = ({ navigation }: Props) => {
  const queryClient = useQueryClient();
  const [editingName, setEditingName] = useState(false);
  const [newName, setNewName] = useState("");
  const [editingBlipkinName, setEditingBlipkinName] = useState(false);
  const [newBlipkinName, setNewBlipkinName] = useState("");

  const { data: companion } = useQuery({
    queryKey: ["companion"],
    queryFn: () => api.get<GetCompanionResponse>("/api/companion"),
  });

  const { data: blipkin } = useQuery({
    queryKey: ["blipkin"],
    queryFn: () => api.get<GetBlipkinResponse>("/api/blipkin"),
    retry: false,
  });

  const { data: settings } = useQuery({
    queryKey: ["settings"],
    queryFn: () => api.get<GetSettingsResponse>("/api/settings"),
  });

  const updateCompanionMutation = useMutation({
    mutationFn: (data: { name?: string; vibe?: string }) =>
      api.put<GetCompanionResponse>("/api/companion", data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["companion"] });
      setEditingName(false);
      setNewName("");
    },
  });

  const updateBlipkinMutation = useMutation({
    mutationFn: (data: { name: string }) =>
      api.put<GetBlipkinResponse>("/api/blipkin", data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["blipkin"] });
      setEditingBlipkinName(false);
      setNewBlipkinName("");
    },
  });

  const updateSettingsMutation = useMutation({
    mutationFn: (data: Partial<GetSettingsResponse>) =>
      api.put<UpdateSettingsResponse>("/api/settings", data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["settings"] });
    },
  });

  const handleLogout = async () => {
    Alert.alert(
      "Log Out",
      "Are you sure you want to log out?",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Log Out",
          style: "destructive",
          onPress: async () => {
            await authClient.signOut();
            // Navigate to root and let App.tsx handle the onboarding flow
            navigation.getParent()?.reset({
              index: 0,
              routes: [{ name: "OnboardingWelcome" }],
            });
          },
        },
      ],
    );
  };

  const handleSaveName = () => {
    if (newName.trim() && newName.trim() !== companion?.name) {
      updateCompanionMutation.mutate({ name: newName.trim() });
    } else {
      setEditingName(false);
    }
  };

  const handleSaveBlipkinName = () => {
    if (newBlipkinName.trim() && newBlipkinName.trim() !== blipkin?.name) {
      updateBlipkinMutation.mutate({ name: newBlipkinName.trim() });
    } else {
      setEditingBlipkinName(false);
    }
  };

  return (
    <View style={{ flex: 1, backgroundColor: "#F9FAFB" }}>
      {/* Header */}
      <View className="bg-white border-b border-gray-200 px-4 py-4">
        <Text className="text-2xl font-bold text-gray-900">Settings</Text>
      </View>

      <ScrollView contentContainerStyle={{ padding: 16, paddingBottom: 100 }}>
        {/* AI Identity Section */}
        <View className="bg-white rounded-2xl p-5 mb-4">
          <View className="flex-row items-center gap-2 mb-4">
            <User size={20} color="#8B5CF6" />
            <Text className="text-lg font-bold text-gray-900">AI Identity</Text>
          </View>

          {/* AI Name */}
          <View className="mb-4">
            <Text className="text-gray-600 text-sm mb-2">AI Name</Text>
            {editingName ? (
              <View className="flex-row gap-2">
                <TextInput
                  value={newName}
                  onChangeText={setNewName}
                  placeholder="Enter new name"
                  className="flex-1 bg-gray-100 rounded-xl px-4 py-3 text-gray-900"
                  autoFocus
                  maxLength={20}
                />
                <Pressable
                  onPress={() => {
                    setEditingName(false);
                    setNewName("");
                  }}
                  className="bg-gray-200 rounded-xl px-4 justify-center"
                >
                  <Text className="text-gray-700 font-semibold">Cancel</Text>
                </Pressable>
                <Pressable
                  onPress={handleSaveName}
                  disabled={!newName.trim() || updateCompanionMutation.isPending}
                  className="bg-purple-600 rounded-xl px-4 justify-center"
                >
                  <Text className="text-white font-semibold">Save</Text>
                </Pressable>
              </View>
            ) : (
              <Pressable
                onPress={() => {
                  setNewName(companion?.name || "");
                  setEditingName(true);
                }}
                className="bg-gray-100 rounded-xl px-4 py-3 flex-row justify-between items-center"
              >
                <Text className="text-gray-900 text-base">{companion?.name || "..."}</Text>
                <Text className="text-purple-600 text-sm">Edit</Text>
              </Pressable>
            )}
          </View>

          {/* AI Vibe */}
          <View>
            <Text className="text-gray-600 text-sm mb-2">AI Vibe</Text>
            <View className="bg-gray-100 rounded-xl px-4 py-3">
              <Text className="text-gray-900 text-base capitalize">{companion?.vibe || "..."}</Text>
            </View>
            <Text className="text-gray-400 text-xs mt-2">
              Vibe determines how your AI communicates
            </Text>
          </View>
        </View>

        {/* PixieVolt Blipkin Section */}
        {blipkin && (
          <View className="bg-white rounded-2xl p-5 mb-4">
            <View className="flex-row items-center gap-2 mb-4">
              <Sparkles size={20} color="#8B5CF6" />
              <Text className="text-lg font-bold text-gray-900">PixieVolt AI</Text>
            </View>

            {/* Blipkin Name */}
            <View>
              <Text className="text-gray-600 text-sm mb-2">Blipkin Name</Text>
              {editingBlipkinName ? (
                <View className="flex-row gap-2">
                  <TextInput
                    value={newBlipkinName}
                    onChangeText={setNewBlipkinName}
                    placeholder="Enter new name"
                    className="flex-1 bg-gray-100 rounded-xl px-4 py-3 text-gray-900"
                    autoFocus
                    maxLength={20}
                  />
                  <Pressable
                    onPress={() => {
                      setEditingBlipkinName(false);
                      setNewBlipkinName("");
                    }}
                    className="bg-gray-200 rounded-xl px-4 justify-center"
                  >
                    <Text className="text-gray-700 font-semibold">Cancel</Text>
                  </Pressable>
                  <Pressable
                    onPress={handleSaveBlipkinName}
                    disabled={!newBlipkinName.trim() || updateBlipkinMutation.isPending}
                    className="bg-purple-600 rounded-xl px-4 justify-center"
                  >
                    <Text className="text-white font-semibold">Save</Text>
                  </Pressable>
                </View>
              ) : (
                <Pressable
                  onPress={() => {
                    setNewBlipkinName(blipkin.name);
                    setEditingBlipkinName(true);
                  }}
                  className="bg-gray-100 rounded-xl px-4 py-3 flex-row justify-between items-center"
                >
                  <Text className="text-gray-900 text-base">{blipkin.name}</Text>
                  <Text className="text-purple-600 text-sm">Edit</Text>
                </Pressable>
              )}
              <Text className="text-gray-400 text-xs mt-2">
                Level {blipkin.level} • Bond {blipkin.bond}/100
              </Text>
            </View>
          </View>
        )}

        {/* Memory & Privacy Section */}
        <View className="bg-white rounded-2xl p-5 mb-4">
          <View className="flex-row items-center gap-2 mb-4">
            <SettingsIcon size={20} color="#8B5CF6" />
            <Text className="text-lg font-bold text-gray-900">Memory & Privacy</Text>
          </View>

          <View className="flex-row justify-between items-center">
            <View className="flex-1 mr-4">
              <Text className="text-gray-900 text-base font-medium mb-1">
                Allow AI Memory
              </Text>
              <Text className="text-gray-500 text-sm">
                Let your AI remember past conversations to personalize replies
              </Text>
            </View>
            <Switch
              value={settings?.allowMemory ?? true}
              onValueChange={(value) =>
                updateSettingsMutation.mutate({ allowMemory: value })
              }
              trackColor={{ false: "#D1D5DB", true: "#8B5CF6" }}
              thumbColor="#FFFFFF"
            />
          </View>
        </View>

        {/* Notifications Section */}
        <View className="bg-white rounded-2xl p-5 mb-4">
          <View className="flex-row items-center gap-2 mb-4">
            <Bell size={20} color="#8B5CF6" />
            <Text className="text-lg font-bold text-gray-900">Notifications</Text>
          </View>

          <View className="flex-row justify-between items-center mb-4">
            <View className="flex-1 mr-4">
              <Text className="text-gray-900 text-base font-medium mb-1">
                Daily Check-in Reminder
              </Text>
              <Text className="text-gray-500 text-sm">
                Get reminded to check in with your AI
              </Text>
            </View>
            <Switch
              value={settings?.dailyReminderEnabled ?? true}
              onValueChange={(value) =>
                updateSettingsMutation.mutate({ dailyReminderEnabled: value })
              }
              trackColor={{ false: "#D1D5DB", true: "#8B5CF6" }}
              thumbColor="#FFFFFF"
            />
          </View>

          {settings?.dailyReminderEnabled && (
            <View>
              <Text className="text-gray-600 text-sm mb-2">Reminder Time</Text>
              <View className="bg-gray-100 rounded-xl px-4 py-3">
                <Text className="text-gray-900 text-base">{settings?.reminderTime || "09:00"}</Text>
              </View>
            </View>
          )}
        </View>

        {/* About & Safety Section */}
        <View className="bg-white rounded-2xl p-5 mb-4">
          <View className="flex-row items-center gap-2 mb-4">
            <Info size={20} color="#8B5CF6" />
            <Text className="text-lg font-bold text-gray-900">About & Safety</Text>
          </View>

          <Text className="text-gray-600 text-sm leading-relaxed">
            This app is for entertainment, productivity, and general life organization only.
            {"\n\n"}
            It is NOT a therapist, doctor, or emergency service.
            {"\n\n"}
            If you are in crisis or need urgent help, contact your local emergency number or a
            trusted professional.
          </Text>
        </View>

        {/* Log Out Button */}
        <Pressable
          onPress={handleLogout}
          className="bg-red-50 border-2 border-red-200 rounded-2xl p-5 flex-row items-center justify-center gap-2"
        >
          <LogOut size={20} color="#DC2626" />
          <Text className="text-red-600 font-semibold text-base">Log Out</Text>
        </Pressable>
      </ScrollView>
    </View>
  );
};

export default SettingsScreen;
