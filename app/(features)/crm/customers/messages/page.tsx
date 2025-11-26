import { MessageManagementClient } from "./message-management-client";

export default async function MessagesPage() {
  // This is a Server Component that will fetch initial data
  // For now, we'll pass empty data and let the client component fetch

  return (
    <div className="h-[calc(100vh-4rem)]">
      <MessageManagementClient />
    </div>
  );
}
