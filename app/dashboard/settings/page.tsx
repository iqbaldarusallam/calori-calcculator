"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabaseClient";
import {
    Card,
    CardHeader,
    CardTitle,
    CardContent,
    CardFooter,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";

export default function SettingsPage() {
    const [profile, setProfile] = useState({
        full_name: "",
        current_weight_kg: "",
        target_calories: "",
    });
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchProfile();
    }, []);

    const fetchProfile = async () => {
        const {
            data: { user },
        } = await supabase.auth.getUser();
        if (!user) return;

        const { data, error } = await supabase
            .from("profiles")
            .select("full_name, current_weight_kg, target_calories")
            .eq("id", user.id)
            .single();

        if (!error && data) setProfile(data);
        setLoading(false);
    };

    const updateProfile = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);

        const {
            data: { user },
        } = await supabase.auth.getUser();
        if (!user) return;

        const { error } = await supabase
            .from("profiles")
            .update({
                full_name: profile.full_name,
                current_weight_kg: parseFloat(profile.current_weight_kg),
                target_calories: parseInt(profile.target_calories),
                updated_at: new Date().toISOString(),
            })
            .eq("id", user.id);

        if (error) toast.error("Gagal memperbarui profil ❌");
        else toast.success("Profil berhasil diperbarui ✅");

        setLoading(false);
    };

    return (
        <div className="max-w-lg mx-auto p-6">
            <Card>
                <CardHeader>
                    <CardTitle>Pengaturan Profil</CardTitle>
                </CardHeader>
                <CardContent>
                    <form onSubmit={updateProfile} className="space-y-4">
                        <div>
                            <Label>Nama Lengkap</Label>
                            <Input
                                type="text"
                                value={profile.full_name}
                                onChange={(e) =>
                                    setProfile({
                                        ...profile,
                                        full_name: e.target.value,
                                    })
                                }
                            />
                        </div>
                        <div>
                            <Label>Berat Badan (kg)</Label>
                            <Input
                                type="number"
                                step="0.1"
                                value={profile.current_weight_kg}
                                onChange={(e) =>
                                    setProfile({
                                        ...profile,
                                        current_weight_kg: e.target.value,
                                    })
                                }
                            />
                        </div>
                        <div>
                            <Label>Target Kalori Harian</Label>
                            <Input
                                type="number"
                                value={profile.target_calories}
                                onChange={(e) =>
                                    setProfile({
                                        ...profile,
                                        target_calories: e.target.value,
                                    })
                                }
                            />
                        </div>
                        <CardFooter className="p-0 pt-4">
                            <Button
                                type="submit"
                                disabled={loading}
                                className="w-full"
                            >
                                {loading ? "Menyimpan..." : "Simpan Perubahan"}
                            </Button>
                        </CardFooter>
                    </form>
                </CardContent>
            </Card>
        </div>
    );
}
