import { InboxDashboard } from "@/components/InboxDashboard";
import { emptyInboxData, fetchInbox } from "@/lib/api";

export default async function Home() {
  try {
    const initialData = await fetchInbox();

    return <InboxDashboard initialData={initialData} />;
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unable to load shared inbox.";

    return <InboxDashboard initialData={emptyInboxData()} initialError={message} />;
  }
}
