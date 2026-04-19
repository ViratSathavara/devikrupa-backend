import { Request, Response } from "express";
import prisma from "../lib/prisma";
import { asyncHandler } from "../utils/asyncHandler";
import { NotFoundError } from "../utils/errors";

export const getUserInquiries = asyncHandler(async (req: Request, res: Response) => {
  const userId = (req as any).user.userId;
  const { page = 1, limit = 20, status } = req.query;

  const where: any = { userId };
  if (status) where.status = status;

  const [inquiries, total] = await Promise.all([
    prisma.inquiry.findMany({
      where,
      include: {
        product: {
          select: {
            id: true,
            name: true,
            name_en: true,
            name_gu: true,
            slug: true,
            price: true,
            images: {
              where: { isPrimary: true },
              take: 1,
            },
          },
        },
        color: true,
      },
      orderBy: { createdAt: "desc" },
      skip: (Number(page) - 1) * Number(limit),
      take: Number(limit),
    }),
    prisma.inquiry.count({ where }),
  ]);

  res.json({
    inquiries,
    pagination: {
      page: Number(page),
      limit: Number(limit),
      total,
      totalPages: Math.ceil(total / Number(limit)),
    },
  });
});

export const getUserServiceInquiries = asyncHandler(async (req: Request, res: Response) => {
  const userId = (req as any).user.userId;
  const { page = 1, limit = 20, status } = req.query;

  const where: any = { userId };
  if (status) where.status = status;

  const [inquiries, total] = await Promise.all([
    prisma.serviceInquiry.findMany({
      where,
      orderBy: { createdAt: "desc" },
      skip: (Number(page) - 1) * Number(limit),
      take: Number(limit),
    }),
    prisma.serviceInquiry.count({ where }),
  ]);

  res.json({
    inquiries,
    pagination: {
      page: Number(page),
      limit: Number(limit),
      total,
      totalPages: Math.ceil(total / Number(limit)),
    },
  });
});

export const getInquiryNotifications = asyncHandler(async (req: Request, res: Response) => {
  const userId = (req as any).user.userId;

  const [newInquiries, contactedInquiries] = await Promise.all([
    prisma.inquiry.count({
      where: { userId, status: "NEW" },
    }),
    prisma.inquiry.count({
      where: { userId, status: "CONTACTED" },
    }),
  ]);

  res.json({
    new: newInquiries,
    contacted: contactedInquiries,
    total: newInquiries + contactedInquiries,
  });
});
