import { View, Text, TouchableOpacity } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useI18n } from "@/lib/i18n";

interface ErrorStateProps {
  title?: string;
  description?: string;
  onRetry?: () => void;
}

export function ErrorState({
  title,
  description,
  onRetry,
}: ErrorStateProps) {
  const { t } = useI18n();
  return (
    <View className="flex-1 bg-background dark:bg-background-dark items-center justify-center px-6">
      <Ionicons name="alert-circle-outline" size={64} color="#FF6B6B" />
      <Text className="text-text-primary dark:text-text-primary-dark font-semibold text-xl mt-4">{title || t("error.genericTitle")}</Text>
      <Text className="text-text-secondary dark:text-text-secondary-dark text-center mt-2">{description || t("common.connectionRetry")}</Text>
      {onRetry && (
        <TouchableOpacity onPress={onRetry} className="mt-4 bg-primary px-6 py-3 rounded-xl">
          <Text className="text-background font-semibold">{t("common.tryAgain")}</Text>
        </TouchableOpacity>
      )}
    </View>
  );
}
