import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /*
   * Cache Components: data fetching is dynamic by default and caching is opted into
   * per function with `use cache` + an explicit `cacheLife`. Chosen because each
   * provider in this app needs its own lifetime — settled day-ahead prices and the
   * weather forecast can cache for hours, but a miss for tomorrow's unpublished prices
   * must not, or prices that appear after ~13:00 Europe/Oslo stay hidden behind the
   * cache. See context/architecture.md §6.
   *
   * Enabling this also makes Partial Prerendering the default, so a static shell is
   * served immediately while request-time content streams in. Request-time APIs
   * (searchParams) must therefore sit inside a <Suspense> boundary.
   *
   * Requires the Node.js runtime — do not add `runtime = 'edge'` to any route.
   */
  cacheComponents: true,
};

export default nextConfig;
