"use client";

import { useState } from "react";
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

/**
 * Modal untuk log makanan (Tahap 1)
 */
export default function LogModal({ onClose }: { onClose: () => void }) {
    const [query, setQuery] = useState("");
    const [results, setResults] = useState<any[]>([]);
    const [selectedFood, setSelectedFood] = useState<any | null>(null);
    const [quantity, setQuantity] = useState(1);
    const [loading, setLoading] = useState(false);
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState("");

    // 🔍 Pencarian ke /api/food-search
    const handleSearch = async () => {
        setLoading(true);
        setError("");
        try {
            const res = await fetch(
                `/api/food-search?q=${encodeURIComponent(query)}`
            );
            if (!res.ok) throw new Error("Gagal mengambil data dari USDA API");
            const data = await res.json();
            // data langsung array hasil dari route
            setResults(data);
        } catch (err: any) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    // 💾 Simpan ke Supabase
    const handleSave = async () => {
        if (!selectedFood) return;
        setSaving(true);
        setError("");

        const { data: auth } = await supabase.auth.getUser();
        const user = auth.user;
        if (!user) {
            setError("User belum login");
            setSaving(false);
            return;
        }

        try {
            const { error: insertError } = await supabase.rpc("log_food", {
                p_user_id: user.id,
                p_food_name: selectedFood.name,
                p_calories_kcal: Math.round(selectedFood.calories),
                p_serving_qty: quantity,
                p_serving_unit: selectedFood.unit || "portion",
            });

            if (insertError) throw insertError;

            alert("✅ Log makanan berhasil disimpan!");
            onClose();
        } catch (err: any) {
            console.error(err);
            setError(err.message);
        } finally {
            setSaving(false);
        }
    };

    return (
        <Dialog open onOpenChange={onClose}>
            <DialogContent className="max-w-lg">
                <DialogHeader>
                    <DialogTitle>🍽️ Log Entri Makanan</DialogTitle>
                </DialogHeader>

                {/* Search bar */}
                <div className="flex gap-2 mt-2">
                    <Input
                        value={query}
                        onChange={(e) => setQuery(e.target.value)}
                        placeholder="Cari makanan (misal: apple)"
                    />
                    <Button onClick={handleSearch} disabled={loading}>
                        {loading ? "Mencari..." : "Cari"}
                    </Button>
                </div>

                {error && <p className="text-red-500 text-sm mt-2">{error}</p>}

                {/* Hasil pencarian */}
                {!selectedFood && (
                    <ScrollArea className="max-h-64 mt-4 border rounded-md">
                        {results.length > 0 ? (
                            results.map((food, idx) => (
                                <div
                                    key={idx}
                                    className="p-3 border-b hover:bg-gray-100 cursor-pointer"
                                    onClick={() => setSelectedFood(food)}
                                >
                                    <p className="font-medium">{food.name}</p>
                                    <p className="text-sm text-gray-500">
                                        {food.calories} kcal
                                    </p>
                                </div>
                            ))
                        ) : (
                            <p className="text-gray-500 text-sm p-3">
                                {loading ? "Mencari..." : "Belum ada hasil"}
                            </p>
                        )}
                    </ScrollArea>
                )}

                {/* Form setelah makanan dipilih */}
                {selectedFood && (
                    <div className="mt-4 space-y-3">
                        <h3 className="font-semibold">
                            {selectedFood.description}
                        </h3>
                        <Input
                            type="number"
                            step="0.1"
                            min="0.1"
                            value={quantity}
                            onChange={(e) =>
                                setQuantity(parseFloat(e.target.value))
                            }
                            placeholder="Jumlah porsi"
                        />
                        <div className="flex justify-end gap-2">
                            <Button
                                variant="outline"
                                onClick={() => setSelectedFood(null)}
                            >
                                Kembali
                            </Button>
                            <Button onClick={handleSave} disabled={saving}>
                                {saving ? "Menyimpan..." : "Simpan"}
                            </Button>
                        </div>
                    </div>
                )}
            </DialogContent>
        </Dialog>
    );
}
