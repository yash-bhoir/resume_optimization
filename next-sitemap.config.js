/** @type {import('next-sitemap').IConfig} */
module.exports = {
  siteUrl: process.env.NEXT_PUBLIC_APP_URL || "https://resumeoptimizer.app",
  generateRobotsTxt: false,
  outDir: "./public",
  exclude: ["/api/*", "/dashboard", "/settings", "/compare", "/results", "/sign-in", "/sign-up"],
};
