import React from "react";
import { View, Text, ScrollView, Pressable, ActivityIndicator, Alert, Modal } from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { Crown, X, Check } from "lucide-react-native";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import type { PurchasesPackage } from "react-native-purchases";
import * as revenueCatClient from "@/lib/revenuecatClient";

interface SubscriptionPaywallModalProps {
  visible: boolean;
  onClose: () => void;
  onSubscribe: () => void;
}

const SubscriptionPaywallModal: React.FC<SubscriptionPaywallModalProps> = ({
  visible,
  onClose,
  onSubscribe,
}) => {
  const queryClient = useQueryClient();
  const [loading, setLoading] = React.useState(true);
  const [monthlyPackage, setMonthlyPackage] = React.useState<PurchasesPackage | null>(null);

  React.useEffect(() => {
    if (visible) {
      loadSubscription();
    }
  }, [visible]);

  const loadSubscription = async () => {
    setLoading(true);
    try {
      const offeringsResult = await revenueCatClient.getOfferings();

      if (offeringsResult.ok) {
        const premiumOffering = offeringsResult.data.all["premium_subscription"];
        if (premiumOffering) {
          const pkg = premiumOffering.availablePackages.find(
            (p) => p.identifier === "$rc_monthly"
          );
          setMonthlyPackage(pkg || null);
        }
      }
    } catch (error) {
      console.log("[Paywall] Error loading subscription:", error);
    } finally {
      setLoading(false);
    }
  };

  const purchaseMutation = useMutation({
    mutationFn: async () => {
      if (!monthlyPackage) throw new Error("No package available");

      const purchaseResult = await revenueCatClient.purchasePackage(monthlyPackage);

      if (!purchaseResult.ok) {
        throw new Error("Purchase failed. Please try again.");
      }

      return purchaseResult.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["blipkin"] });
      onSubscribe();
      onClose();
      Alert.alert("Welcome to Premium! 👑", "You now have unlimited chat with your Blipkin!");
    },
    onError: (error: any) => {
      console.log("[Paywall] Purchase error:", error);
      Alert.alert("Purchase Failed", error.message || "Something went wrong. Please try again.");
    },
  });

  const handleSubscribe = () => {
    Alert.alert(
      "Subscribe to Premium?",
      `$5.99/month for unlimited chat with your Blipkin`,
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Subscribe",
          onPress: () => purchaseMutation.mutate(),
        },
      ]
    );
  };

  const handleDecline = () => {
    Alert.alert(
      "Chat Limit Reached",
      "Your Blipkin needs to rest for 1 hour. You can wait or subscribe for unlimited chatting!",
      [
        { text: "Wait 1 Hour", style: "cancel", onPress: onClose },
        { text: "Subscribe Now", onPress: handleSubscribe },
      ]
    );
  };

  return (
    <Modal visible={visible} animationType="slide" presentationStyle="pageSheet">
      <View style={{ flex: 1, backgroundColor: "#FFFFFF" }}>
        {/* Close Button */}
        <Pressable
          onPress={handleDecline}
          className="absolute top-12 right-6 z-10 bg-gray-100 rounded-full p-2"
        >
          <X size={24} color="#6B7280" />
        </Pressable>

        <ScrollView contentContainerStyle={{ paddingBottom: 40 }}>
          {/* Header */}
          <LinearGradient
            colors={["#8B5CF6", "#6366F1", "#EC4899"]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={{ paddingTop: 60, paddingBottom: 40, paddingHorizontal: 24 }}
          >
            <View className="items-center">
              <View className="bg-white/20 rounded-full p-4 mb-4">
                <Crown size={48} color="#FFFFFF" strokeWidth={2.5} fill="#FFFFFF" />
              </View>
              <Text className="text-white text-3xl font-bold text-center mb-2">
                Unlock Premium
              </Text>
              <Text className="text-white/90 text-lg text-center">
                Chat unlimitedly with your Blipkin!
              </Text>
            </View>
          </LinearGradient>

          {/* Features */}
          <View className="px-6 py-8">
            <Text className="text-gray-900 text-xl font-bold mb-4">Premium Features:</Text>

            <View className="gap-4">
              <View className="flex-row items-start gap-3">
                <View className="bg-green-100 rounded-full p-2 mt-1">
                  <Check size={20} color="#10B981" strokeWidth={3} />
                </View>
                <View className="flex-1">
                  <Text className="text-gray-900 font-semibold text-lg">Unlimited Chat</Text>
                  <Text className="text-gray-600">Chat with your Blipkin as much as you want, no limits!</Text>
                </View>
              </View>

              <View className="flex-row items-start gap-3">
                <View className="bg-green-100 rounded-full p-2 mt-1">
                  <Check size={20} color="#10B981" strokeWidth={3} />
                </View>
                <View className="flex-1">
                  <Text className="text-gray-900 font-semibold text-lg">No Sleep Penalties</Text>
                  <Text className="text-gray-600">Keep chatting without your Blipkin needing to rest</Text>
                </View>
              </View>

              <View className="flex-row items-start gap-3">
                <View className="bg-green-100 rounded-full p-2 mt-1">
                  <Check size={20} color="#10B981" strokeWidth={3} />
                </View>
                <View className="flex-1">
                  <Text className="text-gray-900 font-semibold text-lg">Level Up Faster</Text>
                  <Text className="text-gray-600">Earn 10 XP per message - the best way to level up!</Text>
                </View>
              </View>

              <View className="flex-row items-start gap-3">
                <View className="bg-green-100 rounded-full p-2 mt-1">
                  <Check size={20} color="#10B981" strokeWidth={3} />
                </View>
                <View className="flex-1">
                  <Text className="text-gray-900 font-semibold text-lg">Support Development</Text>
                  <Text className="text-gray-600">Help us keep improving PixieVolt AI!</Text>
                </View>
              </View>
            </View>
          </View>

          {/* Pricing */}
          <View className="px-6 pb-8">
            {loading ? (
              <View className="py-8">
                <ActivityIndicator size="large" color="#8B5CF6" />
              </View>
            ) : (
              <View className="bg-gradient-to-r from-purple-50 to-pink-50 rounded-2xl p-6 border-2 border-purple-200">
                <Text className="text-center text-gray-600 text-sm mb-2">Premium Monthly</Text>
                <Text className="text-center text-purple-600 text-4xl font-bold mb-2">
                  {monthlyPackage?.product.priceString || "$5.99"}
                </Text>
                <Text className="text-center text-gray-500 text-sm">per month • cancel anytime</Text>
              </View>
            )}
          </View>

          {/* Subscribe Button */}
          <View className="px-6">
            <Pressable
              onPress={handleSubscribe}
              disabled={purchaseMutation.isPending || !monthlyPackage}
              className="bg-purple-600 rounded-2xl py-4 shadow-lg active:scale-95"
            >
              {purchaseMutation.isPending ? (
                <ActivityIndicator color="#FFFFFF" />
              ) : (
                <Text className="text-white text-xl font-bold text-center">
                  Subscribe Now
                </Text>
              )}
            </Pressable>

            <Text className="text-gray-500 text-xs text-center mt-4 px-4">
              Subscription renews automatically. Cancel anytime in your device settings.
            </Text>
          </View>
        </ScrollView>
      </View>
    </Modal>
  );
};

export default SubscriptionPaywallModal;
