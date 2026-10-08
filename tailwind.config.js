/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./app/**/*.{js,jsx,ts,tsx}",
    "./ui/**/*.{js,jsx,ts,tsx}", // 👈 NUEVO
    "./components/**/*.{js,jsx,ts,tsx}", // 👈 NUEVO
    "./data/**/*.{js,jsx,ts,tsx}", // 👈 por si acaso
    "./hooks/**/*.{js,jsx,ts,tsx}", // 👈 NUEVO
    "./context/**/*.{js,jsx,ts,tsx}",
  ],
  darkMode: "class",
  presets: [require("nativewind/preset")],
  theme: {
    extend: {
      fontFamily: {
        "manrope-extralight": ["Manrope-ExtraLight"],
        "manrope-light": ["Manrope-Light"],
        manrope: ["Manrope"],
        "manrope-regular": ["Manrope"],
        "manrope-medium": ["Manrope-Medium"],
        "manrope-semibold": ["Manrope-SemiBold"],
        "manrope-bold": ["Manrope-Bold"],
        "manrope-extrabold": ["Manrope-ExtraBold"],
      },
    },
  },
  plugins: [],
};
