"use client";

import {
  Suspense,
  useEffect,
} from "react";
import {
  useRouter,
  useSearchParams,
} from "next/navigation";

function PaystackCallbackContent() {
  const router = useRouter();
  const params = useSearchParams();

  useEffect(() => {
    const reference =
  params.get("reference");

if (!reference) {
  router.replace("/wallet");
  return;
}

const verifiedReference = reference;

async function verify() {
  try {
    const response = await fetch(
      `/api/paystack/verify?reference=${encodeURIComponent(
        verifiedReference
      )}`,
          {
            cache: "no-store",
          }
        );

        if (response.ok) {
          router.replace(
            "/wallet?deposit=success"
          );
        } else {
          router.replace(
            "/wallet?deposit=failed"
          );
        }
      } catch (error) {
        console.error(
          "Paystack verification failed:",
          error
        );

        router.replace(
          "/wallet?deposit=failed"
        );
      }
    }

    void verify();
  }, [params, router]);

  return <PaymentLoading />;
}

export default function PaystackCallbackPage() {
  return (
    <Suspense fallback={<PaymentLoading />}>
      <PaystackCallbackContent />
    </Suspense>
  );
}

function PaymentLoading() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-50 px-4">
      <div className="text-center">
        <div className="mx-auto h-11 w-11 animate-spin rounded-full border-4 border-green-600 border-t-transparent" />

        <h2 className="mt-5 text-2xl font-bold text-gray-900">
          Verifying Payment...
        </h2>

        <p className="mt-3 text-gray-500">
          Please wait while we verify your
          transaction.
        </p>
      </div>
    </div>
  );
}