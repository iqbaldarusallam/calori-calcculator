"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { supabase } from "@/lib/supabaseClient";
import { useRouter } from "next/navigation";
import {
    Card,
    CardHeader,
    CardTitle,
    CardDescription,
    CardContent,
    CardFooter,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Scale, Target } from "lucide-react";
import { Logo } from "@/components/ui/logo";

export default function SetupProfilePage() {
    const router = useRouter();
    const [weight, setWeight] = useState("");
    const [target, setTarget] = useState("");
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");
    const [saved, setSaved] = useState(false);
    const [isChecking, setIsChecking] = useState(true);

    useEffect(() => {
        const checkAuthAndFetchProfile = async () => {
            try {
                const {
                    data: { user },
                    error: authError,
                } = await supabase.auth.getUser();

                // Jika belum login atau error, redirect ke login
                if (!user || authError) {
                    router.push("/auth/login");
                    return;
                }

                // User sudah login, fetch profile
                const { data, error } = await supabase
                    .from("profiles")
                    .select("current_weight_kg, target_calories")
                    .eq("id", user.id)
                    .single();

                if (error) {
                    console.error("Gagal ambil profil:", error.message);
                    setError("Gagal mengambil data profil.");
                } else if (data) {
                    setWeight(data.current_weight_kg?.toString() || "");
                    setTarget(data.target_calories?.toString() || "");
                }

                setIsChecking(false);
            } catch (err) {
                console.error("Error checking auth or fetching profile:", err);
                setError("Terjadi kesalahan. Silakan coba lagi.");
                setIsChecking(false);
            }
        };

        checkAuthAndFetchProfile();
    }, [router]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError("");
        setSaved(false);

        const {
            data: { user },
        } = await supabase.auth.getUser();

        if (!user) {
            setError("User tidak ditemukan.");
            setLoading(false);
            return;
        }

        const { error: updateError } = await supabase
            .from("profiles")
            .update({
                current_weight_kg: Number(weight),
                target_calories: Number(target),
                updated_at: new Date().toISOString(),
            })
            .eq("id", user.id);

        if (updateError) {
            setError(updateError.message);
        } else {
            setSaved(true);
            setTimeout(() => {
                router.push("/dashboard");
            }, 1500);
        }

        setLoading(false);
    };

    // Show loading saat mengecek autentikasi
    if (isChecking) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-[#f8f9f8]">
                <div className="text-center">
                    <Logo size={50} />
                    <p className="text-gray-600 mt-4">Mengecek session...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen flex items-center justify-center bg-[#f8f9f8] p-6">
            <Card className="max-w-md w-full shadow-lg border-none rounded-2xl px-6 py-8 relative">
                <div className="absolute top-4 left-4">
                    <Logo size={40} />
                </div>

                <div className="flex justify-center mb-6 min-h-[80px]">
                    {saved && (
                        <motion.svg
                            xmlns="http://www.w3.org/2000/svg"
                            viewBox="0 0 52 52"
                            className="w-20 h-20 text-[#9DC56E]"
                            initial="hidden"
                            animate="visible"
                        >
                            <motion.circle
                                cx="26"
                                cy="26"
                                r="25"
                                fill="none"
                                stroke="#9DC56E"
                                strokeWidth="2"
                                variants={{
                                    hidden: { pathLength: 0, opacity: 0 },
                                    visible: {
                                        pathLength: 1,
                                        opacity: 1,
                                        transition: {
                                            duration: 0.6,
                                            ease: "easeInOut",
                                        },
                                    },
                                }}
                            />
                            <motion.path
                                fill="none"
                                stroke="#9DC56E"
                                strokeWidth="3"
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                d="M14 27 l7 7 l17 -17"
                                variants={{
                                    hidden: { pathLength: 0, opacity: 0 },
                                    visible: {
                                        pathLength: 1,
                                        opacity: 1,
                                        transition: {
                                            delay: 0.4,
                                            duration: 0.6,
                                            ease: "easeInOut",
                                        },
                                    },
                                }}
                            />
                        </motion.svg>
                    )}
                </div>
                <CardHeader className="p-0 mb-4 mt-4 text-center">
                    <CardTitle className="text-2xl font-semibold text-gray-800">
                        Satu langkah terakhir!
                    </CardTitle>
                    <CardDescription className="text-gray-600 mt-2">
                        Kami perlu info ini untuk menghitung kalori Anda secara
                        akurat.
                    </CardDescription>
                </CardHeader>

                <CardContent className="p-0">
                    <form
                        onSubmit={handleSubmit}
                        className="space-y-5 text-left"
                    >
                        <div>
                            <label className="text-sm font-medium text-gray-700 flex items-center gap-2 mb-1">
                                <Scale className="w-4 h-4 text-gray-600" />
                                Berat Badan (Kg)
                            </label>
                            <Input
                                type="number"
                                placeholder="Berat Badan Saat Ini (kg)"
                                value={weight}
                                onChange={(e) => setWeight(e.target.value)}
                                required
                                className="border border-gray-300 rounded-md h-11 text-sm placeholder-gray-400"
                            />
                        </div>

                        <div>
                            <label className="text-sm font-medium text-gray-700 flex items-center gap-2 mb-1">
                                <Target className="w-4 h-4 text-gray-600" />
                                Target Kalori Harian
                            </label>
                            <Input
                                type="number"
                                placeholder="2000"
                                value={target}
                                onChange={(e) => setTarget(e.target.value)}
                                className="border border-gray-300 rounded-md h-11 text-sm placeholder-gray-400"
                            />
                        </div>

                        {error && (
                            <p className="text-red-500 text-sm">{error}</p>
                        )}
                    </form>
                </CardContent>

                <CardFooter className="p-0 mt-6">
                    <Button
                        onClick={handleSubmit}
                        disabled={loading}
                        className="w-full bg-[#C2E66E] text-black font-semibold text-base h-11 rounded-md hover:bg-[#b8dc66] transition-colors"
                    >
                        {loading ? "Menyimpan..." : "Simpan"}
                    </Button>
                </CardFooter>
            </Card>
        </div>
    );
}
