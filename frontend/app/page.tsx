import { InboxDashboard } from "@/components/InboxDashboard";
import { fetchInbox } from "@/lib/api";

export default async function Home() {
  const initialData = await fetchInbox();

  return <InboxDashboard initialData={initialData} />;
}
