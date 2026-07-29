import { Disc3, LayoutGrid, Settings as SettingsIcon } from "lucide-react-native";
import { Tabs } from "expo-router";
import React from "react";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import Colors from "@/constants/Colors";
import { useColorScheme } from "@/hooks/useColorScheme";

export default function TabLayout() {
  const colorScheme = useColorScheme();
  const insets = useSafeAreaInsets();
  const barHeight = 60 + insets.bottom;

  return (
    <Tabs
      screenOptions={{
        tabBarActiveTintColor: "#ff2a3b",
        tabBarInactiveTintColor: "#6b4f4f",
        tabBarStyle: {
          backgroundColor: "#0c0908",
          borderTopColor: "#33181c",
          borderTopWidth: 1.5,
          height: barHeight,
          paddingBottom: 6 + insets.bottom,
          paddingTop: 6,
        },
        headerShown: false,
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: "Pads",
          // Igual que en DJ: pantalla completa, la navegación se reubica
          // arriba junto a los demás botones en vez de la barra inferior.
          tabBarStyle: { display: "none" },
          tabBarIcon: ({ color, size }) => (
            <LayoutGrid
              width={size}
              height={size}
              color={color}
              accessibilityLabel="Pads"
            />
          ),
        }}
      />

      <Tabs.Screen
        name="DJ"
        options={{
          title: "DJ",
          headerShown: false,
          // El modo DJ es a pantalla completa: la navegación (Pads/Settings)
          // se reubica arriba junto a los demás botones de la pantalla para
          // ganar espacio vertical en lugar de la barra inferior.
          tabBarStyle: { display: "none" },
          tabBarIcon: ({ color, size }) => (
            <Disc3
              width={size}
              height={size}
              color={color}
              accessibilityLabel="Modo DJ"
            />
          ),
        }}
      />

      <Tabs.Screen
        name="Settings"
        options={{
          title: "Settings",
          tabBarIcon: ({ color, size }) => (
            <SettingsIcon
              width={size}
              height={size}
              color={color}
              accessibilityLabel="Ajustes"
            />
          ),
        }}
      />
    </Tabs>
  );
}
