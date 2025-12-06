import React from "react";
import { View, Text, ScrollView, Pressable, ActivityIndicator, Alert } from "react-native";
import { NativeStackScreenProps } from "@react-navigation/native-stack";
import { Zap, Clock } from "lucide-react-native";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import type { PurchasesPackage } from "react-native-purchases";
import * as revenueCatClient from "@/lib/revenuecatClient";
import { api } from "@/lib/api";
import type { RootStackParamList } from "@/navigation/types";

type Props = NativeStackScreenProps<RootStackParamList, "EnergyStore">;

const ENERGY_PACKAGES = [
  {
    id: "small",
    lookupKey: "$rc_custom_small",
    energy: 30,
    price: "$2.99",
    color: "#10B981",
  },
  {
    id: "medium",
    lookupKey: "$rc_custom_medium",
    energy: 60,
    price: "$4.99",
    bonus: "20% Bonus!",
    color: "#F59E0B",
  },
  {
    id: "large",
    lookupKey: "$rc_custom_large",
    energy: 150,
    price: "$10.99",
    bonus: "30% Bonus!",
    color: "#8B5CF6",
  },
  {
    id: "emergency",
    lookupKey: "$rc_custom_emergency",
    energy: 5,
    price: "$2.99",
    label: "Quick Boost",
    description: "Prevents 6hr sleep",
    color: "#F97316",
  },
  {
    id: "full_restore",
    lookupKey: "$rc_custom_full_restore",
    energy: 100,
    price: "$15.99",
    label: "Full Energy Restore",
    description: "Instant full energy!",
    color: "#EF4444",
  },
];

const EnergyStoreScreen = ({ navigation, route }: Props) => {
  const queryClient = useQueryClient();
  const { timeUntilRestore } = route.params || {};

  const [packages, setPackages] = React.useState<Record<string, PurchasesPackage>>({});
  const [isRevenueCatConfigured, setIsRevenueCatConfigured] = React.useState(false);

  React.useEffect(() => {
    checkRevenueCatAndLoadPackages();
  }, []);

  const checkRevenueCatAndLoadPackages = async () => {
    // Check if RevenueCat is configured
    const isConfigured = revenueCatClient.isRevenueCatEnabled();
    setIsRevenueCatConfigured(isConfigured);

    if (!isConfigured) {
      console.log("[EnergyStore] RevenueCat not configured - showing message to user");
      return;
    }

    // Load packages
    const offeringsResult = await revenueCatClient.getOfferings();

    if (!offeringsResult.ok) {
      console.log("[EnergyStore] Failed to load offerings:", offeringsResult.reason);
      return;
    }

    const energyOffering = offeringsResult.data.all["energy_store"];

    if (energyOffering) {
      const pkgs: Record<string, PurchasesPackage> = {};
      energyOffering.availablePackages.forEach((pkg) => {
        pkgs[pkg.identifier] = pkg;
      });
      setPackages(pkgs);
    } else {
      console.log("[EnergyStore] No energy_store offering found");
    }
  };

  const purchaseMutation = useMutation({
    mutationFn: async ({ packageId, rcPackage }: { packageId: string; rcPackage: PurchasesPackage }) => {
      // Purchase through RevenueCat using safe wrapper
      const purchaseResult = await revenueCatClient.purchasePackage(rcPackage);

      if (!purchaseResult.ok) {
        throw new Error(
          purchaseResult.reason === "not_configured"
            ? "RevenueCat is not configured. Please set up payments in the app."
            : "Purchase failed. Please try again."
        );
      }

      // Find energy amount for this package
      const energyPkg = ENERGY_PACKAGES.find((p) => p.lookupKey === rcPackage.identifier);
      if (!energyPkg) throw new Error("Package not found");

      // Update backend
      await api.post("/api/blipkin/purchase-energy", {
        packageId,
        energyAmount: energyPkg.energy,
      });

      return purchaseResult.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["blipkin"] });
      Alert.alert("Success!", "Energy restored! Your Blipkin is ready to play!", [
        { text: "Great!", onPress: () => navigation.goBack() },
      ]);
    },
    onError: (error: any) => {
      console.log("[EnergyStore] Purchase error:", error);
      Alert.alert("Purchase Failed", error.message || "Something went wrong. Please try again.");
    },
  });

  const handlePurchase = (pkg: typeof ENERGY_PACKAGES[0]) => {
    // Check if RevenueCat is configured first
    if (!isRevenueCatConfigured) {
      Alert.alert(
        "Payments Not Set Up",
        "In-app purchases are not configured yet. Please contact support or wait for free energy restore.",
        [{ text: "OK" }]
      );
      return;
    }

    const rcPackage = packages[pkg.lookupKey];
    if (!rcPackage) {
      Alert.alert("Error", "Package not available. Please try again later.");
      return;
    }

    Alert.alert(
      `Purchase ${pkg.label || "Energy"}?`,
      `${pkg.energy} energy for ${pkg.price} AUD`,
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Buy",
          onPress: () => purchaseMutation.mutate({ packageId: pkg.id, rcPackage }),
        },
      ]
    );
  };

  const formatTime = (ms: number) => {
    const hours = Math.floor(ms / (1000 * 60 * 60));
    const minutes = Math.floor((ms % (1000 * 60 * 60)) / (1000 * 60));
    return `${hours}h ${minutes}m`;
  };

  return (
    <View className="flex-1 bg-gray-50">
      <ScrollView className="flex-1" contentContainerStyle={{ padding: 20 }}>
        {/* Header */}
        <View className="bg-purple-600 rounded-2xl p-6 mb-6">
          <View className="flex-row items-center justify-center mb-2">
            <Zap size={32} color="#FFFFFF" strokeWidth={2.5} fill="#FFFFFF" />
            <Text className="text-white text-3xl font-bold ml-3">Energy Store</Text>
          </View>
          <Text className="text-white/90 text-center text-base">
            Keep your Blipkin energized and playing!
          </Text>
        </View>

        {/* Restore Timer */}
        {timeUntilRestore && timeUntilRestore > 0 && (
          <View className="bg-blue-50 rounded-2xl p-4 mb-6 border border-blue-200">
            <View className="flex-row items-center justify-center">
              <Clock size={20} color="#3B82F6" />
              <Text className="text-blue-900 font-semibold ml-2">
                Energy restores in {formatTime(timeUntilRestore)}
              </Text>
            </View>
            <Text className="text-blue-700 text-sm text-center mt-2">
              Or purchase energy below to keep playing now!
            </Text>
          </View>
        )}

        {/* RevenueCat Not Configured Warning */}
        {!isRevenueCatConfigured && (
          <View className="bg-orange-50 rounded-2xl p-4 mb-6 border border-orange-200">
            <Text className="text-orange-900 font-semibold text-center mb-2">
              ⚠️ Purchases Not Available
            </Text>
            <Text className="text-orange-700 text-sm text-center">
              In-app purchases are not configured yet. Your energy will restore automatically in 3 hours for free!
            </Text>
          </View>
        )}

        {/* Energy Packages */}
        <View className="gap-4">
          {ENERGY_PACKAGES.map((pkg) => {
            const rcPackage = packages[pkg.lookupKey];
            const displayPrice = rcPackage?.product.priceString || pkg.price;

            return (
              <Pressable
                key={pkg.id}
                onPress={() => handlePurchase(pkg)}
                disabled={purchaseMutation.isPending}
                className="bg-white rounded-2xl shadow-md active:scale-95 border border-gray-100"
                style={{ transform: [{ scale: 1 }] }}
              >
                <View className="p-5">
                  <View className="flex-row items-center justify-between mb-3">
                    <View className="flex-row items-center gap-3">
                      <View
                        className="rounded-full p-3"
                        style={{ backgroundColor: pkg.color + "20" }}
                      >
                        <Zap size={28} color={pkg.color} strokeWidth={2.5} fill={pkg.color} />
                      </View>
                      <View>
                        <Text className="text-gray-900 text-lg font-bold">
                          {pkg.label || `${pkg.energy} Energy`}
                        </Text>
                        {pkg.bonus && (
                          <Text className="text-green-600 text-sm font-semibold">
                            {pkg.bonus}
                          </Text>
                        )}
                        {pkg.description && (
                          <Text className="text-gray-500 text-sm">
                            {pkg.description}
                          </Text>
                        )}
                      </View>
                    </View>
                    <View>
                      <Text className="text-purple-600 text-2xl font-bold">{displayPrice}</Text>
                      <Text className="text-gray-500 text-xs text-right">AUD</Text>
                    </View>
                  </View>

                  {pkg.id === "full_restore" && (
                    <View className="bg-red-50 rounded-lg p-3 mt-2">
                      <Text className="text-red-900 text-sm font-medium text-center">
                        ⚡ Instantly restores full energy!
                      </Text>
                    </View>
                  )}
                </View>
              </Pressable>
            );
          })}
        </View>

        {/* Info */}
        <View className="bg-purple-50 rounded-2xl p-4 mt-6">
          <Text className="text-purple-900 text-sm font-medium mb-2">
            💡 Energy System
          </Text>
          <Text className="text-purple-700 text-sm leading-5">
            • Playing costs 10 energy per session{"\n"}
            • Energy restores automatically after 3 hours{"\n"}
            • Feed your Blipkin 3 times daily or lose energy faster!
          </Text>
        </View>
      </ScrollView>

      {purchaseMutation.isPending && (
        <View className="absolute inset-0 bg-black/50 items-center justify-center">
          <View className="bg-white rounded-2xl p-6">
            <ActivityIndicator size="large" color="#8B5CF6" />
            <Text className="text-gray-900 font-semibold mt-4">Processing purchase...</Text>
          </View>
        </View>
      )}
    </View>
  );
};

export default EnergyStoreScreen;
