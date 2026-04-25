import { View, Text, TouchableOpacity } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import { useColorScheme } from "nativewind";

export default function AddressesHeader() {
  const { colorScheme } = useColorScheme();
  const iconColor = colorScheme === "dark" ? "#FFFFFF" : "#0F172A";

  return (
    <View className="px-6 pb-5 border-b border-surface dark:border-surface-dark flex-row items-center">
      <TouchableOpacity onPress={() => router.back()} className="mr-4">
        <Ionicons name="arrow-back" size={28} color={iconColor} />
      </TouchableOpacity>
      <Text className="text-text-primary dark:text-text-primary-dark text-2xl font-bold">My Addresses</Text>
    </View>
  );
}
