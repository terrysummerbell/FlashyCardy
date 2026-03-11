import { SignIn } from "@clerk/nextjs";
import { dark } from "@clerk/ui/themes";

export default function SignInPage() {
  return (
    <div className="flex min-h-screen items-center justify-center">
      <SignIn appearance={{ theme: dark }} />
    </div>
  );
}
