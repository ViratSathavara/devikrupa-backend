import { Request, Response } from "express";
import prisma from "../lib/prisma";
import slugify from "slugify";
import { AdminRequest } from "../types/admin-request";

export const createProduct = async (req: Request, res: Response) => {
  try {
    const adminReq = req as AdminRequest;

    if (
      !adminReq.admin ||
      (adminReq.admin.role !== "ADMIN" &&
        adminReq.admin.role !== "SUPER_ADMIN")
    ) {
      return res.status(403).json({ message: "Admin access required" });
    }

    const {
      name,
      description,
      price,
      categoryId,
      images,
      colors,
      totalStock,
      availableStock
    } = req.body;

    if (!name || !categoryId) {
      return res.status(400).json({ message: "Name and category are required" });
    }

    const slug = slugify(name, { lower: true, strict: true });

    // Check if slug already exists
    const existingProduct = await prisma.product.findUnique({
      where: { slug }
    });

    if (existingProduct) {
      return res.status(400).json({ message: "Product with this name already exists" });
    }

    const stock = totalStock || 0;
    const available = availableStock || stock;
    const status =
      available === 0 ? "OUT_OF_STOCK" : available < 10 ? "LOW_STOCK" : "AVAILABLE";

    const product = await prisma.product.create({
      data: {
        name,
        slug,
        description: description || null,
        price: price || null,
        categoryId,
        totalStock: stock,
        availableStock: available,
        soldQuantity: stock - available,
        status,
        images: images && images.length > 0
          ? {
              create: images.map((img: { url: string; alt?: string; isPrimary?: boolean }, index: number) => ({
                url: img.url,
                alt: img.alt || name,
                isPrimary: img.isPrimary !== undefined ? img.isPrimary : index === 0
              }))
            }
          : undefined,
        colors: colors && colors.length > 0
          ? {
              create: colors.map((color: { name: string; hexCode?: string }) => ({
                name: color.name,
                hexCode: color.hexCode || null
              }))
            }
          : undefined
      },
      include: {
        category: true,
        images: true,
        colors: true
      }
    });

    res.status(201).json(product);
  } catch (error) {
    console.error("Create product error:", error);
    res.status(500).json({ message: "Internal server error" });
  }
};

export const getProducts = async (req: Request, res: Response) => {
  try {
    const { categoryId, status, search } = req.query;

    const where: any = {};
    if (categoryId) where.categoryId = categoryId as string;
    if (status) where.status = status;
    if (search) {
      where.OR = [
        { name: { contains: search as string, mode: "insensitive" } },
        { description: { contains: search as string, mode: "insensitive" } }
      ];
    }

    const products = await prisma.product.findMany({
      where,
      include: {
        category: true,
        images: {
          orderBy: [
            { isPrimary: "desc" },
            { createdAt: "asc" }
          ]
        },
        colors: true
      },
      orderBy: {
        createdAt: "desc"
      }
    });

    res.json(products);
  } catch (error) {
    console.error("Get products error:", error);
    res.status(500).json({ message: "Internal server error" });
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
          orderBy: [
            { isPrimary: "desc" },
            { createdAt: "asc" }
          ]
        },
        colors: true
      }
    });

    if (!product) {
      return res.status(404).json({ message: "Product not found" });
    }

    // Check if product is in user's favorites
    let isFavorite = false;
    if (user) {
      const favorite = await prisma.favorite.findUnique({
        where: {
          userId_productId: {
            userId: user.userId,
            productId: product.id
          }
        }
      });
      isFavorite = !!favorite;
    }

    res.json({ ...product, isFavorite });
  } catch (error) {
    console.error("Get product by slug error:", error);
    res.status(500).json({ message: "Internal server error" });
  }
};

export const updateProduct = async (req: Request, res: Response) => {
  try {
    const adminReq = req as AdminRequest;

    if (!adminReq.admin) {
      return res.status(403).json({ message: "Admin access required" });
    }

    const { id } = req.params;
    const {
      name,
      description,
      price,
      categoryId,
      images,
      colors,
      totalStock,
      availableStock
    } = req.body;

    const updateData: any = {};

    if (name) {
      updateData.name = name;
      updateData.slug = slugify(name, { lower: true, strict: true });
    }
    if (description !== undefined) updateData.description = description;
    if (price !== undefined) updateData.price = price;
    if (categoryId) updateData.categoryId = categoryId;
    if (totalStock !== undefined) updateData.totalStock = totalStock;
    if (availableStock !== undefined) {
      updateData.availableStock = availableStock;
      updateData.soldQuantity = (totalStock || 0) - availableStock;
      updateData.status =
        availableStock === 0 ? "OUT_OF_STOCK" : availableStock < 10 ? "LOW_STOCK" : "AVAILABLE";
    }

    const product = await prisma.product.update({
      where: { id },
      data: updateData,
      include: {
        category: true,
        images: true,
        colors: true
      }
    });

    res.json(product);
  } catch (error) {
    console.error("Update product error:", error);
    res.status(500).json({ message: "Internal server error" });
  }
};

export const updateStock = async (req: Request, res: Response) => {
  try {
    const adminReq = req as AdminRequest;

    if (!adminReq.admin) {
      return res.status(403).json({ message: "Admin access required" });
    }

    const { id } = req.params;
    const { quantity, type, reason } = req.body; // type: "INCREASED" or "DECREASED"

    if (!quantity || !type) {
      return res.status(400).json({ message: "Quantity and type are required" });
    }

    const product = await prisma.product.findUnique({
      where: { id }
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
    }

    const newStatus =
      newAvailableStock === 0 ? "OUT_OF_STOCK" : newAvailableStock < 10 ? "LOW_STOCK" : "AVAILABLE";

    // Update product stock
    const updatedProduct = await prisma.product.update({
      where: { id },
      data: {
        totalStock: newTotalStock,
        availableStock: newAvailableStock,
        soldQuantity: newSoldQuantity,
        status: newStatus
      }
    });

    // Create stock history record
    await prisma.stockHistory.create({
      data: {
        productId: id,
        quantity,
        type,
        reason: reason || null
      }
    });

    res.json({
      message: "Stock updated successfully",
      product: updatedProduct
    });
  } catch (error) {
    console.error("Update stock error:", error);
    res.status(500).json({ message: "Internal server error" });
  }
};

export const deleteProduct = async (req: Request, res: Response) => {
  try {
    const adminReq = req as AdminRequest;

    if (!adminReq.admin) {
      return res.status(403).json({ message: "Admin access required" });
    }

    await prisma.product.delete({ where: { id: req.params.id } });
    res.json({ message: "Product deleted successfully" });
  } catch (error) {
    console.error("Delete product error:", error);
    res.status(500).json({ message: "Internal server error" });
  }
};
