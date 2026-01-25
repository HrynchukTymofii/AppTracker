import { PrismaClient } from "@prisma/client";

declare global {
  var prisma: PrismaClient | undefined;
}

export const db = globalThis.prisma || new PrismaClient();

if (process.env.NODE_ENV !== "production") globalThis.prisma = db;

export async function addToWaitlist(data: {
  email: string;
  name: string | null;
  deviceOS: string[];
  dailyScreenTime: string;
}): Promise<{ id: number; isNew: boolean }> {
  const existing = await db.waitlist.findUnique({
    where: { email: data.email },
  });

  if (existing) {
    await db.waitlist.update({
      where: { email: data.email },
      data: {
        name: data.name ?? existing.name,
        deviceOS: data.deviceOS,
        dailyScreenTime: data.dailyScreenTime,
      },
    });
    return { id: existing.id, isNew: false };
  }

  const result = await db.waitlist.create({
    data: {
      email: data.email,
      name: data.name,
      deviceOS: data.deviceOS,
      dailyScreenTime: data.dailyScreenTime,
    },
  });

  return { id: result.id, isNew: true };
}

export async function markEmailSent(id: number): Promise<void> {
  await db.waitlist.update({
    where: { id },
    data: { emailSent: true },
  });
}

export async function createSupportMessage(data: {
  name: string;
  email: string;
  message: string;
}): Promise<{ id: number }> {
  const result = await db.supportMessage.create({
    data: {
      name: data.name,
      email: data.email,
      message: data.message,
    },
  });

  return { id: result.id };
}
