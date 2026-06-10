/** @type {import('next-sitemap').IConfig} */
module.exports = {
  siteUrl: process.env.NEXT_PUBLIC_APP_URL || "https://resumefit.up.railway.app",
  generateRobotsTxt: false,
  outDir: "./public",
  exclude: ["/api/*", "/dashboard", "/settings", "/compare", "/results", "/sign-in", "/sign-up"],
};
