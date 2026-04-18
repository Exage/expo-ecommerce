import SafeScreen from "@/components/SafeScreen";
import { useApi } from "@/lib/api";
import { Product } from "@/types";
import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import { useMemo, useRef, useState } from "react";
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  Text,
  TextInput,
  TouchableOpacity,
  View,
  Image,
} from "react-native";

type ChatMessage = {
  id: string;
  role: "user" | "assistant";
  text: string;
  products?: Product[];
};

type AssistantSuggestResponse = {
  assistantMessage?: string;
  products?: Product[];
};

const AssistantScreen = () => {
  const api = useApi();
  const scrollRef = useRef<ScrollView>(null);
  const [input, setInput] = useState("");
  const [isSending, setIsSending] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: "welcome",
      role: "assistant",
      text: "Привет! Напиши, что хочешь найти, и я подберу товары.",
    },
  ]);

  const canSend = useMemo(() => input.trim().length > 0 && !isSending, [input, isSending]);

  const scrollToBottom = () => {
    requestAnimationFrame(() => {
      scrollRef.current?.scrollToEnd({ animated: true });
    });
  };

  const handleBack = () => {
    if (router.canGoBack()) {
      router.back();
      return;
    }

    router.replace("/(tabs)/index");
  };

  const handleSend = async () => {
    const query = input.trim();
    if (!query || isSending) return;

    const userMessage: ChatMessage = {
      id: `user-${Date.now()}`,
      role: "user",
      text: query,
    };

    setMessages((prev) => [...prev, userMessage]);
    setInput("");
    setIsSending(true);
    scrollToBottom();

    try {
      const { data } = await api.post<AssistantSuggestResponse>("/products/assistant/suggest", {
        query,
      });

      const assistantMessage: ChatMessage = {
        id: `assistant-${Date.now()}`,
        role: "assistant",
        text: data?.assistantMessage?.trim() || "Нашел несколько вариантов.",
        products: Array.isArray(data?.products) ? data.products : [],
      };

      setMessages((prev) => [...prev, assistantMessage]);
    } catch {
      setMessages((prev) => [
        ...prev,
        {
          id: `assistant-error-${Date.now()}`,
          role: "assistant",
          text: "Не получилось получить ответ. Попробуйте еще раз.",
        },
      ]);
    } finally {
      setIsSending(false);
      scrollToBottom();
    }
  };

  return (
    <SafeScreen>
      <KeyboardAvoidingView
        className="flex-1"
        behavior={Platform.OS === "ios" ? "padding" : undefined}
        keyboardVerticalOffset={Platform.OS === "ios" ? 8 : 0}
      >
        <View className="px-6 pt-4 pb-3 border-b border-surface-light">
          <TouchableOpacity
            className="self-start flex-row items-center mb-3"
            onPress={handleBack}
            activeOpacity={0.7}
          >
            <Ionicons name="chevron-back" size={18} color="#B3B3B3" />
            <Text className="text-text-secondary text-sm">Назад</Text>
          </TouchableOpacity>
          <Text className="text-text-primary text-2xl font-bold">AI Assistant</Text>
          <Text className="text-text-secondary mt-1">Simple chat preview</Text>
        </View>

        <ScrollView
          ref={scrollRef}
          className="flex-1 px-4 pt-4"
          contentContainerStyle={{ paddingBottom: 16 }}
          onContentSizeChange={scrollToBottom}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          {messages.map((message) => (
            <View key={message.id} className={`mb-4 ${message.role === "user" ? "items-end" : "items-start"}`}>
              <View
                className={`max-w-[90%] rounded-2xl px-4 py-3 ${
                  message.role === "user" ? "bg-primary" : "bg-surface"
                }`}
              >
                <Text
                  className={`${message.role === "user" ? "text-background" : "text-text-primary"} text-base`}
                >
                  {message.text}
                </Text>
              </View>

              {message.role === "assistant" && (message.products?.length || 0) > 0 && (
                <ScrollView
                  horizontal
                  showsHorizontalScrollIndicator={false}
                  className="mt-3"
                  contentContainerStyle={{ paddingRight: 8 }}
                >
                  {message.products?.map((product) => (
                    <TouchableOpacity
                      key={product._id}
                      className="bg-surface-light rounded-2xl p-3 mr-3 w-44"
                      activeOpacity={0.8}
                      onPress={() => router.push(`/product/${product._id}`)}
                    >
                      {product.images?.[0] ? (
                        <Image
                          source={{ uri: product.images[0] }}
                          className="w-full h-24 rounded-xl bg-background-lighter"
                          resizeMode="cover"
                        />
                      ) : (
                        <View className="w-full h-24 rounded-xl bg-background-lighter items-center justify-center">
                          <Ionicons name="image-outline" size={20} color="#8A8A8A" />
                        </View>
                      )}
                      <Text className="text-text-secondary text-xs mt-2" numberOfLines={1}>
                        {product.category}
                      </Text>
                      <Text className="text-text-primary font-semibold text-sm mt-1" numberOfLines={2}>
                        {product.name}
                      </Text>
                      <Text className="text-primary font-bold text-base mt-2">
                        ${Number(product.price || 0).toFixed(2)}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </ScrollView>
              )}
            </View>
          ))}
        </ScrollView>

        <View className="px-4 py-3 border-t border-surface-light bg-background">
          <View className="flex-row items-center bg-surface rounded-2xl px-4 py-2">
            <TextInput
              className="flex-1 text-text-primary text-base py-2"
              placeholder="Например: подбери ноутбук до $1000"
              placeholderTextColor="#8A8A8A"
              value={input}
              onChangeText={setInput}
              editable={!isSending}
              onSubmitEditing={handleSend}
              returnKeyType="send"
            />
            <TouchableOpacity
              className={`ml-3 size-10 rounded-full items-center justify-center ${canSend ? "bg-primary" : "bg-surface-light"}`}
              onPress={handleSend}
              disabled={!canSend}
              activeOpacity={0.8}
            >
              {isSending ? (
                <ActivityIndicator size="small" color="#121212" />
              ) : (
                <Ionicons name="send" size={18} color={canSend ? "#121212" : "#8A8A8A"} />
              )}
            </TouchableOpacity>
          </View>
        </View>
      </KeyboardAvoidingView>
    </SafeScreen>
  );
};

export default AssistantScreen;
