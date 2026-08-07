"use client";
 import { supabase } from "@/lib/supabase";
import { useState } from "react";
import { useRouter } from "next/navigation";
import Button from "@/components/ui/Button";
import Card from "@/components/ui/Card";
import Input from "@/components/ui/Input";
export default function RegisterPage() {
  const router = useRouter();
const [fullName, setFullName] = useState("");
const [email, setEmail] = useState("");
const [password, setPassword] = useState("");
const [loading, setLoading] = useState(false);
const [message, setMessage] = useState("");
async function handleRegister(event: React.FormEvent<HTMLFormElement>) {
  event.preventDefault();

  setLoading(true);
  setMessage("");

  const { error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      data: {
        full_name: fullName,
      },
    },
  });

  if (error) {
    setMessage(error.message);
    setLoading(false);
    return;
  }

  // Give Supabase a moment to establish the session
  await new Promise((resolve) => setTimeout(resolve, 500));

  router.push("/dashboard");
}
  return (
    <main className="min-h-screen bg-gray-50 flex items-center justify-center p-8">
      <Card className="w-full max-w-md shadow-xl p-8">

        <h1 className="text-3xl font-bold text-center text-gray-900">
          Create Your Account
        </h1>

        <p className="text-gray-500 text-center mt-2">
          Join ChainSave and start saving securely.
        </p>

        <form onSubmit={handleRegister} className="mt-8 space-y-5">

          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              Full Name
            </label>

            <Input
               type="text"
               placeholder="John Doe"
               value={fullName}
               onChange={(event) => setFullName(event.target.value)}
/>
          </div>

          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              Email
            </label>

            <Input
               type="email"
               placeholder="example@email.com"
               value={email}
               onChange={(event) => setEmail(event.target.value)}
/>
          </div>

          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              Password
            </label>

            <Input
               type="password"
               placeholder="********"
               value={password}
               onChange={(event) => setPassword(event.target.value)}
               />
          </div>

          <Button
  type="submit"
  disabled={loading}
  className="w-full shadow-lg hover:shadow-xl"
>
  {loading ? "Creating Account..." : "Create Account"}
</Button>

                </form>

        {message && (
          <p className="mt-4 text-center text-sm font-medium text-green-700">
            {message}
          </p>
        )}

        <div className="mt-6 text-center text-sm text-gray-600">
          Already have an account?{" "}
          <a
            href="/login"
            className="font-semibold text-green-700 hover:underline"
          >
            Sign In
          </a>
        </div>

      </Card>
    </main>
  );
}