import { Suspense } from "react";
import { RegistroView } from "./_components/RegistroView";
import Loading from "./loading";

export default function RegistroPage() {
  return (
    <Suspense fallback={<Loading />}>
      <RegistroView />
    </Suspense>
  );
}