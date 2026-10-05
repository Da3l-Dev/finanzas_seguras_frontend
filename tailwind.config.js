/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./app/**/*.{js,jsx,ts,tsx}",
    "./ui/**/*.{js,jsx,ts,tsx}", // 👈 NUEVO
    "./components/**/*.{js,jsx,ts,tsx}", // 👈 NUEVO
    "./data/**/*.{js,jsx,ts,tsx}", // 👈 por si acaso
    "./hooks/**/*.{js,jsx,ts,tsx}", // 👈 NUEVO
    "./context/**/*.{js,jsx,ts,tsx}", // 👈 NUEVO
  ],
  presets: [require("nativewind/preset")],
  theme: {
    extend: {
      fontFamily: {
        manrope: ["Manrope"],
        "manrope-bold": ["Manrope-Bold"],
        "manrope-medium": ["Manrope-Medium"],
      },
    },
  },
  plugins: [],
};
