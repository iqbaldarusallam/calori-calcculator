export async function getMotivationMessage(netCalories: number) {
    if (netCalories < 0) {
        return "Luar biasa! Kamu membakar lebih banyak kalori daripada yang kamu konsumsi hari ini 🔥";
    } else if (netCalories < 300) {
        return "Kamu menjaga keseimbangan kalori dengan baik 💪 pertahankan rutinitas ini!";
    } else if (netCalories < 800) {
        return "Kamu sedikit surplus hari ini — tidak apa-apa, tapi besok coba tambahkan sedikit aktivitas 🚶‍♂️";
    } else {
        return "Kamu surplus kalori cukup banyak hari ini 🍔 Coba kurangi cemilan malam!";
    }
}
