import { db } from "@/db";
import { consumableRequests } from "@/db/schema";
import { desc } from "drizzle-orm";
import { auth } from "@/auth";
import { redirect } from "next/navigation";
import { AdminConsumableRequestsClient } from "./AdminConsumableRequestsClient";

export default async function AdminConsumableRequestsPage() {
  const session = await auth();
  if (!session?.user?.id || (session.user.role !== "ADMIN" && session.user.role !== "VIEWER")) {
    redirect("/dashboard");
  }

  const isViewer = session.user.role === "VIEWER";

  // 1. Fetch all requests
  const allRequests = await db.query.consumableRequests.findMany({
    with: {
      asset: {
        with: {
          jurusan: true,
          location: true,
        }
      },
      requester: true,
      approver: true,
    },
    orderBy: [desc(consumableRequests.createdAt)],
  });

  // 2. Separate into pending and processed (history) lists
  const pendingRequests = allRequests.filter(r => r.approvalStatus === "PENDING");
  const processedRequests = allRequests.filter(r => r.approvalStatus !== "PENDING");

  return (
    <AdminConsumableRequestsClient
      pendingRequests={pendingRequests}
      processedRequests={processedRequests}
      isViewer={isViewer}
    />
  );
}
