import { Request, Response } from "express";
import prisma from "../lib/prisma";
import { asyncHandler } from "../utils/asyncHandler";
import { ValidationError } from "../utils/errors";
import { logActivity } from "../services/activityLog.service";
import { logger } from "../utils/logger";

export const bulkProductAction = asyncHandler(async (req: Request, res: Response) => {
  const { productIds, action } = req.body;
  const adminId = (req as any).admin.adminId;

  if (!Array.isArray(productIds) || productIds.length === 0) {
    throw new ValidationError("Product IDs are required");
  }

  if (!["activate", "deactivate", "delete"].includes(action)) {
    throw new ValidationError("Invalid action");
  }

  let result;

  switch (action) {
    case "activate":
      result = await prisma.product.updateMany({
        where: { id: { in: productIds } },
        data: { status: "AVAILABLE" },
      });
      await logActivity({
        adminId,
        action: "BULK_ACTIVATE_PRODUCTS",
        entityType: "Product",
        details: { productIds, count: result.count },
        req,
      });
      logger.info("Bulk activated products", { adminId, count: result.count });
      break;

    case "deactivate":
      result = await prisma.product.updateMany({
        where: { id: { in: productIds } },
        data: { status: "OUT_OF_STOCK" },
      });
      await logActivity({
        adminId,
        action: "BULK_DEACTIVATE_PRODUCTS",
        entityType: "Product",
        details: { productIds, count: result.count },
        req,
      });
      logger.info("Bulk deactivated products", { adminId, count: result.count });
      break;

    case "delete":
      result = await prisma.product.deleteMany({
        where: { id: { in: productIds } },
      });
      await logActivity({
        adminId,
        action: "BULK_DELETE_PRODUCTS",
        entityType: "Product",
        details: { productIds, count: result.count },
        req,
      });
      logger.info("Bulk deleted products", { adminId, count: result.count });
      break;
  }

  res.json({
    message: `Successfully ${action}d ${result?.count || 0} products`,
    count: result?.count || 0,
  });
});

export const exportInquiries = asyncHandler(async (req: Request, res: Response) => {
  const { startDate, endDate, status } = req.query;

  const where: any = {};
  if (status) where.status = status;
  if (startDate || endDate) {
    where.createdAt = {};
    if (startDate) where.createdAt.gte = new Date(startDate as string);
    if (endDate) where.createdAt.lte = new Date(endDate as string);
  }

  const inquiries = await prisma.inquiry.findMany({
    where,
    include: {
      user: {
        select: {
          name: true,
          email: true,
          phone: true,
        },
      },
      product: {
        select: {
          name: true,
          name_en: true,
          slug: true,
          price: true,
        },
      },
      color: {
        select: {
          name: true,
          name_en: true,
          hexCode: true,
        },
      },
    },
    orderBy: { createdAt: "desc" },
  });

  // Convert to CSV format
  const headers = [
    "ID",
    "Date",
    "Status",
    "User Name",
    "User Email",
    "User Phone",
    "Product",
    "Color",
    "Quantity",
    "Message",
  ];

  const rows = inquiries.map((inquiry) => [
    inquiry.id,
    inquiry.createdAt.toISOString(),
    inquiry.status,
    inquiry.user.name,
    inquiry.user.email,
    inquiry.user.phone || "",
    inquiry.product?.name_en || inquiry.product?.name || "",
    inquiry.color?.name_en || inquiry.color?.name || "",
    inquiry.quantity || "",
    inquiry.message_en || inquiry.message || "",
  ]);

  const csv = [headers, ...rows].map((row) => row.map((cell) => `"${cell}"`).join(",")).join("\n");

  res.setHeader("Content-Type", "text/csv");
  res.setHeader("Content-Disposition", "attachment; filename=inquiries.csv");
  res.send(csv);

  const adminId = (req as any).admin.adminId;
  await logActivity({
    adminId,
    action: "EXPORT_INQUIRIES",
    entityType: "Inquiry",
    details: { count: inquiries.length, filters: { startDate, endDate, status } },
    req,
  });
});
