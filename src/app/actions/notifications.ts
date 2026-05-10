"use server";

import { db } from "@/db";
import { notifications } from "@/db/schema";
import { eq, and } from "drizzle-orm";
import { auth } from "@/auth";
import { revalidatePath } from "next/cache";

export async function getUnreadNotifications() {
  const session = await auth();
  if (!session?.user?.id) return [];

  return await db.query.notifications.findMany({
    where: and(
      eq(notifications.userId, session.user.id),
      eq(notifications.isRead, false)
    ),
    orderBy: (notifications, { desc }) => [desc(notifications.createdAt)],
  });
}

export async function markAsRead(id: string) {
  const session = await auth();
  if (!session?.user?.id) return;

  await db.update(notifications)
    .set({ isRead: true })
    .where(eq(notifications.id, id));
  
  revalidatePath("/");
}
