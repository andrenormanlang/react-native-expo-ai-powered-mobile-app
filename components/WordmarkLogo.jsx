import React from "react";
import { View, Text, StyleSheet } from "react-native";

export default function WordmarkLogo({ size = "md", align = "left" }) {
  const { containerStyle, titleStyle, accentStyle } =
    sizeStyles[size] || sizeStyles.md;

  return (
    <View
      style={[
        styles.container,
        containerStyle,
        align === "center" && styles.center,
        align === "right" && styles.right,
      ]}
      accessible
      accessibilityRole="header"
      accessibilityLabel="Comics Shelf"
    >
      <Text style={[styles.title, titleStyle]} numberOfLines={1}>
        <Text style={styles.titleMain}>Comics</Text>
        <Text style={[styles.titleAccent, accentStyle]}>Shelf </Text>
      </Text>
    </View>
  );
}

const sizeStyles = {
  sm: {

    titleStyle: { fontSize: 36, lineHeight: 36 },
    accentStyle: { fontSize: 36, lineHeight: 36 },
  },
  md: {

    titleStyle: { fontSize: 36, lineHeight: 40 },
    accentStyle: { fontSize: 36, lineHeight: 40 },
  },
  lg: {

    titleStyle: { fontSize: 36, lineHeight: 46 },
    accentStyle: { fontSize: 36, lineHeight: 46 },
  },
};

const styles = StyleSheet.create({



  title: {
    color: "#FFD54A",
    fontFamily: "Bangers_400Regular",
    fontWeight: "400",
    letterSpacing: 1.0,

    textShadowColor: "rgba(0,0,0,0.55)",

    textShadowRadius: 6,
  },
  titleMain: {
    color: "#FFD54A",
  },
  titleAccent: {
    color: "#EF0307",
  },
});
