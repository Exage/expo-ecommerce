import SafeScreen from "@/components/SafeScreen";
import useCart from "@/hooks/useCart";
import useWishlist from "@/hooks/useWishlist";
import { Ionicons } from "@expo/vector-icons";
import { Image } from "expo-image";
import { router } from "expo-router";
import { ActivityIndicator, Alert, ScrollView, Text, TouchableOpacity, View } from "react-native";
import { useColorScheme } from "nativewind";

function WishlistScreen() {
  const { colorScheme } = useColorScheme();
  const iconColor = colorScheme === "dark" ? "#FFFFFF" : "#0F172A";

  const { wishlist, isLoading, isError, removeFromWishlist, isRemovingFromWishlist } =
    useWishlist();

  const { addToCart, isAddingToCart } = useCart();

  const handleRemoveFromWishlist = (productId: string, productName: string) => {
    Alert.alert("Remove from wishlist", `Remove ${productName} from wishlist`, [
      { text: "Cancel", style: "cancel" },
      {
        text: "Remove",
        style: "destructive",

        onPress: () => removeFromWishlist(productId),
      },
    ]);
  };

  const handleAddToCart = (productId: string, productName: string) => {
    addToCart(
      { productId, quantity: 1 },
      {
        onSuccess: () => Alert.alert("Success", `${productName} added to cart!`),
        onError: (error: any) => {
          Alert.alert("Error", error?.response?.data?.error || "Failed to add to cart");
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
        <Text className="text-text-primary dark:text-text-primary-dark text-2xl font-bold">Wishlist</Text>
        <Text className="text-text-secondary dark:text-text-secondary-dark text-sm ml-auto">
          {wishlist.length} {wishlist.length === 1 ? "item" : "items"}
        </Text>
      </View>

      {wishlist.length === 0 ? (
        <View className="flex-1 items-center justify-center px-6">
          <Ionicons name="heart-outline" size={80} color="#64748B" />
          <Text className="text-text-primary dark:text-text-primary-dark font-semibold text-xl mt-4">
            Your wishlist is empty
          </Text>
          <Text className="text-text-secondary dark:text-text-secondary-dark text-center mt-2">
            Start adding products you love!
          </Text>
          <TouchableOpacity
            className="bg-primary rounded-2xl px-8 py-4 mt-6"
            activeOpacity={0.8}
            onPress={() => router.push("/(tabs)")}
          >
            <Text className="text-background font-bold text-base">Browse Products</Text>
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
                    <Text className="text-primary font-bold text-xl mb-2">
                      ${item.price.toFixed(2)}
                    </Text>

                    {item.stock > 0 ? (
                      <View className="flex-row items-center">
                        <View className="w-2 h-2 bg-green-500 rounded-full mr-2" />
                        <Text className="text-green-500 text-sm font-semibold">
                          {item.stock} in stock
                        </Text>
                      </View>
                    ) : (
                      <View className="flex-row items-center">
                        <View className="w-2 h-2 bg-red-500 rounded-full mr-2" />
                        <Text className="text-red-500 text-sm font-semibold">Out of Stock</Text>
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
                        <Text className="text-background font-bold">Add to Cart</Text>
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
        <Text className="text-text-primary dark:text-text-primary-dark text-2xl font-bold">Wishlist</Text>
      </View>
      <View className="flex-1 items-center justify-center">
        <ActivityIndicator size="large" color="#1DB954" />
        <Text className="text-text-secondary dark:text-text-secondary-dark mt-4">Loading wishlist...</Text>
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
        <Text className="text-text-primary dark:text-text-primary-dark text-2xl font-bold">Wishlist</Text>
      </View>
      <View className="flex-1 items-center justify-center px-6">
        <Ionicons name="alert-circle-outline" size={64} color="#FF6B6B" />
        <Text className="text-text-primary dark:text-text-primary-dark font-semibold text-xl mt-4">
          Failed to load wishlist
        </Text>
        <Text className="text-text-secondary dark:text-text-secondary-dark text-center mt-2">
          Please check your connection and try again
        </Text>
      </View>
    </SafeScreen>
  );
}
