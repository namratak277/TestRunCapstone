// PostCSS processes our CSS at build time:
// - tailwindcss turns class names like "bg-teal" into real CSS
// - autoprefixer adds browser-specific prefixes so styles work in older browsers
const config = { plugins: { tailwindcss: {}, autoprefixer: {} } };
export default config;
