/** @type {import('tailwindcss').Config} */
const colors = {
  primary: "#BB86FC",
  'primary-contrast': "#FFFFFF", // Use quotes for keys with hyphens if needed
  background: "#121212",
  surface: "#1E1E1E",
  'surface-contrast': "#FFFFFF",
  border: "#444444",
  placeholder: "#9E9E9E",
  inactive: "#D1D5DB",
  disabled: "#404040",
  'disabled-contrast': "#9CA3AF",
  'label-text': "#E5E7EB", // Your label text color
};


module.exports = {
  // NOTE: Update this to include the paths to all of your component files.
  content: ["./app/**/*.{js,jsx,ts,tsx}"],
  presets: [require("nativewind/preset")],
  theme: {
    extend: {
      colors: colors, 
    },
  },
  plugins: [],
}