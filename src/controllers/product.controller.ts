import { Request, Response } from "express";
import prisma from "../lib/prisma";
import slugify from "slugify";
import { AdminRequest } from "../types/admin-request";

export const createProduct = async (req: Request, res: Response) => {
  const adminReq = req as AdminRequest;

  if (
    !adminReq.admin ||
    (adminReq.admin.role !== "ADMIN" &&
      adminReq.admin.role !== "SUPER_ADMIN")
  ) {
    return res.status(403).json({ message: "Admin access required" });
  }

  const { name, description, price, categoryId } = req.body;

  const slug = slugify(name, { lower: true });

  const product = await prisma.product.create({
    data: {
      name,
      slug,
      description,
      price,
      categoryId
    }
  });

  res.status(201).json(product);
};

export const getProducts = async (_: Request, res: Response) => {
  const products = await prisma.product.findMany({
    include: { category: true }
  });
  res.json(products);
};

export const getProductBySlug = async (req: Request, res: Response) => {
  const product = await prisma.product.findUnique({
    where: { slug: req.params.slug },
    include: { category: true }
  });

  if (!product) {
    return res.status(404).json({ message: "Product not found" });
  }

  res.json(product);
};

export const deleteProduct = async (req: Request, res: Response) => {
  const adminReq = req as AdminRequest;

  if (!adminReq.admin) {
    return res.status(403).json({ message: "Admin access required" });
  }

  await prisma.product.delete({ where: { id: req.params.id } });
  res.json({ message: "Product deleted" });
};
