"use client";

import { useState, useCallback } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { supabase } from "@/lib/supabaseClient";
import { Search, Utensils } from "lucide-react";
import { Logo } from "@/components/ui/logo";
import { VisuallyHidden } from "@radix-ui/react-visually-hidden";
import SuccessCheck from "@/components/ui/SuccessCheck"; // ✅ animasi checklist kecil

export default function LogFoodModal({
  onClose,
  onRefresh,
}: {
  onClose: () => void;
  onRefresh?: () => void;
}) {
  const [query, setQuery] = useState("");
  type FoodResult = {
    name: string;
    calories: number;
    unit?: string;
  };

  const [results, setResults] = useState<FoodResult[]>([]);
  const [selectedFood, setSelectedFood] = useState<FoodResult | null>(null);
  const [quantity, setQuantity] = useState("1");
  const [loading, setLoading] = useState(false);
  const [translating, setTranslating] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [saved, setSaved] = useState(false); // ✅ untuk tampilkan animasi sukses

  const handleSearch = useCallback(async (searchQuery: string) => {
    if (!searchQuery.trim()) {
      return;
    }

    setLoading(true);
    setError("");
    try {
      console.log(
        `[LogFoodModal] Searching for: "${searchQuery}" (translated)`
      );
      const res = await fetch(
        `/api/food-search?q=${encodeURIComponent(searchQuery)}`
      );
      if (!res.ok) throw new Error("Gagal mengambil data dari USDA API");

      const data = await res.json();
      console.log(`[LogFoodModal] Search results:`, data.length, "items");
      setResults(data as FoodResult[]);
    } catch (err: unknown) {
      const errMsg =
        err instanceof Error ? err.message : "Gagal mencari makanan.";
      console.error(`[LogFoodModal] Search error:`, errMsg);
      setError(errMsg);
    } finally {
      setLoading(false);
    }
  }, []);

  const translateAndSearch = useCallback(async () => {
    if (!query.trim()) return setError("Masukkan nama makanan dulu");

    setTranslating(true);
    setError("");
    setResults([]);

    try {
      console.log(`[LogFoodModal] Starting translate for: "${query}"`);
      const translateRes = await fetch("/api/translate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text: query }),
      });

      if (!translateRes.ok) {
        throw new Error("Gagal menerjemahkan nama makanan.");
      }

      const { translatedText } = await translateRes.json();
      console.log(
        `[LogFoodModal] Translated: "${query}" -> "${translatedText}"`
      );
      await handleSearch(translatedText);
    } catch (err) {
      const message = err instanceof Error ? err.message : "Terjadi kesalahan.";
      console.error(`[LogFoodModal] Error:`, err);
      setError(message);
    } finally {
      setTranslating(false);
    }
  }, [query, handleSearch]);

  const handleSave = async () => {
    if (!selectedFood) return;
    setSaving(true);
    setError("");

    const { data: auth } = await supabase.auth.getUser();
    const user = auth?.user;
    if (!user) {
      setError("User belum login");
      setSaving(false);
      return;
    }

    try {
      const qtyNum = Number(quantity);
      if (Number.isNaN(qtyNum) || qtyNum <= 0) {
        setError("Jumlah porsi tidak valid");
        setSaving(false);
        return;
      }

      const { data: rpcData, error: insertError } = await supabase.rpc(
        "log_food",
        {
          p_user_id: user.id,
          p_food_name: selectedFood.name,
          p_calories_kcal: Math.round(Number(selectedFood.calories)),
          p_serving_qty: qtyNum,
          p_serving_unit: selectedFood.unit || "portion",
        }
      );

      if (insertError) throw insertError;
      if (rpcData) console.log("✅ log_food result:", rpcData);

      try {
        const { data: stats } = await supabase
          .from("user_stats")
          .select("total_coins")
          .eq("user_id", user.id)
          .single();

        const total = stats?.total_coins;
        if (typeof total === "number") {
          window.dispatchEvent(
            new CustomEvent("coins-updated", {
              detail: { total_coins: total },
            })
          );
        }
      } catch (e) {
        console.error("Failed to fetch user_stats after log_food:", e);
      }

      // ✅ tampilkan animasi sukses kecil
      setSaved(true);
      setTimeout(() => {
        if (onRefresh) onRefresh();
        onClose();
      }, 1500);
    } catch (err: unknown) {
      console.error(err);
      const message =
        err instanceof Error
          ? err.message
          : typeof err === "object"
          ? JSON.stringify(err)
          : String(err);
      setError(message);
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open onOpenChange={onClose}>
      <DialogContent className="max-w-md rounded-2xl p-0 overflow-visible">
        <DialogHeader className="flex items-center justify-start px-4 pt-4">
          <Logo size={35} className="mr-auto" />
          <VisuallyHidden>
            <DialogTitle>Log Makanan</DialogTitle>
          </VisuallyHidden>
        </DialogHeader>

        <div className="p-5">
          <div className="flex justify-center mb-3 min-h-[20px]">
            {saved && <SuccessCheck />}
          </div>

          <div className="flex items-center gap-2 mb-3">
            <Utensils className="w-5 h-5 text-gray-700" />
            <h3 className="text-sm font-medium text-gray-800">
              Catatan Makanan
            </h3>
          </div>

          {!selectedFood && (
            <>
              <div className="flex gap-2">
                <Input
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  placeholder="Cari makanan (misal: apel)"
                  className="flex-1 text-sm"
                />
                <Button
                  onClick={translateAndSearch}
                  disabled={loading || translating}
                  className="bg-black hover:bg-gray-400 text-white px-3"
                >
                  <Search className="w-4 h-4" />
                </Button>
              </div>

              {error && <p className="text-red-500 text-sm mt-2">{error}</p>}

              <ScrollArea className="max-h-80 mt-4 border rounded-md overflow-auto">
                {loading || translating ? (
                  <p className="text-center text-gray-500 p-3 text-sm">
                    {translating ? "Menerjemahkan..." : "Mencari..."}
                  </p>
                ) : results.length > 0 ? (
                  results.map((food, idx) => (
                    <div
                      key={idx}
                      className="p-3 border-b hover:bg-gray-100 cursor-pointer"
                      onClick={() => setSelectedFood(food)}
                    >
                      <p className="font-medium text-gray-800 text-sm">
                        {food.name}
                      </p>
                      <p className="text-xs text-gray-500">
                        {food.calories} kcal
                      </p>
                    </div>
                  ))
                ) : (
                  <p className="text-gray-500 text-sm p-3">
                    Belum ada hasil pencarian
                  </p>
                )}
              </ScrollArea>
            </>
          )}

          {selectedFood && (
            <div className="mt-4 space-y-4">
              <div>
                <h3 className="font-semibold text-gray-800 text-sm">
                  {selectedFood.name}
                </h3>
                <p className="text-xs text-gray-500">
                  {selectedFood.calories} kcal / {selectedFood.unit || "porsi"}
                </p>
              </div>

              <Input
                type="number"
                step="0.1"
                min="0.1"
                value={quantity}
                onChange={(e) => setQuantity(e.target.value)}
                placeholder="Jumlah porsi"
                className="text-sm"
              />

              <div className="flex justify-end gap-2 pt-2">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setSelectedFood(null)}
                  className="bg-black text-white hover:bg-gray-800"
                >
                  Kembali
                </Button>
                <Button
                  onClick={handleSave}
                  disabled={saving}
                  style={{ backgroundColor: "#C2E66E" }}
                  className="text-black hover:brightness-95"
                >
                  {saving ? "Menyimpan..." : "Simpan"}
                </Button>
              </div>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
