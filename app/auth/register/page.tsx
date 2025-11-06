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

export default function RegisterPage() {
    const [fullname, setFullname] = useState("");
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [confirm, setConfirm] = useState("");
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");

    const router = useRouter();

    const handleRegister = async (e: React.FormEvent) => {
        e.preventDefault();
        if (password !== confirm) return setError("Password tidak sama");
        if (password.length < 6)
            return setError("Password minimal 6 karakter");

        setLoading(true);
        setError("");

        // Signup ke Supabase Auth
        const { data, error } = await supabase.auth.signUp({
            email: email.trim().toLowerCase(),
            password: password.trim(),
            options: {
                data: { full_name: fullname },
            },
        });

        if (error) {
            console.error("Supabase sign up error:", error);
            setError(error.message);
            setLoading(false);
            return;
        }

        // Jika berhasil signup dan user tersedia
        if (data.user) {
            // Buat row baru di tabel profiles secara manual
            const { error: profileError } = await supabase
                .from("profiles")
                .insert({
                    id: data.user.id,
                    username: `user_${data.user.id.slice(0, 8)}`,
                    full_name: fullname,
                    current_weight_kg: 0.0,
                });

            if (profileError) {
                setError(profileError.message);
                setLoading(false);
                return;
            }

            // Redirect ke halaman login
            router.push("/auth/login");
        }

        setLoading(false);
    };

    return (
        <div className="min-h-screen grid grid-cols-1 md:grid-cols-2">
            <div className="flex items-center justify-center p-6">
                <Card className="max-w-md w-full">
                    <CardHeader>
                        <CardTitle>Buat Akun Baru</CardTitle>
                        <CardDescription>
                            Isi data di bawah ini untuk memulai perjalanan sehat
                            Anda.
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        <form onSubmit={handleRegister} className="space-y-4">
                            <Input
                                type="text"
                                placeholder="Nama Lengkap"
                                value={fullname}
                                onChange={(e) => setFullname(e.target.value)}
                                required
                            />
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
                            <Input
                                type="password"
                                placeholder="Konfirmasi Password"
                                value={confirm}
                                onChange={(e) => setConfirm(e.target.value)}
                                required
                            />
                            {error && (
                                <p className="text-red-500 text-sm">{error}</p>
                            )}
                        </form>
                    </CardContent>
                    <CardFooter className="flex flex-col gap-2">
                        <Button
                            onClick={handleRegister}
                            disabled={loading}
                            className="w-full"
                        >
                            {loading ? "Loading..." : "Register"}
                        </Button>
                        <p className="text-sm text-center">
                            Sudah punya akun?{" "}
                            <Link
                                href="/auth/login"
                                className="text-blue-500 underline"
                            >
                                Sign In
                            </Link>
                        </p>
                    </CardFooter>
                </Card>
            </div>
            <div className="hidden md:block bg-[url('/images/register-bg.jpg')] bg-cover bg-center" />
        </div>
    );
}
