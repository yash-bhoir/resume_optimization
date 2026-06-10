export async function register() {
  if (process.env.NEXT_RUNTIME === "nodejs") {
    const { runStartupCheck } = await import("./lib/startup-check");
    runStartupCheck();
  }
}
