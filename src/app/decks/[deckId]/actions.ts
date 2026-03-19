"use server";

import { auth } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { generateText, Output } from "ai";
import { openai } from "@ai-sdk/openai";
import { createCard, updateCard, deleteCard, createManyCards } from "@/db/queries/cards";
import { updateDeck, deleteDeck, getDeckWithCardsForUser } from "@/db/queries/decks";

const cardSchema = z.object({
  front: z.string().min(1, "Front is required").max(500),
  back: z.string().min(1, "Back is required").max(500),
});

type CardInput = z.infer<typeof cardSchema>;

export async function createCardAction(deckId: string, input: CardInput) {
  const { userId } = await auth();
  if (!userId) redirect("/");

  const parsed = cardSchema.safeParse(input);
  if (!parsed.success) throw new Error("Invalid input");

  await createCard(deckId, userId, parsed.data.front, parsed.data.back);
  revalidatePath(`/decks/${deckId}`);
}

export async function updateCardAction(
  cardId: string,
  deckId: string,
  input: CardInput,
) {
  const { userId } = await auth();
  if (!userId) redirect("/");

  const parsed = cardSchema.safeParse(input);
  if (!parsed.success) throw new Error("Invalid input");

  await updateCard(cardId, deckId, userId, parsed.data);
  revalidatePath(`/decks/${deckId}`);
}

export async function deleteCardAction(cardId: string, deckId: string) {
  const { userId } = await auth();
  if (!userId) redirect("/");

  await deleteCard(cardId, deckId, userId);
  revalidatePath(`/decks/${deckId}`);
}

const updateDeckSchema = z.object({
  title: z.string().min(1, "Title is required").max(100),
  description: z.string().max(500).optional(),
});

type UpdateDeckInput = z.infer<typeof updateDeckSchema>;

export async function updateDeckAction(deckId: string, input: UpdateDeckInput) {
  const { userId } = await auth();
  if (!userId) redirect("/");

  const parsed = updateDeckSchema.safeParse(input);
  if (!parsed.success) throw new Error("Invalid input");

  await updateDeck(deckId, userId, {
    title: parsed.data.title,
    description: parsed.data.description ?? undefined,
  });
  revalidatePath(`/decks/${deckId}`);
}

export async function deleteDeckAction(deckId: string) {
  const { userId } = await auth();
  if (!userId) redirect("/");

  await deleteDeck(deckId, userId);
  redirect("/dashboard");
}

export async function generateCardsAction(deckId: string) {
  const { userId, has } = await auth();
  if (!userId) redirect("/");

  if (!has({ feature: "ai_flashcard_generation" })) {
    throw new Error("AI flashcard generation requires a Pro plan.");
  }

  const deck = await getDeckWithCardsForUser(deckId, userId);
  if (!deck) throw new Error("Deck not found");

  const topicParts = [deck.title];
  if (deck.description) topicParts.push(deck.description);
  const topic = topicParts.join(" — ");

  const { output } = await generateText({
    model: openai("gpt-4o"),
    output: Output.object({
      schema: z.object({
        cards: z.array(
          z.object({
            front: z.string(),
            back: z.string(),
          }),
        ),
      }),
    }),
    prompt: `Generate exactly 20 high-quality flashcards for studying the following topic: "${topic}". Each card should have a concise question or term on the front and a clear, accurate answer or definition on the back.`,
  });

  await createManyCards(deckId, userId, output.cards);
  revalidatePath(`/decks/${deckId}`);
}
