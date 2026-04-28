import type { NextConfig } from "next";
import path from "path";
import { existsSync } from "fs";
import { createRequire } from "node:module";

const require = createRequire(import.meta.url);
const projectRoot = path.dirname(require.resolve("./package.json"));

const ALIASED_PACKAGES = [
  "lucide-react",
  "pdf-lib",
  "@prisma/client",
  "@vercel/postgres",
  "tailwindcss",
  "@tailwindcss/postcss",
] as const;

/**
 * Absolute package dir for webpack. Avoids `pkg/package.json` resolve (not exported on some packages).
 */
function pkgDir(name: string): string {
  const nested = path.join(projectRoot, "node_modules", ...name.split("/"));
  if (existsSync(path.join(nested, "package.json"))) return nested;
  let dir = path.dirname(require.resolve(name));
  for (;;) {
    if (existsSync(path.join(dir, "package.json"))) return dir;
    const parent = path.dirname(dir);
    if (parent === dir) throw new Error(`Could not resolve package root for "${name}"`);
    dir = parent;
  }
}

/** Turbopack on Windows does not accept absolute paths in resolveAlias — use repo-relative POSIX paths. */
function turbopackAlias(name: string): string {
  return "./" + path.posix.join("node_modules", ...name.split("/"));
}

const webpackAliases = Object.fromEntries(
  ALIASED_PACKAGES.map((name) => [name, pkgDir(name)])
) as Record<string, string>;

const turbopackAliases = Object.fromEntries(
  ALIASED_PACKAGES.map((name) => [name, turbopackAlias(name)])
) as Record<string, string>;

const nextConfig: NextConfig = {
  outputFileTracingRoot: projectRoot,
  turbopack: {
    root: projectRoot,
    resolveAlias: turbopackAliases,
  },
  webpack: (config) => {
    config.resolve.modules = [
      path.join(projectRoot, "node_modules"),
      ...(Array.isArray(config.resolve.modules) ? config.resolve.modules : ["node_modules"]),
    ];
    config.resolve.alias = {
      ...config.resolve.alias,
      ...webpackAliases,
    };
    return config;
  },
};

export default nextConfig;
