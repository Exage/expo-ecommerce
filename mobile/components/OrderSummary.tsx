import { View, Text } from "react-native";
import { useI18n } from "@/lib/i18n";

interface OrderSummaryProps {
  subtotal: number;
  shipping: number;
  tax: number;
  total: number;
}

export default function OrderSummary({ subtotal, shipping, tax, total }: OrderSummaryProps) {
  const { t } = useI18n();
  return (
    <View className="px-6 mt-6">
      <View className="bg-surface dark:bg-surface-dark rounded-3xl p-5">
        <Text className="text-text-primary dark:text-text-primary-dark text-xl font-bold mb-4">{t("summary.title")}</Text>

        <View className="space-y-3">
          <View className="flex-row justify-between items-center">
            <Text className="text-text-secondary dark:text-text-secondary-dark text-base">{t("summary.subtotal")}</Text>
            <Text className="text-text-primary dark:text-text-primary-dark font-semibold text-base">
              ${subtotal.toFixed(2)}
            </Text>
          </View>

          <View className="flex-row justify-between items-center">
            <Text className="text-text-secondary dark:text-text-secondary-dark text-base">{t("summary.shipping")}</Text>
            <Text className="text-text-primary dark:text-text-primary-dark font-semibold text-base">
              ${shipping.toFixed(2)}
            </Text>
          </View>

          <View className="flex-row justify-between items-center">
            <Text className="text-text-secondary dark:text-text-secondary-dark text-base">{t("summary.tax")}</Text>
            <Text className="text-text-primary dark:text-text-primary-dark font-semibold text-base">${tax.toFixed(2)}</Text>
          </View>

          {/* Divider */}
          <View className="border-t border-background-lighter dark:border-background-dark-lighter pt-3 mt-1" />

          {/* Total */}
          <View className="flex-row justify-between items-center">
            <Text className="text-text-primary dark:text-text-primary-dark font-bold text-lg">{t("summary.total")}</Text>
            <Text className="text-primary font-bold text-2xl">${total.toFixed(2)}</Text>
          </View>
        </View>
      </View>
    </View>
  );
}
