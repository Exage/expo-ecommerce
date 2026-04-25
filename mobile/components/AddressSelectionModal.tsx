import { useAddresses } from "@/hooks/useAddressess";
import { Address } from "@/types";
import { Ionicons } from "@expo/vector-icons";
import { useEffect, useState } from "react";
import { View, Text, Modal, TouchableOpacity, ScrollView, ActivityIndicator } from "react-native";
import { useColorScheme } from "nativewind";

interface AddressSelectionModalProps {
  visible: boolean;
  onClose: () => void;
  onProceed: (address: Address) => void;
  isProcessing: boolean;
}

const AddressSelectionModal = ({
  visible,
  onClose,
  onProceed,
  isProcessing,
}: AddressSelectionModalProps) => {
  const { colorScheme } = useColorScheme();
  const iconColor = colorScheme === "dark" ? "#FFFFFF" : "#0F172A";

  const [selectedAddress, setSelectedAddress] = useState<Address | null>(null);
  const { addresses, isLoading: addressesLoading } = useAddresses();
  const isContinueDisabled = !selectedAddress || isProcessing;

  useEffect(() => {
    if (!visible) return;

    if (!addresses || addresses.length === 0) {
      setSelectedAddress(null);
      return;
    }

    setSelectedAddress((prev) => {
      if (prev && addresses.some((address) => address._id === prev._id)) {
        return prev;
      }

      const defaultAddress = addresses.find((address) => address.isDefault);
      return defaultAddress ?? addresses[0];
    });
  }, [visible, addresses]);

  return (
    <Modal visible={visible} animationType="slide" transparent={true} onRequestClose={onClose}>
      <View className="flex-1 bg-black/50 justify-end">
        <View className="bg-background dark:bg-background-dark rounded-t-3xl h-1/2">
          {/* Modal Header */}
          <View className="flex-row items-center justify-between p-6 border-b border-surface dark:border-surface-dark">
            <Text className="text-text-primary dark:text-text-primary-dark text-2xl font-bold">Select Address</Text>
            <TouchableOpacity onPress={onClose} className="bg-surface dark:bg-surface-dark rounded-full p-2">
              <Ionicons name="close" size={24} color={iconColor} />
            </TouchableOpacity>
          </View>

          {/* ADDRESSES LIST */}
          <ScrollView className="flex-1 p-6">
            {addressesLoading ? (
              <View className="py-8">
                <ActivityIndicator size="large" color="#1DB954" />
              </View>
            ) : (
              <View className="gap-4">
                {addresses?.map((address: Address) => (
                  <TouchableOpacity
                    key={address._id}
                    className={`bg-surface dark:bg-surface-dark rounded-3xl p-6 border-2 ${
                      selectedAddress?._id === address._id
                        ? "border-primary"
                        : "border-background-lighter dark:border-background-dark-lighter"
                    }`}
                    activeOpacity={0.7}
                    onPress={() => setSelectedAddress(address)}
                  >
                    <View className="flex-row items-start justify-between">
                      <View className="flex-1">
                        <View className="flex-row items-center mb-3">
                          <Text className="text-primary font-bold text-lg mr-2">
                            {address.label}
                          </Text>
                          {address.isDefault && (
                            <View className="bg-primary/20 rounded-full px-3 py-1">
                              <Text className="text-primary text-sm font-semibold">Default</Text>
                            </View>
                          )}
                        </View>
                        <Text className="text-text-primary dark:text-text-primary-dark font-semibold text-lg mb-2">
                          {address.fullName}
                        </Text>
                        <Text className="text-text-secondary dark:text-text-secondary-dark text-base leading-6 mb-1">
                          {address.streetAddress}
                        </Text>
                        <Text className="text-text-secondary dark:text-text-secondary-dark text-base mb-2">
                          {address.city}, {address.state} {address.zipCode}
                        </Text>
                        <Text className="text-text-secondary dark:text-text-secondary-dark text-base">{address.phoneNumber}</Text>
                      </View>
                      {selectedAddress?._id === address._id && (
                        <View className="bg-primary rounded-full p-2 ml-3">
                          <Ionicons name="checkmark" size={24} color="#F8FAFC" />
                        </View>
                      )}
                    </View>
                  </TouchableOpacity>
                ))}
              </View>
            )}
          </ScrollView>

          <View className="p-6 border-t border-surface dark:border-surface-dark">
            <TouchableOpacity
              className={`rounded-2xl py-5 ${isContinueDisabled ? "bg-primary/50" : "bg-primary"}`}
              activeOpacity={0.9}
              onPress={() => {
                if (selectedAddress) onProceed(selectedAddress);
              }}
              disabled={isContinueDisabled}
            >
              <View className="flex-row items-center justify-center">
                {isProcessing ? (
                  <ActivityIndicator size="small" color="#F8FAFC" />
                ) : (
                  <>
                    <Text className="text-background font-bold text-lg mr-2">
                      Continue to Payment
                    </Text>
                    <Ionicons name="arrow-forward" size={20} color="#F8FAFC" />
                  </>
                )}
              </View>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
};

export default AddressSelectionModal;
