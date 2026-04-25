import { View, Text } from "react-native";
import { Ionicons } from "@expo/vector-icons";

interface EmptyStateProps {
  icon?: keyof typeof Ionicons.glyphMap;
  iconSize?: number;
  title: string;
  description?: string;
  header?: string;
}

export function EmptyState({
  icon = "folder-open-outline",
  iconSize = 80,
  title,
  description,
  header,
}: EmptyStateProps) {
  return (
    <View className="flex-1 bg-background dark:bg-background-dark">
      {header && (
        <View className="px-6 pt-16 pb-5">
          <Text className="text-text-primary dark:text-text-primary-dark text-3xl font-bold tracking-tight">{header}</Text>
        </View>
      )}
      <View className="flex-1 items-center justify-center px-6">
        <Ionicons name={icon} size={iconSize} color="#64748B" />
        <Text className="text-text-primary dark:text-text-primary-dark font-semibold text-xl mt-4">{title}</Text>
        {description && <Text className="text-text-secondary dark:text-text-secondary-dark text-center mt-2">{description}</Text>}
      </View>
    </View>
  );
}
