import { auth } from "@clerk/nextjs/server";
import { UserButton } from "@clerk/nextjs";
import { redirect, notFound } from "next/navigation";
import Link from "next/link";
import { getDeckWithCardsForUser } from "@/db/queries/decks";
import { ArrowLeft, BookOpen } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { EditCardModal, AddCardModal, EditDeckModal, DeleteCardButton, DeleteDeckButton, GenerateCardsButton } from "./card-modals";

interface DeckPageProps {
  params: Promise<{ deckId: string }>;
}

export default async function DeckPage({ params }: DeckPageProps) {
  const { userId, has } = await auth();
  if (!userId) redirect("/");

  const canUseAI = has({ feature: "ai_flashcard_generation" });

  const { deckId } = await params;
  const deck = await getDeckWithCardsForUser(deckId, userId);

  if (!deck) notFound();

  return (
    <div className="min-h-screen bg-zinc-950 text-white">
      <header className="border-b border-zinc-800 px-8 py-4">
        <div className="mx-auto flex max-w-4xl items-center justify-between">
          <span className="text-lg font-bold tracking-tight text-white">
            FlashyCardy
          </span>
          <UserButton />
        </div>
      </header>

      <div className="mx-auto max-w-4xl px-8 pt-16 pb-8">
        <div className="mb-6">
          <Link
            href="/dashboard"
            className="mb-4 inline-flex items-center gap-1.5 text-sm text-zinc-400 hover:text-white transition-colors"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to dashboard
          </Link>

          <div className="mt-4 flex items-start justify-between gap-4">
            <div className="flex items-center gap-3">
              <h1 className="text-4xl font-semibold tracking-tight">
                {deck.title}
              </h1>
              <Badge variant="secondary">{deck.cards.length} cards</Badge>
              <EditDeckModal deck={deck} />
              <DeleteDeckButton deck={deck} />
            </div>

            {deck.cards.length > 0 && (
              <Link
                href={`/decks/${deckId}/study`}
                className="inline-flex shrink-0 items-center gap-2 rounded-lg bg-primary px-3 h-8 text-sm font-medium text-primary-foreground whitespace-nowrap transition-colors hover:bg-primary/80"
              >
                <BookOpen className="h-4 w-4 shrink-0" />
                Study
              </Link>
            )}
          </div>

          {deck.description && (
            <p className="mt-2 text-zinc-400">{deck.description}</p>
          )}

          <p className="mt-2 text-xs text-zinc-500">
            Last updated{" "}
            {deck.updatedAt.toLocaleDateString("en-GB", {
              day: "numeric",
              month: "long",
              year: "numeric",
            })}
          </p>
        </div>

        <Separator className="mb-8" />

        {deck.cards.length === 0 ? (
          <div className="rounded-xl border border-dashed border-zinc-700 p-12 text-center text-zinc-500">
            No cards yet. Add your first card to get started.
          </div>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2">
            {deck.cards.map((card) => (
              <Card key={card.id} className="flex flex-col">
                <CardHeader className="pb-2">
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0 flex-1">
                      <CardTitle className="text-sm font-medium text-zinc-400 uppercase tracking-wide">
                        Front
                      </CardTitle>
                      <p className="text-base font-medium">{card.front}</p>
                    </div>
                    <div className="flex items-center gap-0.5">
                      <EditCardModal card={card} deckId={deckId} />
                      <DeleteCardButton card={card} deckId={deckId} />
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <p className="text-sm font-medium text-zinc-400 uppercase tracking-wide mb-1">
                    Back
                  </p>
                  <p className="text-base text-zinc-300">{card.back}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        )}

        <div className="mt-6 flex flex-wrap gap-3">
          <AddCardModal deckId={deckId} />
          <GenerateCardsButton deckId={deckId} canUseAI={canUseAI} hasDescription={!!deck.description} />
        </div>
      </div>
    </div>
  );
}
