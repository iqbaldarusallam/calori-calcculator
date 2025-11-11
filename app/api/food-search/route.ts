import { NextResponse } from "next/server";

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const query = searchParams.get("q");

  if (!query)
    return NextResponse.json(
      { error: "Missing query parameter" },
      { status: 400 }
    );

  try {
    const res = await fetch(
      `https://api.nal.usda.gov/fdc/v1/foods/search?query=${encodeURIComponent(
        query
      )}&pageSize=10&api_key=${process.env.FOODDATA_API_KEY}`
    );

    const data = await res.json();
    const foods = (data.foods ?? []).map((item: unknown) => {
      const it = item as {
        description?: string;
        foodNutrients?: Array<{ nutrientName?: string; value?: number }>;
      };

      const energy = it.foodNutrients?.find(
        (n) => n?.nutrientName === "Energy"
      )?.value;

      return {
        name: it.description ?? "",
        calories: energy ?? 0,
        unit: "kcal",
      };
    });

    return NextResponse.json(foods);
  } catch (err: unknown) {
    console.error(err);
    return NextResponse.json(
      { error: "Failed to fetch food data" },
      { status: 500 }
    );
  }
}
