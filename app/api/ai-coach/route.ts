import { NextResponse } from "next/server";
import { GoogleGenerativeAI } from "@google/generative-ai";

const apiKey = process.env.GEMINI_API_KEY;
if (!apiKey) {
  console.error("GEMINI_API_KEY tidak ditemukan di environment variable!");
}

const genAI = new GoogleGenerativeAI(apiKey || "");
const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash" });

export async function POST(req: Request) {
  try {
    const { netCalories } = await req.json();

    if (typeof netCalories !== "number") {
      return NextResponse.json(
        { error: "Parameter netCalories harus berupa angka." },
        { status: 400 }
      );
    }

    const prompt = `
      Kamu adalah pelatih kesehatan AI.
      Berikan pesan motivasi singkat (maksimal 30 kata) berdasarkan hasil kalori bersih berikut:
      Kalori bersih pengguna: ${netCalories} kkal.
      Gunakan Bahasa Indonesia yang positif dan menyemangati.
    `;

    const result = await model.generateContent(prompt);
    const message = result.response.text();

    return NextResponse.json({ message });
  } catch (error: unknown) {
    console.error("Error saat memanggil Gemini API:", error);

    const message =
      error instanceof Error
        ? error.message
        : "Terjadi kesalahan yang tidak diketahui.";

    return NextResponse.json(
      {
        error: "Gagal memanggil Gemini API",
        detail: message,
      },
      { status: 500 }
    );
  }
}
