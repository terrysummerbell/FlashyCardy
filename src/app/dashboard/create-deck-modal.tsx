"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Plus } from "lucide-react";
import { toast } from "sonner";
import Link from "next/link";
import { Show } from "@clerk/nextjs";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { createDeckAction } from "./actions";

interface CreateDeckModalProps {
  atLimit?: boolean;
}

export function CreateDeckModal({ atLimit = false }: CreateDeckModalProps) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [isPending, startTransition] = useTransition();

  function handleOpenChange(next: boolean) {
    if (!next) {
      setTitle("");
      setDescription("");
    }
    setOpen(next);
  }

  function handleCreate() {
    startTransition(async () => {
      const result = await createDeckAction({
        title,
        description: description.trim() || undefined,
      });
      setOpen(false);
      toast.success("Deck created");
      router.push(`/decks/${result.deckId}`);
    });
  }

  const upgradePrompt = (
    <div className="flex items-center gap-3 rounded-lg border border-zinc-700 bg-zinc-900 px-4 py-3">
      <p className="text-sm text-zinc-400">
        You&apos;ve reached the 3-deck limit on the free plan.
      </p>
      <Link href="/pricing">
        <Button size="sm" className="shrink-0">Upgrade to Pro</Button>
      </Link>
    </div>
  );

  const createContent = (
    <>
      <Button onClick={() => setOpen(true)}>
        <Plus className="mr-1 h-4 w-4" />
        Create New Deck
      </Button>

      <Dialog open={open} onOpenChange={handleOpenChange}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Create new deck</DialogTitle>
          </DialogHeader>

          <div className="space-y-4">
            <div className="space-y-1.5">
              <label className="text-xs font-medium uppercase tracking-wide text-zinc-400">
                Title
              </label>
              <input
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" && title.trim()) handleCreate();
                }}
                className="w-full rounded-md border border-zinc-700 bg-zinc-800 px-3 py-2 text-sm text-white placeholder-zinc-500 focus:border-zinc-500 focus:outline-none focus:ring-1 focus:ring-zinc-500"
                placeholder="e.g. Spanish Vocabulary"
                autoFocus
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-medium uppercase tracking-wide text-zinc-400">
                Description{" "}
                <span className="normal-case text-zinc-600">(optional)</span>
              </label>
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                rows={3}
                className="w-full resize-none rounded-md border border-zinc-700 bg-zinc-800 px-3 py-2 text-sm text-white placeholder-zinc-500 focus:border-zinc-500 focus:outline-none focus:ring-1 focus:ring-zinc-500"
                placeholder="A short description of this deck"
              />
            </div>
          </div>

          <DialogFooter>
            <Button
              variant="ghost"
              onClick={() => handleOpenChange(false)}
              disabled={isPending}
            >
              Cancel
            </Button>
            <Button
              onClick={handleCreate}
              disabled={isPending || !title.trim()}
            >
              {isPending ? "Creating…" : "Create deck"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );

  return (
    <Show when={{ feature: "unlimited_decks" }} fallback={atLimit ? upgradePrompt : createContent}>
      {createContent}
    </Show>
  );
}
