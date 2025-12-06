import React, { useEffect } from "react";
import { View, Text, Pressable } from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withRepeat,
  withTiming,
  withSequence,
  Easing
} from "react-native-reanimated";
import { Sparkles } from "lucide-react-native";
import type { RootStackScreenProps } from "@/navigation/types";

type Props = RootStackScreenProps<"PixieVoltIntro">;

const PixieVoltIntroScreen = ({ navigation }: Props) => {
  // Pulsing animation for the spark/orb
  const scale = useSharedValue(1);
  const opacity = useSharedValue(0.7);

  useEffect(() => {
    scale.value = withRepeat(
      withSequence(
        withTiming(1.2, { duration: 1500, easing: Easing.inOut(Easing.ease) }),
        withTiming(1, { duration: 1500, easing: Easing.inOut(Easing.ease) })
      ),
      -1,
      false
    );

    opacity.value = withRepeat(
      withSequence(
        withTiming(1, { duration: 1500, easing: Easing.inOut(Easing.ease) }),
        withTiming(0.7, { duration: 1500, easing: Easing.inOut(Easing.ease) })
      ),
      -1,
      false
    );
  }, []);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
    opacity: opacity.value,
  }));

  const handleContinue = () => {
    navigation.navigate("PixieVoltName");
  };

  return (
    <View style={{ flex: 1 }}>
      <LinearGradient
        colors={["#6366F1", "#8B5CF6", "#EC4899"]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={{ flex: 1 }}
      >
        <View className="flex-1 justify-center items-center px-8">
          {/* Animated Spark/Orb */}
          <Animated.View style={[animatedStyle]}>
            <View className="bg-white/30 rounded-full p-8 mb-12">
              <View className="bg-white/40 rounded-full p-6">
                <Sparkles size={72} color="#FFFFFF" strokeWidth={1.5} />
              </View>
            </View>
          </Animated.View>

          {/* Title */}
          <Text className="text-5xl font-bold text-white text-center mb-6">
            Welcome to{"\n"}PixieVolt AI
          </Text>

          {/* Subtitle */}
          <Text className="text-xl text-white/90 text-center leading-relaxed max-w-sm">
            A tiny spark of digital life, powered by you.
          </Text>

          {/* Continue Button */}
          <Pressable
            onPress={handleContinue}
            className="absolute bottom-16 bg-white rounded-full px-16 py-5 shadow-xl active:scale-95"
            style={{ transform: [{ scale: 1 }] }}
          >
            <Text className="text-purple-600 text-lg font-bold">Continue</Text>
          </Pressable>
        </View>
      </LinearGradient>
    </View>
  );
};

export default PixieVoltIntroScreen;
