module.exports = {
  content: ["./**/*.html"],
  theme: {
    container: {
      center: true,
    },
    extend: {
      backgroundImage: {
        'backgroundPic': "url('/src/bg.png')",
        'logo': "url('/src/logo2.png')"
      },
      colors: {},
    },
  },
  variants: {},
  plugins: [require("@tailwindcss/typography")],

};
