import { View, Text, TouchableOpacity } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { Address } from "@/types";
import { useI18n } from "@/lib/i18n";

interface AddressCardProps {
  address: Address;
  onEdit: (address: Address) => void;
  onDelete: (addressId: string, label: string) => void;
  isUpdatingAddress: boolean;
  isDeletingAddress: boolean;
}

export default function AddressCard({
  address,
  onEdit,
  onDelete,
  isUpdatingAddress,
  isDeletingAddress,
}: AddressCardProps) {
  const { t } = useI18n();
  return (
    <View className="bg-surface dark:bg-surface-dark rounded-3xl p-5 mb-3">
      <View className="flex-row items-center justify-between mb-4">
        <View className="flex-row items-center">
          <View className="bg-primary/20 rounded-full w-12 h-12 items-center justify-center mr-3">
            <Ionicons name="location" size={24} color="#1DB954" />
          </View>
          <Text className="text-text-primary dark:text-text-primary-dark font-bold text-lg">{address.label}</Text>
        </View>
        {address.isDefault && (
          <View className="bg-primary px-3 py-1 rounded-full">
            <Text className="text-background text-xs font-bold">{t("addresses.default")}</Text>
          </View>
        )}
      </View>
      <View className="ml-15">
        <Text className="text-text-primary dark:text-text-primary-dark font-semibold mb-1">{address.fullName}</Text>
        <Text className="text-text-secondary dark:text-text-secondary-dark text-sm mb-1">{address.streetAddress}</Text>
        <Text className="text-text-secondary dark:text-text-secondary-dark text-sm mb-2">
          {address.city}, {address.state} {address.zipCode}
        </Text>
        <Text className="text-text-secondary dark:text-text-secondary-dark text-sm">{address.phoneNumber}</Text>
      </View>
      <View className="flex-row mt-4 gap-2">
        <TouchableOpacity
          className="flex-1 bg-primary/20 py-3 rounded-xl items-center"
          activeOpacity={0.7}
          onPress={() => onEdit(address)}
          disabled={isUpdatingAddress}
        >
          <Text className="text-primary font-bold">{t("addresses.edit")}</Text>
        </TouchableOpacity>
        <TouchableOpacity
          className="flex-1 bg-red-500/20 py-3 rounded-xl items-center"
          activeOpacity={0.7}
          onPress={() => onDelete(address._id, address.label)}
          disabled={isDeletingAddress}
        >
          <Text className="text-red-500 font-bold">{t("addresses.delete")}</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}
