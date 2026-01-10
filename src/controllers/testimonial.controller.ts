import { Request, Response } from "express";
import prisma from "../lib/prisma";
import { AdminRequest } from "../types/admin-request";

/**
 * CREATE TESTIMONIAL (PUBLIC)
 */
export const createTestimonial = async (req: Request, res: Response) => {
  try {
    const { name, role, location, rating, message } = req.body;

    if (!name || !message) {
      return res.status(400).json({ message: "Name and message are required" });
    }

    const initials = name
      .split(" ")
      .map((n: string) => n[0])
      .join("")
      .toUpperCase();

    const testimonial = await prisma.testimonial.create({
      data: {
        name,
        role: role || "Customer",
        location: location || "",
        rating: rating || 5,
        message,
        initials,
      },
    });

    res.status(201).json(testimonial);
  } catch (error) {
    console.error("Create testimonial error:", error);
    res.status(500).json({ message: "Internal server error" });
  }
};

/**
 * GET TESTIMONIALS (PUBLIC)
 */
export const getTestimonials = async (_: Request, res: Response) => {
  try {
    const testimonials = await prisma.testimonial.findMany({
      where: { isActive: true },
      orderBy: { createdAt: "desc" },
    });

    res.json(testimonials);
  } catch (error) {
    console.error("Get testimonials error:", error);
    res.status(500).json({ message: "Internal server error" });
  }
};

/**
 * DELETE TESTIMONIAL (ADMIN ONLY)
 */
export const deleteTestimonial = async (req: Request, res: Response) => {
  try {
    const adminReq = req as AdminRequest;

    if (
      !adminReq.admin ||
      (adminReq.admin.role !== "ADMIN" &&
        adminReq.admin.role !== "SUPER_ADMIN")
    ) {
      return res.status(403).json({ message: "Admin access required" });
    }

    const { id } = req.params;

    await prisma.testimonial.delete({
      where: { id },
    });

    res.json({ message: "Testimonial deleted successfully" });
  } catch (error) {
    console.error("Delete testimonial error:", error);
    res.status(500).json({ message: "Internal server error" });
  }
};
