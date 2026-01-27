import React from "react";
import { View, StyleSheet, Dimensions } from "react-native";

const { width, height } = Dimensions.get("window");
const DOT_SIZE = 8; // Reduced dot size
const SPACING = 16; // Reduced spacing

export default function HalftoneBackground() {
  const rows = Math.ceil(height / SPACING);
  const cols = Math.ceil(width / SPACING);
  const dots = [];

  for (let i = 0; i < rows; i++) {
    for (let j = 0; j < cols; j++) {
      const isOffset = i % 2 === 0;
      dots.push(
        <View
          key={`${i}-${j}`}
          style={[
            styles.dot,
            {
              top: i * SPACING,
              left: j * SPACING + (isOffset ? SPACING / 2 : 0),
              opacity: Math.random() * 0.08 + 0.02, // Random opacity for visual interest
            },
          ]}
        />
      );
    }
  }

  return (
    <View style={styles.container}>
      <View style={styles.overlay} />
      {dots}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: "absolute",
    width: "100%",
    height: "100%",
    backgroundColor: "#121212",
  },
  overlay: {
    position: "absolute",
    width: "100%",
    height: "100%",
    backgroundColor: "rgba(18, 18, 18, 0.3)",
  },
  dot: {
    position: "absolute",
    width: DOT_SIZE,
    height: DOT_SIZE,
    borderRadius: DOT_SIZE / 2,
    backgroundColor: "#fff",
  },
});
