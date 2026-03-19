import { db } from "@/db";
import { cards, decks } from "@/db/schema";
import { and, eq } from "drizzle-orm";

async function assertDeckOwnership(deckId: string, userId: string) {
  const deck = await db.query.decks.findFirst({
    where: and(eq(decks.id, deckId), eq(decks.clerkUserId, userId)),
  });
  if (!deck) throw new Error("Deck not found");
  return deck;
}

export async function getCardsByDeck(deckId: string, userId: string) {
  await assertDeckOwnership(deckId, userId);
  return db.select().from(cards).where(eq(cards.deckId, deckId));
}

export async function getCardByIdForUser(
  cardId: string,
  deckId: string,
  userId: string,
) {
  await assertDeckOwnership(deckId, userId);
  return db.query.cards.findFirst({
    where: and(eq(cards.id, cardId), eq(cards.deckId, deckId)),
  });
}

export async function createCard(
  deckId: string,
  userId: string,
  front: string,
  back: string,
) {
  await assertDeckOwnership(deckId, userId);
  return db.insert(cards).values({ deckId, front, back }).returning();
}

export async function updateCard(
  cardId: string,
  deckId: string,
  userId: string,
  data: { front?: string; back?: string },
) {
  await assertDeckOwnership(deckId, userId);
  return db
    .update(cards)
    .set(data)
    .where(and(eq(cards.id, cardId), eq(cards.deckId, deckId)))
    .returning();
}

export async function deleteCard(
  cardId: string,
  deckId: string,
  userId: string,
) {
  await assertDeckOwnership(deckId, userId);
  return db
    .delete(cards)
    .where(and(eq(cards.id, cardId), eq(cards.deckId, deckId)));
}

export async function createManyCards(
  deckId: string,
  userId: string,
  newCards: { front: string; back: string }[],
) {
  await assertDeckOwnership(deckId, userId);
  return db
    .insert(cards)
    .values(newCards.map((c) => ({ deckId, front: c.front, back: c.back })))
    .returning();
}
