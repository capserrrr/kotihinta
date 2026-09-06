// Single source of truth for the app's basePath — must match next.config.ts.
// Next.js automatically prefixes <Link> and router navigation with this, but
// NOT arbitrary fetch() calls to absolute paths, so client code doing its
// own fetch()ing needs to prepend this explicitly.
export const BASE_PATH = "/kotihinta";
