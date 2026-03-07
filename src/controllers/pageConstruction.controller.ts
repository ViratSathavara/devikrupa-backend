import { Prisma } from "@prisma/client";
import { Request, Response } from "express";
import prisma from "../lib/prisma";
import { AdminRequest } from "../types/admin-request";
import { discoverAdminRoutes, discoverWebRoutes } from "../utils/discoverWebRoutes";
import { DEFAULT_PAGE_SETTING_PRESETS } from "../utils/pageSettingCatalog";

type CheckPageBody = {
  path?: unknown;
  label?: unknown;
};

type UpdatePageBody = {
  isUnderConstruction?: unknown;
  message?: unknown;
  label?: unknown;
};

const MAX_PATH_LENGTH = 255;
const MAX_LABEL_LENGTH = 120;
const MAX_MESSAGE_LENGTH = 600;

const mapKnownDynamicPath = (routePath: string): string => {
  if (/^\/products\/[^/]+$/.test(routePath)) {
    return "/products/[slug]";
  }

  return routePath;
};

const normalizePath = (value: unknown): string | null => {
  if (typeof value !== "string") {
    return null;
  }

  const rawValue = value.trim();
  if (!rawValue) {
    return null;
  }

  const pathWithoutQuery = rawValue.split("?")[0]?.split("#")[0] ?? "";
  if (!pathWithoutQuery) {
    return null;
  }

  let normalizedPath = pathWithoutQuery.startsWith("/")
    ? pathWithoutQuery
    : `/${pathWithoutQuery}`;

  normalizedPath = normalizedPath.replace(/\/{2,}/g, "/");

  if (normalizedPath.length > 1) {
    normalizedPath = normalizedPath.replace(/\/+$/, "");
  }

  if (!normalizedPath || !normalizedPath.startsWith("/")) {
    return null;
  }

  if (normalizedPath.length > MAX_PATH_LENGTH) {
    return null;
  }

  return mapKnownDynamicPath(normalizedPath);
};

const normalizeLabel = (value: unknown): string | null => {
  if (typeof value !== "string") {
    return null;
  }

  const normalized = value.trim();
  if (!normalized) {
    return null;
  }

  return normalized.slice(0, MAX_LABEL_LENGTH);
};

const normalizeMessage = (value: unknown): string | null => {
  if (value === null) {
    return null;
  }

  if (typeof value !== "string") {
    return null;
  }

  const normalized = value.trim();
  if (!normalized) {
    return null;
  }

  return normalized.slice(0, MAX_MESSAGE_LENGTH);
};

const formatLabelFromPath = (routePath: string): string => {
  if (routePath.startsWith("/_section/")) {
    const sectionName = routePath
      .replace("/_section/", "")
      .replace(/[-_]/g, " ")
      .replace(/\b\w/g, (character) => character.toUpperCase());
    return `Landing: ${sectionName}`;
  }

  if (routePath.startsWith("/_admin")) {
    const adminPath = routePath.replace("/_admin", "") || "/";
    if (adminPath === "/") {
      return "Admin Root";
    }

    const adminLabel = adminPath
      .split("/")
      .filter(Boolean)
      .map((segment) =>
        segment
          .replace(/[-_]/g, " ")
          .replace(/\b\w/g, (character) => character.toUpperCase())
      )
      .join(" / ");

    return `Admin: ${adminLabel}`;
  }

  if (routePath === "/") {
    return "Home";
  }

  return routePath
    .split("/")
    .filter(Boolean)
    .map((segment) =>
      segment
        .replace(/[-_]/g, " ")
        .replace(/\b\w/g, (character) => character.toUpperCase())
    )
    .join(" / ");
};

const syncKnownPaths = async (): Promise<void> => {
  const [discoveredWebRoutes, discoveredAdminRoutesList] = await Promise.all([
    discoverWebRoutes(),
    discoverAdminRoutes(),
  ]);

  const allPaths = new Map<string, string>();

  for (const preset of DEFAULT_PAGE_SETTING_PRESETS) {
    allPaths.set(preset.path, preset.label);
  }

  for (const routePath of [...discoveredWebRoutes, ...discoveredAdminRoutesList]) {
    if (!allPaths.has(routePath)) {
      allPaths.set(routePath, formatLabelFromPath(routePath));
    }
  }

  if (allPaths.size === 0) {
    return;
  }

  await prisma.pageConstructionSetting.createMany({
    data: Array.from(allPaths.entries()).map(([routePath, label]) => ({
      path: routePath,
      label,
    })),
    skipDuplicates: true,
  });
};

export const checkPageConstructionSetting = async (
  req: Request,
  res: Response
) => {
  try {
    const body = (req.body ?? {}) as CheckPageBody;
    const routePath = normalizePath(body.path);

    if (!routePath) {
      return res.status(400).json({ message: "Valid path is required" });
    }

    const label = normalizeLabel(body.label) ?? formatLabelFromPath(routePath);

    const setting = await prisma.pageConstructionSetting.upsert({
      where: { path: routePath },
      update: {},
      create: {
        path: routePath,
        label,
      },
    });

    return res.json({
      id: setting.id,
      path: setting.path,
      label: setting.label,
      isUnderConstruction: setting.isUnderConstruction,
      message: setting.message,
      updatedAt: setting.updatedAt,
    });
  } catch (error) {
    console.error("Page check failed:", error);
    return res.status(500).json({ message: "Failed to check page status" });
  }
};

export const getPageConstructionSettings = async (
  _req: Request,
  res: Response
) => {
  try {
    const settings = await prisma.pageConstructionSetting.findMany({
      orderBy: [{ path: "asc" }],
    });

    return res.json(settings);
  } catch (error) {
    console.error("Failed to fetch page settings:", error);
    return res.status(500).json({ message: "Failed to fetch page settings" });
  }
};

export const updatePageConstructionSetting = async (
  req: Request,
  res: Response
) => {
  const adminReq = req as AdminRequest;
  const body = (req.body ?? {}) as UpdatePageBody;

  if (!adminReq.admin?.adminId) {
    return res.status(401).json({ message: "Unauthorized" });
  }

  const { id } = req.params;
  if (!id) {
    return res.status(400).json({ message: "Page setting id is required" });
  }

  const data: Prisma.PageConstructionSettingUpdateInput = {
    updatedByAdminId: adminReq.admin.adminId,
  };

  let hasFieldToUpdate = false;

  if (body.isUnderConstruction !== undefined) {
    if (typeof body.isUnderConstruction !== "boolean") {
      return res
        .status(400)
        .json({ message: "isUnderConstruction must be boolean" });
    }
    data.isUnderConstruction = body.isUnderConstruction;
    hasFieldToUpdate = true;
  }

  if (body.message !== undefined) {
    if (typeof body.message !== "string" && body.message !== null) {
      return res.status(400).json({ message: "message must be a string" });
    }
    data.message = normalizeMessage(body.message);
    hasFieldToUpdate = true;
  }

  if (body.label !== undefined) {
    const normalizedLabel = normalizeLabel(body.label);
    if (!normalizedLabel) {
      return res.status(400).json({ message: "label must be a valid string" });
    }
    data.label = normalizedLabel;
    hasFieldToUpdate = true;
  }

  if (!hasFieldToUpdate) {
    return res.status(400).json({ message: "No valid fields to update" });
  }

  try {
    const updatedSetting = await prisma.pageConstructionSetting.update({
      where: { id },
      data,
    });

    return res.json(updatedSetting);
  } catch (error) {
    if (
      error instanceof Prisma.PrismaClientKnownRequestError &&
      error.code === "P2025"
    ) {
      return res.status(404).json({ message: "Page setting not found" });
    }

    console.error("Failed to update page setting:", error);
    return res.status(500).json({ message: "Failed to update page setting" });
  }
};
