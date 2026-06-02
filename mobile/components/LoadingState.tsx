import { View, Text, ActivityIndicator } from "react-native";
import { useI18n } from "@/lib/i18n";

interface LoadingStateProps {
  message?: string;
  color?: string;
}

const LoadingState = ({ message, color = "#1DB954" }: LoadingStateProps) => {
  const { t } = useI18n();
  return (
    <View className="flex-1 bg-background dark:bg-background-dark items-center justify-center">
      <ActivityIndicator size={"large"} color={color} />
      <Text className="text-text-secondary dark:text-text-secondary-dark mt-4">{message || t("common.loading")}</Text>
    </View>
  );
};

export default LoadingState;
