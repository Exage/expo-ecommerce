import ProductsGrid from "@/components/ProductsGrid";
import SafeScreen from "@/components/SafeScreen";
import useCatalogMeta from "@/hooks/useCatalogMeta";
import useProducts from "@/hooks/useProducts";

import { Ionicons } from "@expo/vector-icons";
import { useEffect, useMemo, useState } from "react";
import { View, Text, ScrollView, TouchableOpacity, TextInput, Image } from "react-native";
import { useColorScheme } from "nativewind";

const CATEGORY_IMAGES = {
  Electronics: require("@/assets/images/electronics.png"),
  Fashion: require("@/assets/images/fashion.png"),
  Sports: require("@/assets/images/sports.png"),
  Books: require("@/assets/images/books.png"),
} as const;

const ShopScreen = () => {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("All");
  const [selectedSubcategory, setSelectedSubcategory] = useState("All");
  const { colorScheme } = useColorScheme();
  const iconColor = colorScheme === "dark" ? "#FFFFFF" : "#0F172A";
  const mutedIconColor = colorScheme === "dark" ? "#B3B3B3" : "#64748B";

  const { data: products, isLoading, isError } = useProducts();
  const { data: catalogMeta } = useCatalogMeta();

  const categoryIconMap = useMemo(() => {
    const map: Record<string, string> = { All: "grid-outline" };
    (catalogMeta?.categories || []).forEach((category) => {
      map[category.name] = category.icon || "pricetag-outline";
    });
    return map;
  }, [catalogMeta]);

  const derivedCategories = useMemo(() => {
    const set = new Set((products ?? []).map((product) => product.category).filter(Boolean));
    return Array.from(set);
  }, [products]);

  const categories = useMemo(() => {
    const backendCategories = catalogMeta?.categories?.map((category) => category.name) || [];
    const source = backendCategories.length > 0 ? backendCategories : derivedCategories;
    return ["All", ...source];
  }, [catalogMeta, derivedCategories]);

  const subcategories = useMemo(() => {
    if (selectedCategory === "All") return ["All"];
    const selected = catalogMeta?.categories?.find((category) => category.name === selectedCategory);
    if (selected) {
      return ["All", ...selected.subcategories.map((subcategory) => subcategory.name)];
    }

    const set = new Set(
      (products ?? [])
        .filter((product) => product.category === selectedCategory)
        .map((product) => product.subcategory)
        .filter((subcategory): subcategory is string => Boolean(subcategory))
    );
    const derived = Array.from(set);
    return ["All", ...derived];
  }, [catalogMeta, products, selectedCategory]);

  useEffect(() => {
    if (!categories.includes(selectedCategory)) {
      setSelectedCategory("All");
      setSelectedSubcategory("All");
    }
  }, [categories, selectedCategory]);

  useEffect(() => {
    if (!subcategories.includes(selectedSubcategory)) {
      setSelectedSubcategory("All");
    }
  }, [selectedSubcategory, subcategories]);

  const filteredProducts = useMemo(() => {
    if (!products) return [];

    let filtered = products;

    // filtering by category
    if (selectedCategory !== "All") {
      filtered = filtered.filter((product) => product.category === selectedCategory);
    }

    if (selectedSubcategory !== "All") {
      filtered = filtered.filter((product) => product.subcategory === selectedSubcategory);
    }

    // filtering by searh query
    if (searchQuery.trim()) {
      filtered = filtered.filter((product) =>
        product.name.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }

    return filtered;
  }, [products, searchQuery, selectedCategory, selectedSubcategory]);

  return (
    <SafeScreen>
      <ScrollView
        className="flex-1"
        contentContainerStyle={{ paddingBottom: 100 }}
        showsVerticalScrollIndicator={false}
      >
        {/* HEADER */}
        <View className="px-6 pb-4 pt-6">
          <View className="flex-row items-center justify-between mb-6">
            <View>
              <Text className="text-text-primary dark:text-text-primary-dark text-3xl font-bold tracking-tight">Shop</Text>
              <Text className="text-text-secondary dark:text-text-secondary-dark text-sm mt-1">Browse all products</Text>
            </View>

            <TouchableOpacity
              className="bg-surface/50 dark:bg-surface-dark/50 p-3 rounded-full"
              activeOpacity={0.7}
            >
              <Ionicons name="options-outline" size={22} color={iconColor} />
            </TouchableOpacity>
          </View>

          {/* SEARCH BAR */}
          <View className="bg-surface dark:bg-surface-dark flex-row items-center px-5 py-4 rounded-2xl">
            <Ionicons color={mutedIconColor} size={22} name="search" />
            <TextInput
              placeholder="Search for products"
              placeholderTextColor={mutedIconColor}
              className="flex-1 ml-3 text-base text-text-primary dark:text-text-primary-dark"
              value={searchQuery}
              onChangeText={setSearchQuery}
            />
          </View>
        </View>

        {/* CATEGORY FILTER */}
        <View className="mb-6">
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={{ paddingHorizontal: 20 }}
          >
            {categories.map((categoryName) => {
              const isSelected = selectedCategory === categoryName;
              const iconName = categoryIconMap[categoryName] || "pricetag-outline";
              const categoryImage = CATEGORY_IMAGES[categoryName as keyof typeof CATEGORY_IMAGES];
              return (
                <TouchableOpacity
                  key={categoryName}
                  onPress={() => {
                    setSelectedCategory(categoryName);
                    setSelectedSubcategory("All");
                  }}
                  className={`mr-3 rounded-2xl size-20 overflow-hidden items-center justify-center ${isSelected ? "bg-primary" : "bg-surface dark:bg-surface-dark"}`}
                >
                  {categoryImage ? (
                    <Image source={categoryImage} className="size-10" resizeMode="contain" />
                  ) : (
                    <Ionicons
                      name={iconName as keyof typeof Ionicons.glyphMap}
                      size={28}
                      color={isSelected ? "#F8FAFC" : iconColor}
                    />
                  )}
                  <Text
                    numberOfLines={1}
                    className={`text-xs mt-1 px-2 ${isSelected ? "text-background" : "text-text-primary dark:text-text-primary-dark"}`}
                  >
                    {categoryName}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </ScrollView>
        </View>

        {/* SUBCATEGORY FILTER */}
        {selectedCategory !== "All" && (
          <View className="mb-6">
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={{ paddingHorizontal: 20 }}
            >
              {subcategories.map((subcategoryName) => {
                const isSelected = selectedSubcategory === subcategoryName;
                return (
                  <TouchableOpacity
                    key={subcategoryName}
                    onPress={() => setSelectedSubcategory(subcategoryName)}
                    className={`mr-2 px-4 py-2 rounded-full ${isSelected ? "bg-primary" : "bg-surface dark:bg-surface-dark"}`}
                  >
                    <Text className={`text-sm ${isSelected ? "text-background" : "text-text-primary dark:text-text-primary-dark"}`}>
                      {subcategoryName}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </ScrollView>
          </View>
        )}

        <View className="px-6 mb-6">
          <View className="flex-row items-center justify-between mb-4">
            <Text className="text-text-primary dark:text-text-primary-dark text-lg font-bold">Products</Text>
            <Text className="text-text-secondary dark:text-text-secondary-dark text-sm">{filteredProducts.length} items</Text>
          </View>

          {/* PRODUCTS GRID */}
          <ProductsGrid products={filteredProducts} isLoading={isLoading} isError={isError} />
        </View>
      </ScrollView>
    </SafeScreen>
  );
};

export default ShopScreen;
