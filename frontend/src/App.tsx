import React from 'react';
import { StatusBar } from 'expo-status-bar';
import { View, Text } from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';

export default function App() {
  return (
    <SafeAreaProvider>
      <View className="flex-1 items-center justify-center bg-slate-900">
        <Text className="text-4xl font-bold text-white mb-4">
          NHL Arenas
        </Text>
        <Text className="text-xl text-slate-300">
          Coming Soon
        </Text>
      </View>
      <StatusBar style="light" />
    </SafeAreaProvider>
  );
}
