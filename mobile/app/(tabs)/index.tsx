import ProductsGrid from "@/components/ProductsGrid";
import SafeScreen from "@/components/SafeScreen";
import useCatalogMeta from "@/hooks/useCatalogMeta";
import useProducts from "@/hooks/useProducts";
import { useI18n } from "@/lib/i18n";
import { CatalogSpecRule, Product } from "@/types";

import { Ionicons } from "@expo/vector-icons";
import { useCallback, useEffect, useMemo, useState } from "react";
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Image,
  RefreshControl,
  Modal,
} from "react-native";
import { useColorScheme } from "nativewind";

const CATEGORY_IMAGES = {
  Electronics: require("@/assets/images/electronics.png"),
  Fashion: require("@/assets/images/fashion.png"),
  Sports: require("@/assets/images/sports.png"),
  Books: require("@/assets/images/books.png"),
} as const;

const HIDDEN_CATEGORIES = new Set(["Fashion", "Books"]);

const HIDDEN_SUBCATEGORIES: Record<string, Set<string>> = {
  Electronics: new Set(["Smartwatch", "Television"]),
  Sports: new Set(["Yoga Mat", "Football"]),
};

type SpecFilterValue = string | number | boolean;

const SMARTPHONE_FILTER_OVERRIDES: Record<string, Partial<CatalogSpecRule>> = {
  brand: {
    type: "enum",
    options: ["apple", "samsung", "google", "xiaomi", "oneplus", "huawei", "nothing", "other"],
  },
  displayType: {
    type: "enum",
    options: ["ips", "oled", "amoled", "super-amoled", "ltpo", "other"],
  },
  processor: {
    type: "enum",
    options: [
      "a17-pro",
      "a18",
      "snapdragon-8-gen-2",
      "snapdragon-8-gen-3",
      "dimensity-9200",
      "dimensity-9300",
      "tensor-g3",
      "tensor-g4",
      "exynos-2400",
      "other",
    ],
  },
  mainCamera: {
    type: "enum",
    options: ["12mp", "48mp", "50mp", "64mp", "108mp", "200mp", "other"],
  },
  frontCamera: {
    type: "enum",
    options: ["8mp", "10mp", "12mp", "16mp", "32mp", "other"],
  },
  color: {
    type: "enum",
    options: ["black", "white", "silver", "gray", "blue", "green", "red", "purple", "gold", "pink", "other"],
  },
};

const ShopScreen = () => {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("All");
  const [selectedSubcategory, setSelectedSubcategory] = useState("All");
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [showFiltersModal, setShowFiltersModal] = useState(false);
  const [appliedSpecFilters, setAppliedSpecFilters] = useState<Record<string, SpecFilterValue>>({});
  const [draftSpecFilters, setDraftSpecFilters] = useState<Record<string, SpecFilterValue>>({});
  const { t } = useI18n();
  const { colorScheme } = useColorScheme();
  const iconColor = colorScheme === "dark" ? "#FFFFFF" : "#0F172A";
  const mutedIconColor = colorScheme === "dark" ? "#B3B3B3" : "#64748B";

  const { data: products, isLoading, isError, refetch: refetchProducts } = useProducts();
  const { data: catalogMeta, refetch: refetchCatalogMeta } = useCatalogMeta();

  const handleRefresh = useCallback(async () => {
    setIsRefreshing(true);
    try {
      await Promise.all([refetchProducts(), refetchCatalogMeta()]);
    } finally {
      setIsRefreshing(false);
    }
  }, [refetchCatalogMeta, refetchProducts]);

  const categoryIconMap = useMemo(() => {
    const map: Record<string, string> = { All: "grid-outline" };
    (catalogMeta?.categories || []).forEach((category) => {
      map[category.name] = category.icon || "pricetag-outline";
    });
    return map;
  }, [catalogMeta]);

  const derivedCategories = useMemo(() => {
    const set = new Set(
      (products ?? [])
        .map((product) => product.category)
        .filter((category): category is string => Boolean(category) && !HIDDEN_CATEGORIES.has(category))
    );
    return Array.from(set);
  }, [products]);

  const categories = useMemo(() => {
    const backendCategories =
      catalogMeta?.categories
        ?.map((category) => category.name)
        .filter((categoryName) => !HIDDEN_CATEGORIES.has(categoryName)) || [];
    const source = backendCategories.length > 0 ? backendCategories : derivedCategories;
    return ["All", ...source];
  }, [catalogMeta, derivedCategories]);

  const subcategories = useMemo(() => {
    if (selectedCategory === "All") return ["All"];
    const selected = catalogMeta?.categories?.find((category) => category.name === selectedCategory);
    if (selected) {
      const hidden = HIDDEN_SUBCATEGORIES[selectedCategory] ?? new Set<string>();
      return [
        "All",
        ...selected.subcategories
          .map((subcategory) => subcategory.name)
          .filter((subcategoryName) => !hidden.has(subcategoryName)),
      ];
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

  const activeSpecRules = useMemo<Record<string, CatalogSpecRule>>(() => {
    if (selectedCategory === "All" || selectedSubcategory === "All") return {};
    const category = catalogMeta?.categories.find((item) => item.name === selectedCategory);
    const subcategory = category?.subcategories.find((item) => item.name === selectedSubcategory);
    if (!subcategory?.specs) return {};

    const baseRules = Object.fromEntries(
      Object.entries(subcategory.specs).filter(([, rule]) => rule.filterable)
    );

    if (selectedCategory === "Electronics" && selectedSubcategory === "Smartphone") {
      const merged: Record<string, CatalogSpecRule> = { ...baseRules };
      Object.entries(SMARTPHONE_FILTER_OVERRIDES).forEach(([key, override]) => {
        if (!merged[key]) return;
        merged[key] = { ...merged[key], ...override, filterable: true };
      });
      return merged;
    }

    return baseRules;
  }, [catalogMeta, selectedCategory, selectedSubcategory]);

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

  useEffect(() => {
    const allowedKeys = new Set(Object.keys(activeSpecRules));
    setAppliedSpecFilters((prev) =>
      Object.fromEntries(Object.entries(prev).filter(([key]) => allowedKeys.has(key)))
    );
    setDraftSpecFilters((prev) =>
      Object.fromEntries(Object.entries(prev).filter(([key]) => allowedKeys.has(key)))
    );
  }, [activeSpecRules]);

  const doesProductMatchSpecFilters = useCallback(
    (product: Product) => {
      const filters = Object.entries(appliedSpecFilters);
      if (filters.length === 0) return true;

      for (const [specKey, filterValue] of filters) {
        const specRule = activeSpecRules[specKey];
        if (!specRule) continue;

        const productValue = product.specs?.[specKey];
        if (productValue === undefined || productValue === null) return false;

        if (specRule.type === "boolean") {
          if (Boolean(productValue) !== Boolean(filterValue)) return false;
          continue;
        }

        if (specRule.type === "number") {
          const numericFilter = Number(filterValue);
          if (Number.isNaN(numericFilter) || Number(productValue) !== numericFilter) return false;
          continue;
        }

        if (specRule.type === "string") {
          const needle = String(filterValue).toLowerCase().trim();
          const haystack = String(productValue).toLowerCase();
          if (!haystack.includes(needle)) return false;
          continue;
        }

        if (specRule.type === "enum") {
          if (String(productValue) !== String(filterValue)) return false;
          continue;
        }

        if (specRule.type === "string[]") {
          const needle = String(filterValue).toLowerCase().trim();
          const values = Array.isArray(productValue) ? productValue.map((item) => String(item).toLowerCase()) : [];
          if (!values.some((item) => item.includes(needle))) return false;
          continue;
        }

        if (specRule.type === "number[]") {
          const numericFilter = Number(filterValue);
          const values = Array.isArray(productValue) ? productValue.map((item) => Number(item)) : [];
          if (Number.isNaN(numericFilter) || !values.includes(numericFilter)) return false;
          continue;
        }
      }

      return true;
    },
    [activeSpecRules, appliedSpecFilters]
  );

  const filteredProducts = useMemo(() => {
    if (!products) return [];

    let filtered = products.filter((product) => {
      if (HIDDEN_CATEGORIES.has(product.category)) return false;
      const hidden = HIDDEN_SUBCATEGORIES[product.category] ?? new Set<string>();
      return !hidden.has(product.subcategory ?? "");
    });

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

    filtered = filtered.filter((product) => doesProductMatchSpecFilters(product));

    return filtered;
  }, [products, searchQuery, selectedCategory, selectedSubcategory, doesProductMatchSpecFilters]);

  const openFiltersModal = () => {
    setDraftSpecFilters(appliedSpecFilters);
    setShowFiltersModal(true);
  };

  const applyFilters = () => {
    setAppliedSpecFilters(draftSpecFilters);
    setShowFiltersModal(false);
  };

  const clearFilters = () => {
    setDraftSpecFilters({});
    setAppliedSpecFilters({});
  };

  const formatSpecLabel = (key: string) =>
    key
      .replace(/([a-z0-9])([A-Z])/g, "$1 $2")
      .replace(/[_-]+/g, " ")
      .replace(/\b\w/g, (ch) => ch.toUpperCase());

  const getSpecLabel = (key: string) => {
    const translated = t(`spec.${key}`);
    return translated === `spec.${key}` ? formatSpecLabel(key) : translated;
  };

  const canOpenFilters =
    selectedCategory !== "All" &&
    selectedSubcategory !== "All" &&
    Object.keys(activeSpecRules).length > 0;

  return (
    <SafeScreen>
      <ScrollView
        className="flex-1"
        contentContainerStyle={{ paddingBottom: 100 }}
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={isRefreshing} onRefresh={handleRefresh} />}
      >
        {/* HEADER */}
        <View className="px-6 pb-4 pt-6">
          <View className="flex-row items-center justify-between mb-6">
            <View>
              <Text className="text-text-primary dark:text-text-primary-dark text-3xl font-bold tracking-tight">{t("shop.title")}</Text>
              <Text className="text-text-secondary dark:text-text-secondary-dark text-sm mt-1">{t("shop.subtitle")}</Text>
            </View>

            {canOpenFilters && (
              <TouchableOpacity
                className="bg-surface/50 dark:bg-surface-dark/50 p-3 rounded-full"
                activeOpacity={0.7}
                onPress={openFiltersModal}
              >
                <Ionicons name="options-outline" size={22} color={iconColor} />
              </TouchableOpacity>
            )}
          </View>

          {/* SEARCH BAR */}
          <View className="bg-surface dark:bg-surface-dark flex-row items-center px-5 py-4 rounded-2xl">
            <Ionicons color={mutedIconColor} size={22} name="search" />
            <TextInput
              placeholder={t("shop.search")}
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
            <Text className="text-text-primary dark:text-text-primary-dark text-lg font-bold">{t("shop.products")}</Text>
            <Text className="text-text-secondary dark:text-text-secondary-dark text-sm">{t("common.itemsCount", { count: filteredProducts.length })}</Text>
          </View>

          {/* PRODUCTS GRID */}
          <ProductsGrid products={filteredProducts} isLoading={isLoading} isError={isError} />
        </View>
      </ScrollView>

      <Modal visible={showFiltersModal} animationType="slide" transparent onRequestClose={() => setShowFiltersModal(false)}>
        <View className="flex-1 bg-black/50 justify-end">
          <View className="bg-background dark:bg-background-dark rounded-t-3xl max-h-[80%]">
            <View className="px-6 py-4 border-b border-surface dark:border-surface-dark flex-row items-center justify-between">
              <Text className="text-text-primary dark:text-text-primary-dark text-xl font-bold">
                {t("filters.title")}
              </Text>
              <TouchableOpacity onPress={() => setShowFiltersModal(false)}>
                <Ionicons name="close" size={24} color={iconColor} />
              </TouchableOpacity>
            </View>

            <ScrollView className="px-6 py-4">
              {selectedCategory === "All" || selectedSubcategory === "All" ? (
                <Text className="text-text-secondary dark:text-text-secondary-dark">
                  {t("filters.selectCategoryFirst")}
                </Text>
              ) : Object.keys(activeSpecRules).length === 0 ? (
                <Text className="text-text-secondary dark:text-text-secondary-dark">
                  {t("filters.noneForSubcategory")}
                </Text>
              ) : (
                Object.entries(activeSpecRules).map(([specKey, rule]) => {
                  const currentValue = draftSpecFilters[specKey];
                  const label = getSpecLabel(specKey);

                  return (
                    <View key={specKey} className="mb-5">
                      <Text className="text-text-primary dark:text-text-primary-dark font-semibold mb-2">
                        {label}
                      </Text>

                      {(rule.type === "string" || rule.type === "number" || rule.type === "string[]" || rule.type === "number[]") && (
                        <TextInput
                          value={currentValue !== undefined ? String(currentValue) : ""}
                          onChangeText={(text) =>
                            setDraftSpecFilters((prev) => {
                              if (!text.trim()) {
                                const next = { ...prev };
                                delete next[specKey];
                                return next;
                              }
                              return { ...prev, [specKey]: rule.type.includes("number") ? Number(text) : text };
                            })
                          }
                          keyboardType={rule.type.includes("number") ? "numeric" : "default"}
                          placeholder={rule.type.includes("number") ? t("filters.enterNumber") : t("filters.enterValue")}
                          placeholderTextColor={mutedIconColor}
                          className="bg-surface dark:bg-surface-dark text-text-primary dark:text-text-primary-dark rounded-xl px-4 py-3"
                        />
                      )}

                      {rule.type === "boolean" && (
                        <View className="flex-row">
                          <FilterChip
                            label={t("common.yes")}
                            active={currentValue === true}
                            onPress={() => setDraftSpecFilters((prev) => ({ ...prev, [specKey]: true }))}
                          />
                          <FilterChip
                            label={t("common.no")}
                            active={currentValue === false}
                            onPress={() => setDraftSpecFilters((prev) => ({ ...prev, [specKey]: false }))}
                          />
                        </View>
                      )}

                      {rule.type === "enum" && (
                        <View className="flex-row flex-wrap">
                          {(rule.options || []).map((option) => (
                            <FilterChip
                              key={option}
                              label={option}
                              active={String(currentValue) === option}
                              onPress={() => setDraftSpecFilters((prev) => ({ ...prev, [specKey]: option }))}
                            />
                          ))}
                        </View>
                      )}
                    </View>
                  );
                })
              )}
            </ScrollView>

            <View className="px-6 py-4 border-t border-surface dark:border-surface-dark flex-row">
              <TouchableOpacity
                className="flex-1 bg-surface dark:bg-surface-dark rounded-xl py-3 items-center mr-2"
                onPress={clearFilters}
              >
                <Text className="text-text-primary dark:text-text-primary-dark font-semibold">{t("filters.reset")}</Text>
              </TouchableOpacity>
              <TouchableOpacity className="flex-1 bg-primary rounded-xl py-3 items-center ml-2" onPress={applyFilters}>
                <Text className="text-background font-semibold">{t("filters.apply")}</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </SafeScreen>
  );
};

function FilterChip({
  label,
  active,
  onPress,
}: {
  label: string;
  active: boolean;
  onPress: () => void;
}) {
  return (
    <TouchableOpacity
      onPress={onPress}
      className={`px-3 py-2 rounded-full mr-2 mb-2 ${active ? "bg-primary" : "bg-background-lighter dark:bg-background-dark-lighter"}`}
    >
      <Text className={`${active ? "text-background" : "text-text-primary dark:text-text-primary-dark"} text-sm font-medium`}>
        {label}
      </Text>
    </TouchableOpacity>
  );
}

export default ShopScreen;
