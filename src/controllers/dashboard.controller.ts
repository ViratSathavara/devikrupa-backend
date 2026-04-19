import { Request, Response } from "express";
import prisma from "../lib/prisma";
import { asyncHandler } from "../utils/asyncHandler";

export const getDashboardStats = asyncHandler(async (req: Request, res: Response) => {
  const { startDate, endDate } = req.query;

  const dateFilter: any = {};
  if (startDate) dateFilter.gte = new Date(startDate as string);
  if (endDate) dateFilter.lte = new Date(endDate as string);

  const [
    totalUsers,
    totalProducts,
    totalInquiries,
    newInquiries,
    totalCategories,
    recentUsers,
  ] = await Promise.all([
    prisma.user.count(),
    prisma.product.count(),
    prisma.inquiry.count(
      Object.keys(dateFilter).length > 0 ? { where: { createdAt: dateFilter } } : undefined
    ),
    prisma.inquiry.count({ where: { status: "NEW" } }),
    prisma.category.count({ where: { status: "ACTIVE" } }),
    prisma.user.count({
      where: {
        createdAt: {
          gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000), // Last 30 days
        },
      },
    }),
  ]);

  res.json({
    totalUsers,
    totalProducts,
    totalInquiries,
    newInquiries,
    totalCategories,
    recentUsers,
  });
});

export const getInquiriesOverTime = asyncHandler(async (req: Request, res: Response) => {
  const { days = 30 } = req.query;
  const daysCount = parseInt(days as string);

  const startDate = new Date();
  startDate.setDate(startDate.getDate() - daysCount);

  const inquiries = await prisma.inquiry.groupBy({
    by: ["createdAt"],
    where: {
      createdAt: {
        gte: startDate,
      },
    },
    _count: true,
  });

  // Group by date
  const inquiriesByDate: Record<string, number> = {};
  inquiries.forEach((inquiry) => {
    const date = inquiry.createdAt.toISOString().split("T")[0];
    inquiriesByDate[date] = (inquiriesByDate[date] || 0) + inquiry._count;
  });

  const chartData = Object.entries(inquiriesByDate).map(([date, count]) => ({
    date,
    count,
  }));

  res.json({ data: chartData });
});

export const getTopProducts = asyncHandler(async (req: Request, res: Response) => {
  const { limit = 10 } = req.query;

  const products = await prisma.product.findMany({
    include: {
      _count: {
        select: {
          inquiries: true,
          favorites: true,
        },
      },
      images: {
        where: { isPrimary: true },
        take: 1,
      },
    },
    orderBy: [
      { inquiries: { _count: "desc" } },
      { favorites: { _count: "desc" } },
    ],
    take: Number(limit),
  });

  const topProducts = products.map((product) => ({
    id: product.id,
    name: product.name_en || product.name,
    slug: product.slug,
    price: product.price,
    image: product.images[0]?.url,
    inquiryCount: product._count.inquiries,
    favoriteCount: product._count.favorites,
  }));

  res.json({ products: topProducts });
});

export const getUserSignups = asyncHandler(async (req: Request, res: Response) => {
  const { days = 30 } = req.query;
  const daysCount = parseInt(days as string);

  const startDate = new Date();
  startDate.setDate(startDate.getDate() - daysCount);

  const users = await prisma.user.groupBy({
    by: ["createdAt"],
    where: {
      createdAt: {
        gte: startDate,
      },
    },
    _count: true,
  });

  // Group by date
  const usersByDate: Record<string, number> = {};
  users.forEach((user) => {
    const date = user.createdAt.toISOString().split("T")[0];
    usersByDate[date] = (usersByDate[date] || 0) + user._count;
  });

  const chartData = Object.entries(usersByDate).map(([date, count]) => ({
    date,
    count,
  }));

  res.json({ data: chartData });
});
