import SafeScreen from "@/components/SafeScreen";
import useCart from "@/hooks/useCart";
import useWishlist from "@/hooks/useWishlist";
import { useI18n } from "@/lib/i18n";
import { formatPriceByn } from "@/lib/utils";
import { Ionicons } from "@expo/vector-icons";
import { Image } from "expo-image";
import { router } from "expo-router";
import { ActivityIndicator, Alert, ScrollView, Text, TouchableOpacity, View } from "react-native";
import { useColorScheme } from "nativewind";

function WishlistScreen() {
  const { colorScheme } = useColorScheme();
  const { t } = useI18n();
  const iconColor = colorScheme === "dark" ? "#FFFFFF" : "#0F172A";

  const { wishlist, isLoading, isError, removeFromWishlist, isRemovingFromWishlist } =
    useWishlist();

  const { addToCart, isAddingToCart } = useCart();

  const handleRemoveFromWishlist = (productId: string, productName: string) => {
    Alert.alert(t("wishlist.removeTitle"), t("wishlist.removeQ", { name: productName }), [
      { text: t("common.cancel"), style: "cancel" },
      {
        text: t("common.remove"),
        style: "destructive",

        onPress: () => removeFromWishlist(productId),
      },
    ]);
  };

  const handleAddToCart = (productId: string, productName: string) => {
    addToCart(
      { productId, quantity: 1 },
      {
        onSuccess: () => Alert.alert(t("common.success"), t("products.added", { name: productName })),
        onError: (error: any) => {
          Alert.alert(t("common.error"), error?.response?.data?.error || t("products.addFailed"));
        },
      }
    );
  };

  if (isLoading) return <LoadingUI />;
  if (isError) return <ErrorUI />;

  return (
    <SafeScreen>
      {/* HEADER */}
      <View className="px-6 pb-5 border-b border-surface dark:border-surface-dark flex-row items-center">
        <TouchableOpacity onPress={() => router.back()} className="mr-4">
          <Ionicons name="arrow-back" size={28} color={iconColor} />
        </TouchableOpacity>
        <Text className="text-text-primary dark:text-text-primary-dark text-2xl font-bold">{t("wishlist.title")}</Text>
        <Text className="text-text-secondary dark:text-text-secondary-dark text-sm ml-auto">
          {t("common.itemsCount", { count: wishlist.length })}
        </Text>
      </View>

      {wishlist.length === 0 ? (
        <View className="flex-1 items-center justify-center px-6">
          <Ionicons name="heart-outline" size={80} color="#64748B" />
          <Text className="text-text-primary dark:text-text-primary-dark font-semibold text-xl mt-4">
            {t("wishlist.empty")}
          </Text>
          <Text className="text-text-secondary dark:text-text-secondary-dark text-center mt-2">
            {t("wishlist.emptyDesc")}
          </Text>
          <TouchableOpacity
            className="bg-primary rounded-2xl px-8 py-4 mt-6"
            activeOpacity={0.8}
            onPress={() => router.push("/(tabs)")}
          >
            <Text className="text-background font-bold text-base">{t("wishlist.browse")}</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <ScrollView
          className="flex-1"
          showsVerticalScrollIndicator={false}
          contentContainerStyle={{ paddingBottom: 100 }}
        >
          <View className="px-6 py-4">
            {wishlist.map((item) => (
              <TouchableOpacity
                key={item._id}
                className="bg-surface dark:bg-surface-dark rounded-3xl overflow-hidden mb-3"
                activeOpacity={0.8}
                // onPress={() => router.push(`/product/${item._id}`)}
              >
                <View className="flex-row p-4">
                  <Image
                    source={item.images[0]}
                    className="rounded-2xl bg-background-lighter dark:bg-background-dark-lighter"
                    style={{ width: 96, height: 96, borderRadius: 8 }}
                  />

                  <View className="flex-1 ml-4">
                    <Text className="text-text-primary dark:text-text-primary-dark font-bold text-base mb-2" numberOfLines={2}>
                      {item.name}
                    </Text>
                    <Text className="text-primary font-bold text-xl mb-2">{formatPriceByn(item.price)}</Text>

                    {item.stock > 0 ? (
                      <View className="flex-row items-center">
                        <View className="w-2 h-2 bg-green-500 rounded-full mr-2" />
                        <Text className="text-green-500 text-sm font-semibold">
                          {t("wishlist.inStock", { count: item.stock })}
                        </Text>
                      </View>
                    ) : (
                      <View className="flex-row items-center">
                        <View className="w-2 h-2 bg-red-500 rounded-full mr-2" />
                        <Text className="text-red-500 text-sm font-semibold">{t("wishlist.outOfStock")}</Text>
                      </View>
                    )}
                  </View>

                  <TouchableOpacity
                    className="self-start bg-red-500/20 p-2 rounded-full"
                    activeOpacity={0.7}
                    onPress={() => handleRemoveFromWishlist(item._id, item.name)}
                    disabled={isRemovingFromWishlist}
                  >
                    <Ionicons name="trash-outline" size={20} color="#EF4444" />
                  </TouchableOpacity>
                </View>
                {item.stock > 0 && (
                  <View className="px-4 pb-4">
                    <TouchableOpacity
                      className="bg-primary rounded-xl py-3 items-center"
                      activeOpacity={0.8}
                      onPress={() => handleAddToCart(item._id, item.name)}
                      disabled={isAddingToCart}
                    >
                      {isAddingToCart ? (
                        <ActivityIndicator size="small" color="#F8FAFC" />
                      ) : (
                        <Text className="text-background font-bold">{t("wishlist.addToCart")}</Text>
                      )}
                    </TouchableOpacity>
                  </View>
                )}
              </TouchableOpacity>
            ))}
          </View>
        </ScrollView>
      )}
    </SafeScreen>
  );
}
export default WishlistScreen;

function LoadingUI() {
  const { colorScheme } = useColorScheme();
  const iconColor = colorScheme === "dark" ? "#FFFFFF" : "#0F172A";

  return (
    <SafeScreen>
      <View className="px-6 pb-5 border-b border-surface dark:border-surface-dark flex-row items-center">
        <TouchableOpacity onPress={() => router.back()} className="mr-4">
          <Ionicons name="arrow-back" size={28} color={iconColor} />
        </TouchableOpacity>
        <Text className="text-text-primary dark:text-text-primary-dark text-2xl font-bold">{t("wishlist.title")}</Text>
      </View>
      <View className="flex-1 items-center justify-center">
        <ActivityIndicator size="large" color="#1DB954" />
        <Text className="text-text-secondary dark:text-text-secondary-dark mt-4">{t("wishlist.loading")}</Text>
      </View>
    </SafeScreen>
  );
}

function ErrorUI() {
  const { colorScheme } = useColorScheme();
  const iconColor = colorScheme === "dark" ? "#FFFFFF" : "#0F172A";

  return (
    <SafeScreen>
      <View className="px-6 pb-5 border-b border-surface dark:border-surface-dark flex-row items-center">
        <TouchableOpacity onPress={() => router.back()} className="mr-4">
          <Ionicons name="arrow-back" size={28} color={iconColor} />
        </TouchableOpacity>
        <Text className="text-text-primary dark:text-text-primary-dark text-2xl font-bold">{t("wishlist.title")}</Text>
      </View>
      <View className="flex-1 items-center justify-center px-6">
        <Ionicons name="alert-circle-outline" size={64} color="#FF6B6B" />
        <Text className="text-text-primary dark:text-text-primary-dark font-semibold text-xl mt-4">
          {t("wishlist.failed")}
        </Text>
        <Text className="text-text-secondary dark:text-text-secondary-dark text-center mt-2">
          {t("common.connectionRetry")}
        </Text>
      </View>
    </SafeScreen>
  );
}
