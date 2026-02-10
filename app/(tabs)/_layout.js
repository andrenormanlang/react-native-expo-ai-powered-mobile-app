import { View, StyleSheet } from "react-native";
import { Tabs } from "expo-router";
import WordmarkLogo from "../../components/WordmarkLogo";

export default function TabsLayout() {
  return (
    <View style={styles.root}>
      <Tabs
        screenOptions={{
          headerShown: true,
          headerTitle: "",
          headerLeft: () => <WordmarkLogo size="sm" align="left" />,
          headerLeftContainerStyle: {
            paddingLeft: 14,
            paddingVertical: 2,
          },
          sceneContainerStyle: { backgroundColor: "transparent" },
          headerStyle: {
            backgroundColor: "#1E1E1E",
          },
          headerTitleStyle: {
            color: "#fff",
          },
          contentStyle: { backgroundColor: "transparent" },
          tabBarStyle: { display: "none" },
        }}
      >
        <Tabs.Screen
          name="index"
          options={{
            title: "Shelf",
          }}
        />
        <Tabs.Screen
          name="add-comic"
          options={{
            title: "Add Comic",
          }}
        />
      </Tabs>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: "transparent",
  },
});
