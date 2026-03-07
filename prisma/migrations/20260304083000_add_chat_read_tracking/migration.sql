-- AlterTable
ALTER TABLE "ChatConversation"
ADD COLUMN "adminLastReadAt" TIMESTAMP(3),
ADD COLUMN "customerLastReadAt" TIMESTAMP(3);
