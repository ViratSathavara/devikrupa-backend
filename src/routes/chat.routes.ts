import { Router } from "express";
import { authMiddleware } from "../middlewares/auth.middleware";
import { adminMiddleware } from "../middlewares/admin.middleware";
import {
  closeChatConversation,
  convertChatToInquiry,
  createChatConversation,
  getAdminChatConversations,
  getAdminConversationMessages,
  getMyChatConversations,
  getMyConversationMessages,
  markAdminConversationRead,
  markMyConversationRead,
  reopenChatConversation,
  sendAdminChatMessage,
  sendCustomerChatMessage,
} from "../controllers/chat.controller";

const router = Router();

// Customer routes
router.post("/conversations", authMiddleware, createChatConversation);
router.get("/conversations/my", authMiddleware, getMyChatConversations);
router.get(
  "/conversations/:conversationId/messages",
  authMiddleware,
  getMyConversationMessages
);
router.post(
  "/conversations/:conversationId/messages",
  authMiddleware,
  sendCustomerChatMessage
);
router.patch(
  "/conversations/:conversationId/read",
  authMiddleware,
  markMyConversationRead
);

// Admin routes
router.get("/admin/conversations", adminMiddleware, getAdminChatConversations);
router.get(
  "/admin/conversations/:conversationId/messages",
  adminMiddleware,
  getAdminConversationMessages
);
router.post(
  "/admin/conversations/:conversationId/messages",
  adminMiddleware,
  sendAdminChatMessage
);
router.patch(
  "/admin/conversations/:conversationId/read",
  adminMiddleware,
  markAdminConversationRead
);
router.patch(
  "/admin/conversations/:conversationId/close",
  adminMiddleware,
  closeChatConversation
);
router.patch(
  "/admin/conversations/:conversationId/reopen",
  adminMiddleware,
  reopenChatConversation
);
router.post(
  "/admin/conversations/:conversationId/convert-to-inquiry",
  adminMiddleware,
  convertChatToInquiry
);

export default router;
