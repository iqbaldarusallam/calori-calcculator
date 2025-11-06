"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { supabase } from "@/lib/supabaseClient";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { LogOut, User } from "lucide-react";

export default function Navbar() {
    const router = useRouter();
    const [initials, setInitials] = useState<string>("U");

    useEffect(() => {
        (async () => {
            const { data: auth } = await supabase.auth.getUser();
            const user = auth.user;
            if (!user) return;

            // Ambil inisial dari nama lengkap atau email
            const fullName =
                (user.user_metadata?.full_name as string | undefined) ?? "";
            const init =
                fullName
                    ?.split(" ")
                    .map((p) => p[0])
                    .join("")
                    .slice(0, 2)
                    .toUpperCase() || (user.email?.[0] ?? "U").toUpperCase();
            setInitials(init);
        })();
    }, []);

    const handleLogout = async () => {
        await supabase.auth.signOut();
        router.push("/auth/login");
    };

    return (
        <nav className="flex items-center justify-between px-6 py-4 border-b bg-white">
            {/* Logo */}
            <Link href="/dashboard" className="font-bold text-xl text-primary">
                CalPal
            </Link>

            {/* Avatar + dropdown menu */}
            <DropdownMenu>
                <DropdownMenuTrigger asChild>
                    <button className="rounded-full outline-none ring-0">
                        <Avatar className="h-9 w-9">
                            <AvatarFallback className="bg-primary/10 text-primary text-sm">
                                {initials}
                            </AvatarFallback>
                        </Avatar>
                    </button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-48">
                    <DropdownMenuLabel>Account</DropdownMenuLabel>
                    <DropdownMenuSeparator />

                    {/* Arahkan ke setup profile */}
                    <DropdownMenuItem
                        onClick={() => router.push("/setup-profile")}
                        className="cursor-pointer"
                    >
                        <User className="mr-2 h-4 w-4" />
                        <span>Profile</span>
                    </DropdownMenuItem>

                    <DropdownMenuItem
                        onClick={handleLogout}
                        className="cursor-pointer text-red-600"
                    >
                        <LogOut className="mr-2 h-4 w-4" />
                        <span>Logout</span>
                    </DropdownMenuItem>
                </DropdownMenuContent>
            </DropdownMenu>
        </nav>
    );
}
