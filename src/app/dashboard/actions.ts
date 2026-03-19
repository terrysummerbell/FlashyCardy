"use server";

import { auth } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { createDeck, createDeckWithLimit } from "@/db/queries/decks";

const createDeckSchema = z.object({
  title: z.string().min(1, "Title is required").max(100),
  description: z.string().max(500).optional(),
});

type CreateDeckInput = z.infer<typeof createDeckSchema>;

export async function createDeckAction(input: CreateDeckInput) {
  const { userId, has } = await auth();
  if (!userId) redirect("/");

  const parsed = createDeckSchema.safeParse(input);
  if (!parsed.success) throw new Error("Invalid input");

  const hasUnlimitedDecks = has({ feature: "unlimited_decks" });

  const [deck] = hasUnlimitedDecks
    ? await createDeck(userId, parsed.data.title, parsed.data.description)
    : await createDeckWithLimit(userId, parsed.data.title, 3, parsed.data.description);

  revalidatePath("/dashboard");
  return { deckId: deck.id };
}
