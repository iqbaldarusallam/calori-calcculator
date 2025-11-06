"use client";

import { useState } from "react";
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
import Link from "next/link";

export default function LoginPage() {
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");

    const router = useRouter();

    const handleLogin = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError("");

        // 🔹 Step 1: Login ke Supabase
        const { data, error } = await supabase.auth.signInWithPassword({
            email: email.trim().toLowerCase(),
            password: password.trim(),
        });

        if (error) {
            setLoading(false);
            if (error.message === "Email not confirmed") {
                setError(
                    "Email belum dikonfirmasi. Silakan cek email Anda untuk link konfirmasi."
                );
            } else {
                setError(error.message);
            }
            return;
        }

        // 🔹 Step 2: Ambil profil user berdasarkan id Supabase Auth
        const userId = data.user?.id;
        if (!userId) {
            setError("User ID tidak ditemukan.");
            setLoading(false);
            return;
        }

        const { data: profile, error: profileError } = await supabase
            .from("profiles")
            .select("current_weight_kg")
            .eq("id", userId)
            .single();

        if (profileError) {
            setError("Gagal mengambil data profil.");
            setLoading(false);
            return;
        }

        // 🔹 Step 3: Cek apakah profil sudah lengkap
        if (!profile || Number(profile.current_weight_kg) === 0) {
            // user baru → belum setup profil
            router.push("/setup-profile");
        } else {
            // user lama → langsung ke dashboard
            router.push("/dashboard");
        }

        setLoading(false);
    };

    return (
        <div className="min-h-screen grid grid-cols-1 md:grid-cols-2">
            <div className="flex items-center justify-center p-6">
                <Card className="max-w-md w-full">
                    <CardHeader>
                        <CardTitle>Selamat Datang Kembali</CardTitle>
                        <CardDescription>
                            Masukkan email dan password Anda untuk melanjutkan.
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        <form onSubmit={handleLogin} className="space-y-4">
                            <Input
                                type="email"
                                placeholder="email@anda.com"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                required
                            />
                            <Input
                                type="password"
                                placeholder="Password"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                required
                            />
                            {error && (
                                <p className="text-red-500 text-sm">{error}</p>
                            )}
                        </form>
                    </CardContent>
                    <CardFooter className="flex flex-col gap-2">
                        <Button
                            onClick={handleLogin}
                            disabled={loading}
                            className="w-full"
                        >
                            {loading ? "Loading..." : "Sign In"}
                        </Button>
                        <p className="text-sm text-center">
                            Belum punya akun?{" "}
                            <Link
                                href="/auth/register"
                                className="text-blue-500 underline"
                            >
                                Register
                            </Link>
                        </p>
                    </CardFooter>
                </Card>
            </div>
            <div className="hidden md:block bg-[url('/images/login-bg.jpg')] bg-cover bg-center" />
        </div>
    );
}
