import { Suspense } from "react";
import { CostosView } from "./_components/CostosView";
import Loading from "./loading";

export default function CostosPage() {
  return (
    <Suspense fallback={<Loading />}>
      <CostosView />
    </Suspense>
  );
}