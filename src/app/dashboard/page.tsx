import { auth, currentUser } from "@clerk/nextjs/server";
import { UserButton } from "@clerk/nextjs";
import { redirect } from "next/navigation";
import { getDecksByUser } from "@/db/queries/decks";
import { Plus } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
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
  const { userId } = await auth();
  if (!userId) redirect("/");

  const [user, userDecks] = await Promise.all([
    currentUser(),
    getDecksByUser(userId),
  ]);

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
              <Card key={deck.id} className="flex flex-col justify-between">
                <CardHeader>
                  <div className="flex items-start justify-between gap-2">
                    <CardTitle>{deck.title}</CardTitle>
                    <Badge variant="outline">
                      {deck.createdAt.toLocaleDateString("en-GB", {
                        day: "numeric",
                        month: "short",
                        year: "numeric",
                      })}
                    </Badge>
                  </div>
                  {deck.description && (
                    <CardDescription>{deck.description}</CardDescription>
                  )}
                </CardHeader>
                <CardContent>
                  <Separator className="mb-4" />
                  <p className="text-xs text-muted-foreground">
                    Created{" "}
                    {deck.createdAt.toLocaleDateString("en-GB", {
                      day: "numeric",
                      month: "long",
                      year: "numeric",
                    })}
                  </p>
                </CardContent>
                <CardFooter>
                  <Button>Study</Button>
                </CardFooter>
              </Card>
            ))}
          </div>
        )}

        <div className="mt-6">
          <Button>
            <Plus className="mr-1 h-4 w-4" />
            Create New Deck
          </Button>
        </div>
      </div>
    </div>
  );
}
