"use client";

import { ClientSetupFlow } from "@/components/client-context/client-setup-flow";

export default function ClientContextPage() {
  return (
    <div className="h-full -m-8 overflow-auto">
      <ClientSetupFlow />
    </div>
  );
}
