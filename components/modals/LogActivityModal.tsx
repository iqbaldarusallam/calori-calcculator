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

/**
 * Modal untuk log aktivitas (Tahap 2)
 */
export default function LogActivityModal({ onClose }: { onClose: () => void }) {
    const [activities, setActivities] = useState<any[]>([]);
    const [search, setSearch] = useState("");
    const [selectedActivity, setSelectedActivity] = useState<any | null>(null);
    const [duration, setDuration] = useState<number>(30);
    const [saving, setSaving] = useState(false);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");

    // 📦 Ambil daftar aktivitas dari tabel met_activities
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

    // 💾 Simpan ke activity_logs
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
            const { error: insertError } = await supabase
                .from("activity_logs")
                .insert({
                    user_id: user.id,
                    met_activity_id: selectedActivity.id,
                    duration_minutes: duration,
                });

            if (insertError) throw insertError;

            alert("✅ Aktivitas berhasil dicatat!");
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
                    <DialogTitle>🏃 Log Aktivitas</DialogTitle>
                </DialogHeader>

                {/* Search bar */}
                {!selectedActivity && (
                    <>
                        <div className="flex gap-2 mt-2">
                            <Input
                                placeholder="Cari aktivitas (misal: Running)"
                                value={search}
                                onChange={(e) => setSearch(e.target.value)}
                            />
                        </div>

                        {error && (
                            <p className="text-red-500 text-sm mt-2">{error}</p>
                        )}

                        <ScrollArea className="max-h-64 mt-4 border rounded-md">
                            {loading ? (
                                <p className="text-center text-gray-500 p-3">
                                    Memuat...
                                </p>
                            ) : filteredActivities.length > 0 ? (
                                filteredActivities.map((a) => (
                                    <div
                                        key={a.id}
                                        className="p-3 border-b hover:bg-gray-100 cursor-pointer"
                                        onClick={() => setSelectedActivity(a)}
                                    >
                                        <p className="font-medium">
                                            {a.activity_name}
                                        </p>
                                        <p className="text-sm text-gray-500">
                                            MET: {a.met_value}
                                        </p>
                                    </div>
                                ))
                            ) : (
                                <p className="text-gray-500 text-sm p-3">
                                    Tidak ditemukan aktivitas
                                </p>
                            )}
                        </ScrollArea>
                    </>
                )}

                {/* Form input setelah memilih aktivitas */}
                {selectedActivity && (
                    <div className="mt-4 space-y-3">
                        <h3 className="font-semibold">
                            {selectedActivity.activity_name}
                        </h3>
                        <p className="text-sm text-gray-500">
                            MET Value: {selectedActivity.met_value}
                        </p>

                        <Input
                            type="number"
                            min="1"
                            value={duration}
                            onChange={(e) =>
                                setDuration(parseInt(e.target.value))
                            }
                            placeholder="Durasi (menit)"
                        />

                        <div className="flex justify-end gap-2">
                            <Button
                                variant="outline"
                                onClick={() => setSelectedActivity(null)}
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
