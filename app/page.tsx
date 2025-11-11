"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabaseClient";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { Logo } from "@/components/ui/logo";
import Image from "next/image";
import { BarChart, Zap, Award, BrainCircuit, Menu, X } from "lucide-react";
import { motion } from "framer-motion";

export default function LandingPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  useEffect(() => {
    const checkSession = async () => {
      const {
        data: { session },
      } = await supabase.auth.getSession();

      if (session) {
        router.replace("/dashboard");
      } else {
        setLoading(false);
      }
    };

    checkSession();
  }, [router]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-white">
        <Logo size={80} />
      </div>
    );
  }

  const features = [
    {
      icon: <BarChart className="w-8 h-8 text-[#C2E66E]" />,
      title: "Lacak Kalori",
      description:
        "Pantau seluruh asupan makanan dan minuman harian Anda dengan mudah dan akurat. Setiap kalori yang masuk akan dicatat agar tujuan kesehatan tetap terukur.",
    },
    {
      icon: <Zap className="w-8 h-8 text-[#C2E66E]" />,
      title: "Catat Aktivitas",
      description:
        "Rekam aktivitas fisik dan ketahui berapa banyak kalori yang Anda bakar setiap hari untuk menjaga keseimbangan energi tubuh.",
    },
    {
      icon: <BrainCircuit className="w-8 h-8 text-[#C2E66E]" />,
      title: "AI Coach",
      description:
        "Dapatkan rekomendasi pintar, motivasi harian, dan analisis kebiasaan makan dari pelatih AI yang dirancang untuk mendampingi Anda sepanjang perjalanan.",
    },
    {
      icon: <Award className="w-8 h-8 text-[#C2E66E]" />,
      title: "Gamifikasi",
      description:
        "Kumpulkan koin, capai pencapaian baru, dan jadikan perjalanan kesehatan Anda lebih menyenangkan dan memotivasi setiap hari.",
    },
  ];

  return (
    <div className="min-h-screen bg-white text-black">
      <header className="absolute top-0 left-0 w-full z-50">
        <div className="max-w-7xl mx-auto px-6 py-5 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Logo size={60} showText={false} />
            <span className="text-white text-xl font-semibold drop-shadow-lg">
              CalPal
            </span>
          </div>

          <nav className="hidden md:flex items-center gap-8">
            <Link
              href="#fitur"
              className="text-white hover:text-[#C2E66E] transition"
            >
              Fitur
            </Link>
            <Link
              href="#tentang"
              className="text-white hover:text-[#C2E66E] transition"
            >
              Tentang
            </Link>
            <Link
              href="#pencatatan"
              className="text-white hover:text-[#C2E66E] transition"
            >
              Pencatatan
            </Link>
            <Link
              href="#keunggulan"
              className="text-white hover:text-[#C2E66E] transition"
            >
              Keunggulan
            </Link>
          </nav>

          <button
            className="md:hidden text-white text-3xl cursor-pointer"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          >
            {mobileMenuOpen ? <X size={28} /> : <Menu size={28} />}
          </button>
        </div>

        {mobileMenuOpen && (
          <div className="md:hidden bg-black bg-opacity-95 px-6 py-4">
            <Link
              href="#fitur"
              className="block text-white hover:text-[#C2E66E] transition py-2"
              onClick={() => setMobileMenuOpen(false)}
            >
              Fitur
            </Link>
            <Link
              href="#tentang"
              className="block text-white hover:text-[#C2E66E] transition py-2"
              onClick={() => setMobileMenuOpen(false)}
            >
              Tentang
            </Link>
            <Link
              href="#pencatatan"
              className="block text-white hover:text-[#C2E66E] transition py-2"
              onClick={() => setMobileMenuOpen(false)}
            >
              Pencatatan
            </Link>
            <Link
              href="#keunggulan"
              className="block text-white hover:text-[#C2E66E] transition py-2"
              onClick={() => setMobileMenuOpen(false)}
            >
              Keunggulan
            </Link>
          </div>
        )}
      </header>

      <section className="relative w-full h-[600px] md:h-[750px] flex items-center">
        <div className="relative w-full h-full">
          <Image
            src="/images/food-chart.jpg"
            alt="Hero Image"
            fill
            className="object-cover brightness-50"
            priority
          />
        </div>

        <div className="absolute inset-0 flex items-center px-8 md:px-20">
          <motion.div
            initial={{ opacity: 0, y: 50 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.2 }}
            className="max-w-xl text-white"
          >
            <h1 className="text-4xl md:text-6xl font-bold leading-tight drop-shadow-xl">
              Wujudkan Gaya Hidup Sehat Bersama CalPal
            </h1>

            <p className="mt-6 text-lg md:text-xl text-gray-200 drop-shadow-lg">
              Platform manajemen nutrisi dan kesehatan terpadu dengan AI Coach,
              pelacakan kalori real-time, dan gamifikasi yang membuat perjalanan
              sehatmu menjadi lebih menyenangkan dan termotivasi.
            </p>

            <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
              <Button
                size="lg"
                className="mt-10 bg-[#C2E66E] font-semibold text-lg text-black hover:bg-[#b8dc66] transition-all duration-300 shadow-lg hover:shadow-xl rounded-lg px-8 py-3"
                onClick={() => router.push("/auth/login")}
              >
                Get Started
              </Button>
            </motion.div>
          </motion.div>
        </div>
      </section>

      <section id="fitur" className="py-20 bg-[#f8f8f8]">
        <div className="container mx-auto px-6">
          <h2 className="text-3xl font-bold text-center mb-12">
            Fitur Canggih untuk Gaya Hidup Lebih Sehat
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            {features.map((feature) => (
              <motion.div
                key={feature.title}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5 }}
                viewport={{ once: true }}
                whileHover={{
                  y: -10,
                  boxShadow: "0 20px 30px rgba(0,0,0,0.1)",
                }}
                className="bg-white border border-gray-200 p-6 rounded-2xl shadow-sm hover:shadow-md transition text-center cursor-pointer"
              >
                <div className="flex justify-center mb-4">{feature.icon}</div>
                <h3 className="text-xl font-semibold mb-2">{feature.title}</h3>
                <p className="text-gray-600">{feature.description}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      <section className="py-20 text-center">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          viewport={{ once: true }}
        >
          <h2 className="text-3xl font-bold">
            Siap Mengubah Hidup Sehat Hari Ini?
          </h2>
          <p className="mt-3 text-gray-600 max-w-lg mx-auto">
            Kesehatan adalah investasi terbaik untuk masa depanmu. Jangan
            biarkan hari berlalu tanpa aksi nyata. Mulai sekarang, catat setiap
            makanan, pantau aktivitas, dan raih target kesehatanmu dengan CalPal
            sebagai partner terpercayamu.
          </p>
          <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
            <Button
              size="lg"
              className="mt-10 bg-[#C2E66E] text-black text-lg font-semibold hover:bg-[#b8dc66] transition-all duration-300 shadow-lg hover:shadow-xl rounded-lg px-8 py-3"
              onClick={() => router.push("/auth/register")}
            >
              Daftar Sekarang
            </Button>
          </motion.div>
        </motion.div>
      </section>

      <section
        id="tentang"
        className="py-20 container mx-auto px-6 grid md:grid-cols-2 gap-6 items-start"
      >
        <motion.div
          initial={{ opacity: 0, x: -50 }}
          whileInView={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.6 }}
          viewport={{ once: true }}
        >
          <h2 className="text-3xl md:text-4xl font-bold mb-4">
            Apa itu CalPal?
          </h2>
          <p className="text-lg text-gray-700">
            CalPal adalah aplikasi manajemen nutrisi dan kesehatan yang
            menggabungkan teknologi AI terkini dengan antarmuka user-friendly.
            Dirancang khusus untuk membantu Anda mencapai dan mempertahankan
            berat badan ideal, memberikan insight tentang pola makan, dan
            memahami kebutuhan kesehatan unik Anda dengan rekomendasi personal
            dari AI Coach yang cerdas.
          </p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, x: 50 }}
          whileInView={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.6 }}
          viewport={{ once: true }}
          className="w-full h-[400px] relative"
        >
          <Image
            src="/images/about.jpg"
            alt="About CalPal"
            fill
            className="object-cover rounded-xl shadow-lg"
          />
        </motion.div>
      </section>

      <section
        id="pencatatan"
        className="py-20 container mx-auto px-6 grid md:grid-cols-2 gap-6 items-start"
      >
        <motion.div
          initial={{ opacity: 0, x: -50 }}
          whileInView={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.6 }}
          viewport={{ once: true }}
          className="w-full h-[400px] relative"
        >
          <Image
            src="/images/healthy-food.jpg"
            alt="Scan food"
            fill
            className="object-cover rounded-xl shadow-lg"
          />
        </motion.div>

        <motion.div
          initial={{ opacity: 0, x: 50 }}
          whileInView={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.6 }}
          viewport={{ once: true }}
        >
          <h2 className="text-3xl md:text-4xl font-bold mb-4">
            Lacak Setiap Kalori dengan Mudah
          </h2>
          <p className="text-lg text-gray-700">
            Catat makanan dan minuman harian Anda dengan mudah, dari menu
            rumahan hingga restoran favorit. CalPal secara otomatis menghitung
            kalori dan breakdown nutrisi, memberikan visualisasi data yang
            jelas, serta memungkinkan Anda mencatat aktivitas fisik untuk
            melihat keseimbangan energi harian dan progress dalam satu dashboard
            komprehensif.
          </p>
        </motion.div>
      </section>

      <section
        id="keunggulan"
        className="py-20 container mx-auto px-6 grid md:grid-cols-2 gap-6 items-start"
      >
        <motion.div
          initial={{ opacity: 0, x: -50 }}
          whileInView={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.6 }}
          viewport={{ once: true }}
        >
          <h2 className="text-3xl md:text-4xl font-bold mb-4">
            Fitur Gamifikasi untuk Motivasi Berkelanjutan
          </h2>
          <p className="text-lg text-gray-700">
            Kumpulkan koin setiap kali mencapai target harian dan buka
            pencapaian baru. CalPal mengintegrasikan sistem reward yang menarik
            dengan poin dan achievement yang dapat dikumpulkan, sementara AI
            Coach memberikan motivasi personal dan tips harian, menjadikan
            perjalanan kesehatan Anda lebih menyenangkan dan penuh pencapaian.
          </p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, x: 50 }}
          whileInView={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.6 }}
          viewport={{ once: true }}
          className="w-full h-[400px] relative"
        >
          <Image
            src="/images/people-happy.jpg"
            alt="Gamification"
            fill
            className="object-cover rounded-xl shadow-lg"
          />
        </motion.div>
      </section>
    </div>
  );
}
