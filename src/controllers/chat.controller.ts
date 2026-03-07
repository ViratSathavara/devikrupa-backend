import { ChatConversationStatus, ChatSenderType, Prisma } from "@prisma/client";
import { Request, Response } from "express";
import prisma from "../lib/prisma";
import { emitChatConversationUpdated, emitChatMessageCreated } from "../lib/socket";
import { AuthenticatedRequest } from "../types/auth-request";
import { AdminRequest } from "../types/admin-request";
import { resolveBilingualText } from "../services/translation.service";

const CHAT_MESSAGE_SELECT = {
  id: true,
  conversationId: true,
  senderType: true,
  message: true,
  userId: true,
  adminId: true,
  createdAt: true,
} satisfies Prisma.ChatMessageSelect;

const CHAT_CONVERSATION_INCLUDE = {
  user: {
    select: {
      id: true,
      name: true,
      email: true,
      phone: true,
    },
  },
  messages: {
    orderBy: {
      createdAt: "desc",
    },
    take: 1,
    select: CHAT_MESSAGE_SELECT,
  },
  _count: {
    select: {
      messages: true,
    },
  },
} satisfies Prisma.ChatConversationInclude;

type ChatConversationPayload = Prisma.ChatConversationGetPayload<{
  include: typeof CHAT_CONVERSATION_INCLUDE;
}>;

type ChatMessagePayload = Prisma.ChatMessageGetPayload<{
  select: typeof CHAT_MESSAGE_SELECT;
}>;

type ChatConversationResponse = Omit<ChatConversationPayload, "messages"> & {
  latestMessage: ChatMessagePayload | null;
  unreadForAdminCount: number;
  unreadForCustomerCount: number;
};

const getUnreadCounts = async (
  conversation: Pick<
    ChatConversationPayload,
    "id" | "adminLastReadAt" | "customerLastReadAt"
  >
): Promise<{ unreadForAdminCount: number; unreadForCustomerCount: number }> => {
  const [unreadForAdminCount, unreadForCustomerCount] = await Promise.all([
    prisma.chatMessage.count({
      where: {
        conversationId: conversation.id,
        senderType: ChatSenderType.CUSTOMER,
        ...(conversation.adminLastReadAt
          ? { createdAt: { gt: conversation.adminLastReadAt } }
          : {}),
      },
    }),
    prisma.chatMessage.count({
      where: {
        conversationId: conversation.id,
        senderType: ChatSenderType.ADMIN,
        ...(conversation.customerLastReadAt
          ? { createdAt: { gt: conversation.customerLastReadAt } }
          : {}),
      },
    }),
  ]);

  return { unreadForAdminCount, unreadForCustomerCount };
};

const toConversationResponse = async (
  conversation: ChatConversationPayload
): Promise<ChatConversationResponse> => {
  const { messages, ...rest } = conversation;
  const { unreadForAdminCount, unreadForCustomerCount } = await getUnreadCounts(
    conversation
  );

  return {
    ...rest,
    latestMessage: messages[0] ?? null,
    unreadForAdminCount,
    unreadForCustomerCount,
  };
};

const toConversationResponseList = async (
  conversations: ChatConversationPayload[]
): Promise<ChatConversationResponse[]> => {
  return Promise.all(conversations.map((conversation) => toConversationResponse(conversation)));
};

const normalizeText = (value: unknown): string => String(value ?? "").trim();

const parseStatusFilter = (raw: unknown): ChatConversationStatus | "ALL" => {
  const value = String(raw ?? "ACTIVE").toUpperCase();
  if (value === "ALL") return "ALL";
  if (value === "CLOSED") return "CLOSED";
  return "ACTIVE";
};

const parseTake = (raw: unknown, fallback = 25, max = 100): number => {
  const parsed = Number.parseInt(String(raw ?? ""), 10);
  if (Number.isNaN(parsed) || parsed < 1) {
    return fallback;
  }
  return Math.min(parsed, max);
};

const getChatConversationOrNull = async (
  id: string
): Promise<ChatConversationPayload | null> => {
  return prisma.chatConversation.findUnique({
    where: { id },
    include: CHAT_CONVERSATION_INCLUDE,
  });
};

export const createChatConversation = async (req: Request, res: Response) => {
  try {
    const authReq = req as AuthenticatedRequest;
    const user = authReq.user;

    if (!user?.userId) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    const customerName = normalizeText(req.body.customerName);
    const mobile = normalizeText(req.body.mobile);
    const email = normalizeText(req.body.email) || null;
    const firstMessage = normalizeText(req.body.message);

    if (!customerName || !mobile) {
      return res
        .status(400)
        .json({ message: "Customer name and mobile are required" });
    }

    const activeConversation = await prisma.chatConversation.findFirst({
      where: {
        userId: user.userId,
        status: "ACTIVE",
      },
      orderBy: [
        {
          lastMessageAt: "desc",
        },
        {
          updatedAt: "desc",
        },
      ],
    });

    let createdMessage: ChatMessagePayload | null = null;
    let conversation: ChatConversationPayload;

    if (activeConversation) {
      await prisma.chatConversation.update({
        where: { id: activeConversation.id },
        data: {
          customerName,
          mobile,
          email,
        },
      });

      if (firstMessage) {
        createdMessage = await prisma.chatMessage.create({
          data: {
            conversationId: activeConversation.id,
            senderType: "CUSTOMER",
            userId: user.userId,
            message: firstMessage,
          },
          select: CHAT_MESSAGE_SELECT,
        });

        await prisma.chatConversation.update({
          where: { id: activeConversation.id },
          data: {
            status: "ACTIVE",
            closedAt: null,
            closedByAdminId: null,
            lastMessage: createdMessage.message,
            lastMessageAt: createdMessage.createdAt,
            customerLastReadAt: createdMessage.createdAt,
          },
        });
      }

      const refreshedConversation = await getChatConversationOrNull(
        activeConversation.id
      );

      if (!refreshedConversation) {
        return res.status(404).json({ message: "Conversation not found" });
      }

      conversation = refreshedConversation;
    } else {
      const createdConversation = await prisma.chatConversation.create({
        data: {
          customerName,
          mobile,
          email,
          userId: user.userId,
          lastMessage: firstMessage || null,
          lastMessageAt: firstMessage ? new Date() : null,
          customerLastReadAt: firstMessage ? new Date() : null,
          messages: firstMessage
            ? {
                create: {
                  senderType: "CUSTOMER",
                  userId: user.userId,
                  message: firstMessage,
                },
              }
            : undefined,
        },
        include: CHAT_CONVERSATION_INCLUDE,
      });

      conversation = createdConversation;
      createdMessage = conversation.messages[0] ?? null;
    }

    if (createdMessage) {
      emitChatMessageCreated(createdMessage);
    }
    await emitChatConversationUpdated(conversation.id);

    return res.status(201).json({
      conversation: await toConversationResponse(conversation),
      message: createdMessage,
    });
  } catch (error) {
    console.error("Create chat conversation error:", error);
    return res.status(500).json({ message: "Internal server error" });
  }
};

export const getMyChatConversations = async (req: Request, res: Response) => {
  try {
    const authReq = req as AuthenticatedRequest;
    const user = authReq.user;
    if (!user?.userId) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    const statusFilter = parseStatusFilter(req.query.status);
    const take = parseTake(req.query.take, 20);

    const whereClause: Prisma.ChatConversationWhereInput = {
      userId: user.userId,
    };

    if (statusFilter !== "ALL") {
      whereClause.status = statusFilter;
    }

    const conversations = await prisma.chatConversation.findMany({
      where: whereClause,
      include: CHAT_CONVERSATION_INCLUDE,
      orderBy: [{ lastMessageAt: "desc" }, { updatedAt: "desc" }],
      take,
    });

    return res.json(await toConversationResponseList(conversations));
  } catch (error) {
    console.error("Get customer chat conversations error:", error);
    return res.status(500).json({ message: "Internal server error" });
  }
};

export const getMyConversationMessages = async (req: Request, res: Response) => {
  try {
    const authReq = req as AuthenticatedRequest;
    const user = authReq.user;

    if (!user?.userId) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    const conversationId = String(req.params.conversationId ?? "").trim();
    if (!conversationId) {
      return res.status(400).json({ message: "Conversation ID is required" });
    }

    const conversation = await getChatConversationOrNull(conversationId);
    if (!conversation) {
      return res.status(404).json({ message: "Conversation not found" });
    }

    if (conversation.userId !== user.userId) {
      return res.status(403).json({ message: "Access denied" });
    }

    const [updatedConversation, messages] = await Promise.all([
      prisma.chatConversation.update({
        where: { id: conversationId },
        data: {
          customerLastReadAt: new Date(),
        },
        include: CHAT_CONVERSATION_INCLUDE,
      }),
      prisma.chatMessage.findMany({
        where: { conversationId },
        orderBy: { createdAt: "asc" },
        select: CHAT_MESSAGE_SELECT,
        take: 500,
      }),
    ]);

    await emitChatConversationUpdated(conversationId);

    return res.json({
      conversation: await toConversationResponse(updatedConversation),
      messages,
    });
  } catch (error) {
    console.error("Get customer conversation messages error:", error);
    return res.status(500).json({ message: "Internal server error" });
  }
};

export const markMyConversationRead = async (req: Request, res: Response) => {
  try {
    const authReq = req as AuthenticatedRequest;
    const user = authReq.user;

    if (!user?.userId) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    const conversationId = String(req.params.conversationId ?? "").trim();
    if (!conversationId) {
      return res.status(400).json({ message: "Conversation ID is required" });
    }

    const conversation = await getChatConversationOrNull(conversationId);
    if (!conversation) {
      return res.status(404).json({ message: "Conversation not found" });
    }

    if (conversation.userId !== user.userId) {
      return res.status(403).json({ message: "Access denied" });
    }

    const updatedConversation = await prisma.chatConversation.update({
      where: { id: conversationId },
      data: {
        customerLastReadAt: new Date(),
      },
      include: CHAT_CONVERSATION_INCLUDE,
    });

    await emitChatConversationUpdated(conversationId);

    return res.json({
      conversation: await toConversationResponse(updatedConversation),
    });
  } catch (error) {
    console.error("Mark customer chat conversation read error:", error);
    return res.status(500).json({ message: "Internal server error" });
  }
};

export const sendCustomerChatMessage = async (req: Request, res: Response) => {
  try {
    const authReq = req as AuthenticatedRequest;
    const user = authReq.user;

    if (!user?.userId) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    const conversationId = String(req.params.conversationId ?? "").trim();
    const messageText = normalizeText(req.body.message);

    if (!conversationId) {
      return res.status(400).json({ message: "Conversation ID is required" });
    }
    if (!messageText) {
      return res.status(400).json({ message: "Message is required" });
    }

    const conversation = await prisma.chatConversation.findUnique({
      where: { id: conversationId },
      select: {
        id: true,
        userId: true,
      },
    });

    if (!conversation) {
      return res.status(404).json({ message: "Conversation not found" });
    }

    if (conversation.userId !== user.userId) {
      return res.status(403).json({ message: "Access denied" });
    }

    const createdMessage = await prisma.chatMessage.create({
      data: {
        conversationId,
        senderType: "CUSTOMER",
        message: messageText,
        userId: user.userId,
      },
      select: CHAT_MESSAGE_SELECT,
    });

    await prisma.chatConversation.update({
      where: { id: conversationId },
      data: {
        status: "ACTIVE",
        closedAt: null,
        closedByAdminId: null,
        lastMessage: createdMessage.message,
        lastMessageAt: createdMessage.createdAt,
        customerLastReadAt: createdMessage.createdAt,
      },
    });

    emitChatMessageCreated(createdMessage);
    await emitChatConversationUpdated(conversationId);

    return res.status(201).json({ message: createdMessage });
  } catch (error) {
    console.error("Send customer chat message error:", error);
    return res.status(500).json({ message: "Internal server error" });
  }
};

export const getAdminChatConversations = async (req: Request, res: Response) => {
  try {
    const adminReq = req as AdminRequest;
    if (!adminReq.admin?.adminId) {
      return res.status(403).json({ message: "Admin access required" });
    }

    const statusFilter = parseStatusFilter(req.query.status);
    const take = parseTake(req.query.take, 50);

    const whereClause: Prisma.ChatConversationWhereInput = {};
    if (statusFilter !== "ALL") {
      whereClause.status = statusFilter;
    }

    const conversations = await prisma.chatConversation.findMany({
      where: whereClause,
      include: CHAT_CONVERSATION_INCLUDE,
      orderBy: [{ status: "asc" }, { lastMessageAt: "desc" }, { updatedAt: "desc" }],
      take,
    });

    return res.json(await toConversationResponseList(conversations));
  } catch (error) {
    console.error("Get admin chat conversations error:", error);
    return res.status(500).json({ message: "Internal server error" });
  }
};

export const getAdminConversationMessages = async (req: Request, res: Response) => {
  try {
    const adminReq = req as AdminRequest;
    if (!adminReq.admin?.adminId) {
      return res.status(403).json({ message: "Admin access required" });
    }

    const conversationId = String(req.params.conversationId ?? "").trim();
    if (!conversationId) {
      return res.status(400).json({ message: "Conversation ID is required" });
    }

    const conversation = await getChatConversationOrNull(conversationId);
    if (!conversation) {
      return res.status(404).json({ message: "Conversation not found" });
    }

    const [updatedConversation, messages] = await Promise.all([
      prisma.chatConversation.update({
        where: { id: conversationId },
        data: {
          adminLastReadAt: new Date(),
        },
        include: CHAT_CONVERSATION_INCLUDE,
      }),
      prisma.chatMessage.findMany({
        where: { conversationId },
        orderBy: { createdAt: "asc" },
        select: CHAT_MESSAGE_SELECT,
        take: 1000,
      }),
    ]);

    await emitChatConversationUpdated(conversationId);

    return res.json({
      conversation: await toConversationResponse(updatedConversation),
      messages,
    });
  } catch (error) {
    console.error("Get admin conversation messages error:", error);
    return res.status(500).json({ message: "Internal server error" });
  }
};

export const markAdminConversationRead = async (req: Request, res: Response) => {
  try {
    const adminReq = req as AdminRequest;
    if (!adminReq.admin?.adminId) {
      return res.status(403).json({ message: "Admin access required" });
    }

    const conversationId = String(req.params.conversationId ?? "").trim();
    if (!conversationId) {
      return res.status(400).json({ message: "Conversation ID is required" });
    }

    const conversation = await getChatConversationOrNull(conversationId);
    if (!conversation) {
      return res.status(404).json({ message: "Conversation not found" });
    }

    const updatedConversation = await prisma.chatConversation.update({
      where: { id: conversationId },
      data: {
        adminLastReadAt: new Date(),
      },
      include: CHAT_CONVERSATION_INCLUDE,
    });

    await emitChatConversationUpdated(conversationId);

    return res.json({
      conversation: await toConversationResponse(updatedConversation),
    });
  } catch (error) {
    console.error("Mark admin chat conversation read error:", error);
    return res.status(500).json({ message: "Internal server error" });
  }
};

export const sendAdminChatMessage = async (req: Request, res: Response) => {
  try {
    const adminReq = req as AdminRequest;
    const admin = adminReq.admin;
    if (!admin?.adminId) {
      return res.status(403).json({ message: "Admin access required" });
    }

    const conversationId = String(req.params.conversationId ?? "").trim();
    const messageText = normalizeText(req.body.message);

    if (!conversationId) {
      return res.status(400).json({ message: "Conversation ID is required" });
    }
    if (!messageText) {
      return res.status(400).json({ message: "Message is required" });
    }

    const conversation = await prisma.chatConversation.findUnique({
      where: { id: conversationId },
      select: {
        id: true,
        userId: true,
      },
    });

    if (!conversation) {
      return res.status(404).json({ message: "Conversation not found" });
    }

    const createdMessage = await prisma.chatMessage.create({
      data: {
        conversationId,
        senderType: "ADMIN",
        message: messageText,
        adminId: admin.adminId,
        userId: conversation.userId ?? null,
      },
      select: CHAT_MESSAGE_SELECT,
    });

    await prisma.chatConversation.update({
      where: { id: conversationId },
      data: {
        status: "ACTIVE",
        closedAt: null,
        closedByAdminId: null,
        lastMessage: createdMessage.message,
        lastMessageAt: createdMessage.createdAt,
        adminLastReadAt: createdMessage.createdAt,
      },
    });

    emitChatMessageCreated(createdMessage);
    await emitChatConversationUpdated(conversationId);

    return res.status(201).json({ message: createdMessage });
  } catch (error) {
    console.error("Send admin chat message error:", error);
    return res.status(500).json({ message: "Internal server error" });
  }
};

export const closeChatConversation = async (req: Request, res: Response) => {
  try {
    const adminReq = req as AdminRequest;
    const admin = adminReq.admin;
    if (!admin?.adminId) {
      return res.status(403).json({ message: "Admin access required" });
    }

    const conversationId = String(req.params.conversationId ?? "").trim();
    if (!conversationId) {
      return res.status(400).json({ message: "Conversation ID is required" });
    }

    const updatedConversation = await prisma.chatConversation.update({
      where: { id: conversationId },
      data: {
        status: "CLOSED",
        closedAt: new Date(),
        closedByAdminId: admin.adminId,
      },
      include: CHAT_CONVERSATION_INCLUDE,
    });

    await emitChatConversationUpdated(conversationId);

    return res.json({
      conversation: await toConversationResponse(updatedConversation),
    });
  } catch (error) {
    console.error("Close chat conversation error:", error);
    return res.status(500).json({ message: "Internal server error" });
  }
};

export const reopenChatConversation = async (req: Request, res: Response) => {
  try {
    const adminReq = req as AdminRequest;
    if (!adminReq.admin?.adminId) {
      return res.status(403).json({ message: "Admin access required" });
    }

    const conversationId = String(req.params.conversationId ?? "").trim();
    if (!conversationId) {
      return res.status(400).json({ message: "Conversation ID is required" });
    }

    const updatedConversation = await prisma.chatConversation.update({
      where: { id: conversationId },
      data: {
        status: "ACTIVE",
        closedAt: null,
        closedByAdminId: null,
      },
      include: CHAT_CONVERSATION_INCLUDE,
    });

    await emitChatConversationUpdated(conversationId);

    return res.json({
      conversation: await toConversationResponse(updatedConversation),
    });
  } catch (error) {
    console.error("Reopen chat conversation error:", error);
    return res.status(500).json({ message: "Internal server error" });
  }
};

export const convertChatToInquiry = async (req: Request, res: Response) => {
  try {
    const adminReq = req as AdminRequest;
    if (!adminReq.admin?.adminId) {
      return res.status(403).json({ message: "Admin access required" });
    }

    const conversationId = String(req.params.conversationId ?? "").trim();
    if (!conversationId) {
      return res.status(400).json({ message: "Conversation ID is required" });
    }

    const conversation = await prisma.chatConversation.findUnique({
      where: { id: conversationId },
      select: {
        id: true,
        userId: true,
        customerName: true,
        mobile: true,
        email: true,
        lastMessage: true,
      },
    });

    if (!conversation) {
      return res.status(404).json({ message: "Conversation not found" });
    }

    if (!conversation.userId) {
      return res.status(400).json({
        message: "Conversation has no linked customer account",
      });
    }

    const latestCustomerMessage = await prisma.chatMessage.findFirst({
      where: {
        conversationId,
        senderType: ChatSenderType.CUSTOMER,
      },
      orderBy: {
        createdAt: "desc",
      },
      select: {
        message: true,
      },
    });

    const inquiryMessage =
      latestCustomerMessage?.message ||
      conversation.lastMessage ||
      `Inquiry converted from live chat (${conversation.customerName}, ${conversation.mobile})`;

    const resolvedMessage = await resolveBilingualText({
      text: inquiryMessage,
    });

    const inquiry = await prisma.inquiry.create({
      data: {
        userId: conversation.userId,
        message: resolvedMessage.textEn ?? resolvedMessage.textGu ?? inquiryMessage,
        message_en: resolvedMessage.textEn,
        message_gu: resolvedMessage.textGu,
        status: "NEW",
      },
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

    return res.status(201).json({
      message: "Live chat converted to inquiry",
      inquiry,
    });
  } catch (error) {
    console.error("Convert chat to inquiry error:", error);
    return res.status(500).json({ message: "Internal server error" });
  }
};
