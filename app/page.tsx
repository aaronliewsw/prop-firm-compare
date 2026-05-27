import Dashboard from "@/components/dashboard";
import data from "@/data/firms.json";
import type { Firm } from "@/lib/firms";

export default function Page() {
  const firms = data.firms as Firm[];
  return <Dashboard firms={firms} generatedAt={data.generatedAt} />;
}
