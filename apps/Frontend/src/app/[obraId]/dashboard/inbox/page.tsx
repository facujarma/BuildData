import { Suspense } from "react";
import { ScreenInbox } from "./_components/ScreenInbox";
import Loading from "./loading";

export default function InboxPage() {
  return (
    <Suspense fallback={<Loading />}>
      <ScreenInbox />
    </Suspense>
  );
}