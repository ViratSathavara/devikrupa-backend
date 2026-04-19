import { Request } from "express";
import prisma from "../lib/prisma";
import { logger } from "../utils/logger";

type ActivityLogData = {
  adminId: string;
  action: string;
  entityType: string;
  entityId?: string;
  details?: Record<string, any>;
  req?: Request;
};

export const logActivity = async ({
  adminId,
  action,
  entityType,
  entityId,
  details,
  req,
}: ActivityLogData): Promise<void> => {
  try {
    const ipAddress = req?.ip || req?.headers["x-forwarded-for"] as string || null;
    const userAgent = req?.headers["user-agent"] || null;

    await prisma.adminActivityLog.create({
      data: {
        adminId,
        action,
        entityType,
        entityId,
        details: details ? JSON.stringify(details) : null,
        ipAddress,
        userAgent,
      },
    });
  } catch (error) {
    logger.error("Failed to log admin activity", { error, adminId, action });
  }
};

export const getActivityLogs = async (filters: {
  adminId?: string;
  entityType?: string;
  entityId?: string;
  startDate?: Date;
  endDate?: Date;
  page?: number;
  limit?: number;
}) => {
  const { adminId, entityType, entityId, startDate, endDate, page = 1, limit = 50 } = filters;

  const where: any = {};
  if (adminId) where.adminId = adminId;
  if (entityType) where.entityType = entityType;
  if (entityId) where.entityId = entityId;
  if (startDate || endDate) {
    where.createdAt = {};
    if (startDate) where.createdAt.gte = startDate;
    if (endDate) where.createdAt.lte = endDate;
  }

  const [logs, total] = await Promise.all([
    prisma.adminActivityLog.findMany({
      where,
      include: {
        admin: {
          select: {
            id: true,
            name: true,
            email: true,
            role: true,
          },
        },
      },
      orderBy: { createdAt: "desc" },
      skip: (page - 1) * limit,
      take: limit,
    }),
    prisma.adminActivityLog.count({ where }),
  ]);

  return {
    logs,
    pagination: {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit),
    },
  };
};
