import { SignInButton, SignUpButton } from "@clerk/nextjs";
import { Button } from "@/components/ui/button";

export default function Home() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-8 bg-zinc-950 px-4 text-center">
      <div className="flex flex-col items-center gap-3">
        <h1 className="text-5xl font-bold tracking-tight text-white">
          FlashyCardy
        </h1>
        <p className="text-lg text-zinc-400">
          Your personal flashcard platform
        </p>
      </div>
      <div className="flex gap-4">
        <SignInButton mode="modal">
          <Button variant="secondary">Sign in</Button>
        </SignInButton>
        <SignUpButton mode="modal">
          <Button variant="outline">Sign up</Button>
        </SignUpButton>
      </div>
    </div>
  );
}
