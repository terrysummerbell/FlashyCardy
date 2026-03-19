import { PricingTable } from "@clerk/nextjs";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";

export default function PricingPage() {
  return (
    <div className="min-h-screen bg-zinc-950 text-white">
      <header className="border-b border-zinc-800 px-8 py-4">
        <div className="mx-auto flex max-w-4xl items-center justify-between">
          <Link href="/" className="text-lg font-bold tracking-tight text-white">
            FlashyCardy
          </Link>
          <Button variant="outline" size="sm">
            <Link href="/dashboard">Dashboard</Link>
          </Button>
        </div>
      </header>

      <div className="mx-auto max-w-4xl px-8 pt-16 pb-16">
        <div className="mb-8 text-center">
          <h1 className="text-4xl font-semibold tracking-tight">Pricing</h1>
          <p className="mt-3 text-zinc-400">
            Choose the plan that works best for you.
          </p>
        </div>

        <Separator className="mb-10" />

        <PricingTable />
      </div>
    </div>
  );
}
