import "@testing-library/jest-dom/vitest";

// jsdom 25 doesn't ship matchMedia. The compare-page islands probe it on mount
// to engage the mobile card fallback; provide a noop polyfill so the
// onMount handlers don't throw.
if (typeof window !== "undefined" && !window.matchMedia) {
  Object.defineProperty(window, "matchMedia", {
    writable: true,
    value: (query: string) => ({
      matches: false,
      media: query,
      onchange: null,
      addListener: () => {},
      removeListener: () => {},
      addEventListener: () => {},
      removeEventListener: () => {},
      dispatchEvent: () => false,
    }),
  });
}
