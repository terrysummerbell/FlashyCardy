"use client";

import { useClerk } from "@clerk/nextjs";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";

export function SignOutButton() {
  const { signOut } = useClerk();
  const router = useRouter();

  return (
    <Button
      variant="outline"
      className="border-zinc-700 bg-transparent text-zinc-300 hover:bg-zinc-800 hover:text-white"
      onClick={() => signOut(() => router.push("/"))}
    >
      Sign out
    </Button>
  );
}
