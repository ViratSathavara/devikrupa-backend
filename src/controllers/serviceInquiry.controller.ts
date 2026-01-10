import { Request, Response } from "express";
import prisma from "../lib/prisma";

// Create service inquiry (for external product repair/service)
export const createServiceInquiry = async (req: Request, res: Response) => {
  try {
    const user = (req as any).user;
    if (!user) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    const {
      productName,
      productType,
      brand,
      model,
      color,
      warrantyInfo,
      issueDescription,
      additionalDetails
    } = req.body;

    if (!productName || !productType || !issueDescription) {
      return res.status(400).json({
        message: "Product name, type, and issue description are required"
      });
    }

    const serviceInquiry = await prisma.serviceInquiry.create({
      data: {
        userId: user.userId,
        productName,
        productType,
        brand: brand || null,
        model: model || null,
        color: color || null,
        warrantyInfo: warrantyInfo || null,
        issueDescription,
        additionalDetails: additionalDetails || null,
        status: "NEW"
      }
    });

    res.status(201).json({
      message: "Service inquiry created successfully",
      serviceInquiry
    });
  } catch (error) {
    console.error("Create service inquiry error:", error);
    res.status(500).json({ message: "Internal server error" });
  }
};

// Get all service inquiries (admin)
export const getAllServiceInquiries = async (_req: Request, res: Response) => {
  try {
    const serviceInquiries = await prisma.serviceInquiry.findMany({
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            phone: true
          }
        }
      },
      orderBy: {
        createdAt: "desc"
      }
    });

    res.json(serviceInquiries);
  } catch (error) {
    console.error("Get service inquiries error:", error);
    res.status(500).json({ message: "Internal server error" });
  }
};

// Get user's service inquiries
export const getUserServiceInquiries = async (req: Request, res: Response) => {
  try {
    const user = (req as any).user;
    if (!user) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    const serviceInquiries = await prisma.serviceInquiry.findMany({
      where: {
        userId: user.userId
      },
      orderBy: {
        createdAt: "desc"
      }
    });

    res.json(serviceInquiries);
  } catch (error) {
    console.error("Get user service inquiries error:", error);
    res.status(500).json({ message: "Internal server error" });
  }
};

// Update service inquiry status (admin)
export const updateServiceInquiryStatus = async (req: Request, res: Response) => {
  try {
    const adminReq = req as any;
    if (!adminReq.admin) {
      return res.status(403).json({ message: "Admin access required" });
    }

    const { id } = req.params;
    const { status } = req.body;

    if (!["NEW", "CONTACTED", "CLOSED"].includes(status)) {
      return res.status(400).json({ message: "Invalid status" });
    }

    const serviceInquiry = await prisma.serviceInquiry.update({
      where: { id },
      data: { status },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            phone: true
          }
        }
      }
    });

    res.json({
      message: "Service inquiry status updated",
      serviceInquiry
    });
  } catch (error) {
    console.error("Update service inquiry status error:", error);
    res.status(500).json({ message: "Internal server error" });
  }
};
