import type { Server as HttpServer } from "http";
import type { CorsOptions } from "cors";
import { Prisma } from "@prisma/client";
import jwt from "jsonwebtoken";
import { Server, Socket } from "socket.io";
import prisma from "./prisma";
import { ENV } from "../config/env";

type ChatIdentity =
  | {
      type: "CUSTOMER";
      userId: string;
      email: string;
    }
  | {
      type: "ADMIN";
      adminId: string;
      role: string;
    };

type JwtPayload = {
  userId?: string;
  email?: string;
  adminId?: string;
  role?: string;
};

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

let io: Server | null = null;

const CHAT_ADMIN_ROOM = "chat:admins";

const getUserRoom = (userId: string): string => `chat:user:${userId}`;

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
        senderType: "CUSTOMER",
        ...(conversation.adminLastReadAt
          ? { createdAt: { gt: conversation.adminLastReadAt } }
          : {}),
      },
    }),
    prisma.chatMessage.count({
      where: {
        conversationId: conversation.id,
        senderType: "ADMIN",
        ...(conversation.customerLastReadAt
          ? { createdAt: { gt: conversation.customerLastReadAt } }
          : {}),
      },
    }),
  ]);

  return { unreadForAdminCount, unreadForCustomerCount };
};

const toConversationEventPayload = async (conversation: ChatConversationPayload) => {
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

const extractAuthToken = (socket: Socket): string | null => {
  const fromAuth =
    typeof socket.handshake.auth?.token === "string"
      ? socket.handshake.auth.token
      : null;

  if (fromAuth) {
    return fromAuth;
  }

  const authorizationHeader = socket.handshake.headers.authorization;
  if (typeof authorizationHeader !== "string") {
    return null;
  }

  const value = authorizationHeader.trim();
  if (value.toLowerCase().startsWith("bearer ")) {
    return value.slice(7).trim();
  }

  return value || null;
};

const decodeIdentity = (token: string): ChatIdentity | null => {
  try {
    const decoded = jwt.verify(token, ENV.JWT_SECRET) as JwtPayload;

    if (
      typeof decoded.adminId === "string" &&
      decoded.adminId &&
      typeof decoded.role === "string" &&
      decoded.role
    ) {
      return {
        type: "ADMIN",
        adminId: decoded.adminId,
        role: decoded.role,
      };
    }

    if (
      typeof decoded.userId === "string" &&
      decoded.userId &&
      typeof decoded.email === "string" &&
      decoded.email
    ) {
      return {
        type: "CUSTOMER",
        userId: decoded.userId,
        email: decoded.email,
      };
    }
  } catch {
    return null;
  }

  return null;
};

export const initializeSocketServer = (
  httpServer: HttpServer,
  corsOptions: CorsOptions
): Server => {
  if (io) {
    return io;
  }

  io = new Server(httpServer, {
    cors: {
      origin: corsOptions.origin as CorsOptions["origin"],
      credentials: true,
      methods: corsOptions.methods as string[] | undefined,
    },
    transports: ["websocket", "polling"],
  });

  io.use((socket, next) => {
    const token = extractAuthToken(socket);
    if (!token) {
      return next(new Error("Unauthorized"));
    }

    const identity = decodeIdentity(token);
    if (!identity) {
      return next(new Error("Invalid token"));
    }

    socket.data.identity = identity;
    return next();
  });

  io.on("connection", (socket) => {
    const identity = socket.data.identity as ChatIdentity | undefined;
    if (!identity) {
      socket.disconnect(true);
      return;
    }

    if (identity.type === "ADMIN") {
      socket.join(CHAT_ADMIN_ROOM);
      return;
    }

    socket.join(getUserRoom(identity.userId));
  });

  return io;
};

export const emitChatMessageCreated = (message: ChatMessagePayload): void => {
  if (!io) {
    return;
  }

  io.to(CHAT_ADMIN_ROOM).emit("chat:message:new", message);

  if (message.userId) {
    io.to(getUserRoom(message.userId)).emit("chat:message:new", message);
  }
};

export const emitChatConversationUpdated = async (
  conversationId: string
): Promise<void> => {
  if (!io) {
    return;
  }

  const conversation = await prisma.chatConversation.findUnique({
    where: { id: conversationId },
    include: CHAT_CONVERSATION_INCLUDE,
  });

  if (!conversation) {
    return;
  }

  const payload = await toConversationEventPayload(conversation);

  io.to(CHAT_ADMIN_ROOM).emit("chat:conversation:updated", payload);

  if (conversation.userId) {
    io.to(getUserRoom(conversation.userId)).emit(
      "chat:conversation:updated",
      payload
    );
  }
};
