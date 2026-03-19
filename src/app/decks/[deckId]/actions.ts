"use server";

import { auth } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { generateText, Output } from "ai";
import { openai } from "@ai-sdk/openai";
import { createCard, updateCard, deleteCard, createManyCards } from "@/db/queries/cards";
import { updateDeck, deleteDeck, getDeckWithCardsForUser } from "@/db/queries/decks";

const deckIdSchema = z.string().uuid("Invalid deck ID");
const cardIdSchema = z.string().uuid("Invalid card ID");

type DeckId = z.infer<typeof deckIdSchema>;
type CardId = z.infer<typeof cardIdSchema>;

const cardSchema = z.object({
  front: z.string().min(1, "Front is required").max(500),
  back: z.string().min(1, "Back is required").max(500),
});

type CardInput = z.infer<typeof cardSchema>;

export async function createCardAction(deckId: DeckId, input: CardInput) {
  const { userId } = await auth();
  if (!userId) redirect("/");

  const parsedDeckId = deckIdSchema.safeParse(deckId);
  if (!parsedDeckId.success) throw new Error("Invalid deck ID");

  const parsed = cardSchema.safeParse(input);
  if (!parsed.success) throw new Error("Invalid input");

  await createCard(parsedDeckId.data, userId, parsed.data.front, parsed.data.back);
  revalidatePath(`/decks/${parsedDeckId.data}`);
}

export async function updateCardAction(
  cardId: CardId,
  deckId: DeckId,
  input: CardInput,
) {
  const { userId } = await auth();
  if (!userId) redirect("/");

  const parsedCardId = cardIdSchema.safeParse(cardId);
  if (!parsedCardId.success) throw new Error("Invalid card ID");

  const parsedDeckId = deckIdSchema.safeParse(deckId);
  if (!parsedDeckId.success) throw new Error("Invalid deck ID");

  const parsed = cardSchema.safeParse(input);
  if (!parsed.success) throw new Error("Invalid input");

  await updateCard(parsedCardId.data, parsedDeckId.data, userId, parsed.data);
  revalidatePath(`/decks/${parsedDeckId.data}`);
}

export async function deleteCardAction(cardId: CardId, deckId: DeckId) {
  const { userId } = await auth();
  if (!userId) redirect("/");

  const parsedCardId = cardIdSchema.safeParse(cardId);
  if (!parsedCardId.success) throw new Error("Invalid card ID");

  const parsedDeckId = deckIdSchema.safeParse(deckId);
  if (!parsedDeckId.success) throw new Error("Invalid deck ID");

  await deleteCard(parsedCardId.data, parsedDeckId.data, userId);
  revalidatePath(`/decks/${parsedDeckId.data}`);
}

const updateDeckSchema = z.object({
  title: z.string().min(1, "Title is required").max(100),
  description: z.string().max(500).optional(),
});

type UpdateDeckInput = z.infer<typeof updateDeckSchema>;

export async function updateDeckAction(deckId: DeckId, input: UpdateDeckInput) {
  const { userId } = await auth();
  if (!userId) redirect("/");

  const parsedDeckId = deckIdSchema.safeParse(deckId);
  if (!parsedDeckId.success) throw new Error("Invalid deck ID");

  const parsed = updateDeckSchema.safeParse(input);
  if (!parsed.success) throw new Error("Invalid input");

  await updateDeck(parsedDeckId.data, userId, {
    title: parsed.data.title,
    description: parsed.data.description ?? undefined,
  });
  revalidatePath(`/decks/${parsedDeckId.data}`);
}

export async function deleteDeckAction(deckId: DeckId) {
  const { userId } = await auth();
  if (!userId) redirect("/");

  const parsedDeckId = deckIdSchema.safeParse(deckId);
  if (!parsedDeckId.success) throw new Error("Invalid deck ID");

  await deleteDeck(parsedDeckId.data, userId);
  redirect("/dashboard");
}

export async function generateCardsAction(deckId: DeckId) {
  const { userId, has } = await auth();
  if (!userId) redirect("/");

  const parsedDeckId = deckIdSchema.safeParse(deckId);
  if (!parsedDeckId.success) throw new Error("Invalid deck ID");

  if (!has({ feature: "ai_flashcard_generation" })) {
    throw new Error("AI flashcard generation requires a Pro plan.");
  }

  const deck = await getDeckWithCardsForUser(parsedDeckId.data, userId);
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

  await createManyCards(parsedDeckId.data, userId, output.cards);
  revalidatePath(`/decks/${parsedDeckId.data}`);
}
