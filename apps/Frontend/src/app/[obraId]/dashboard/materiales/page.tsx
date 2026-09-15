import { Suspense } from "react";
import { MaterialesView } from "./_components/MaterialesView";
import Loading from "./loading";

export default function MaterialesPage() {
  return (
    <Suspense fallback={<Loading />}>
      <MaterialesView />
    </Suspense>
  );
}