import { SignUp } from "@clerk/nextjs";
import { dark } from "@clerk/ui/themes";

export default function SignUpPage() {
  return (
    <div className="flex min-h-screen items-center justify-center">
      <SignUp appearance={{ theme: dark }} />
    </div>
  );
}
