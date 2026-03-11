import { db } from "@/db";
import { decks } from "@/db/schema";
import { and, eq } from "drizzle-orm";

export async function getDecksByUser(userId: string) {
  return db.select().from(decks).where(eq(decks.clerkUserId, userId));
}

export async function getDeckByIdForUser(deckId: string, userId: string) {
  return db.query.decks.findFirst({
    where: and(eq(decks.id, deckId), eq(decks.clerkUserId, userId)),
  });
}

export async function getDeckWithCardsForUser(deckId: string, userId: string) {
  return db.query.decks.findFirst({
    where: and(eq(decks.id, deckId), eq(decks.clerkUserId, userId)),
    with: { cards: true },
  });
}

export async function createDeck(
  userId: string,
  title: string,
  description?: string,
) {
  return db
    .insert(decks)
    .values({ clerkUserId: userId, title, description })
    .returning();
}

export async function updateDeck(
  deckId: string,
  userId: string,
  data: { title?: string; description?: string },
) {
  return db
    .update(decks)
    .set(data)
    .where(and(eq(decks.id, deckId), eq(decks.clerkUserId, userId)))
    .returning();
}

export async function deleteDeck(deckId: string, userId: string) {
  return db
    .delete(decks)
    .where(and(eq(decks.id, deckId), eq(decks.clerkUserId, userId)));
}
