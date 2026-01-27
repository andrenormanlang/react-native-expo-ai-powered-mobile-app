const { getDefaultConfig } = require("expo/metro-config");
const { withNativeWind } = require("nativewind/metro");

const config = getDefaultConfig(__dirname, {
  resolver: {
    sourceExts: ["js", "jsx", "json"],
  },
});

module.exports = withNativeWind(config, { input: "./styles/global.css" });
