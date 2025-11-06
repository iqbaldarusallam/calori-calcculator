// app/dashboard/layout.tsx
import React from "react";
import Navbar from "@/components/shared/Navbar";

export default function DashboardLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    return (
        <div className="flex min-h-screen flex-col">
            <Navbar />
            <main className="flex-1">{children}</main>
        </div>
    );
}
