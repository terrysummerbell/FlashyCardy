"use client";

import { useState, useCallback, useEffect, useRef } from "react";
import { ChevronLeft, ChevronRight, RotateCcw, Shuffle, CheckCircle2, X, Check } from "lucide-react";
import { Button } from "@/components/ui/button";

interface Card {
  id: string;
  front: string;
  back: string;
}

interface StudyClientProps {
  deckId: string;
  deckTitle: string;
  initialCards: Card[];
}

function shuffleArray<T>(arr: T[]): T[] {
  const copy = [...arr];
  for (let i = copy.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [copy[i], copy[j]] = [copy[j], copy[i]];
  }
  return copy;
}

// Phase of the two-step advance animation
type AdvancePhase = "idle" | "folding" | "unfolding";

export function StudyClient({ deckTitle, initialCards }: StudyClientProps) {
  const [cards, setCards] = useState<Card[]>(initialCards);
  const [currentIndex, setCurrentIndex] = useState(0);
  // Numeric rotation in degrees: 0 = front, 180 = back
  const [rotation, setRotation] = useState(0);
  // Duration for the CSS transition (set to 0 to make a jump invisible)
  const [transitionMs, setTransitionMs] = useState(500);
  // Separate index for what content is rendered inside the card; lags by one step
  // during the advance animation so the swap happens while the card is edge-on
  const [displayIndex, setDisplayIndex] = useState(0);
  const [completed, setCompleted] = useState(false);
  const [correctCount, setCorrectCount] = useState(0);
  const [advancePhase, setAdvancePhase] = useState<AdvancePhase>("idle");

  // Queued next-index used during the advance animation
  const pendingIndexRef = useRef<number | null>(null);
  const pendingCompleteRef = useRef(false);
  const innerCardRef = useRef<HTMLDivElement>(null);

  const total = cards.length;
  const currentCard = cards[displayIndex];
  const isFlipped = rotation === 180;
  const progress = ((currentIndex + (completed ? 1 : 0)) / total) * 100;

  // ── transitionend handler ───────────────────────────────────────────────────
  useEffect(() => {
    const el = innerCardRef.current;
    if (!el) return;

    function handleTransitionEnd(e: TransitionEvent) {
      // Ignore transitions on child elements
      if (e.target !== el) return;

      if (advancePhase === "folding") {
        // Card is now edge-on at 270°.
        // 1. Swap content (displayIndex → next card)
        // 2. Jump instantly to the mirror edge at 90° (same visual angle, opposite side)
        // 3. Re-enable transition and rotate to 0° to reveal the new front.
        if (pendingCompleteRef.current) {
          setCompleted(true);
          setAdvancePhase("idle");
          pendingCompleteRef.current = false;
          return;
        }
        const nextIdx = pendingIndexRef.current!;
        pendingIndexRef.current = null;

        setDisplayIndex(nextIdx);
        setCurrentIndex(nextIdx);

        // Disable transition and jump to 90° (invisible — same edge-on position)
        setTransitionMs(0);
        setRotation(90);

        // Re-enable transition and animate to 0° on the next paint
        requestAnimationFrame(() => {
          requestAnimationFrame(() => {
            setTransitionMs(250);
            setRotation(0);
            setAdvancePhase("unfolding");
          });
        });
      } else if (advancePhase === "unfolding") {
        // Animation complete — new card front is fully visible
        setTransitionMs(500);
        setAdvancePhase("idle");
      }
    }

    el.addEventListener("transitionend", handleTransitionEnd);
    return () => el.removeEventListener("transitionend", handleTransitionEnd);
  }, [advancePhase]);

  // ── flip (click / Space) ────────────────────────────────────────────────────
  const flip = useCallback(() => {
    if (advancePhase !== "idle") return;
    setRotation((r) => (r === 0 ? 180 : 0));
    setTransitionMs(500);
  }, [advancePhase]);

  // ── advance to next card ────────────────────────────────────────────────────
  const goNext = useCallback(
    (correct?: boolean) => {
      if (advancePhase !== "idle") return;
      if (correct) setCorrectCount((c) => c + 1);

      if (isFlipped) {
        // Two-phase forward rotation: 180 → 270 (fold away), then 90 → 0 (reveal new front)
        if (currentIndex < total - 1) {
          pendingIndexRef.current = currentIndex + 1;
          pendingCompleteRef.current = false;
        } else {
          pendingIndexRef.current = null;
          pendingCompleteRef.current = true;
        }
        setAdvancePhase("folding");
        setTransitionMs(250);
        setRotation(270);
      } else {
        // Card is already face-up — just advance instantly
        if (currentIndex < total - 1) {
          const next = currentIndex + 1;
          setCurrentIndex(next);
          setDisplayIndex(next);
        } else {
          setCompleted(true);
        }
      }
    },
    [advancePhase, isFlipped, currentIndex, total],
  );

  // ── go back ─────────────────────────────────────────────────────────────────
  const goPrev = useCallback(() => {
    if (advancePhase !== "idle") return;
    if (currentIndex > 0) {
      const prev = currentIndex - 1;
      setCurrentIndex(prev);
      setDisplayIndex(prev);
      setRotation(0);
      setTransitionMs(500);
    }
  }, [advancePhase, currentIndex]);

  // ── restart / shuffle ───────────────────────────────────────────────────────
  const resetState = useCallback(() => {
    pendingIndexRef.current = null;
    pendingCompleteRef.current = false;
    setAdvancePhase("idle");
    setCurrentIndex(0);
    setDisplayIndex(0);
    setRotation(0);
    setTransitionMs(500);
    setCompleted(false);
    setCorrectCount(0);
  }, []);

  const restart = useCallback(() => {
    resetState();
  }, [resetState]);

  const shuffle = useCallback(() => {
    setCards(shuffleArray(initialCards));
    resetState();
  }, [initialCards, resetState]);

  // ── keyboard shortcuts ───────────────────────────────────────────────────────
  useEffect(() => {
    function handleKey(e: KeyboardEvent) {
      const tag = (e.target as HTMLElement).tagName;
      if (tag === "INPUT" || tag === "TEXTAREA") return;
      if (e.key === " ") {
        e.preventDefault();
        flip();
      }
      // When the answer is showing: ← = Incorrect, → = Correct
      // When the question is showing: ← = Previous, → = Next
      if (e.key === "ArrowRight") {
        e.preventDefault();
        if (isFlipped && advancePhase === "idle") {
          goNext(true);
        } else {
          goNext(false);
        }
      }
      if (e.key === "ArrowLeft") {
        e.preventDefault();
        if (isFlipped && advancePhase === "idle") {
          goNext(false);
        } else {
          goPrev();
        }
      }
    }
    window.addEventListener("keydown", handleKey);
    return () => window.removeEventListener("keydown", handleKey);
  }, [flip, goNext, goPrev, isFlipped, advancePhase]);

  // ── completion screen ────────────────────────────────────────────────────────
  if (completed) {
    const scorePercent = total > 0 ? Math.round((correctCount / total) * 100) : 0;
    return (
      <div className="flex flex-col items-center gap-8 py-16 text-center">
        <div className="flex flex-col items-center gap-3">
          <CheckCircle2 className="h-16 w-16 text-emerald-400" />
          <h2 className="text-3xl font-semibold tracking-tight">All done!</h2>
          <p className="text-zinc-400">
            You went through all {total} card{total !== 1 ? "s" : ""} in{" "}
            <span className="font-medium text-white">{deckTitle}</span>.
          </p>
        </div>

        <div className="flex flex-col items-center gap-1">
          <p className="text-5xl font-bold tabular-nums text-white">
            {correctCount}
            <span className="text-zinc-500">/{total}</span>
          </p>
          <p className="text-sm text-zinc-400">correct — {scorePercent}%</p>
        </div>

        <div className="flex gap-3">
          <Button variant="outline" onClick={restart} className="gap-2">
            <RotateCcw className="h-4 w-4" />
            Study again
          </Button>
          <Button onClick={shuffle} className="gap-2">
            <Shuffle className="h-4 w-4" />
            Shuffle &amp; restart
          </Button>
        </div>
      </div>
    );
  }

  // ── main study UI ────────────────────────────────────────────────────────────
  return (
    <div className="flex flex-col gap-8">
      {/* Header row */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">{deckTitle}</h1>
          <p className="mt-0.5 text-sm text-zinc-400">
            Card {currentIndex + 1} of {total}
          </p>
        </div>

        <div className="flex gap-2">
          <Button
            variant="ghost"
            size="sm"
            onClick={shuffle}
            className="gap-1.5 text-zinc-400 hover:text-white"
            title="Shuffle cards"
          >
            <Shuffle className="h-4 w-4" />
            Shuffle
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={restart}
            className="gap-1.5 text-zinc-400 hover:text-white"
            title="Restart from beginning"
          >
            <RotateCcw className="h-4 w-4" />
            Restart
          </Button>
        </div>
      </div>

      {/* Progress bar */}
      <div className="h-1.5 w-full rounded-full bg-zinc-800">
        <div
          className="h-full rounded-full bg-indigo-500 transition-all duration-300"
          style={{ width: `${progress}%` }}
        />
      </div>

      {/* Score tally */}
      <div className="flex items-center justify-center gap-2">
        <span className="text-2xl font-bold tabular-nums text-white">
          {correctCount}
          <span className="text-zinc-500">/{total}</span>
        </span>
        <span className="text-sm text-zinc-400">correct</span>
      </div>

      {/* Flip card */}
      <div
        className="mx-auto w-full max-w-2xl cursor-pointer select-none"
        style={{ perspective: "1200px" }}
        onClick={flip}
        role="button"
        tabIndex={0}
        aria-label={isFlipped ? "Card back — click to see front" : "Card front — click to reveal answer"}
        onKeyDown={(e) => {
          if (e.key === "Enter") flip();
        }}
      >
        <div
          ref={innerCardRef}
          className="relative h-72 w-full"
          style={{
            transformStyle: "preserve-3d",
            transform: `rotateY(${rotation}deg)`,
            transition: `transform ${transitionMs}ms ease`,
          }}
        >
          {/* Front face */}
          <div
            className="absolute inset-0 flex flex-col items-center justify-center rounded-2xl border border-zinc-700 bg-zinc-900 p-8 text-center"
            style={{ backfaceVisibility: "hidden" }}
          >
            <span className="mb-4 text-xs font-medium uppercase tracking-widest text-zinc-500">
              Front
            </span>
            <p className="text-xl font-medium leading-relaxed text-white">
              {currentCard.front}
            </p>
            <span className="mt-6 text-xs text-zinc-600">
              Click or press{" "}
              <kbd className="rounded border border-zinc-700 bg-zinc-800 px-1.5 py-0.5 font-mono text-zinc-400">
                Space
              </kbd>{" "}
              to flip
            </span>
          </div>

          {/* Back face */}
          <div
            className="absolute inset-0 flex flex-col items-center justify-center rounded-2xl border border-indigo-700/50 bg-zinc-900 p-8 text-center"
            style={{
              backfaceVisibility: "hidden",
              transform: "rotateY(180deg)",
            }}
          >
            <span className="mb-4 text-xs font-medium uppercase tracking-widest text-indigo-400">
              Back
            </span>
            <p className="text-xl font-medium leading-relaxed text-white">
              {currentCard.back}
            </p>
            <span className="mt-6 text-xs text-zinc-600">
              Click or press{" "}
              <kbd className="rounded border border-zinc-700 bg-zinc-800 px-1.5 py-0.5 font-mono text-zinc-400">
                Space
              </kbd>{" "}
              to flip back
            </span>
          </div>
        </div>
      </div>

      {/* Correct / Incorrect buttons — visible only after card is flipped */}
      {isFlipped && advancePhase === "idle" && (
        <div className="flex items-center justify-center gap-4">
          <Button
            size="lg"
            onClick={() => goNext(false)}
            className="gap-2 border-red-700 bg-red-600 text-white hover:bg-red-700 focus-visible:ring-red-500"
            aria-label="Mark incorrect (press left arrow)"
          >
            <kbd className="inline-flex items-center rounded border border-red-400/50 bg-red-700/60 px-1.5 py-0.5 font-mono text-xs text-red-200">
              ←
            </kbd>
            <X className="h-5 w-5" />
            Incorrect
          </Button>
          <Button
            size="lg"
            onClick={() => goNext(true)}
            className="gap-2 border-emerald-700 bg-emerald-600 text-white hover:bg-emerald-700 focus-visible:ring-emerald-500"
            aria-label="Mark correct (press right arrow)"
          >
            Correct
            <Check className="h-5 w-5" />
            <kbd className="inline-flex items-center rounded border border-emerald-400/50 bg-emerald-700/60 px-1.5 py-0.5 font-mono text-xs text-emerald-200">
              →
            </kbd>
          </Button>
        </div>
      )}

      {/* Navigation */}
      <div className="flex items-center justify-center gap-4">
        <Button
          variant="outline"
          size="lg"
          onClick={goPrev}
          disabled={currentIndex === 0 || advancePhase !== "idle"}
          className="gap-2"
          aria-label="Previous card"
        >
          <ChevronLeft className="h-5 w-5" />
          Previous
        </Button>

        <span className="min-w-[4rem] text-center text-sm tabular-nums text-zinc-500">
          {currentIndex + 1} / {total}
        </span>

        <Button
          size="lg"
          onClick={() => goNext(false)}
          disabled={advancePhase !== "idle"}
          className="gap-2"
          aria-label={currentIndex === total - 1 ? "Finish" : "Next card"}
        >
          {currentIndex === total - 1 ? "Finish" : "Next"}
          <ChevronRight className="h-5 w-5" />
        </Button>
      </div>

      {/* Keyboard hint */}
      <p className="text-center text-xs text-zinc-600">
        {isFlipped && advancePhase === "idle" ? (
          <>
            <kbd className="rounded border border-zinc-800 bg-zinc-900 px-1.5 py-0.5 font-mono">←</kbd>{" "}
            Incorrect &nbsp;·&nbsp;{" "}
            <kbd className="rounded border border-zinc-800 bg-zinc-900 px-1.5 py-0.5 font-mono">→</kbd>{" "}
            Correct &nbsp;·&nbsp;{" "}
            <kbd className="rounded border border-zinc-800 bg-zinc-900 px-1.5 py-0.5 font-mono">Space</kbd>{" "}
            flip back
          </>
        ) : (
          <>
            <kbd className="rounded border border-zinc-800 bg-zinc-900 px-1.5 py-0.5 font-mono">←</kbd>{" "}
            <kbd className="rounded border border-zinc-800 bg-zinc-900 px-1.5 py-0.5 font-mono">→</kbd>{" "}
            navigate &nbsp;·&nbsp;{" "}
            <kbd className="rounded border border-zinc-800 bg-zinc-900 px-1.5 py-0.5 font-mono">Space</kbd>{" "}
            flip
          </>
        )}
      </p>
    </div>
  );
}
