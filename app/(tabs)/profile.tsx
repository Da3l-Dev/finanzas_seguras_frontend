import { Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

export default function Profile() {
  return (
    <SafeAreaView className="flex-1 bg-slate-50 dark:bg-[#141313]">
      <View className="flex-row items-center justify-between px-5 py-4">
        <Text className="font-manrope-bold text-[20px] text-slate-900 dark:text-white">
          Perfil
        </Text>
      </View>
    </SafeAreaView>
  );
}
