import { Request, Response } from "express";
import prisma from "../lib/prisma";

// Get all inquiries (for admin)
export const getAllInquiries = async (_req: Request, res: Response) => {
  try {
    const inquiries = await prisma.inquiry.findMany({
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            phone: true
          }
        },
        product: {
          include: {
            category: true,
            images: true
          }
        },
        color: true
      },
      orderBy: {
        createdAt: "desc"
      }
    });

    res.json(inquiries);
  } catch (error) {
    console.error("Get inquiries error:", error);
    res.status(500).json({ message: "Internal server error" });
  }
};

// Create product inquiry
export const createInquiry = async (req: Request, res: Response) => {
  try {
    const user = (req as any).user;
    if (!user) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    const { productId, message, quantity, colorId } = req.body;

    if (!productId || !message) {
      return res.status(400).json({ message: "Product ID and message are required" });
    }

    const inquiry = await prisma.inquiry.create({
      data: {
        userId: user.userId,
        productId,
        message,
        quantity: quantity || null,
        colorId: colorId || null,
        status: "NEW"
      },
      include: {
        product: {
          include: {
            category: true,
            images: true
          }
        },
        color: true
      }
    });

    res.status(201).json({
      message: "Inquiry created successfully",
      inquiry
    });
  } catch (error) {
    console.error("Create inquiry error:", error);
    res.status(500).json({ message: "Internal server error" });
  }
};

// Get user's inquiries
export const getUserInquiries = async (req: Request, res: Response) => {
  try {
    const user = (req as any).user;
    if (!user) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    const inquiries = await prisma.inquiry.findMany({
      where: {
        userId: user.userId
      },
      include: {
        product: {
          include: {
            category: true,
            images: true
          }
        },
        color: true
      },
      orderBy: {
        createdAt: "desc"
      }
    });

    res.json(inquiries);
  } catch (error) {
    console.error("Get user inquiries error:", error);
    res.status(500).json({ message: "Internal server error" });
  }
};

// Update inquiry status (admin only)
export const updateInquiryStatus = async (req: Request, res: Response) => {
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

    const inquiry = await prisma.inquiry.update({
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
        },
        product: {
          include: {
            category: true,
            images: true
          }
        }
      }
    });

    res.json({
      message: "Inquiry status updated",
      inquiry
    });
  } catch (error) {
    console.error("Update inquiry status error:", error);
    res.status(500).json({ message: "Internal server error" });
  }
};
