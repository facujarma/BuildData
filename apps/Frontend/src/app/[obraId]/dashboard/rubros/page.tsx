import { Suspense } from "react";
import { ScreenRubros } from "./_components/ScreenRubros";
import Loading from "./loading";

export default function RubrosPage() {
  return (
    <Suspense fallback={<Loading />}>
      <ScreenRubros />
    </Suspense>
  );
}