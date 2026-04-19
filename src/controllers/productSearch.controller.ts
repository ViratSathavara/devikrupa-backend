import { Request, Response } from "express";
import prisma from "../lib/prisma";
import { asyncHandler } from "../utils/asyncHandler";
import { localizeProduct } from "../services/localization.service";
import { SupportedLanguage } from "../services/languageDetection.service";

const getRequestedLanguage = (req: Request): SupportedLanguage =>
  (req as any).requestedLanguage ?? "en";

export const searchProducts = asyncHandler(async (req: Request, res: Response) => {
  const {
    search,
    categoryId,
    minPrice,
    maxPrice,
    status,
    page = 1,
    limit = 20,
  } = req.query;

  const where: any = {};

  // Search by name
  if (search) {
    where.OR = [
      { name: { contains: search as string, mode: "insensitive" } },
      { name_en: { contains: search as string, mode: "insensitive" } },
      { name_gu: { contains: search as string, mode: "insensitive" } },
      { description: { contains: search as string, mode: "insensitive" } },
      { description_en: { contains: search as string, mode: "insensitive" } },
      { description_gu: { contains: search as string, mode: "insensitive" } },
    ];
  }

  // Filter by category
  if (categoryId) {
    where.categoryId = categoryId;
  }

  // Filter by price range
  if (minPrice || maxPrice) {
    where.price = {};
    if (minPrice) where.price.gte = parseFloat(minPrice as string);
    if (maxPrice) where.price.lte = parseFloat(maxPrice as string);
  }

  // Filter by status
  if (status) {
    where.status = status;
  }

  const [products, total] = await Promise.all([
    prisma.product.findMany({
      where,
      include: {
        category: true,
        images: {
          where: { isPrimary: true },
          take: 1,
        },
        colors: true,
      },
      orderBy: { createdAt: "desc" },
      skip: (Number(page) - 1) * Number(limit),
      take: Number(limit),
    }),
    prisma.product.count({ where }),
  ]);

  const lang = getRequestedLanguage(req);
  const localizedProducts = products.map((product) => localizeProduct(product, lang));

  res.json({
    products: localizedProducts,
    pagination: {
      page: Number(page),
      limit: Number(limit),
      total,
      totalPages: Math.ceil(total / Number(limit)),
    },
  });
});

export const getRelatedProducts = asyncHandler(async (req: Request, res: Response) => {
  const { productId } = req.params;
  const { limit = 6 } = req.query;

  const product = await prisma.product.findUnique({
    where: { id: productId },
    select: { categoryId: true },
  });

  if (!product) {
    return res.status(404).json({ message: "Product not found" });
  }

  const relatedProducts = await prisma.product.findMany({
    where: {
      categoryId: product.categoryId,
      id: { not: productId },
      status: "AVAILABLE",
    },
    include: {
      category: true,
      images: {
        where: { isPrimary: true },
        take: 1,
      },
      colors: true,
    },
    take: Number(limit),
    orderBy: { createdAt: "desc" },
  });

  const lang = getRequestedLanguage(req);
  const localizedProducts = relatedProducts.map((p) => localizeProduct(p, lang));

  res.json({ products: localizedProducts });
});
