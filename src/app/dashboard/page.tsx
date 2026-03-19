import { auth, currentUser } from "@clerk/nextjs/server";
import { UserButton } from "@clerk/nextjs";
import { redirect } from "next/navigation";
import Link from "next/link";
import { getDecksByUser } from "@/db/queries/decks";
import { Badge } from "@/components/ui/badge";
import { CreateDeckModal } from "./create-deck-modal";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";

export default async function DashboardPage() {
  const { userId, has } = await auth();
  if (!userId) redirect("/");

  const [user, userDecks] = await Promise.all([
    currentUser(),
    getDecksByUser(userId),
  ]);

  const isPro = has({ plan: "pro" });
  const hasUnlimitedDecks = has({ feature: "unlimited_decks" });
  const atDeckLimit = !hasUnlimitedDecks && userDecks.length >= 3;

  const displayName =
    user?.firstName ?? user?.emailAddresses[0].emailAddress ?? "there";

  return (
    <div className="min-h-screen bg-zinc-950 text-white">
      {/* Page header */}
      <header className="border-b border-zinc-800 px-8 py-4">
        <div className="mx-auto flex max-w-4xl items-center justify-between">
          <span className="text-lg font-bold tracking-tight text-white">
            FlashyCardy
          </span>
          <UserButton />
        </div>
      </header>

      {/* Main content */}
      <div className="mx-auto max-w-4xl px-8 pt-16 pb-8">
        <div className="mb-6">
          <div className="flex items-center gap-3">
            <h1 className="text-4xl font-semibold tracking-tight">
              Dashboard
            </h1>
            <Badge variant="secondary">{userDecks.length} decks</Badge>
            {isPro && (
              <Badge className="bg-amber-500 text-black hover:bg-amber-500">
                Pro
              </Badge>
            )}
          </div>
          <p className="mt-2 text-zinc-400">
            Welcome back, {displayName}. Manage your flashcard decks and study
            progress.
          </p>
        </div>

        <Separator className="mb-8" />

        {userDecks.length === 0 ? (
          <div className="rounded-xl border border-dashed border-zinc-700 p-12 text-center text-zinc-500">
            No decks yet. Create your first deck to get started.
          </div>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2">
            {userDecks.map((deck) => (
              <Link key={deck.id} href={`/decks/${deck.id}`}>
              <Card className="flex flex-col justify-between">
                <CardHeader>
                  <CardTitle>{deck.title}</CardTitle>
                  {deck.description && (
                    <CardDescription>{deck.description}</CardDescription>
                  )}
                </CardHeader>
                <CardContent></CardContent>
                <CardFooter>
                  <p className="text-xs text-muted-foreground">
                    Updated{" "}
                    {deck.updatedAt.toLocaleDateString("en-GB", {
                      day: "numeric",
                      month: "long",
                      year: "numeric",
                    })}
                  </p>
                </CardFooter>
              </Card>
              </Link>
            ))}
          </div>
        )}

        <div className="mt-6">
          <CreateDeckModal atLimit={atDeckLimit} />
        </div>
      </div>
    </div>
  );
}
