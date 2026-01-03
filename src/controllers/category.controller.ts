import { Request, Response } from "express";
import prisma from "../lib/prisma";

export const createCategory = async (req: Request, res: Response) => {
  const { name } = req.body;

  const category = await prisma.category.create({
    data: { name }
  });

  res.status(201).json(category);
};

export const getCategories = async (_: Request, res: Response) => {
  const categories = await prisma.category.findMany();
  res.json(categories);
};

export const deleteCategory = async (req: Request, res: Response) => {
  const { id } = req.params;

  await prisma.category.delete({ where: { id } });
  res.json({ message: "Category deleted" });
};
