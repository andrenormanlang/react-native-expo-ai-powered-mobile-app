import { View, Text, StyleSheet } from "react-native";
import { Tabs } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import WordmarkLogo from "../../components/WordmarkLogo";

export default function TabsLayout() {
  return (
    <View style={styles.root}>
      <Tabs
        screenOptions={({ route }) => ({
          headerShown: true,
          headerTitle: "",
          headerLeft: () => <WordmarkLogo size="sm" align="left" />,
          headerLeftContainerStyle: {
            paddingLeft: 14,
            paddingVertical: 2,
          },
          sceneContainerStyle: { backgroundColor: "transparent" },
          tabBarStyle: {
            backgroundColor: "#1E1E1E",
            borderTopColor: "#333",
            borderTopWidth: 1,
            height: 72,
            paddingTop: 8,
            paddingBottom: 10,
            elevation: 8,
            shadowColor: "#000",
            shadowOffset: { width: 0, height: -4 },
            shadowOpacity: 0.25,
            shadowRadius: 4,
          },
          tabBarItemStyle: {
            paddingVertical: 4,
          },
          headerStyle: {
            backgroundColor: "#1E1E1E",
          },
          headerTitleStyle: {
            color: "#fff",
          },
          contentStyle: { backgroundColor: "transparent" },
          tabBarIcon: ({ focused, color, size }) => {
            let iconName;

            if (route.name === "index") {
              iconName = focused ? "book" : "book-outline";
            } else if (route.name === "add-comic") {
              iconName = focused ? "add-circle" : "add-circle-outline";
            }

            return (
              <View
                style={[
                  styles.iconContainer,
                  focused && styles.iconContainerFocused,
                ]}
              >
                <Ionicons name={iconName} size={size} color={color} />
              </View>
            );
          },
          tabBarActiveTintColor: "#BB86FC",
          tabBarInactiveTintColor: "#999",
          tabBarLabel: ({ focused, children }) => (
            <Text style={[styles.tabLabel, focused && styles.tabLabelFocused]}>
              {children}
            </Text>
          ),
        })}
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
  iconContainer: {
    padding: 2,
    borderRadius: 12,
    backgroundColor: "transparent",
    transform: [{ scale: 1 }],
  },
  iconContainerFocused: {
    backgroundColor: "rgba(187, 134, 252, 0.12)",
    transform: [{ scale: 1.1 }],
  },
  tabLabel: {
    fontSize: 12,
    marginTop: 4,
    color: "#999",
    opacity: 0.8,
  },
  tabLabelFocused: {
    color: "#BB86FC",
    opacity: 1,
    fontWeight: "600",
  },
});
