import { MetalMania_400Regular } from "@expo-google-fonts/metal-mania";
import {
  DarkTheme,
  DefaultTheme,
  ThemeProvider,
} from "@react-navigation/native";
import { useFonts } from "expo-font";
import * as NavigationBar from "expo-navigation-bar";
import { Stack } from "expo-router";
import * as SplashScreen from "expo-splash-screen";
import { useEffect } from "react";
import { Platform } from "react-native";
import "react-native-reanimated";
import { SafeAreaProvider } from "react-native-safe-area-context";

import VolumeOverlay from "@/components/ui/VolumeOverlay";
import { useColorScheme } from "@/hooks/useColorScheme";

export { ErrorBoundary } from "expo-router";

export const unstable_settings = {
  initialRouteName: "(tabs)",
};

SplashScreen.preventAutoHideAsync();

export default function RootLayout() {
  const [loaded, error] = useFonts({
    SpaceMono: require("../assets/fonts/SpaceMono-Regular.ttf"),
    MetalMania_400Regular,
  });

  // Expo Router uses Error Boundaries to catch errors in the navigation tree.
  useEffect(() => {
    if (error) throw error;
  }, [error]);

  useEffect(() => {
    if (loaded) {
      SplashScreen.hideAsync();
    }
  }, [loaded]);

  if (!loaded) {
    return null;
  }

  return <RootLayoutNav />;
}

const CustomDarkTheme = {
  ...DarkTheme,
  colors: {
    ...DarkTheme.colors,
    background: "#07080a",
    card: "#0c0908",
    text: "#e3e5ec",
    border: "#33181c",
  },
};

function RootLayoutNav() {
  const colorScheme = useColorScheme();

  useEffect(() => {
    if (Platform.OS !== "android") return;
    // Modo inmersivo "sticky": oculta volver/home/recientes; un swipe desde
    // el borde los muestra momentáneamente y luego se ocultan solos de nuevo.
    NavigationBar.setBehaviorAsync("overlay-swipe").catch(() => undefined);
    NavigationBar.setVisibilityAsync("hidden").catch(() => undefined);
  }, []);

  return (
    <SafeAreaProvider style={{ flex: 1, backgroundColor: "#07080a" }}>
      <ThemeProvider value={CustomDarkTheme}>
        <Stack screenOptions={{ contentStyle: { backgroundColor: "#07080a" } }}>
          <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
          <Stack.Screen name="modal" options={{ presentation: "modal" }} />
        </Stack>
        <VolumeOverlay />
      </ThemeProvider>
    </SafeAreaProvider>
  );
}
