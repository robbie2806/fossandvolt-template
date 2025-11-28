import type { BottomTabScreenProps as BottomTabScreenPropsBase } from "@react-navigation/bottom-tabs";
import { CompositeScreenProps, NavigatorScreenParams } from "@react-navigation/native";
import type { NativeStackScreenProps } from "@react-navigation/native-stack";

declare global {
  namespace ReactNavigation {
    // eslint-disable-next-line @typescript-eslint/no-empty-object-type
    interface RootParamList extends RootStackParamList {}
  }
}

export type RootStackParamList = {
  // Onboarding flow
  OnboardingWelcome: undefined;
  OnboardingName: undefined;
  OnboardingVibe: { aiName: string };

  // Main app tabs
  Tabs: NavigatorScreenParams<BottomTabParamList> | undefined;

  // Auth
  LoginModalScreen: undefined;
};

export type BottomTabParamList = {
  ChatTab: undefined;
  BondTab: undefined;
  SettingsTab: undefined;
};

export type RootStackScreenProps<T extends keyof RootStackParamList> = NativeStackScreenProps<
  RootStackParamList,
  T
>;

export type BottomTabScreenProps<Screen extends keyof BottomTabParamList> = CompositeScreenProps<
  BottomTabScreenPropsBase<BottomTabParamList, Screen>,
  NativeStackScreenProps<RootStackParamList>
>;
