import "dotenv/config";
import express from "express";
import cors from "cors";
import { ENV } from "./config/env";
import { seedDefaultAdmin } from "./utils/seedAdmin";
import authRoutes from "./routes/auth.routes";
import productRoutes from "./routes/product.routes";
import categoryRoutes from "./routes/category.routes";
import adminAuthRoutes from "./routes/adminAuth.routes";
import adminRoutes from "./routes/admin.routes";
import inquiryRoutes from "./routes/inquiry.routes";
import serviceInquiryRoutes from "./routes/serviceInquiry.routes";
import favoriteRoutes from "./routes/favorite.routes";
import testimonialRoutes from "./routes/testimonial.routes";
import uploadRoutes from "./routes/upload.routes";

const app = express();

/* Middlewares */
app.use(
  cors({
    origin: ENV.CORS_ORIGINS,
    credentials: true,
  })
);
app.use(express.json());

/* Routes */
app.use("/api/auth", authRoutes);
app.use("/api/products", productRoutes);
app.use("/api/categories", categoryRoutes);
app.use("/api/admin/auth", adminAuthRoutes);
app.use("/api/admins", adminRoutes);
app.use("/api/inquiries", inquiryRoutes);
app.use("/api/service-inquiries", serviceInquiryRoutes);
app.use("/api/favorites", favoriteRoutes);
app.use("/api/testimonials", testimonialRoutes);
app.use("/api/upload", uploadRoutes);

/* Health Check */
app.get("/", (_, res) => {
  res.send("Devikrupa Backend is running 🚀");
});

app.listen(ENV.PORT, () => {
  console.log(`🚀 Server running at http://localhost:${ENV.PORT}`);
});
