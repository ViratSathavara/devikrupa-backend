import { Request, Response } from "express";
import prisma from "../lib/prisma";

// Add to favorites
export const addToFavorite = async (req: Request, res: Response) => {
  try {
    const user = (req as any).user;
    if (!user) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    const { productId } = req.body;

    if (!productId) {
      return res.status(400).json({ message: "Product ID is required" });
    }

    // Check if product exists
    const product = await prisma.product.findUnique({
      where: { id: productId }
    });

    if (!product) {
      return res.status(404).json({ message: "Product not found" });
    }

    // Check if already favorite
    const existing = await prisma.favorite.findUnique({
      where: {
        userId_productId: {
          userId: user.userId,
          productId
        }
      }
    });

    if (existing) {
      return res.status(400).json({ message: "Product already in favorites" });
    }

    const favorite = await prisma.favorite.create({
      data: {
        userId: user.userId,
        productId
      },
      include: {
        product: {
          include: {
            category: true,
            images: {
              orderBy: [
                { isPrimary: "desc" },
                { createdAt: "asc" }
              ],
              take: 1
            }
          }
        }
      }
    });

    res.status(201).json({
      message: "Added to favorites",
      favorite
    });
  } catch (error) {
    console.error("Add to favorite error:", error);
    res.status(500).json({ message: "Internal server error" });
  }
};

// Remove from favorites
export const removeFromFavorite = async (req: Request, res: Response) => {
  try {
    const user = (req as any).user;
    if (!user) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    const { productId } = req.params;

    await prisma.favorite.deleteMany({
      where: {
        userId: user.userId,
        productId
      }
    });

    res.json({ message: "Removed from favorites" });
  } catch (error) {
    console.error("Remove from favorite error:", error);
    res.status(500).json({ message: "Internal server error" });
  }
};

// Get user's favorites
export const getUserFavorites = async (req: Request, res: Response) => {
  try {
    const user = (req as any).user;
    if (!user) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    const favorites = await prisma.favorite.findMany({
      where: {
        userId: user.userId
      },
      include: {
        product: {
          include: {
            category: true,
            images: {
              orderBy: [
                { isPrimary: "desc" },
                { createdAt: "asc" }
              ],
              take: 1
            },
            colors: true
          }
        }
      },
      orderBy: {
        createdAt: "desc"
      }
    });

    res.json(favorites);
  } catch (error) {
    console.error("Get favorites error:", error);
    res.status(500).json({ message: "Internal server error" });
  }
};
