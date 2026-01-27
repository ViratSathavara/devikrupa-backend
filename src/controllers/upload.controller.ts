import { Request, Response } from "express";
import cloudinary from "../config/cloudinary";

export const uploadImage = async (req: Request, res: Response) => {
  try {
    if (!req.file) {
      return res.status(400).json({ message: "No file uploaded" });
    }

    const base64 = req.file.buffer.toString("base64");
    const file = `data:${req.file.mimetype};base64,${base64}`;

    const result = await cloudinary.uploader.upload(file, {
      folder: "devikrupa",
      resource_type: "image",
    });

    res.status(201).json({
      url: result.secure_url,
      publicId: result.public_id,
    });
  } catch (error) {
    console.error("Upload error:", error);
    res.status(500).json({ message: "Image upload failed" });
  }
};
