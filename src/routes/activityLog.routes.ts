import { Router } from "express";
import { asyncHandler } from "../utils/asyncHandler";
import { adminMiddleware } from "../middlewares/admin.middleware";
import { getActivityLogs } from "../services/activityLog.service";

const router = Router();

router.get(
  "/",
  adminMiddleware,
  asyncHandler(async (req, res) => {
    const {
      adminId,
      entityType,
      entityId,
      startDate,
      endDate,
      page,
      limit,
    } = req.query;

    const result = await getActivityLogs({
      adminId: adminId as string,
      entityType: entityType as string,
      entityId: entityId as string,
      startDate: startDate ? new Date(startDate as string) : undefined,
      endDate: endDate ? new Date(endDate as string) : undefined,
      page: page ? parseInt(page as string) : undefined,
      limit: limit ? parseInt(limit as string) : undefined,
    });

    res.json(result);
  })
);

export default router;
