import { SafeAreaView, Text, View } from "react-native";
export default function Transactions() {
  return (
    <SafeAreaView className="flex-1 bg-slate-50 dark:bg-[#141313]">
      <View className="flex-row items-center justify-between px-5 py-4">
        <Text className="font-manrope-bold text-[20px] text-slate-900 dark:text-white">
          Transacciones
        </Text>
      </View>
    </SafeAreaView>
  );
}
