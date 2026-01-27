import { useEffect } from "react";
import { View, StyleSheet } from "react-native";
import { Stack, usePathname } from "expo-router";
import * as SplashScreen from "expo-splash-screen";
import { useFonts, Bangers_400Regular } from "@expo-google-fonts/bangers";
import HalftoneBackground from "./components/HalftoneBackground";

SplashScreen.preventAutoHideAsync().catch(() => {});

export default function RootLayout() {
  const [fontsLoaded, fontError] = useFonts({
    Bangers_400Regular,
  });

  useEffect(() => {
    if (fontsLoaded || fontError) {
      SplashScreen.hideAsync().catch(() => {});
    }
  }, [fontsLoaded, fontError]);

  const pathname = usePathname();
  const showHalftone = pathname !== "/" && pathname !== "/add-comic";

  if (!fontsLoaded && !fontError) {
    return null;
  }

  return (
    <View style={styles.root}>
      {showHalftone && <HalftoneBackground />}
      <Stack
        screenOptions={{
          headerShown: false,
          contentStyle: { backgroundColor: "transparent" },
        }}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: "#0A0A0A",
  },
});
