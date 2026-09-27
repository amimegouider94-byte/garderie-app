/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        nursery: {
          orange: "#FF8A65",
          "orange-light": "#FFF3E0",
          "orange-dark": "#E64A19",
          mint: "#4DB6AC",
          "mint-light": "#E0F2F1",
          "mint-dark": "#00796B",
          purple: "#9FA8DA",
          "purple-light": "#EDE7F6",
          "purple-dark": "#5C6BC0",
          sky: "#4FC3F7",
          "sky-light": "#E1F5FE",
          yellow: "#FFD54F",
          "yellow-light": "#FFFDE7",
          coral: "#FF7043",
          cream: "#FAF8F5",
          sand: "#F5F0EB",
        },
      },
      fontFamily: {
        sans: ["var(--font-sans)", "system-ui", "sans-serif"],
      },
      boxShadow: {
        card: "0 4px 20px -2px rgba(0, 0, 0, 0.05), 0 2px 6px -1px rgba(0, 0, 0, 0.03)",
        hover: "0 10px 25px -5px rgba(0, 0, 0, 0.08), 0 8px 10px -6px rgba(0, 0, 0, 0.04)",
      },
    },
  },
  plugins: [],
};
