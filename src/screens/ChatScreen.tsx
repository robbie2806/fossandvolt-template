import React, { useState, useRef, useEffect } from "react";
import {
  View,
  Text,
  TextInput,
  Pressable,
  FlatList,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
  Alert,
} from "react-native";
import { SafeAreaView, useSafeAreaInsets } from "react-native-safe-area-context";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Send, Sparkles, ArrowLeft } from "lucide-react-native";
import type { BottomTabScreenProps } from "@/navigation/types";
import { api } from "@/lib/api";
import type { GetChatHistoryResponse, GetCompanionResponse, GetBlipkinResponse, SendChatMessageResponse } from "@/shared/contracts";
import SubscriptionPaywallModal from "./SubscriptionPaywallScreen";

type Props = BottomTabScreenProps<"ChatTab">;

type Message = {
  id: string;
  role: "user" | "assistant";
  content: string;
  createdAt: string;
};

const ChatScreen = ({ navigation, route }: Props) => {
  const [inputText, setInputText] = useState("");
  const [showPaywall, setShowPaywall] = useState(false);
  const flatListRef = useRef<FlatList>(null);
  const queryClient = useQueryClient();
  const insets = useSafeAreaInsets();

  // Fetch Blipkin info (Blipkin IS the AI companion)
  const { data: blipkin } = useQuery({
    queryKey: ["blipkin"],
    queryFn: () => api.get<GetBlipkinResponse>("/api/blipkin"),
  });

  // Fetch chat history
  const { data: chatData, isLoading } = useQuery({
    queryKey: ["chat"],
    queryFn: () => api.get<GetChatHistoryResponse>("/api/chat"),
  });

  // Send message mutation - always use blipkin mode
  const sendMessageMutation = useMutation({
    mutationFn: (message: string) =>
      api.post<SendChatMessageResponse>("/api/chat", { message, mode: "blipkin" }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["chat"] });
      queryClient.invalidateQueries({ queryKey: ["blipkin"] });
      setInputText("");
    },
    onError: (error: any) => {
      // Check if this is a chat limit error
      try {
        const errorData = JSON.parse(error.message);
        if (errorData.limitReached || errorData.showPaywall) {
          setShowPaywall(true);
        } else if (errorData.sleeping) {
          Alert.alert(
            "Blipkin is Sleeping 😴",
            "Your Blipkin is resting right now. Please try again later!",
            [{ text: "OK" }]
          );
        } else {
          Alert.alert("Error", error.message || "Failed to send message");
        }
      } catch {
        // If it's a 429 status, show paywall
        if (error.message.includes("429") || error.message.includes("limit")) {
          setShowPaywall(true);
        } else {
          Alert.alert("Error", error.message || "Failed to send message");
        }
      }
    },
  });

  const handleSend = () => {
    if (inputText.trim() && !sendMessageMutation.isPending) {
      sendMessageMutation.mutate(inputText.trim());
    }
  };

  useEffect(() => {
    if (chatData?.messages && chatData.messages.length > 0) {
      setTimeout(() => {
        flatListRef.current?.scrollToEnd({ animated: true });
      }, 100);
    }
  }, [chatData?.messages]);

  const messages: Message[] = chatData?.messages || [];

  return (
    <View style={{ flex: 1, backgroundColor: "#F9FAFB" }}>
      <SafeAreaView edges={["top"]} style={{ backgroundColor: "#FFFFFF" }}>
        {/* Header */}
        <View className="bg-white border-b border-gray-200 px-4 py-4">
          <View className="flex-row items-center gap-3">
            <View className="bg-purple-100 rounded-full p-2">
              <Sparkles size={24} color="#8B5CF6" />
            </View>
            <View>
              <Text className="text-lg font-bold text-gray-900">{blipkin?.name || "..."}</Text>
              <View className="flex-row items-center gap-1.5">
                <View className="w-2 h-2 bg-green-500 rounded-full" />
                <Text className="text-sm text-gray-500">
                  Level {blipkin?.level || 1} • {blipkin?.xp || 0}/{(blipkin?.level || 1) * 100} XP
                </Text>
              </View>
            </View>
          </View>
        </View>
      </SafeAreaView>

      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        keyboardVerticalOffset={Platform.OS === "ios" ? 90 : 0}
      >
        {/* Messages */}
        {isLoading ? (
          <View style={{ flex: 1 }} className="justify-center items-center">
            <ActivityIndicator size="large" color="#8B5CF6" />
          </View>
        ) : messages.length === 0 ? (
          <View style={{ flex: 1 }} className="justify-center items-center px-8">
            <Sparkles size={48} color="#D1D5DB" />
            <Text className="text-gray-400 text-center mt-4 text-lg">
              Start chatting with {blipkin?.name || "your Blipkin"}!
            </Text>
            <Text className="text-gray-400 text-center mt-2 text-sm">
              Chat to build your bond and help your Blipkin grow
            </Text>
          </View>
        ) : (
          <FlatList
            ref={flatListRef}
            data={messages}
            keyExtractor={(item) => item.id}
            contentContainerStyle={{ padding: 16, paddingBottom: 20 }}
            renderItem={({ item }) => (
              <View
                className={`mb-4 ${item.role === "user" ? "items-end" : "items-start"}`}
              >
                <View
                  className={`max-w-[75%] rounded-2xl px-4 py-3 ${
                    item.role === "user"
                      ? "bg-purple-600"
                      : "bg-white border border-gray-200"
                  }`}
                >
                  <Text
                    className={`text-base ${
                      item.role === "user" ? "text-white" : "text-gray-900"
                    }`}
                  >
                    {item.content}
                  </Text>
                </View>
              </View>
            )}
          />
        )}

        {/* Input - Fixed at bottom above tab bar */}
        <View className="bg-white border-t border-gray-200 px-4 py-3" style={{ marginBottom: 49 + insets.bottom }}>
          <View className="flex-row items-end gap-3">
            <TextInput
              value={inputText}
              onChangeText={setInputText}
              placeholder="Type a message..."
              placeholderTextColor="#9CA3AF"
              className="flex-1 bg-gray-100 rounded-2xl px-5 py-3 text-base text-gray-900"
              style={{ maxHeight: 100, minHeight: 44 }}
              multiline
              maxLength={500}
              editable={!sendMessageMutation.isPending}
              returnKeyType="default"
              blurOnSubmit={false}
            />
            <Pressable
              onPress={handleSend}
              disabled={!inputText.trim() || sendMessageMutation.isPending}
              className={`rounded-full p-3 ${
                inputText.trim() && !sendMessageMutation.isPending
                  ? "bg-purple-600 active:bg-purple-700"
                  : "bg-gray-200"
              }`}
              style={{ height: 44, width: 44, justifyContent: "center", alignItems: "center" }}
            >
              {sendMessageMutation.isPending ? (
                <ActivityIndicator size="small" color="#FFFFFF" />
              ) : (
                <Send
                  size={20}
                  color={inputText.trim() ? "#FFFFFF" : "#9CA3AF"}
                />
              )}
            </Pressable>
          </View>
        </View>
      </KeyboardAvoidingView>

      {/* Subscription Paywall Modal */}
      <SubscriptionPaywallModal
        visible={showPaywall}
        onClose={() => setShowPaywall(false)}
        onSubscribe={() => {
          queryClient.invalidateQueries({ queryKey: ["blipkin"] });
          Alert.alert("Success!", "You now have unlimited chat!");
        }}
      />
    </View>
  );
};

export default ChatScreen;
