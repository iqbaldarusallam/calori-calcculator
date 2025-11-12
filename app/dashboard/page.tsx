"use client";

import { useRouter } from "next/navigation";
import { useCallback, useEffect, useState } from "react";
import { supabase } from "@/lib/supabaseClient";
import { translateFoodNameToIndonesian } from "@/lib/foodTranslations";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import LogFoodModal from "@/components/modals/LogFoodModal";
import LogActivityModal from "@/components/modals/LogActivityModal";
import MotivationModal from "@/components/modals/MotivationModal";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Calendar } from "@/components/ui/calendar";
import {
  Popover,
  PopoverTrigger,
  PopoverContent,
} from "@/components/ui/popover";
import {
  CalendarDays,
  ForkKnife,
  Flame,
  Activity,
  Lightbulb,
  Dumbbell,
  TrendingUp,
} from "lucide-react";
import dayjs from "dayjs";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";

export default function DashboardPage() {
  const router = useRouter();
  const [date, setDate] = useState(new Date());
  const [summary, setSummary] = useState({
    total_calories_in: 0,
    total_calories_out: 0,
    net_calories: 0,
  });
  type WeeklyDataEntry = {
    log_date: string;
    total_in: number;
    total_out: number;
    net_calories: number;
  };

  type LogEntry = {
    id: string | number;
    item: string;
    detail?: string;
    calories: number;
  };

  const [weeklyData, setWeeklyData] = useState<WeeklyDataEntry[]>([]);
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [isSessionChecking, setIsSessionChecking] = useState(true);
  const [motivation, setMotivation] = useState("");
  const [motivationLoading, setMotivationLoading] = useState(false);
  const [showFoodModal, setShowFoodModal] = useState(false);
  const [showActivityModal, setShowActivityModal] = useState(false);
  const [showMotivationModal, setShowMotivationModal] = useState(false);

  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;
  const totalPages = Math.max(1, Math.ceil(logs.length / itemsPerPage));
  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentLogs = logs.slice(indexOfFirstItem, indexOfLastItem);

  useEffect(() => {
    setCurrentPage(1);
  }, [logs]);

  useEffect(() => {
    const checkSession = async () => {
      setIsSessionChecking(true);
      try {
        const {
          data: { session },
        } = await supabase.auth.getSession();
        if (!session) {
          router.replace("/auth/login");
        } else {
          setIsSessionChecking(false);
        }
      } catch (error) {
        console.error("Session check error:", error);
        router.replace("/auth/login");
      }
    };
    checkSession();
  }, [router]);

  const fetchData = useCallback(async () => {
    setLoading(true);
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return setLoading(false);

    const { data: summaryData } = await supabase.rpc("get_daily_summary", {
      p_user_id: user.id,
      p_log_date: dayjs(date).format("YYYY-MM-DD"),
    });
    if (summaryData && summaryData.length > 0) {
      setSummary(summaryData[0]);
    }

    const { data: foodLogs } = await supabase
      .from("food_logs")
      .select("id, food_name, calories_kcal, log_date")
      .eq("user_id", user.id)
      .eq("log_date", dayjs(date).format("YYYY-MM-DD"));

    const { data: activityLogs } = await supabase
      .from("activity_logs")
      .select(
        "id, duration_minutes, calories_burned, log_date, met_activity_id, met_activities(activity_name)"
      )
      .eq("user_id", user.id)
      .eq("log_date", dayjs(date).format("YYYY-MM-DD"));

    const { data: weeklyData } = await supabase.rpc("get_weekly_summary", {
      p_user_id: user.id,
    });
    setWeeklyData(weeklyData || []);

    const merged = [
      ...(foodLogs?.map((f) => ({
        id: f.id,
        item: translateFoodNameToIndonesian(f.food_name),
        detail: "Makanan",
        calories: f.calories_kcal,
      })) ?? []),
      ...(activityLogs?.map((a) => {
        const activityName = Array.isArray(a.met_activities)
          ? (a.met_activities[0] as { activity_name: string })?.activity_name
          : (a.met_activities as { activity_name: string })?.activity_name;
        return {
          id: a.id,
          item: activityName || `Aktivitas #${a.met_activity_id}`,
          detail: `Durasi ${a.duration_minutes} menit`,
          calories: -a.calories_burned,
        };
      }) ?? []),
    ];

    setLogs(merged);
    setLoading(false);
  }, [date]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const fetchMotivation = async () => {
    setMotivationLoading(true);
    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) throw new Error("User tidak ditemukan");

      const { data: summaryData } = await supabase.rpc("get_daily_summary", {
        p_user_id: user.id,
        p_log_date: dayjs(date).format("YYYY-MM-DD"),
      });

      const netCalories = summaryData?.[0]?.net_calories ?? 0;

      const res = await fetch("/api/ai-coach", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ netCalories }),
      });

      const data = await res.json();

      setMotivation(
        data.message || "Terus semangat menjalani hari yang sehat! 💪"
      );
      setShowMotivationModal(true);
    } catch (err: unknown) {
      console.error(err);
      const message =
        err instanceof Error ? err.message : "Gagal mengambil motivasi AI.";
      setMotivation(message);
      setShowMotivationModal(true);
    }
    setMotivationLoading(false);
  };

  const goToPage = (p: number) => {
    const page = Math.min(Math.max(1, p), totalPages);
    setCurrentPage(page);
  };

  if (isSessionChecking) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-[#F9FAFB]">
        <div className="text-center space-y-4">
          <div className="flex justify-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#C2E66E]"></div>
          </div>
          <p className="text-gray-600 text-lg">Memverifikasi session...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 bg-[#F9FAFB] min-h-screen space-y-8">
      <div className="flex flex-wrap justify-between gap-8">
        <div className="flex items-center bg-white rounded-2xl shadow-lg px-8 py-6 w-full md:w-[360px]">
          <div className="bg-[#FFA257] rounded-2xl w-16 h-16 flex items-center justify-center shadow-md">
            <ForkKnife className="w-7 h-7" />
          </div>
          <div className="ml-5">
            <p className="text-base text-gray-500 font-medium">Kalori Masuk</p>
            <p className="text-2xl font-bold text-gray-900">
              {summary.total_calories_in}
              <span className="text-base font-normal text-gray-500 ml-1">
                Kalori
              </span>
            </p>
          </div>
        </div>

        <div className="flex items-center bg-white rounded-2xl shadow-lg px-8 py-6 w-full md:w-[360px]">
          <div className="bg-[#FF3B30] rounded-2xl w-16 h-16 flex items-center justify-center shadow-md">
            <Flame className="w-7 h-7" />
          </div>
          <div className="ml-5">
            <p className="text-base text-gray-500 font-medium">
              Kalori Terbakar
            </p>
            <p className="text-2xl font-bold text-gray-900">
              {summary.total_calories_out}
              <span className="text-base font-normal text-gray-500 ml-1">
                Kalori
              </span>
            </p>
          </div>
        </div>

        <div className="flex items-center bg-[#C2E66E] rounded-2xl shadow-lg px-8 py-6 w-full md:w-[360px]">
          <div className="bg-[#D8F5A2] rounded-2xl w-16 h-16 flex items-center justify-center shadow-md">
            <Activity className="w-7 h-7 text-[#6E882A]" />
          </div>
          <div className="ml-5 ">
            <p className="text-base font-medium ">Kalori Bersih</p>
            <p className="text-2xl font-bold">
              {summary.net_calories.toLocaleString()}
              <span className="text-base font-normal ml-1 opacity-90">
                Kalori
              </span>
            </p>
          </div>
        </div>
      </div>

      <div className="flex flex-wrap justify-between items-center gap-4">
        <div className="flex items-center gap-3">
          <Activity className="w-6 h-6" />
          <h2 className="text-2xl font-semibold text-gray-800">
            Catatan Kalori Harian
          </h2>
        </div>

        <Popover>
          <PopoverTrigger asChild>
            <Button
              variant="outline"
              className="flex items-center gap-2 text-gray-600"
            >
              <CalendarDays className="w-4 h-4" />
              {dayjs(date).format("DD MMM YYYY")}
            </Button>
          </PopoverTrigger>
          <PopoverContent align="end" className="p-0">
            <Calendar
              mode="single"
              selected={date}
              onSelect={(d) => d && setDate(d)}
            />
          </PopoverContent>
        </Popover>
      </div>

      <Card className="border border-gray-300 shadow-lg rounded-2xl bg-white">
        <div className="flex flex-wrap items-center justify-between p-4 gap-2">
          <Button
            onClick={fetchMotivation}
            disabled={motivationLoading}
            className="bg-[#FFA257] hover:bg-[#FF9b3a] text-black 
                 px-3 py-2 sm:px-4 sm:py-2 rounded-xl flex items-center gap-2 text-sm sm:text-base"
          >
            <Lightbulb className="w-4 h-4 sm:w-5 sm:h-5" />
            {motivationLoading ? "Mengambil..." : "DapatkanMotivasi"}
          </Button>

          <div className="flex flex-wrap gap-2">
            <Button
              onClick={() => setShowActivityModal(true)}
              className="bg-[#C2E66E] hover:bg-[#B7DD5A] text-[#2E4B00] 
                   px-2 py-1 sm:px-3 sm:py-2 rounded-full flex items-center gap-2 text-xs sm:text-sm"
            >
              <Dumbbell className="w-3 h-3 sm:w-4 sm:h-4" />
              Tambah Aktivitas
            </Button>

            <Button
              onClick={() => setShowFoodModal(true)}
              className="bg-[#C2E66E] hover:bg-[#B7DD5A] text-[#2E4B00] 
                   px-2 py-1 sm:px-3 sm:py-2 rounded-full flex items-center gap-2 text-xs sm:text-sm"
            >
              <ForkKnife className="w-3 h-3 sm:w-4 sm:h-4" />
              Tambah Makanan
            </Button>
          </div>
        </div>

        <CardContent className="p-0">
          {loading ? (
            <div className="p-6 text-gray-500">Loading...</div>
          ) : (
            <>
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow className="bg-white">
                      <TableHead className="font-medium text-gray-500 text-left px-6 py-3">
                        Item
                      </TableHead>
                      <TableHead className="font-medium text-gray-500 text-left px-6 py-3">
                        Detail
                      </TableHead>
                      <TableHead className="font-medium text-gray-500 text-right px-6 py-3">
                        Cals
                      </TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {currentLogs.length > 0 ? (
                      currentLogs.map((log) => (
                        <TableRow
                          key={log.id}
                          className="border-t hover:bg-gray-50"
                        >
                          <TableCell className="px-6 py-4 text-sm text-gray-800">
                            {log.item}
                          </TableCell>
                          <TableCell className="px-6 py-4 text-sm text-gray-600">
                            {log.detail}
                          </TableCell>
                          <TableCell
                            className={`px-6 py-4 text-sm font-medium text-right ${
                              log.calories > 0
                                ? "text-[#FFA257]"
                                : "text-[#F45C43]"
                            }`}
                          >
                            {log.calories} kkal
                          </TableCell>
                        </TableRow>
                      ))
                    ) : (
                      <TableRow>
                        <TableCell
                          colSpan={3}
                          className="text-center text-gray-500 py-8"
                        >
                          Belum ada data hari ini
                        </TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              </div>

              {logs.length > itemsPerPage && (
                <div className="flex items-center justify-start gap-2 px-4 py-4">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => goToPage(currentPage - 1)}
                    disabled={currentPage === 1}
                    className="rounded-full w-8 h-8 flex items-center justify-center text-gray-500 hover:bg-gray-100"
                  >
                    ‹
                  </Button>

                  {Array.from({ length: totalPages }, (_, i) => {
                    const page = i + 1;
                    return (
                      <button
                        key={page}
                        onClick={() => goToPage(page)}
                        className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${
                          page === currentPage
                            ? "bg-[#C2E66E] text-[#2E4B00]"
                            : "bg-white text-gray-600 border border-gray-200"
                        }`}
                      >
                        {page}
                      </button>
                    );
                  })}

                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => goToPage(currentPage + 1)}
                    disabled={currentPage === totalPages}
                    className="rounded-full w-8 h-8 flex items-center justify-center text-gray-500 hover:bg-gray-100"
                  >
                    ›
                  </Button>
                </div>
              )}
            </>
          )}
        </CardContent>
      </Card>

      <Card className="border border-gray-300 shadow-lg rounded-2xl bg-white">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <div className="flex items-center gap-3">
            <TrendingUp className="w-6 h-6 ]" />
            <CardTitle className="text-lg font-semibold ">
              Weekly Progress
            </CardTitle>
          </div>
        </CardHeader>
        <CardContent>
          {weeklyData.length > 0 ? (
            <ResponsiveContainer width="100%" height={320}>
              <LineChart data={weeklyData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" />
                <XAxis
                  dataKey="log_date"
                  tick={{ fill: "#000000" }}
                  axisLine={{ stroke: "#000000" }}
                />
                <YAxis
                  tick={{ fill: "#000000" }}
                  axisLine={{ stroke: "#000000" }}
                />
                <Tooltip
                  contentStyle={{
                    backgroundColor: "#FFFFFF",
                    border: "1px solid #E5E7EB",
                    color: "#000000",
                  }}
                  itemStyle={{ color: "#000000" }}
                  labelStyle={{ color: "#000000" }}
                />
                <Legend wrapperStyle={{ color: "#000000" }} />{" "}
                <Line
                  type="monotone"
                  dataKey="total_in"
                  stroke="#FFA257"
                  strokeWidth={3}
                  dot={false}
                  name="Kalori Masuk"
                />
                <Line
                  type="monotone"
                  dataKey="total_out"
                  stroke="#F45C43"
                  strokeWidth={3}
                  dot={false}
                  name="Kalori Terbakar"
                />
                <Line
                  type="monotone"
                  dataKey="net_calories"
                  stroke="#C2E66E"
                  strokeWidth={3}
                  dot={false}
                  name="Kalori Bersih"
                />
              </LineChart>
            </ResponsiveContainer>
          ) : (
            <p className="text-gray-500">Belum ada data minggu ini.</p>
          )}
        </CardContent>
      </Card>

      {showFoodModal && (
        <LogFoodModal
          onClose={() => setShowFoodModal(false)}
          onRefresh={fetchData}
        />
      )}
      {showActivityModal && (
        <LogActivityModal
          onClose={() => setShowActivityModal(false)}
          onRefresh={fetchData}
        />
      )}

      {showMotivationModal && (
        <MotivationModal
          isOpen={showMotivationModal}
          onClose={() => setShowMotivationModal(false)}
          message={motivation}
        />
      )}
    </div>
  );
}
