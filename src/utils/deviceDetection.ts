/**
 * Detects whether the current device is a mobile device based on
 * user-agent and touch support. Returns true only if BOTH conditions
 * match, reducing false positives from touch-enabled laptops.
 *
 * Supports URL parameter override: ?layout=mobile forces mobile mode,
 * ?layout=desktop forces desktop mode. Useful for local testing.
 */
export function isMobileDevice(): boolean {
  if (typeof navigator === "undefined") return false;

  // URL parameter override for testing in dev:
  //   http://localhost:5173/?layout=mobile    ← query string
  //   http://localhost:5173/#/?layout=mobile  ← hash (HashRouter)
  //   http://localhost:5173/#/editor?layout=mobile ← editor page
  if (typeof window !== "undefined") {
    const allText = window.location.search + " " + window.location.hash;
    if (allText.includes("layout=mobile")) return true;
    if (allText.includes("layout=desktop")) return false;
  }

  const hasTouch = navigator.maxTouchPoints > 0;

  const mobileUserAgent = /Android|iPhone|iPad|iPod|webOS|BlackBerry|IEMobile|Opera Mini/i.test(
    navigator.userAgent,
  );

  return hasTouch && mobileUserAgent;
}
