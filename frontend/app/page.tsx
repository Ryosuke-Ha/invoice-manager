"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import { useBackendHealth } from "@/hooks/useBackendHealth";
import { BackendError } from "@/components/BackendError";

export default function Home() {
  const router = useRouter();
  const { data: session, status } = useSession();
  const { status: healthStatus, nextRetryIn, checkHealth } = useBackendHealth();

  useEffect(() => {
    if (status === "unauthenticated") {
      router.replace("/login");
    }
  }, [status, router]);

  if (status === "loading" || healthStatus === "checking") {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-gray-400 text-sm animate-pulse">Loading...</p>
      </div>
    );
  }

  if (status === "unauthenticated") {
    return null;
  }

  if (healthStatus === "unhealthy") {
    return <BackendError nextRetryIn={nextRetryIn} onRetry={checkHealth} />;
  }

  // ここにアプリのメインコンテンツを追加
  return (
    <main>
      <h1 className="text-2xl font-bold text-gray-900">TEMPLATE_APP</h1>
      <p className="text-gray-500 mt-2">ログイン中: {session?.user?.email}</p>
    </main>
  );
}
