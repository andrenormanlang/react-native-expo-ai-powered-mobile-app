import { View, StyleSheet } from "react-native";
import { Tabs } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
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
          tabBarStyle: {
            backgroundColor: "#0B1020",
            borderTopColor: "rgba(255,255,255,0.03)",
          },
          tabBarActiveTintColor: "#22D3EE",
          tabBarInactiveTintColor: "#A1A1AA",
        }}
      >
        <Tabs.Screen
          name="index"
          options={{
            title: "All",
            tabBarIcon: ({ color, size }) => (
              <Ionicons name="grid-outline" size={size} color={color} />
            ),
          }}
        />
        <Tabs.Screen
          name="read"
          options={{
            title: "Read",
            tabBarIcon: ({ color, size }) => (
              <Ionicons
                name="checkmark-circle-outline"
                size={size}
                color={color}
              />
            ),
          }}
        />
        <Tabs.Screen
          name="to-read"
          options={{
            title: "To Read",
            tabBarIcon: ({ color, size }) => (
              <Ionicons name="bookmark-outline" size={size} color={color} />
            ),
          }}
        />
        <Tabs.Screen
          name="add-comic"
          options={{
            title: "Add Comic",
            tabBarIcon: ({ color, size }) => (
              <Ionicons name="add-circle-outline" size={size} color={color} />
            ),
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
