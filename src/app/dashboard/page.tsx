import { currentUser } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";

export default async function DashboardPage() {
  const user = await currentUser();

  if (!user) {
    redirect("/sign-in");
  }

  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-4 p-8">
      <h1 className="text-3xl font-semibold tracking-tight">
        Welcome back, {user.firstName ?? user.emailAddresses[0].emailAddress}!
      </h1>
      <p className="text-muted-foreground">
        Your flashcard dashboard is ready.
      </p>
    </div>
  );
}
