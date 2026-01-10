import { Request, Response } from "express";
import prisma from "../lib/prisma";

/**
 * CREATE CATEGORY
 */
export const createCategory = async (req: Request, res: Response) => {
  try {
    const {
      name,
      description,
      imageUrl,
      icon,
      displayOrder,
      status,
      seoTitle,
    } = req.body;

    if (!name) {
      return res.status(400).json({ message: "Category name is required" });
    }

    const category = await prisma.category.create({
      data: {
        name,
        description: description || null,
        imageUrl: imageUrl || null,
        icon: icon || null,
        displayOrder: displayOrder ?? 0,
        status: status || "ACTIVE",
        seoTitle: seoTitle || null,
      },
    });

    return res.status(201).json(category);
  } catch (error) {
    console.error("Create category error:", error);
    return res.status(500).json({ message: "Failed to create category" });
  }
};

/**
 * GET ALL CATEGORIES
 */
export const getCategories = async (_: Request, res: Response) => {
  try {
    const categories = await prisma.category.findMany({
      orderBy: {
        displayOrder: "asc",
      },
      include: {
        products: true,
      },
    });

    return res.json(categories);
  } catch (error) {
    console.error("Get categories error:", error);
    return res.status(500).json({ message: "Failed to fetch categories" });
  }
};

/**
 * UPDATE CATEGORY
 */
export const updateCategory = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const {
      name,
      description,
      imageUrl,
      icon,
      displayOrder,
      status,
      seoTitle,
    } = req.body;

    if (!id) {
      return res.status(400).json({ message: "Category ID is required" });
    }

    const existingCategory = await prisma.category.findUnique({
      where: { id },
    });

    if (!existingCategory) {
      return res.status(404).json({ message: "Category not found" });
    }

    const updatedCategory = await prisma.category.update({
      where: { id },
      data: {
        name: name ?? existingCategory.name,
        description: description ?? existingCategory.description,
        imageUrl: imageUrl ?? existingCategory.imageUrl,
        icon: icon ?? existingCategory.icon,
        displayOrder: displayOrder ?? existingCategory.displayOrder,
        status: status ?? existingCategory.status,
        seoTitle: seoTitle ?? existingCategory.seoTitle,
      },
    });

    return res.json(updatedCategory);
  } catch (error) {
    console.error("Update category error:", error);
    return res.status(500).json({ message: "Failed to update category" });
  }
};

/**
 * DELETE CATEGORY
 */
export const deleteCategory = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    if (!id) {
      return res.status(400).json({ message: "Category ID is required" });
    }

    await prisma.category.delete({
      where: { id },
    });

    return res.json({ message: "Category deleted successfully" });
  } catch (error) {
    console.error("Delete category error:", error);
    return res.status(500).json({ message: "Failed to delete category" });
  }
};
