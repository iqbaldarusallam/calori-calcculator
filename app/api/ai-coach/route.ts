import { NextResponse } from "next/server";
import { GoogleGenerativeAI } from "@google/generative-ai";

const apiKey = process.env.GEMINI_API_KEY;
if (!apiKey) {
  throw new Error("GEMINI_API_KEY is not defined in environment variables.");
}

const genAI = new GoogleGenerativeAI(apiKey);
const model = genAI.getGenerativeModel({
  model: "gemini-2.0-flash",
});

export async function POST(req: Request) {
  try {
    const { netCalories } = await req.json();

    if (typeof netCalories !== "number") {
      return NextResponse.json(
        {
          error: "Parameter 'netCalories' dibutuhkan dan harus berupa angka.",
        },
        { status: 400 }
      );
    }

    const prompt = `
      Berikan satu kalimat motivasi singkat (maksimal 20 kata) untuk seseorang yang sedang diet.
      Kondisi kalori bersih hari ini: ${netCalories} kalori.
      - Jika kalori bersih negatif (defisit), berikan pujian.
      - Jika kalori bersih positif (surplus), berikan semangat untuk hari esok.
      - Jika kalori bersih nol, berikan motivasi umum.
      Gunakan Bahasa Indonesia yang positif dan menyemangati. Jangan gunakan format tebal (bold) atau markdown apa pun.
      Pastikan kalimatnya relevan dengan kondisi kalori bersih yang diberikan. Sebutkan kalori bersih dalam kalimat motivasi.
        Contoh Kalimat motivasi:
        "Kalori bersih hari ini adalah ${netCalories} kalori. Tetap semangat, setiap langkah kecil membawa perubahan besar!", untuk mencapai tujuan dietmu! Berikut adalah saran yang bisa kamu gunakan. [Lakukan berikan saran sesuai kondisi kalori bersih yang diberikan dengan kalimat yang tidak kaku dan mengalir natural].
    `;

    const result = await model.generateContent(prompt);
    const message = result.response.text();

    return NextResponse.json({ message });
  } catch (error) {
    console.error("Error saat memanggil Gemini API:", error);
    return NextResponse.json(
      {
        error: "Gagal memanggil Gemini API",
        detail: (error as Error).message,
      },
      { status: 500 }
    );
  }
}
