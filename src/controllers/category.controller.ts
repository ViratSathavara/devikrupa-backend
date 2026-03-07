import { Request, Response } from "express";
import prisma from "../lib/prisma";
import {
  localizeCategory,
  localizeProduct,
} from "../services/localization.service";
import { SupportedLanguage } from "../services/languageDetection.service";
import { resolveBilingualText } from "../services/translation.service";

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

const normalizeCategoryStatus = (value: unknown): "ACTIVE" | "HIDDEN" => {
  const normalized = String(value ?? "ACTIVE").trim().toUpperCase();
  if (normalized === "HIDDEN" || normalized === "INACTIVE") {
    return "HIDDEN";
  }
  return "ACTIVE";
};

export const createCategory = async (req: Request, res: Response) => {
  try {
    const {
      name,
      name_en,
      name_gu,
      description,
      description_en,
      description_gu,
      imageUrl,
      icon,
      displayOrder,
      status,
      seoTitle,
      seoTitle_en,
      seoTitle_gu,
    } = req.body;

    const sourceLang = getRequestedLanguage(req);
    const resolvedName = await resolveBilingualText({
      text: name,
      textEn: name_en,
      textGu: name_gu,
      sourceLang,
    });

    if (!resolvedName.textEn && !resolvedName.textGu) {
      return res.status(400).json({ message: "Category name is required" });
    }

    const resolvedDescription = await resolveBilingualText({
      text: description,
      textEn: description_en,
      textGu: description_gu,
      sourceLang,
    });

    const resolvedSeoTitle = await resolveBilingualText({
      text: seoTitle,
      textEn: seoTitle_en,
      textGu: seoTitle_gu,
      sourceLang,
    });

    const category = await prisma.category.create({
      data: {
        name: resolvedName.textEn ?? resolvedName.textGu!,
        name_en: resolvedName.textEn,
        name_gu: resolvedName.textGu,
        description: resolvedDescription.textEn ?? resolvedDescription.textGu,
        description_en: resolvedDescription.textEn,
        description_gu: resolvedDescription.textGu,
        imageUrl: imageUrl || null,
        icon: icon || null,
        displayOrder: Number.isFinite(Number(displayOrder))
          ? Number(displayOrder)
          : 0,
        status: normalizeCategoryStatus(status),
        seoTitle: resolvedSeoTitle.textEn ?? resolvedSeoTitle.textGu,
        seoTitle_en: resolvedSeoTitle.textEn,
        seoTitle_gu: resolvedSeoTitle.textGu,
      },
    });

    return res.status(201).json(localizeCategory(category, getRequestedLanguage(req)));
  } catch (error) {
    console.error("Create category error:", error);
    return res.status(500).json({ message: "Failed to create category" });
  }
};

export const getCategories = async (req: Request, res: Response) => {
  try {
    type LocalizableProduct = Record<string, unknown>;
    type LocalizableCategory = Record<string, unknown> & {
      products: LocalizableProduct[];
    };

    let categories: LocalizableCategory[] = [];
    try {
      categories = await prisma.category.findMany({
        orderBy: {
          displayOrder: "asc",
        },
        include: {
          products: {
            include: {
              images: true,
              colors: true,
            },
          },
        },
      });
    } catch (error) {
      if (!isMissingColumnError(error)) {
        throw error;
      }

      console.warn(
        "Get categories: multilingual columns are missing in DB, using legacy projection. Apply Prisma migrations."
      );

      categories = await prisma.category.findMany({
        orderBy: {
          displayOrder: "asc",
        },
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
          products: {
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
              images: {
                select: {
                  id: true,
                  url: true,
                  alt: true,
                  isPrimary: true,
                  productId: true,
                  createdAt: true,
                },
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
          },
        },
      });
    }

    const language = getRequestedLanguage(req);
    const localizedCategories = categories.map((category: LocalizableCategory) => ({
      ...localizeCategory(category, language),
      products: category.products.map((product: LocalizableProduct) =>
        localizeProduct(product, language)
      ),
    }));

    return res.json(localizedCategories);
  } catch (error) {
    console.error("Get categories error:", error);
    return res.status(500).json({ message: "Failed to fetch categories" });
  }
};

export const updateCategory = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    if (!id) {
      return res.status(400).json({ message: "Category ID is required" });
    }

    const existingCategory = await prisma.category.findUnique({
      where: { id },
    });

    if (!existingCategory) {
      return res.status(404).json({ message: "Category not found" });
    }

    const {
      name,
      name_en,
      name_gu,
      description,
      description_en,
      description_gu,
      imageUrl,
      icon,
      displayOrder,
      status,
      seoTitle,
      seoTitle_en,
      seoTitle_gu,
    } = req.body;

    const sourceLang = getRequestedLanguage(req);
    const updateData: any = {};

    const hasNameInput = [name, name_en, name_gu].some((value) => value !== undefined);
    if (hasNameInput) {
      const resolvedName = await resolveBilingualText({
        text: name,
        textEn: name_en,
        textGu: name_gu,
        sourceLang,
      });

      if (!resolvedName.textEn && !resolvedName.textGu) {
        return res.status(400).json({ message: "Category name cannot be empty" });
      }

      updateData.name = resolvedName.textEn ?? resolvedName.textGu;
      updateData.name_en = resolvedName.textEn;
      updateData.name_gu = resolvedName.textGu;
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

    const hasSeoTitleInput = [seoTitle, seoTitle_en, seoTitle_gu].some(
      (value) => value !== undefined
    );
    if (hasSeoTitleInput) {
      const resolvedSeoTitle = await resolveBilingualText({
        text: seoTitle,
        textEn: seoTitle_en,
        textGu: seoTitle_gu,
        sourceLang,
      });
      updateData.seoTitle = resolvedSeoTitle.textEn ?? resolvedSeoTitle.textGu;
      updateData.seoTitle_en = resolvedSeoTitle.textEn;
      updateData.seoTitle_gu = resolvedSeoTitle.textGu;
    }

    if (imageUrl !== undefined) updateData.imageUrl = imageUrl || null;
    if (icon !== undefined) updateData.icon = icon || null;
    if (displayOrder !== undefined) {
      updateData.displayOrder = Number.isFinite(Number(displayOrder))
        ? Number(displayOrder)
        : existingCategory.displayOrder;
    }
    if (status !== undefined) {
      updateData.status = normalizeCategoryStatus(status);
    }

    const updatedCategory = await prisma.category.update({
      where: { id },
      data: updateData,
    });

    return res.json(localizeCategory(updatedCategory, getRequestedLanguage(req)));
  } catch (error) {
    console.error("Update category error:", error);
    return res.status(500).json({ message: "Failed to update category" });
  }
};

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
