import { HsBatchLookupPanel } from "@/features/hs-batch/hs-batch-lookup-panel";
import { getSeoulDateString } from "@/lib/utils";

export default function HsBatchLookupPage() {
  return <HsBatchLookupPanel basisDate={getSeoulDateString()} />;
}
