import { Request, Response } from "express";
import slugify from "slugify";
import prisma from "../lib/prisma";
import { localizeProduct } from "../services/localization.service";
import { SupportedLanguage } from "../services/languageDetection.service";
import { resolveBilingualText } from "../services/translation.service";
import { AdminRequest } from "../types/admin-request";

const getRequestedLanguage = (req: Request): SupportedLanguage =>
  (req as any).requestedLanguage ?? "en";

const isMissingColumnError = (error: unknown): boolean => {
  if (!error || typeof error !== "object") {
    return false;
  }

  const candidate = error as { code?: string; message?: string };
  return (
    candidate.code === "P2022" ||
    (typeof candidate.message === "string" &&
      candidate.message.includes("does not exist in the current database"))
  );
};

const parsePositiveInteger = (value: unknown, fallback = 0): number => {
  const parsed = Number.parseInt(String(value ?? ""), 10);
  if (Number.isNaN(parsed)) {
    return fallback;
  }
  return Math.max(0, parsed);
};

const parseNullableNumber = (value: unknown): number | null => {
  if (value === null || value === undefined || value === "") {
    return null;
  }
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : null;
};

const ensureAdminAccess = (adminReq: AdminRequest, res: Response): boolean => {
  if (
    !adminReq.admin ||
    (adminReq.admin.role !== "ADMIN" && adminReq.admin.role !== "SUPER_ADMIN")
  ) {
    res.status(403).json({ message: "Admin access required" });
    return false;
  }
  return true;
};

const mapColorPayload = async (
  colors: Array<{ name?: string; name_en?: string; name_gu?: string; hexCode?: string }>,
  sourceLang: SupportedLanguage
) => {
  const validColors = colors.filter(
    (color) => String(color?.name ?? color?.name_en ?? color?.name_gu ?? "").trim() !== ""
  );

  return Promise.all(
    validColors.map(async (color) => {
      const resolvedName = await resolveBilingualText({
        text: color.name,
        textEn: color.name_en,
        textGu: color.name_gu,
        sourceLang,
      });

      const canonicalColorName =
        resolvedName.textEn ?? resolvedName.textGu ?? String(color.name ?? "").trim();

      return {
        name: canonicalColorName,
        name_en: resolvedName.textEn,
        name_gu: resolvedName.textGu,
        hexCode: color.hexCode || null,
      };
    })
  );
};

export const createProduct = async (req: Request, res: Response) => {
  try {
    const adminReq = req as AdminRequest;
    if (!ensureAdminAccess(adminReq, res)) {
      return;
    }

    const sourceLang = getRequestedLanguage(req);
    const {
      name,
      name_en,
      name_gu,
      description,
      description_en,
      description_gu,
      price,
      categoryId,
      images,
      colors,
      totalStock,
      availableStock,
    } = req.body;

    if (!categoryId) {
      return res.status(400).json({ message: "Category is required" });
    }

    const resolvedName = await resolveBilingualText({
      text: name,
      textEn: name_en,
      textGu: name_gu,
      sourceLang,
    });

    const resolvedDescription = await resolveBilingualText({
      text: description,
      textEn: description_en,
      textGu: description_gu,
      sourceLang,
    });

    const canonicalName = resolvedName.textEn ?? resolvedName.textGu;
    if (!canonicalName) {
      return res.status(400).json({ message: "Product name is required" });
    }

    const slug = slugify(canonicalName, { lower: true, strict: true });
    const existingProduct = await prisma.product.findUnique({
      where: { slug },
      select: { id: true },
    });

    if (existingProduct) {
      return res
        .status(400)
        .json({ message: "Product with this name already exists" });
    }

    const parsedPrice = parseNullableNumber(price);
    if (price !== null && price !== undefined && price !== "" && parsedPrice === null) {
      return res.status(400).json({ message: "Invalid price value" });
    }

    const stock = parsePositiveInteger(totalStock, 0);
    const available =
      availableStock === undefined || availableStock === null || availableStock === ""
        ? stock
        : parsePositiveInteger(availableStock, stock);

    const status =
      available === 0 ? "OUT_OF_STOCK" : available < 10 ? "LOW_STOCK" : "AVAILABLE";

    const imagePayload = Array.isArray(images)
      ? images
          .filter((img) => String(img?.url ?? "").trim() !== "")
          .map(
            (
              img: { url: string; alt?: string; isPrimary?: boolean },
              index: number
            ) => ({
              url: img.url,
              alt: img.alt || canonicalName,
              isPrimary: img.isPrimary !== undefined ? img.isPrimary : index === 0,
            })
          )
      : [];

    const colorPayload = await mapColorPayload(
      Array.isArray(colors) ? colors : [],
      sourceLang
    );

    const product = await prisma.product.create({
      data: {
        name: resolvedName.textEn ?? canonicalName,
        name_en: resolvedName.textEn,
        name_gu: resolvedName.textGu,
        slug,
        description: resolvedDescription.textEn ?? resolvedDescription.textGu,
        description_en: resolvedDescription.textEn,
        description_gu: resolvedDescription.textGu,
        price: parsedPrice,
        categoryId,
        totalStock: stock,
        availableStock: available,
        soldQuantity: Math.max(0, stock - available),
        status,
        images:
          imagePayload.length > 0
            ? {
                create: imagePayload,
              }
            : undefined,
        colors:
          colorPayload.length > 0
            ? {
                create: colorPayload,
              }
            : undefined,
      },
      include: {
        category: true,
        images: true,
        colors: true,
      },
    });

    return res.status(201).json(localizeProduct(product, getRequestedLanguage(req)));
  } catch (error) {
    console.error("Create product error:", error);
    return res.status(500).json({ message: "Internal server error" });
  }
};

export const getProducts = async (req: Request, res: Response) => {
  try {
    const { categoryId, status, search } = req.query;
    const where: any = {};

    if (categoryId) where.categoryId = categoryId as string;
    if (status) where.status = status;

    if (search) {
      const searchValue = String(search);
      where.OR = [
        { name: { contains: searchValue, mode: "insensitive" } },
        { name_en: { contains: searchValue, mode: "insensitive" } },
        { name_gu: { contains: searchValue, mode: "insensitive" } },
        { description: { contains: searchValue, mode: "insensitive" } },
        { description_en: { contains: searchValue, mode: "insensitive" } },
        { description_gu: { contains: searchValue, mode: "insensitive" } },
        {
          category: {
            is: {
              OR: [
                { name: { contains: searchValue, mode: "insensitive" } },
                { name_en: { contains: searchValue, mode: "insensitive" } },
                { name_gu: { contains: searchValue, mode: "insensitive" } },
              ],
            },
          },
        },
      ];
    }

    let products: any[] = [];
    try {
      products = await prisma.product.findMany({
        where,
        include: {
          category: true,
          images: {
            orderBy: [{ isPrimary: "desc" }, { createdAt: "asc" }],
          },
          colors: true,
        },
        orderBy: {
          createdAt: "desc",
        },
      });
    } catch (error) {
      if (!isMissingColumnError(error)) {
        throw error;
      }

      console.warn(
        "Get products: multilingual columns are missing in DB, using legacy projection. Apply Prisma migrations."
      );

      const legacyWhere: any = {};
      if (categoryId) legacyWhere.categoryId = categoryId as string;
      if (status) legacyWhere.status = status;
      if (search) {
        const searchValue = String(search);
        legacyWhere.OR = [
          { name: { contains: searchValue, mode: "insensitive" } },
          { description: { contains: searchValue, mode: "insensitive" } },
          {
            category: {
              is: {
                name: { contains: searchValue, mode: "insensitive" },
              },
            },
          },
        ];
      }

      products = await prisma.product.findMany({
        where: legacyWhere,
        select: {
          id: true,
          name: true,
          slug: true,
          description: true,
          price: true,
          totalStock: true,
          availableStock: true,
          soldQuantity: true,
          status: true,
          createdAt: true,
          updatedAt: true,
          categoryId: true,
          category: {
            select: {
              id: true,
              name: true,
              description: true,
              imageUrl: true,
              icon: true,
              displayOrder: true,
              status: true,
              seoTitle: true,
              createdAt: true,
              updatedAt: true,
            },
          },
          images: {
            select: {
              id: true,
              url: true,
              alt: true,
              isPrimary: true,
              productId: true,
              createdAt: true,
            },
            orderBy: [{ isPrimary: "desc" }, { createdAt: "asc" }],
          },
          colors: {
            select: {
              id: true,
              name: true,
              hexCode: true,
              productId: true,
              createdAt: true,
            },
          },
        },
        orderBy: {
          createdAt: "desc",
        },
      });
    }

    const language = getRequestedLanguage(req);
    return res.json(products.map((product) => localizeProduct(product, language)));
  } catch (error) {
    console.error("Get products error:", error);
    return res.status(500).json({ message: "Internal server error" });
  }
};

export const getProductBySlug = async (req: Request, res: Response) => {
  try {
    const user = (req as any).user;
    const product = await prisma.product.findUnique({
      where: { slug: req.params.slug },
      include: {
        category: true,
        images: {
          orderBy: [{ isPrimary: "desc" }, { createdAt: "asc" }],
        },
        colors: true,
      },
    });

    if (!product) {
      return res.status(404).json({ message: "Product not found" });
    }

    let isFavorite = false;
    if (user) {
      const favorite = await prisma.favorite.findUnique({
        where: {
          userId_productId: {
            userId: user.userId,
            productId: product.id,
          },
        },
      });
      isFavorite = !!favorite;
    }

    const localizedProduct = localizeProduct(product, getRequestedLanguage(req));
    return res.json({ ...localizedProduct, isFavorite });
  } catch (error) {
    console.error("Get product by slug error:", error);
    return res.status(500).json({ message: "Internal server error" });
  }
};

export const updateProduct = async (req: Request, res: Response) => {
  try {
    const adminReq = req as AdminRequest;
    if (!ensureAdminAccess(adminReq, res)) {
      return;
    }

    const { id } = req.params;
    const {
      name,
      name_en,
      name_gu,
      description,
      description_en,
      description_gu,
      price,
      categoryId,
      images,
      colors,
      totalStock,
      availableStock,
    } = req.body;

    const existingProduct = await prisma.product.findUnique({
      where: { id },
      select: {
        id: true,
        totalStock: true,
        availableStock: true,
      },
    });

    if (!existingProduct) {
      return res.status(404).json({ message: "Product not found" });
    }

    const sourceLang = getRequestedLanguage(req);
    const updateData: any = {};

    const hasNameInput = [name, name_en, name_gu].some(
      (value) => value !== undefined
    );
    if (hasNameInput) {
      const resolvedName = await resolveBilingualText({
        text: name,
        textEn: name_en,
        textGu: name_gu,
        sourceLang,
      });

      const canonicalName = resolvedName.textEn ?? resolvedName.textGu;
      if (!canonicalName) {
        return res.status(400).json({ message: "Product name cannot be empty" });
      }

      const nextSlug = slugify(canonicalName, { lower: true, strict: true });
      const slugConflict = await prisma.product.findFirst({
        where: {
          slug: nextSlug,
          NOT: { id },
        },
        select: { id: true },
      });
      if (slugConflict) {
        return res
          .status(400)
          .json({ message: "Product with this name already exists" });
      }

      updateData.name = resolvedName.textEn ?? canonicalName;
      updateData.name_en = resolvedName.textEn;
      updateData.name_gu = resolvedName.textGu;
      updateData.slug = nextSlug;
    }

    const hasDescriptionInput = [description, description_en, description_gu].some(
      (value) => value !== undefined
    );
    if (hasDescriptionInput) {
      const resolvedDescription = await resolveBilingualText({
        text: description,
        textEn: description_en,
        textGu: description_gu,
        sourceLang,
      });

      updateData.description = resolvedDescription.textEn ?? resolvedDescription.textGu;
      updateData.description_en = resolvedDescription.textEn;
      updateData.description_gu = resolvedDescription.textGu;
    }

    if (price !== undefined) {
      const parsedPrice = parseNullableNumber(price);
      if (price !== null && price !== "" && parsedPrice === null) {
        return res.status(400).json({ message: "Invalid price value" });
      }
      updateData.price = parsedPrice;
    }

    if (categoryId) updateData.categoryId = categoryId;

    const nextTotalStock =
      totalStock !== undefined
        ? parsePositiveInteger(totalStock, existingProduct.totalStock)
        : existingProduct.totalStock;
    const nextAvailableStock =
      availableStock !== undefined
        ? parsePositiveInteger(availableStock, existingProduct.availableStock)
        : existingProduct.availableStock;

    if (totalStock !== undefined || availableStock !== undefined) {
      updateData.totalStock = nextTotalStock;
      updateData.availableStock = nextAvailableStock;
      updateData.soldQuantity = Math.max(0, nextTotalStock - nextAvailableStock);
      updateData.status =
        nextAvailableStock === 0
          ? "OUT_OF_STOCK"
          : nextAvailableStock < 10
            ? "LOW_STOCK"
            : "AVAILABLE";
    }

    if (Array.isArray(images)) {
      const imagePayload = images
        .filter((img) => String(img?.url ?? "").trim() !== "")
        .map(
          (
            img: { url: string; alt?: string; isPrimary?: boolean },
            index: number
          ) => ({
            url: img.url,
            alt: img.alt || updateData.name || "Product image",
            isPrimary: img.isPrimary !== undefined ? img.isPrimary : index === 0,
          })
        );

      updateData.images = {
        deleteMany: {},
        ...(imagePayload.length > 0 ? { create: imagePayload } : {}),
      };
    }

    if (Array.isArray(colors)) {
      const colorPayload = await mapColorPayload(colors, sourceLang);
      updateData.colors = {
        deleteMany: {},
        ...(colorPayload.length > 0 ? { create: colorPayload } : {}),
      };
    }

    const product = await prisma.product.update({
      where: { id },
      data: updateData,
      include: {
        category: true,
        images: true,
        colors: true,
      },
    });

    return res.json(localizeProduct(product, getRequestedLanguage(req)));
  } catch (error) {
    console.error("Update product error:", error);
    return res.status(500).json({ message: "Internal server error" });
  }
};

export const updateStock = async (req: Request, res: Response) => {
  try {
    const adminReq = req as AdminRequest;
    if (!ensureAdminAccess(adminReq, res)) {
      return;
    }

    const { id } = req.params;
    const quantity = parsePositiveInteger(req.body.quantity, 0);
    const type = String(req.body.type ?? "");
    const reason = req.body.reason;

    if (!quantity || !type) {
      return res.status(400).json({ message: "Quantity and type are required" });
    }

    const product = await prisma.product.findUnique({
      where: { id },
    });

    if (!product) {
      return res.status(404).json({ message: "Product not found" });
    }

    let newAvailableStock = product.availableStock;
    let newTotalStock = product.totalStock;
    let newSoldQuantity = product.soldQuantity;

    if (type === "INCREASED") {
      newAvailableStock += quantity;
      newTotalStock += quantity;
    } else if (type === "DECREASED") {
      newAvailableStock = Math.max(0, newAvailableStock - quantity);
      newSoldQuantity += quantity;
    } else {
      return res.status(400).json({ message: "Invalid stock update type" });
    }

    const newStatus =
      newAvailableStock === 0
        ? "OUT_OF_STOCK"
        : newAvailableStock < 10
          ? "LOW_STOCK"
          : "AVAILABLE";

    const updatedProduct = await prisma.product.update({
      where: { id },
      data: {
        totalStock: newTotalStock,
        availableStock: newAvailableStock,
        soldQuantity: newSoldQuantity,
        status: newStatus,
      },
    });

    await prisma.stockHistory.create({
      data: {
        productId: id,
        quantity,
        type,
        reason: reason || null,
      },
    });

    return res.json({
      message: "Stock updated successfully",
      product: localizeProduct(updatedProduct, getRequestedLanguage(req)),
    });
  } catch (error) {
    console.error("Update stock error:", error);
    return res.status(500).json({ message: "Internal server error" });
  }
};

export const deleteProduct = async (req: Request, res: Response) => {
  try {
    const adminReq = req as AdminRequest;
    if (!ensureAdminAccess(adminReq, res)) {
      return;
    }

    await prisma.product.delete({ where: { id: req.params.id } });
    return res.json({ message: "Product deleted successfully" });
  } catch (error) {
    console.error("Delete product error:", error);
    return res.status(500).json({ message: "Internal server error" });
  }
};
