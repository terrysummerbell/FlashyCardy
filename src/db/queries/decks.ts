import { db } from "@/db";
import { cards, decks } from "@/db/schema";
import { and, count, desc, eq } from "drizzle-orm";

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
    with: { cards: { orderBy: desc(cards.updatedAt) } },
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

/**
 * Creates a deck only if the user has fewer than `limit` decks.
 * The count and insert run inside a serializable transaction so concurrent
 * requests cannot both slip past the limit check (TOCTOU protection).
 */
export async function createDeckWithLimit(
  userId: string,
  title: string,
  limit: number,
  description?: string,
) {
  return db.transaction(
    async (tx) => {
      const [{ value: deckCount }] = await tx
        .select({ value: count() })
        .from(decks)
        .where(eq(decks.clerkUserId, userId));

      if (deckCount >= limit) {
        throw new Error(
          "Free plan is limited to 3 decks. Upgrade to Pro for unlimited decks.",
        );
      }

      return tx
        .insert(decks)
        .values({ clerkUserId: userId, title, description })
        .returning();
    },
    { isolationLevel: "serializable" },
  );
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
