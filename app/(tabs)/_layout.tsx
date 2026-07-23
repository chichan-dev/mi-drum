import FontAwesome from "@expo/vector-icons/FontAwesome";
import { Tabs } from "expo-router";
import React from "react";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { DeckIcon, GridIcon, SettingsIcon } from "@/components/icons";
import Colors from "@/constants/Colors";
import { useColorScheme } from "@/hooks/useColorScheme";

function TabBarIcon(props: {
  name: React.ComponentProps<typeof FontAwesome>["name"];
  color: string;
}) {
  return <FontAwesome size={28} style={{ marginBottom: -3 }} {...props} />;
}

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
          tabBarIcon: ({ color, size }) => (
            <GridIcon
              width={size}
              height={size}
              fill={color}
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
          tabBarIcon: ({ color, size }) => (
            <DeckIcon
              width={size}
              height={size}
              fill={color}
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
              fill={color}
              accessibilityLabel="Ajustes"
            />
          ),
        }}
      />
    </Tabs>
  );
}
