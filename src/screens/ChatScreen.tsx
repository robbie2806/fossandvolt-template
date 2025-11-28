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
} from "react-native";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Send, Sparkles } from "lucide-react-native";
import type { BottomTabScreenProps } from "@/navigation/types";
import { api } from "@/lib/api";
import type { GetChatHistoryResponse, GetCompanionResponse, SendChatMessageResponse } from "@/shared/contracts";

type Props = BottomTabScreenProps<"ChatTab">;

type Message = {
  id: string;
  role: "user" | "assistant";
  content: string;
  createdAt: string;
};

const ChatScreen = ({ navigation }: Props) => {
  const [inputText, setInputText] = useState("");
  const flatListRef = useRef<FlatList>(null);
  const queryClient = useQueryClient();

  // Fetch companion info
  const { data: companion } = useQuery({
    queryKey: ["companion"],
    queryFn: () => api.get<GetCompanionResponse>("/api/companion"),
  });

  // Fetch chat history
  const { data: chatData, isLoading } = useQuery({
    queryKey: ["chat"],
    queryFn: () => api.get<GetChatHistoryResponse>("/api/chat"),
  });

  // Send message mutation
  const sendMessageMutation = useMutation({
    mutationFn: (message: string) =>
      api.post<SendChatMessageResponse>("/api/chat", { message }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["chat"] });
      queryClient.invalidateQueries({ queryKey: ["companion"] });
      queryClient.invalidateQueries({ queryKey: ["bond"] });
      setInputText("");
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
      {/* Header */}
      <View className="bg-white border-b border-gray-200 px-4 py-4 flex-row items-center justify-between">
        <View className="flex-row items-center gap-3">
          <View className="bg-purple-100 rounded-full p-2">
            <Sparkles size={24} color="#8B5CF6" />
          </View>
          <View>
            <Text className="text-lg font-bold text-gray-900">{companion?.name || "..."}</Text>
            <View className="flex-row items-center gap-1.5">
              <View className="w-2 h-2 bg-green-500 rounded-full" />
              <Text className="text-sm text-gray-500">Bond Level {companion?.bondLevel || 1}</Text>
            </View>
          </View>
        </View>
      </View>

      {/* Messages */}
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === "ios" ? "padding" : undefined}
        keyboardVerticalOffset={90}
      >
        {isLoading ? (
          <View className="flex-1 justify-center items-center">
            <ActivityIndicator size="large" color="#8B5CF6" />
          </View>
        ) : messages.length === 0 ? (
          <View className="flex-1 justify-center items-center px-8">
            <Sparkles size={48} color="#D1D5DB" />
            <Text className="text-gray-400 text-center mt-4 text-lg">
              Start chatting with {companion?.name || "your AI companion"}!
            </Text>
            <Text className="text-gray-400 text-center mt-2 text-sm">
              Every message helps grow your bond
            </Text>
          </View>
        ) : (
          <FlatList
            ref={flatListRef}
            data={messages}
            keyExtractor={(item) => item.id}
            contentContainerStyle={{ padding: 16, paddingBottom: 100 }}
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

        {/* Input */}
        <View className="bg-white border-t border-gray-200 px-4 py-3 flex-row items-center gap-3">
          <TextInput
            value={inputText}
            onChangeText={setInputText}
            placeholder="Type a message..."
            placeholderTextColor="#9CA3AF"
            className="flex-1 bg-gray-100 rounded-full px-5 py-3 text-base text-gray-900"
            multiline
            maxLength={500}
            editable={!sendMessageMutation.isPending}
            onSubmitEditing={handleSend}
          />
          <Pressable
            onPress={handleSend}
            disabled={!inputText.trim() || sendMessageMutation.isPending}
            className={`rounded-full p-3 ${
              inputText.trim() && !sendMessageMutation.isPending
                ? "bg-purple-600 active:bg-purple-700"
                : "bg-gray-200"
            }`}
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
      </KeyboardAvoidingView>
    </View>
  );
};

export default ChatScreen;
