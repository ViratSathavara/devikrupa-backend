import { Request, Response } from "express";
import prisma from "../lib/prisma";
import { localizeServiceInquiry } from "../services/localization.service";
import { SupportedLanguage } from "../services/languageDetection.service";
import { resolveBilingualText } from "../services/translation.service";

const getRequestedLanguage = (req: Request): SupportedLanguage =>
  (req as any).requestedLanguage ?? "en";

const resolveOptionalBilingual = async (
  value: unknown,
  valueEn: unknown,
  valueGu: unknown
) => {
  const hasValue = [value, valueEn, valueGu].some(
    (candidate) => String(candidate ?? "").trim() !== ""
  );
  if (!hasValue) {
    return { textEn: null, textGu: null };
  }

  return resolveBilingualText({
    text: value,
    textEn: valueEn,
    textGu: valueGu,
  });
};

export const createServiceInquiry = async (req: Request, res: Response) => {
  try {
    const user = (req as any).user;
    if (!user) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    const {
      productName,
      productName_en,
      productName_gu,
      productType,
      productType_en,
      productType_gu,
      brand,
      brand_en,
      brand_gu,
      model,
      model_en,
      model_gu,
      color,
      color_en,
      color_gu,
      warrantyInfo,
      warrantyInfo_en,
      warrantyInfo_gu,
      issueDescription,
      issueDescription_en,
      issueDescription_gu,
      additionalDetails,
      additionalDetails_en,
      additionalDetails_gu,
    } = req.body;

    const resolvedProductName = await resolveBilingualText({
      text: productName,
      textEn: productName_en,
      textGu: productName_gu,
    });
    const resolvedProductType = await resolveBilingualText({
      text: productType,
      textEn: productType_en,
      textGu: productType_gu,
    });
    const resolvedIssueDescription = await resolveBilingualText({
      text: issueDescription,
      textEn: issueDescription_en,
      textGu: issueDescription_gu,
    });

    if (
      (!resolvedProductName.textEn && !resolvedProductName.textGu) ||
      (!resolvedProductType.textEn && !resolvedProductType.textGu) ||
      (!resolvedIssueDescription.textEn && !resolvedIssueDescription.textGu)
    ) {
      return res.status(400).json({
        message: "Product name, type, and issue description are required",
      });
    }

    const [resolvedBrand, resolvedModel, resolvedColor, resolvedWarrantyInfo, resolvedAdditionalDetails] =
      await Promise.all([
        resolveOptionalBilingual(brand, brand_en, brand_gu),
        resolveOptionalBilingual(model, model_en, model_gu),
        resolveOptionalBilingual(color, color_en, color_gu),
        resolveOptionalBilingual(
          warrantyInfo,
          warrantyInfo_en,
          warrantyInfo_gu
        ),
        resolveOptionalBilingual(
          additionalDetails,
          additionalDetails_en,
          additionalDetails_gu
        ),
      ]);

    const serviceInquiry = await prisma.serviceInquiry.create({
      data: {
        userId: user.userId,
        productName: resolvedProductName.textEn ?? resolvedProductName.textGu!,
        productName_en: resolvedProductName.textEn,
        productName_gu: resolvedProductName.textGu,
        productType: resolvedProductType.textEn ?? resolvedProductType.textGu!,
        productType_en: resolvedProductType.textEn,
        productType_gu: resolvedProductType.textGu,
        brand: resolvedBrand.textEn ?? resolvedBrand.textGu,
        brand_en: resolvedBrand.textEn,
        brand_gu: resolvedBrand.textGu,
        model: resolvedModel.textEn ?? resolvedModel.textGu,
        model_en: resolvedModel.textEn,
        model_gu: resolvedModel.textGu,
        color: resolvedColor.textEn ?? resolvedColor.textGu,
        color_en: resolvedColor.textEn,
        color_gu: resolvedColor.textGu,
        warrantyInfo: resolvedWarrantyInfo.textEn ?? resolvedWarrantyInfo.textGu,
        warrantyInfo_en: resolvedWarrantyInfo.textEn,
        warrantyInfo_gu: resolvedWarrantyInfo.textGu,
        issueDescription:
          resolvedIssueDescription.textEn ?? resolvedIssueDescription.textGu!,
        issueDescription_en: resolvedIssueDescription.textEn,
        issueDescription_gu: resolvedIssueDescription.textGu,
        additionalDetails:
          resolvedAdditionalDetails.textEn ?? resolvedAdditionalDetails.textGu,
        additionalDetails_en: resolvedAdditionalDetails.textEn,
        additionalDetails_gu: resolvedAdditionalDetails.textGu,
        status: "NEW",
      },
    });

    return res.status(201).json({
      message: "Service inquiry created successfully",
      serviceInquiry: localizeServiceInquiry(
        serviceInquiry,
        getRequestedLanguage(req)
      ),
    });
  } catch (error) {
    console.error("Create service inquiry error:", error);
    return res.status(500).json({ message: "Internal server error" });
  }
};

export const getAllServiceInquiries = async (req: Request, res: Response) => {
  try {
    const serviceInquiries = await prisma.serviceInquiry.findMany({
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            phone: true,
          },
        },
      },
      orderBy: {
        createdAt: "desc",
      },
    });

    const language = getRequestedLanguage(req);
    return res.json(
      serviceInquiries.map((inquiry) => localizeServiceInquiry(inquiry, language))
    );
  } catch (error) {
    console.error("Get service inquiries error:", error);
    return res.status(500).json({ message: "Internal server error" });
  }
};

export const getUserServiceInquiries = async (req: Request, res: Response) => {
  try {
    const user = (req as any).user;
    if (!user) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    const serviceInquiries = await prisma.serviceInquiry.findMany({
      where: {
        userId: user.userId,
      },
      orderBy: {
        createdAt: "desc",
      },
    });

    const language = getRequestedLanguage(req);
    return res.json(
      serviceInquiries.map((inquiry) => localizeServiceInquiry(inquiry, language))
    );
  } catch (error) {
    console.error("Get user service inquiries error:", error);
    return res.status(500).json({ message: "Internal server error" });
  }
};

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
            phone: true,
          },
        },
      },
    });

    return res.json({
      message: "Service inquiry status updated",
      serviceInquiry: localizeServiceInquiry(
        serviceInquiry,
        getRequestedLanguage(req)
      ),
    });
  } catch (error) {
    console.error("Update service inquiry status error:", error);
    return res.status(500).json({ message: "Internal server error" });
  }
};
