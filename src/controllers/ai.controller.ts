import { randomUUID } from "crypto";
import { Request, Response } from "express";
import prisma from "../lib/prisma";
import { generateAIResponse } from "../services/ai.service";

export const chatWithAI = async (req: Request, res: Response) => {
  try {
    const message =
      typeof req.body?.message === "string" ? req.body.message.trim() : "";
    const sessionId =
      typeof req.body?.sessionId === "string" ? req.body.sessionId.trim() : "";

    if (!message) {
      return res.status(400).json({ error: "Message is required" });
    }

    const finalSessionId = sessionId || randomUUID();

    await prisma.$executeRaw`
      INSERT INTO "AIChatMessage" ("sessionId", "sender", "message")
      VALUES (${finalSessionId}, ${"user"}, ${message})
    `;

    const previousMessages = await prisma.$queryRaw<
      { sender: string; message: string }[]
    >`
      SELECT "sender", "message"
      FROM "AIChatMessage"
      WHERE "sessionId" = ${finalSessionId}
      ORDER BY "createdAt" ASC
      LIMIT 10
    `;

    const history = previousMessages
      .map((msg) => `${msg.sender}: ${msg.message}`)
      .join("\n");

    const aiReply = await generateAIResponse(history);

    await prisma.$executeRaw`
      INSERT INTO "AIChatMessage" ("sessionId", "sender", "message")
      VALUES (${finalSessionId}, ${"ai"}, ${aiReply})
    `;

    return res.json({
      reply: aiReply,
      sessionId: finalSessionId,
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ error: "Chat failed" });
  }
};
