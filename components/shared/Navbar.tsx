"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabaseClient";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { LogOut, User, Trophy, CircleDollarSign } from "lucide-react";
import { Logo } from "@/components/ui/logo";
import AchievementModal from "@/components/modals/AchievementsModal";

export default function Navbar() {
  const router = useRouter();
  const [coins, setCoins] = useState<number>(0);
  const [userId, setUserId] = useState<string | null>(null);
  const [totalAchievements, setTotalAchievements] = useState(0);
  const [unlockedBadges, setUnlockedBadges] = useState(0);
  const [isBadgeModalOpen, setIsBadgeModalOpen] = useState(false);

  const handleLogout = async () => {
    await supabase.auth.signOut();
    router.push("/auth/login");
  };

  useEffect(() => {
    const fetchData = async () => {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) return;
      setUserId(user.id);

      const { data: stats } = await supabase
        .from("user_stats")
        .select("total_coins")
        .eq("user_id", user.id)
        .single();

      const totalCoins = stats?.total_coins || 0;
      setCoins(totalCoins);

      const { count: total } = await supabase
        .from("achievements")
        .select("*", { count: "exact", head: true });

      const thresholds = [100, 500, 1000, 1500, 2500, 10000];
      const unlocked = thresholds.filter((t) => totalCoins >= t).length;
      setUnlockedBadges(unlocked);
      setTotalAchievements(total || 6);
    };

    fetchData();
  }, []);

  useEffect(() => {
    if (!userId) return;

    const channel = supabase
      .channel("realtime-coins")
      .on(
        "postgres_changes",
        {
          event: "UPDATE",
          schema: "public",
          table: "user_stats",
          filter: `user_id=eq.${userId}`,
        },
        (payload) => {
          console.log("supabase realtime payload:", payload);
          const newCoins = payload.new?.total_coins;
          if (newCoins !== undefined) {
            setCoins(newCoins);
            const unlocked = [100, 500, 1000, 1500, 2500, 10000].filter(
              (t) => newCoins >= t
            ).length;
            setUnlockedBadges(unlocked);
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [userId]);

  useEffect(() => {
    const onCoinsUpdated = (e: Event) => {
      const detail = (e as CustomEvent)?.detail;
      const newCoins = detail?.total_coins;
      if (typeof newCoins === "number") {
        setCoins(newCoins);
        const unlocked = [100, 500, 1000, 1500, 2500, 10000].filter(
          (t) => newCoins >= t
        ).length;
        setUnlockedBadges(unlocked);
      }
    };

    window.addEventListener("coins-updated", onCoinsUpdated as EventListener);
    return () => {
      window.removeEventListener(
        "coins-updated",
        onCoinsUpdated as EventListener
      );
    };
  }, []);

  return (
    <>
      <nav className="relative z-50 flex items-center justify-between px-6 py-3 border-b bg-white shadow-sm">
        <div className="flex items-center gap-1 select-none">
          <Logo size={40} />
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={() => setIsBadgeModalOpen(true)}
            className="flex items-center gap-1 rounded-full bg-[#F0FCD9] px-2 py-[2px] cursor-pointer hover:bg-[#E6F5C5] transition-all"
          >
            <Trophy className="w-3.5 h-3.5 text-[#A8D96F]" />
            <span className="text-xs font-medium">
              {unlockedBadges}/{totalAchievements}
            </span>
          </button>

          <div className="flex items-center gap-1 rounded-full bg-[#F0FCD9] px-2 py-[2px]">
            <CircleDollarSign className="w-3.5 h-3.5 text-[#BFD86E]" />
            <span className="text-xs font-bold">{coins}</span>
            <span className="text-[10px]">Coins</span>
          </div>

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button className="cursor-pointer rounded-full outline-none hover:scale-105 transition">
                <Avatar className="h-7 w-7">
                  <AvatarFallback className="bg-[#C2E66E] text-xs font-semibold text-black">
                    U
                  </AvatarFallback>
                </Avatar>
              </button>
            </DropdownMenuTrigger>

            <DropdownMenuContent
              align="end"
              className="w-44 mt-2 rounded-lg shadow-lg border border-gray-200 bg-white overflow-hidden"
            >
              <DropdownMenuItem
                onClick={() => router.push("/setup-profile")}
                className="cursor-pointer text-sm font-medium flex items-center gap-2 px-3 py-2 hover:bg-[#C6E48B] focus:bg-[#C6E48B]"
              >
                <User className="h-4 w-4" />
                Edit Profile
              </DropdownMenuItem>

              <DropdownMenuItem
                onClick={handleLogout}
                className="cursor-pointer text-sm font-medium flex items-center gap-2 px-3 py-2 hover:bg-[#C6E48B] focus:bg-[#C6E48B]"
              >
                <LogOut className="h-4 w-4" />
                Logout
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </nav>

      <AchievementModal
        isOpen={isBadgeModalOpen}
        onClose={() => setIsBadgeModalOpen(false)}
      />
    </>
  );
}
