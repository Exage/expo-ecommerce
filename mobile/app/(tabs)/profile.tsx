import SafeScreen from "@/components/SafeScreen";
import { useI18n } from "@/lib/i18n";
import { setStoredTheme } from "@/lib/theme";
import { useAuth, useUser } from "@clerk/clerk-expo";

import { ScrollView, Switch, Text, TouchableOpacity, View } from "react-native";
import { Image } from "expo-image";
import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import { useColorScheme } from "nativewind";

const MENU_ITEMS = [
  { id: 1, icon: "person-outline", titleKey: "profile.editProfile", color: "#3B82F6", action: "/profile" },
  { id: 2, icon: "list-outline", titleKey: "profile.orders", color: "#10B981", action: "/orders" },
  { id: 3, icon: "location-outline", titleKey: "profile.addresses", color: "#F59E0B", action: "/addresses" },
  { id: 4, icon: "heart-outline", titleKey: "profile.wishlist", color: "#EF4444", action: "/wishlist" },
] as const;

const ProfileScreen = () => {
  const { signOut } = useAuth();
  const { user } = useUser();
  const { language, setLanguage, t } = useI18n();
  const { colorScheme, setColorScheme } = useColorScheme();
  const isDark = colorScheme === "dark";
  // const iconColor = colorScheme === "dark" ? "#FFFFFF" : "#0F172A";
  // const mutedIconColor = colorScheme === "dark" ? "#B3B3B3" : "#64748B";
  const switchTrackColor = { false: isDark ? "#2A2A2A" : "#CBD5E1", true: "#1DB954" };

  const handleMenuPress = (action: (typeof MENU_ITEMS)[number]["action"]) => {
    if (action === "/profile") return;
    router.push(action);
  };

  const handleThemeToggle = async (enabled: boolean) => {
    const nextTheme = enabled ? "dark" : "light";
    setColorScheme(nextTheme);
    await setStoredTheme(nextTheme);
  };

  return (
    <SafeScreen>
      <ScrollView
        className="flex-1"
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: 100 }}
      >
        {/* HEADER */}
        <View className="px-6 pb-8">
          <View className="bg-surface dark:bg-surface-dark rounded-3xl p-6">
            <View className="flex-row items-center">
              <View className="relative">
                <Image
                  source={user?.imageUrl}
                  style={{ width: 80, height: 80, borderRadius: 40 }}
                  transition={200}
                />
                <View className="absolute -bottom-1 -right-1 bg-primary rounded-full size-7 items-center justify-center border-2 border-surface dark:border-surface-dark">
                  <Ionicons name="checkmark" size={16} color="#121212" />
                </View>
              </View>

              <View className="flex-1 ml-4">
                <Text className="text-text-primary dark:text-text-primary-dark text-2xl font-bold mb-1">
                  {user?.firstName} {user?.lastName}
                </Text>
                <Text className="text-text-secondary dark:text-text-secondary-dark text-sm">
                  {user?.emailAddresses?.[0]?.emailAddress || t("profile.noEmail")}
                </Text>
              </View>
            </View>
          </View>
        </View>

        {/* MENU ITEMS */}
        <View className="flex-row flex-wrap gap-2 mx-6 mb-3">
          {MENU_ITEMS.map((item) => (
            <TouchableOpacity
              key={item.id}
              className="bg-surface dark:bg-surface-dark rounded-2xl p-6 items-center justify-center"
              style={{ width: "48%" }}
              activeOpacity={0.7}
              onPress={() => handleMenuPress(item.action)}
            >
              <View
                className="rounded-full w-16 h-16 items-center justify-center mb-4"
                style={{ backgroundColor: item.color + "20" }}
              >
                <Ionicons name={item.icon} size={28} color={item.color} />
              </View>
              <Text className="text-text-primary dark:text-text-primary-dark font-bold text-base">{t(item.titleKey)}</Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* THEME TOGGLE */}
        <View className="mb-3 mx-6 bg-surface dark:bg-surface-dark rounded-2xl p-4">
          <View className="flex-row items-center justify-between py-2">
            <View className="flex-row items-center">
              <Ionicons name={isDark ? "moon-outline" : "sunny-outline"} size={22} color="#1DB954" />
              <Text className="text-text-primary dark:text-text-primary-dark font-semibold ml-3">
                {t("profile.darkTheme")}
              </Text>
            </View>
            <Switch
              value={isDark}
              onValueChange={(value) => void handleThemeToggle(value)}
              thumbColor="#FFFFFF"
              trackColor={switchTrackColor}
            />
          </View>
        </View>

        <View className="mb-3 mx-6 bg-surface dark:bg-surface-dark rounded-2xl p-4">
          <Text className="text-text-primary dark:text-text-primary-dark font-semibold mb-3">{t("language.label")}</Text>
          <View className="flex-row gap-2">
            <TouchableOpacity
              className={`flex-1 rounded-xl py-3 items-center ${language === "ru" ? "bg-primary" : "bg-background-lighter dark:bg-background-dark-lighter"}`}
              onPress={() => setLanguage("ru")}
            >
              <Text className={language === "ru" ? "text-background font-bold" : "text-text-primary dark:text-text-primary-dark font-semibold"}>
                {t("language.russian")}
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              className={`flex-1 rounded-xl py-3 items-center ${language === "en" ? "bg-primary" : "bg-background-lighter dark:bg-background-dark-lighter"}`}
              onPress={() => setLanguage("en")}
            >
              <Text className={language === "en" ? "text-background font-bold" : "text-text-primary dark:text-text-primary-dark font-semibold"}>
                {t("language.english")}
              </Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* NOTIFICATONS BTN */}
        {/* <View className="mb-3 mx-6 bg-surface dark:bg-surface-dark rounded-2xl p-4">
          <TouchableOpacity
            className="flex-row items-center justify-between py-2"
            activeOpacity={0.7}
          >
            <View className="flex-row items-center">
              <Ionicons name="notifications-outline" size={22} color={iconColor} />
              <Text className="text-text-primary dark:text-text-primary-dark font-semibold ml-3">Notifications</Text>
            </View>
            <Ionicons name="chevron-forward" size={20} color={mutedIconColor} />
          </TouchableOpacity>
        </View> */}

        {/* PRIVACY AND SECURTIY LINK */}
        {/* <View className="mb-3 mx-6 bg-surface dark:bg-surface-dark rounded-2xl p-4">
          <TouchableOpacity
            className="flex-row items-center justify-between py-2"
            activeOpacity={0.7}
            onPress={() => router.push("/privacy-security")}
          >
            <View className="flex-row items-center">
              <Ionicons name="shield-checkmark-outline" size={22} color={iconColor} />
              <Text className="text-text-primary dark:text-text-primary-dark font-semibold ml-3">Privacy & Security</Text>
            </View>
            <Ionicons name="chevron-forward" size={20} color={mutedIconColor} />
          </TouchableOpacity>
        </View> */}

        {/* SIGNOUT BTN */}
        <TouchableOpacity
          className="mx-6 mb-3 bg-surface dark:bg-surface-dark rounded-2xl py-5 flex-row items-center justify-center border-2 border-red-500/20"
          activeOpacity={0.8}
          onPress={() => signOut()}
        >
          <Ionicons name="log-out-outline" size={22} color="#EF4444" />
          <Text className="text-red-500 font-bold text-base ml-2">{t("profile.signOut")}</Text>
        </TouchableOpacity>

        <Text className="mx-6 mb-3 text-center text-text-secondary dark:text-text-secondary-dark text-xs">Version 1.0.0</Text>
      </ScrollView>
    </SafeScreen>
  );
};

export default ProfileScreen;

// REACT NATIVE IMAGE VS EXPO IMAGE:

// React Native Image (what we have used so far):
// import { Image } from "react-native";
//
// <Image source={{ uri: url }} />

// Basic image component
// No built-in caching optimization
// Requires source={{ uri: string }}

// Expo Image (from expo-image):
// import { Image } from "expo-image";

// <Image source={url} />

// Caching - automatic disk/memory caching
// Placeholder - blur hash, thumbnail while loading
// Transitions - crossfade, fade animations
// Better performance - optimized native rendering
// Simpler syntax: source={url} or source={{ uri: url }}
// Supports contentFit instead of resizeMode

// Example with expo-image:
// <Image   source={user?.imageUrl}  placeholder={blurhash}  transition={200}  contentFit="cover"  className="size-20 rounded-full"/>

// Recommendation: For production apps, expo-image is better — faster, cached, smoother UX.
// React Native's Image works fine for simple cases though.
