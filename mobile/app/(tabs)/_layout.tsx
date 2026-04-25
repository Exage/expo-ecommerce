import { Redirect, Tabs } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { useAuth } from "@clerk/clerk-expo";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { BlurView } from "expo-blur";
import { StyleSheet } from "react-native";
import { useColorScheme } from "nativewind";

const TabsLayout = () => {
  const { isSignedIn, isLoaded } = useAuth();
  const { colorScheme } = useColorScheme();
  const insets = useSafeAreaInsets();
  const isDark = colorScheme === "dark";

  if (!isLoaded) return null; // for a better ux
  if (!isSignedIn) return <Redirect href={"/(auth)"} />;

  return (
    <Tabs
      screenOptions={{
        tabBarActiveTintColor: "#1DB954",
        tabBarInactiveTintColor: isDark ? "#B3B3B3" : "#64748B",
        tabBarStyle: {
          position: "absolute",
          backgroundColor: "transparent",
          borderTopWidth: isDark ? 0 : 1,
          borderTopColor: isDark ? "transparent" : "#E2E8F0",
          height: 32 + insets.bottom,
          paddingTop: 4,
          marginHorizontal: 72,
          marginBottom: insets.bottom,
          borderRadius: 24,
          overflow: "hidden",
        },
        tabBarBackground: () => (
          <BlurView
            intensity={80}
            tint={isDark ? "dark" : "light"}
            style={StyleSheet.absoluteFill}
            // StyleSheet.absoluteFill is equal to this 👇
            // { position: "absolute", top: 0, right: 0, left: 0, bottom: 0 }
          />
        ),
        tabBarLabelStyle: {
          fontSize: 12,
          fontWeight: 600,
        },
        headerShown: false,
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: "Shop",
          tabBarIcon: ({ color, size }) => <Ionicons name="grid" size={size} color={color} />,
        }}
      />
      <Tabs.Screen
        name="cart"
        options={{
          title: "Cart",
          tabBarIcon: ({ color, size }) => <Ionicons name="cart" size={size} color={color} />,
        }}
      />
      <Tabs.Screen
        name="assistant"
        options={{
          title: "AI",
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="chatbubble-ellipses" size={size} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          title: "Profile",
          tabBarIcon: ({ color, size }) => <Ionicons name="person" size={size} color={color} />,
        }}
      />
    </Tabs>
  );
};

export default TabsLayout;
