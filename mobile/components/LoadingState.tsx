import { View, Text, ActivityIndicator } from "react-native";

interface LoadingStateProps {
  message?: string;
  color?: string;
}

const LoadingState = ({ message = "Loading...", color = "#1DB954" }: LoadingStateProps) => {
  return (
    <View className="flex-1 bg-background dark:bg-background-dark items-center justify-center">
      <ActivityIndicator size={"large"} color={color} />
      <Text className="text-text-secondary dark:text-text-secondary-dark mt-4">{message}</Text>
    </View>
  );
};

export default LoadingState;
