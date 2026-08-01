"use client";

import { useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";

export default function PaystackCallbackPage() {
  const router = useRouter();
  const params = useSearchParams();

  useEffect(() => {
    const reference = params.get("reference");

    if (!reference) {
      router.replace("/wallet");
      return;
    }

    async function verify() {
      const response = await fetch(
        `/api/paystack/verify?reference=${reference}`
      );

      if (response.ok) {
        router.replace("/wallet?deposit=success");
      } else {
        router.replace("/wallet?deposit=failed");
      }
    }

    verify();
  }, [params, router]);

  return (
    <div className="flex h-screen items-center justify-center">
      <div className="text-center">

        <h2 className="text-2xl font-bold">
          Verifying Payment...
        </h2>

        <p className="mt-3 text-gray-500">
          Please wait while we verify your transaction.
        </p>

      </div>
    </div>
  );
}