import {
  View,
  Text,
  Modal,
  TouchableOpacity,
  ScrollView,
  TextInput,
  Switch,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
} from "react-native";
import SafeScreen from "./SafeScreen";
import { Ionicons } from "@expo/vector-icons";
import { useColorScheme } from "nativewind";

interface AddressFormData {
  label: string;
  fullName: string;
  streetAddress: string;
  city: string;
  state: string;
  zipCode: string;
  phoneNumber: string;
  isDefault: boolean;
}

interface AddressFormModalProps {
  visible: boolean;
  isEditing: boolean;
  addressForm: AddressFormData;
  isAddingAddress: boolean;
  isUpdatingAddress: boolean;
  onClose: () => void;
  onSave: () => void;
  onFormChange: (form: AddressFormData) => void;
}

const AddressFormModal = ({
  addressForm,
  isAddingAddress,
  isEditing,
  isUpdatingAddress,
  onClose,
  onFormChange,
  onSave,
  visible,
}: AddressFormModalProps) => {
  const { colorScheme } = useColorScheme();
  const iconColor = colorScheme === "dark" ? "#FFFFFF" : "#0F172A";

  return (
    <Modal visible={visible} animationType="slide" transparent onRequestClose={onClose}>
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        className="flex-1"
      >
        <SafeScreen>
          {/* HEADER */}
          <View className="px-6 py-5 border-b border-surface dark:border-surface-dark flex-row items-center justify-between">
            <Text className="text-text-primary dark:text-text-primary-dark text-2xl font-bold">
              {isEditing ? "Edit Address" : "Add New Address"}
            </Text>
            <TouchableOpacity onPress={onClose}>
              <Ionicons name="close" size={28} color={iconColor} />
            </TouchableOpacity>
          </View>

          <ScrollView
            className="flex-1"
            contentContainerStyle={{ paddingBottom: 50 }}
            showsVerticalScrollIndicator={false}
          >
            <View className="p-6">
              {/* LABEL INPUT */}
              <View className="mb-5">
                <Text className="text-text-primary dark:text-text-primary-dark font-semibold mb-2">Label</Text>
                <TextInput
                  className="bg-surface dark:bg-surface-dark text-text-primary dark:text-text-primary-dark p-4 rounded-2xl text-base"
                  placeholder="e.g., Home, Work, Office"
                  placeholderTextColor="#64748B"
                  value={addressForm.label}
                  onChangeText={(text) => onFormChange({ ...addressForm, label: text })}
                />
              </View>

              {/* NAME INPUT */}
              <View className="mb-5">
                <Text className="text-text-primary dark:text-text-primary-dark font-semibold mb-2">Full Name</Text>
                <TextInput
                  className="bg-surface dark:bg-surface-dark text-text-primary dark:text-text-primary-dark px-4 py-4 rounded-2xl text-base"
                  placeholder="Enter your full name"
                  placeholderTextColor="#64748B"
                  value={addressForm.fullName}
                  onChangeText={(text) => onFormChange({ ...addressForm, fullName: text })}
                />
              </View>

              {/* Address Input */}
              <View className="mb-5">
                <Text className="text-text-primary dark:text-text-primary-dark font-semibold mb-2">Street Address</Text>
                <TextInput
                  className="bg-surface dark:bg-surface-dark text-text-primary dark:text-text-primary-dark px-4 py-4 rounded-2xl text-base"
                  placeholder="Street address, apt/suite number"
                  placeholderTextColor="#64748B"
                  value={addressForm.streetAddress}
                  onChangeText={(text) => onFormChange({ ...addressForm, streetAddress: text })}
                  multiline
                />
              </View>

              {/* City Input */}
              <View className="mb-5">
                <Text className="text-text-primary dark:text-text-primary-dark font-semibold mb-2">City</Text>
                <TextInput
                  className="bg-surface dark:bg-surface-dark text-text-primary dark:text-text-primary-dark px-4 py-4 rounded-2xl text-base"
                  placeholder="e.g., New York"
                  placeholderTextColor="#64748B"
                  value={addressForm.city}
                  onChangeText={(text) => onFormChange({ ...addressForm, city: text })}
                />
              </View>

              {/* State Input */}
              <View className="mb-5">
                <Text className="text-text-primary dark:text-text-primary-dark font-semibold mb-2">State</Text>
                <TextInput
                  className="bg-surface dark:bg-surface-dark text-text-primary dark:text-text-primary-dark px-4 py-4 rounded-2xl text-base"
                  placeholder="e.g., NY"
                  placeholderTextColor="#64748B"
                  value={addressForm.state}
                  onChangeText={(text) => onFormChange({ ...addressForm, state: text })}
                />
              </View>

              {/* ZIP Code Input */}
              <View className="mb-5">
                <Text className="text-text-primary dark:text-text-primary-dark font-semibold mb-2">ZIP Code</Text>
                <TextInput
                  className="bg-surface dark:bg-surface-dark text-text-primary dark:text-text-primary-dark px-4 py-4 rounded-2xl text-base"
                  placeholder="e.g., 10001"
                  placeholderTextColor="#64748B"
                  value={addressForm.zipCode}
                  onChangeText={(text) => onFormChange({ ...addressForm, zipCode: text })}
                  keyboardType="numeric"
                />
              </View>

              {/* Phone Input */}
              <View className="mb-5">
                <Text className="text-text-primary dark:text-text-primary-dark font-semibold mb-2">Phone Number</Text>
                <TextInput
                  className="bg-surface dark:bg-surface-dark text-text-primary dark:text-text-primary-dark px-4 py-4 rounded-2xl text-base"
                  placeholder="+1 (555) 123-4567"
                  placeholderTextColor="#64748B"
                  value={addressForm.phoneNumber}
                  onChangeText={(text) => onFormChange({ ...addressForm, phoneNumber: text })}
                  keyboardType="phone-pad"
                />
              </View>

              {/* Default Address Toggle */}
              <View className="bg-surface dark:bg-surface-dark rounded-2xl p-4 flex-row items-center justify-between mb-6">
                <Text className="text-text-primary dark:text-text-primary-dark font-semibold">Set as default address</Text>
                <Switch
                  value={addressForm.isDefault}
                  onValueChange={(value) => onFormChange({ ...addressForm, isDefault: value })}
                  thumbColor="white"
                />
              </View>

              {/* Save Button */}
              <TouchableOpacity
                className="bg-primary rounded-2xl py-5 items-center"
                activeOpacity={0.8}
                onPress={onSave}
                disabled={isAddingAddress || isUpdatingAddress}
              >
                {isAddingAddress || isUpdatingAddress ? (
                  <ActivityIndicator size="small" color="#F8FAFC" />
                ) : (
                  <Text className="text-background font-bold text-lg">
                    {isEditing ? "Save Changes" : "Add Address"}
                  </Text>
                )}
              </TouchableOpacity>
            </View>
          </ScrollView>
        </SafeScreen>
      </KeyboardAvoidingView>
    </Modal>
  );
};

export default AddressFormModal;
