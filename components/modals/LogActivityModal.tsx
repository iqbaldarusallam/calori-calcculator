"use client";

import { useState, useEffect } from "react";
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
import { Search, Timer, Dumbbell } from "lucide-react";
import { Logo } from "@/components/ui/logo";
import { VisuallyHidden } from "@radix-ui/react-visually-hidden";

export default function LogActivityModal({
    onClose,
    onRefresh,
}: {
    onClose: () => void;
    onRefresh?: () => void;
}) {
    type Activity = {
        id: number;
        activity_name: string;
        met_value: number;
    };

    const [activities, setActivities] = useState<Activity[]>([]);
    const [search, setSearch] = useState("");
    const [selectedActivity, setSelectedActivity] = useState<Activity | null>(
        null
    );
    const [duration, setDuration] = useState<number>(30);
    const [saving, setSaving] = useState(false);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");

    useEffect(() => {
        const fetchActivities = async () => {
            setLoading(true);
            const { data, error } = await supabase
                .from("met_activities")
                .select("*")
                .order("activity_name", { ascending: true });
            if (error) setError(error.message);
            else setActivities(data || []);
            setLoading(false);
        };
        fetchActivities();
    }, []);

    const filteredActivities = activities.filter((a) =>
        a.activity_name.toLowerCase().includes(search.toLowerCase())
    );

    const handleSave = async () => {
        if (!selectedActivity || !duration) return;
        setSaving(true);
        setError("");

        const {
            data: { user },
        } = await supabase.auth.getUser();
        if (!user) {
            setError("User belum login");
            setSaving(false);
            return;
        }

        try {
            console.log("=== Activity Log Submission ===");
            console.log("User ID:", user.id);
            console.log("Selected Activity:", selectedActivity);
            console.log("Selected Activity ID:", selectedActivity?.id);
            console.log("Duration:", duration);

            if (!selectedActivity?.id) {
                setError("Pilih aktivitas terlebih dahulu");
                setSaving(false);
                return;
            }

            // Fetch user weight untuk kalkulasi kalori
            const { data: profileData } = await supabase
                .from("profiles")
                .select("current_weight_kg")
                .eq("id", user.id)
                .single();

            let caloriesBurned = 0;
            if (profileData?.current_weight_kg) {
                // Formula: (MET * 3.5 * weight_kg * duration_minutes) / 200
                caloriesBurned = Math.round(
                    (selectedActivity.met_value *
                        3.5 *
                        profileData.current_weight_kg *
                        duration) /
                        200
                );
            } else {
                // Default weight 70kg jika tidak ada data
                caloriesBurned = Math.round(
                    (selectedActivity.met_value * 3.5 * 70 * duration) / 200
                );
            }

            console.log("Calculated calories burned:", caloriesBurned);

            const { error: insertError } = await supabase
                .from("activity_logs")
                .insert({
                    user_id: user.id,
                    met_activity_id: selectedActivity.id,
                    duration_minutes: duration,
                    calories_burned: caloriesBurned,
                });

            if (insertError) {
                // Log detailed error info
                console.error("=== Activity Log Insert Error ===");
                console.error("Error object:", insertError);
                console.error("Error keys:", Object.keys(insertError));
                console.error(
                    "Error stringified:",
                    JSON.stringify(insertError, null, 2)
                );

                // Try to extract error message from various possible structures
                let errorMsg = "Gagal menyimpan aktivitas";

                if (typeof insertError === "object" && insertError !== null) {
                    if ("message" in insertError) {
                        errorMsg = (insertError as { message: string }).message;
                    } else if ("error" in insertError) {
                        errorMsg = (insertError as { error: string }).error;
                    } else if ("details" in insertError) {
                        errorMsg = (insertError as { details: string }).details;
                    } else if ("hint" in insertError) {
                        errorMsg = (insertError as { hint: string }).hint;
                    } else if (Object.keys(insertError).length === 0) {
                        errorMsg =
                            "Unknown database error (empty error object)";
                    } else {
                        errorMsg = JSON.stringify(insertError);
                    }
                } else if (typeof insertError === "string") {
                    errorMsg = insertError;
                }

                console.error("Final error message:", errorMsg);
                throw new Error(errorMsg);
            }

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
                console.error(
                    "Failed to fetch user_stats after activity insert:",
                    e
                );
            }

            alert("✅ Aktivitas berhasil dicatat!");

            if (onRefresh) {
                onRefresh();
            }

            onClose();
        } catch (err: unknown) {
            console.error("Activity save error:", err);
            const message = err instanceof Error ? err.message : String(err);
            setError(message || "Gagal menyimpan aktivitas");
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
                        <DialogTitle>Log Aktivitas</DialogTitle>
                    </VisuallyHidden>
                </DialogHeader>

                <div className="p-5">
                    <div className="flex items-center gap-2 mb-3">
                        <Dumbbell className="w-5 h-5 text-gray-700" />
                        <h3 className="text-sm font-medium text-gray-800">
                            Catatan Aktivitas
                        </h3>
                    </div>

                    {!selectedActivity && (
                        <>
                            <div className="flex gap-2">
                                <Input
                                    placeholder="Cari Aktivitas (Misal: Running)"
                                    value={search}
                                    onChange={(e) => setSearch(e.target.value)}
                                    className="flex-1 text-sm"
                                />
                                <Button
                                    type="button"
                                    className="bg-black hover:bg-gray-400 text-white px-3"
                                >
                                    <Search className="w-4 h-4" />
                                </Button>
                            </div>

                            {error && (
                                <p className="text-red-500 text-sm mt-2">
                                    {error}
                                </p>
                            )}

                            <ScrollArea className="h-64 mt-4 border rounded-md overflow-y-auto">
                                {loading ? (
                                    <p className="text-center text-gray-500 p-3 text-sm">
                                        Memuat...
                                    </p>
                                ) : filteredActivities.length > 0 ? (
                                    filteredActivities.map((a) => (
                                        <div
                                            key={a.id}
                                            className="p-3 border-b hover:bg-gray-100 cursor-pointer"
                                            onClick={() =>
                                                setSelectedActivity(a)
                                            }
                                        >
                                            <p className="font-medium text-gray-800 text-sm">
                                                {a.activity_name}
                                            </p>
                                            <p className="text-xs text-gray-500">
                                                MET: {a.met_value}
                                            </p>
                                        </div>
                                    ))
                                ) : (
                                    <p className="text-gray-500 text-sm p-3">
                                        Belum ada hasil
                                    </p>
                                )}
                            </ScrollArea>
                        </>
                    )}

                    {selectedActivity && (
                        <div className="mt-4 space-y-4">
                            <div>
                                <h3 className="font-semibold text-gray-800 text-sm">
                                    {selectedActivity.activity_name}
                                </h3>
                                <p className="text-xs text-gray-500">
                                    MET: {selectedActivity.met_value}
                                </p>
                            </div>

                            <div className="flex items-center gap-2">
                                <Timer className="w-4 h-4 text-black" />
                                <label className="text-sm text-gray-600">
                                    Durasi (Menit)
                                </label>
                            </div>

                            <Input
                                type="number"
                                min="1"
                                value={duration}
                                onChange={(e) =>
                                    setDuration(parseInt(e.target.value))
                                }
                                placeholder="Durasi (menit)"
                                className="text-sm"
                            />

                            <div className="flex justify-end gap-2 pt-2">
                                <Button
                                    type="button"
                                    variant="outline"
                                    onClick={() => setSelectedActivity(null)}
                                    className="bg-black text-white hover:bg-gray-800"
                                >
                                    Kembali
                                </Button>
                                <Button
                                    type="button"
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
