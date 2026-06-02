import useSocialAuth from "@/hooks/useSocialAuth";
import { useI18n } from "@/lib/i18n";
import { View, Text, Image, TouchableOpacity, ActivityIndicator } from "react-native";

const AuthScreen = () => {
  const { loadingStrategy, handleSocialAuth } = useSocialAuth();
  const { t } = useI18n();

  return (
    <View className="px-8 flex-1 justify-center items-center bg-white">
      {/* DEMO IMAGE */}
      <Image
        source={require("../../assets/images/auth-image.png")}
        className="size-96"
        resizeMode="contain"
      />

      <View className="gap-2 mt-3">
        {/* GOOGLE SIGN IN BTN */}
        <TouchableOpacity
          className="flex-row items-center justify-center bg-white border border-gray-300 rounded-full px-6 py-2 w-72"
          onPress={() => handleSocialAuth("oauth_google")}
          disabled={loadingStrategy !== null}
          style={{
            shadowOffset: { width: 0, height: 1 },
            shadowOpacity: 0.1,
            elevation: 2, // this is for android
          }}
        >
          <View className="h-8 flex items-center justify-center">
            {loadingStrategy === "oauth_google" ? (
              <ActivityIndicator size={"small"} color={"#111"} />
            ) : (
              <View className="flex-row items-center justify-center">
                <Image
                  source={require("../../assets/images/google.png")}
                  className="size-8 mr-3"
                  resizeMode="contain"
                />
                <Text className="text-black font-medium text-base">
                  {t("auth.google")}
                </Text>
              </View>
            )}
          </View>
        </TouchableOpacity>

        {/* APPLE SIGN IN BTN */}
        <TouchableOpacity
          className="flex-row items-center justify-center bg-white border border-gray-300 rounded-full px-6 py-2 w-72"
          onPress={() => handleSocialAuth("oauth_apple")}
          disabled={loadingStrategy !== null}
          style={{
            shadowOffset: { width: 0, height: 1 },
            shadowOpacity: 0.1,
            elevation: 2, // this is for android
          }}
        >
          <View className="h-8 flex items-center justify-center">
            {loadingStrategy === "oauth_apple" ? (
              <ActivityIndicator size={"small"} color={"#111"} />
            ) : (
              <View className="flex-row items-center justify-center">
                <Image
                  source={require("../../assets/images/apple.png")}
                  className="size-5 mr-3"
                  resizeMode="contain"
                />
                <Text className="text-black font-medium text-base">
                  {t("auth.apple")}
                </Text>
              </View>
            )}
          </View>
        </TouchableOpacity>
      </View>

      <Text className="text-center text-gray-500 text-xs leading-4 mt-6 px-2">
        {t("auth.termsPrefix")} <Text className="text-blue-500">{t("auth.terms")}</Text>
        {", "}
        <Text className="text-blue-500">{t("auth.privacy")}</Text>
        {", and "}
        <Text className="text-blue-500">{t("auth.cookies")}</Text>
      </Text>
    </View>
  );
};

export default AuthScreen;
