import { auth } from "@clerk/nextjs/server";
import { UserButton } from "@clerk/nextjs";
import { redirect, notFound } from "next/navigation";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { getDeckWithCardsForUser } from "@/db/queries/decks";
import { StudyClient } from "./study-client";

interface StudyPageProps {
  params: Promise<{ deckId: string }>;
}

export default async function StudyPage({ params }: StudyPageProps) {
  const { userId } = await auth();
  if (!userId) redirect("/");

  const { deckId } = await params;
  const deck = await getDeckWithCardsForUser(deckId, userId);

  if (!deck) notFound();

  if (deck.cards.length === 0) {
    redirect(`/decks/${deckId}`);
  }

  const cards = deck.cards.map((c) => ({
    id: c.id,
    front: c.front,
    back: c.back,
  }));

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

      <div className="mx-auto max-w-4xl px-8 pt-10 pb-8">
        <Link
          href={`/decks/${deckId}`}
          className="mb-6 inline-flex items-center gap-1.5 text-sm text-zinc-400 hover:text-white transition-colors"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to {deck.title}
        </Link>

        <StudyClient
          deckId={deckId}
          deckTitle={deck.title}
          initialCards={cards}
        />
      </div>
    </div>
  );
}
