"use client";

import { useState, useTransition } from "react";
import { Pencil, Plus, Sparkles, Trash2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Show } from "@clerk/nextjs";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { createCardAction, updateCardAction, updateDeckAction, deleteCardAction, deleteDeckAction, generateCardsAction } from "./actions";

interface Deck {
  id: string;
  title: string;
  description?: string | null;
}

interface EditDeckModalProps {
  deck: Deck;
}

export function EditDeckModal({ deck }: EditDeckModalProps) {
  const [open, setOpen] = useState(false);
  const [title, setTitle] = useState(deck.title);
  const [description, setDescription] = useState(deck.description ?? "");
  const [isPending, startTransition] = useTransition();

  function handleOpen() {
    setTitle(deck.title);
    setDescription(deck.description ?? "");
    setOpen(true);
  }

  function handleSave() {
    startTransition(async () => {
      await updateDeckAction(deck.id, {
        title,
        description: description.trim() || undefined,
      });
      setOpen(false);
    });
  }

  return (
    <>
      <Button
        variant="ghost"
        size="sm"
        className="h-8 px-2.5 text-zinc-400 hover:text-white"
        onClick={handleOpen}
      >
        <Pencil className="h-4 w-4" />
        <span className="sr-only">Edit deck</span>
      </Button>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit deck</DialogTitle>
          </DialogHeader>

          <div className="space-y-4">
            <div className="space-y-1.5">
              <label className="text-xs font-medium uppercase tracking-wide text-zinc-400">
                Title
              </label>
              <input
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="w-full rounded-md border border-zinc-700 bg-zinc-800 px-3 py-2 text-sm text-white placeholder-zinc-500 focus:border-zinc-500 focus:outline-none focus:ring-1 focus:ring-zinc-500"
                placeholder="Deck title"
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
            <Button variant="ghost" onClick={() => setOpen(false)} disabled={isPending}>
              Cancel
            </Button>
            <Button
              onClick={handleSave}
              disabled={isPending || !title.trim()}
            >
              {isPending ? "Saving…" : "Save changes"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}

interface Card {
  id: string;
  front: string;
  back: string;
}

interface EditCardModalProps {
  card: Card;
  deckId: string;
}

export function EditCardModal({ card, deckId }: EditCardModalProps) {
  const [open, setOpen] = useState(false);
  const [front, setFront] = useState(card.front);
  const [back, setBack] = useState(card.back);
  const [isPending, startTransition] = useTransition();

  function handleOpen() {
    setFront(card.front);
    setBack(card.back);
    setOpen(true);
  }

  function handleSave() {
    startTransition(async () => {
      await updateCardAction(card.id, deckId, { front, back });
      setOpen(false);
      toast.success("Card updated");
    });
  }

  return (
    <>
      <Button
        variant="ghost"
        size="sm"
        className="h-7 px-2 text-zinc-400 hover:text-white"
        onClick={handleOpen}
      >
        <Pencil className="h-3.5 w-3.5" />
        <span className="sr-only">Edit card</span>
      </Button>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit card</DialogTitle>
          </DialogHeader>

          <div className="space-y-4">
            <div className="space-y-1.5">
              <label className="text-xs font-medium uppercase tracking-wide text-zinc-400">
                Front
              </label>
              <textarea
                value={front}
                onChange={(e) => setFront(e.target.value)}
                rows={3}
                className="w-full resize-none rounded-md border border-zinc-700 bg-zinc-800 px-3 py-2 text-sm text-white placeholder-zinc-500 focus:border-zinc-500 focus:outline-none focus:ring-1 focus:ring-zinc-500"
                placeholder="Question or term"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-medium uppercase tracking-wide text-zinc-400">
                Back
              </label>
              <textarea
                value={back}
                onChange={(e) => setBack(e.target.value)}
                rows={3}
                className="w-full resize-none rounded-md border border-zinc-700 bg-zinc-800 px-3 py-2 text-sm text-white placeholder-zinc-500 focus:border-zinc-500 focus:outline-none focus:ring-1 focus:ring-zinc-500"
                placeholder="Answer or definition"
              />
            </div>
          </div>

          <DialogFooter>
            <Button variant="ghost" onClick={() => setOpen(false)} disabled={isPending}>
              Cancel
            </Button>
            <Button
              onClick={handleSave}
              disabled={isPending || !front.trim() || !back.trim()}
            >
              {isPending ? "Saving…" : "Save changes"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}

interface DeleteCardButtonProps {
  card: Card;
  deckId: string;
}

export function DeleteCardButton({ card, deckId }: DeleteCardButtonProps) {
  const [open, setOpen] = useState(false);
  const [isPending, startTransition] = useTransition();

  function handleConfirm() {
    startTransition(async () => {
      await deleteCardAction(card.id, deckId);
      setOpen(false);
      toast.success("Card deleted");
    });
  }

  return (
    <>
      <Button
        variant="ghost"
        size="sm"
        className="h-7 px-2 text-zinc-500 hover:text-red-400"
        onClick={() => setOpen(true)}
      >
        <Trash2 className="h-3.5 w-3.5" />
        <span className="sr-only">Delete card</span>
      </Button>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete card?</DialogTitle>
            <DialogDescription>
              This will permanently delete this card. This action cannot be undone.
            </DialogDescription>
          </DialogHeader>

          <div className="rounded-md border border-zinc-700 bg-zinc-800/50 p-3 text-sm text-zinc-300 space-y-1">
            <p><span className="text-zinc-500 uppercase text-xs tracking-wide font-medium">Front</span></p>
            <p>{card.front}</p>
          </div>

          <DialogFooter>
            <Button variant="ghost" onClick={() => setOpen(false)} disabled={isPending}>
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={handleConfirm}
              disabled={isPending}
            >
              {isPending ? "Deleting…" : "Delete card"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}

interface DeleteDeckButtonProps {
  deck: Deck;
}

export function DeleteDeckButton({ deck }: DeleteDeckButtonProps) {
  const [open, setOpen] = useState(false);
  const [isPending, startTransition] = useTransition();

  function handleConfirm() {
    startTransition(async () => {
      await deleteDeckAction(deck.id);
    });
  }

  return (
    <>
      <Button
        variant="ghost"
        size="sm"
        className="h-8 px-2.5 text-zinc-500 hover:text-red-400"
        onClick={() => setOpen(true)}
      >
        <Trash2 className="h-4 w-4" />
        <span className="sr-only">Delete deck</span>
      </Button>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete deck?</DialogTitle>
            <DialogDescription>
              This will permanently delete <strong className="text-white">{deck.title}</strong> and all of its cards. This action cannot be undone.
            </DialogDescription>
          </DialogHeader>

          <DialogFooter>
            <Button variant="ghost" onClick={() => setOpen(false)} disabled={isPending}>
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={handleConfirm}
              disabled={isPending}
            >
              {isPending ? "Deleting…" : "Delete deck"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}

interface GenerateCardsButtonProps {
  deckId: string;
  hasDescription: boolean;
}

export function GenerateCardsButton({ deckId, hasDescription }: GenerateCardsButtonProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  function handleGenerate() {
    if (!hasDescription) {
      toast.info("Add a description to this deck before generating cards with AI.");
      return;
    }
    startTransition(async () => {
      try {
        await generateCardsAction(deckId);
        toast.success("20 cards generated successfully!");
      } catch {
        toast.error("Failed to generate cards. Please try again.");
      }
    });
  }

  const generateButton = (
    <Button
      variant="outline"
      onClick={handleGenerate}
      disabled={isPending}
      className={`gap-2 ${!hasDescription ? "text-zinc-500 hover:text-zinc-500" : "text-white"}`}
    >
      <Sparkles className="h-4 w-4" />
      {isPending ? "Generating…" : "Generate Cards with AI"}
    </Button>
  );

  const upgradeButton = (
    <Tooltip>
      <TooltipTrigger
        render={
          <Button
            variant="outline"
            className="gap-2"
            onClick={() => router.push("/pricing")}
          >
            <Sparkles className="h-4 w-4" />
            Generate Cards with AI
          </Button>
        }
      />
      <TooltipContent>
        <p>AI card generation is a Pro feature. Click to upgrade.</p>
      </TooltipContent>
    </Tooltip>
  );

  return (
    <Show when={{ feature: "ai_flashcard_generation" }} fallback={upgradeButton}>
      {hasDescription ? (
        generateButton
      ) : (
        <Tooltip>
          <TooltipTrigger render={generateButton} />
          <TooltipContent>
            <p>Add a deck description to generate cards with AI.</p>
          </TooltipContent>
        </Tooltip>
      )}
    </Show>
  );
}

interface AddCardModalProps {
  deckId: string;
}

export function AddCardModal({ deckId }: AddCardModalProps) {
  const [open, setOpen] = useState(false);
  const [front, setFront] = useState("");
  const [back, setBack] = useState("");
  const [isPending, startTransition] = useTransition();

  function handleSave() {
    startTransition(async () => {
      await createCardAction(deckId, { front, back });
      setFront("");
      setBack("");
      setOpen(false);
      toast.success("Card added");
    });
  }

  return (
    <>
      <Button onClick={() => setOpen(true)} className="hover:bg-white">
        <Plus className="mr-1 h-4 w-4" />
        Add Card
      </Button>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add card</DialogTitle>
          </DialogHeader>

          <div className="space-y-4">
            <div className="space-y-1.5">
              <label className="text-xs font-medium uppercase tracking-wide text-zinc-400">
                Front
              </label>
              <textarea
                value={front}
                onChange={(e) => setFront(e.target.value)}
                rows={3}
                className="w-full resize-none rounded-md border border-zinc-700 bg-zinc-800 px-3 py-2 text-sm text-white placeholder-zinc-500 focus:border-zinc-500 focus:outline-none focus:ring-1 focus:ring-zinc-500"
                placeholder="Question or term"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-medium uppercase tracking-wide text-zinc-400">
                Back
              </label>
              <textarea
                value={back}
                onChange={(e) => setBack(e.target.value)}
                rows={3}
                className="w-full resize-none rounded-md border border-zinc-700 bg-zinc-800 px-3 py-2 text-sm text-white placeholder-zinc-500 focus:border-zinc-500 focus:outline-none focus:ring-1 focus:ring-zinc-500"
                placeholder="Answer or definition"
              />
            </div>
          </div>

          <DialogFooter>
            <Button variant="ghost" onClick={() => setOpen(false)} disabled={isPending}>
              Cancel
            </Button>
            <Button
              onClick={handleSave}
              disabled={isPending || !front.trim() || !back.trim()}
            >
              {isPending ? "Adding…" : "Add card"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
