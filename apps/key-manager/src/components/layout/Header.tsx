import { auth } from "@/auth";
import SignOut from "@/components/auth/SignOut";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { CircleUserRoundIcon } from "lucide-react";
import Link from "next/link";

const Header = async () => {
  const session = await auth();

  return (
    <header className={"px-6 my-4 flex justify-between items-center"}>
      <Link href={"/"} className={"text-3xl font-bold"}>
        Anteater API
      </Link>
      {session?.user && (
        <DropdownMenu>
          <div className={"flex items-center space-x-4"}>
            {session.user.isAdmin && (
              <p className={"text-destructive text-xl select-none"}>ADMIN</p>
            )}
            <DropdownMenuTrigger asChild>
              <Avatar>
                <AvatarImage src={session.user.image ?? ""} alt={"avatar"} />
                <AvatarFallback>
                  <CircleUserRoundIcon className="size-4/5" />
                </AvatarFallback>
              </Avatar>
            </DropdownMenuTrigger>
          </div>
          <DropdownMenuContent align={"end"}>
            <SignOut />
          </DropdownMenuContent>
        </DropdownMenu>
      )}
    </header>
  );
};

export default Header;
