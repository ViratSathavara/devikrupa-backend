import { access, readdir } from "fs/promises";
import path from "path";

const PAGE_FILE_NAMES = new Set(["page.tsx", "page.ts", "page.jsx", "page.js"]);

const WEB_CANDIDATE_ROUTE_ROOTS = [
  path.resolve(process.cwd(), "../devikrupa-web/src/app"),
  path.resolve(process.cwd(), "devikrupa-web/src/app"),
  path.resolve(process.cwd(), "../devikrupa-web/app"),
  path.resolve(process.cwd(), "devikrupa-web/app"),
];

const ADMIN_CANDIDATE_ROUTE_ROOTS = [
  path.resolve(process.cwd(), "../devikrupa-admin/src/app"),
  path.resolve(process.cwd(), "devikrupa-admin/src/app"),
  path.resolve(process.cwd(), "../devikrupa-admin/app"),
  path.resolve(process.cwd(), "devikrupa-admin/app"),
];

const hasDynamicSegment = (segment: string): boolean =>
  segment.includes("[") || segment.includes("]");

const shouldIgnoreSegment = (segment: string): boolean =>
  !segment ||
  segment === "api" ||
  (segment.startsWith("(") && segment.endsWith(")")) ||
  segment.startsWith("@") ||
  segment.startsWith("_");

const shouldSkipDirectory = (segment: string): boolean => shouldIgnoreSegment(segment);

const toRoutePath = (routeRoot: string, absoluteDirectory: string): string | null => {
  const relativeDirectory = path.relative(routeRoot, absoluteDirectory);

  if (!relativeDirectory || relativeDirectory === ".") {
    return "/";
  }

  const segments = relativeDirectory.split(path.sep).filter(Boolean);
  if (segments.length === 0) {
    return "/";
  }

  if (segments.some(shouldIgnoreSegment)) {
    return null;
  }

  return `/${segments.join("/")}`;
};

const discoverPagePathsInDirectory = async (
  routeRoot: string,
  currentDirectory: string,
  discoveredPaths: Set<string>
): Promise<void> => {
  const entries = await readdir(currentDirectory, { withFileTypes: true });

  const hasPageFile = entries.some(
    (entry) => entry.isFile() && PAGE_FILE_NAMES.has(entry.name)
  );

  if (hasPageFile) {
    const routePath = toRoutePath(routeRoot, currentDirectory);
    if (routePath) {
      discoveredPaths.add(routePath);
    }
  }

  for (const entry of entries) {
    if (!entry.isDirectory() || shouldSkipDirectory(entry.name)) {
      continue;
    }

    await discoverPagePathsInDirectory(
      routeRoot,
      path.join(currentDirectory, entry.name),
      discoveredPaths
    );
  }
};

const findExistingRouteRoot = async (
  candidates: string[]
): Promise<string | null> => {
  for (const candidate of candidates) {
    try {
      await access(candidate);
      return candidate;
    } catch {
      // Candidate does not exist for this environment.
    }
  }

  return null;
};

const discoverRoutes = async (
  candidates: string[],
  prefix = ""
): Promise<string[]> => {
  const routeRoot = await findExistingRouteRoot(candidates);
  if (!routeRoot) {
    return [];
  }

  const discoveredPaths = new Set<string>();
  await discoverPagePathsInDirectory(routeRoot, routeRoot, discoveredPaths);

  return Array.from(discoveredPaths)
    .map((routePath) => {
      if (!prefix) {
        return routePath;
      }

      if (routePath === "/") {
        return prefix;
      }

      return `${prefix}${routePath}`;
    })
    .sort((first, second) =>
      first.localeCompare(second)
  );
};

export const discoverWebRoutes = async (): Promise<string[]> =>
  discoverRoutes(WEB_CANDIDATE_ROUTE_ROOTS);

export const discoverAdminRoutes = async (): Promise<string[]> =>
  discoverRoutes(ADMIN_CANDIDATE_ROUTE_ROOTS, "/_admin");
