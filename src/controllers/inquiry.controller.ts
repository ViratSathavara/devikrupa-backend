import { Request, Response } from "express";
import prisma from "../lib/prisma";
import { localizeInquiry } from "../services/localization.service";
import { SupportedLanguage } from "../services/languageDetection.service";
import { resolveBilingualText } from "../services/translation.service";

const getRequestedLanguage = (req: Request): SupportedLanguage =>
  (req as any).requestedLanguage ?? "en";

export const getAllInquiries = async (req: Request, res: Response) => {
  try {
    const inquiries = await prisma.inquiry.findMany({
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            phone: true,
          },
        },
        product: {
          include: {
            category: true,
            images: true,
            colors: true,
          },
        },
        color: true,
      },
      orderBy: {
        createdAt: "desc",
      },
    });

    const language = getRequestedLanguage(req);
    return res.json(inquiries.map((inquiry) => localizeInquiry(inquiry, language)));
  } catch (error) {
    console.error("Get inquiries error:", error);
    return res.status(500).json({ message: "Internal server error" });
  }
};

export const createInquiry = async (req: Request, res: Response) => {
  try {
    const user = (req as any).user;
    if (!user) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    const { productId, message, message_en, message_gu, quantity, colorId } = req.body;
    if (!productId) {
      return res.status(400).json({ message: "Product ID is required" });
    }

    const resolvedMessage = await resolveBilingualText({
      text: message,
      textEn: message_en,
      textGu: message_gu,
    });

    if (!resolvedMessage.textEn && !resolvedMessage.textGu) {
      return res.status(400).json({ message: "Inquiry message is required" });
    }

    const parsedQuantity =
      quantity === undefined || quantity === null || quantity === ""
        ? null
        : Math.max(1, Number.parseInt(String(quantity), 10));

    const inquiry = await prisma.inquiry.create({
      data: {
        userId: user.userId,
        productId,
        message: resolvedMessage.textEn ?? resolvedMessage.textGu!,
        message_en: resolvedMessage.textEn,
        message_gu: resolvedMessage.textGu,
        quantity: Number.isFinite(parsedQuantity as number) ? parsedQuantity : null,
        colorId: colorId || null,
        status: "NEW",
      },
      include: {
        product: {
          include: {
            category: true,
            images: true,
            colors: true,
          },
        },
        color: true,
      },
    });

    return res.status(201).json({
      message: "Inquiry created successfully",
      inquiry: localizeInquiry(inquiry, getRequestedLanguage(req)),
    });
  } catch (error) {
    console.error("Create inquiry error:", error);
    return res.status(500).json({ message: "Internal server error" });
  }
};

export const getUserInquiries = async (req: Request, res: Response) => {
  try {
    const user = (req as any).user;
    if (!user) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    const inquiries = await prisma.inquiry.findMany({
      where: {
        userId: user.userId,
      },
      include: {
        product: {
          include: {
            category: true,
            images: true,
            colors: true,
          },
        },
        color: true,
      },
      orderBy: {
        createdAt: "desc",
      },
    });

    const language = getRequestedLanguage(req);
    return res.json(inquiries.map((inquiry) => localizeInquiry(inquiry, language)));
  } catch (error) {
    console.error("Get user inquiries error:", error);
    return res.status(500).json({ message: "Internal server error" });
  }
};

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
            phone: true,
          },
        },
        product: {
          include: {
            category: true,
            images: true,
            colors: true,
          },
        },
        color: true,
      },
    });

    return res.json({
      message: "Inquiry status updated",
      inquiry: localizeInquiry(inquiry, getRequestedLanguage(req)),
    });
  } catch (error) {
    console.error("Update inquiry status error:", error);
    return res.status(500).json({ message: "Internal server error" });
  }
};
