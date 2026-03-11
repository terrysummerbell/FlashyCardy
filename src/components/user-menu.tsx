"use client";

import { useClerk } from "@clerk/nextjs";
import { useRouter } from "next/navigation";
import { LogOut } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

interface UserMenuProps {
  imageUrl: string;
  fullName: string | null;
  email: string;
}

export function UserMenu({ imageUrl, fullName, email }: UserMenuProps) {
  const { signOut } = useClerk();
  const router = useRouter();

  return (
    <DropdownMenu>
      <DropdownMenuTrigger className="rounded-full ring-2 ring-transparent transition hover:ring-zinc-600 focus:outline-none focus:ring-zinc-500">
        <Avatar>
          <AvatarImage src={imageUrl} alt={fullName ?? "User avatar"} />
          <AvatarFallback>{fullName?.[0] ?? email[0]}</AvatarFallback>
        </Avatar>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-56">
        <DropdownMenuGroup>
          <DropdownMenuLabel>
            {fullName && <p className="font-medium">{fullName}</p>}
            <p className="truncate text-xs font-normal text-muted-foreground">
              {email}
            </p>
          </DropdownMenuLabel>
        </DropdownMenuGroup>
        <DropdownMenuSeparator />
        <DropdownMenuItem
          onClick={() => signOut(() => router.push("/"))}
          className="cursor-pointer"
        >
          <LogOut className="mr-2 h-4 w-4" />
          Log out
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
