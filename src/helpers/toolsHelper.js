// SweetAlert2 dimuat malas (lazy) — hanya diunduh saat dialog pertama kali ditampilkan,
// sehingga tidak ikut memperbesar JavaScript awal halaman.
async function loadSwal() {
  const module = await import("sweetalert2");
  return module.default;
}

async function fireAndClose(options) {
  const Swal = await loadSwal();
  const result = await Swal.fire(options);
  if (result.isConfirmed) {
    Swal.close();
  }
  return result;
}

export function showErrorDialog(message) {
  return fireAndClose({
    title: "Terjadi Kesalahan",
    text: message,
    icon: "error",
    confirmButtonText: "Tutup",
    confirmButtonColor: "#ef4444",
  });
}

export function showWarningDialog(message) {
  return fireAndClose({
    title: "Peringatan",
    text: message,
    icon: "warning",
    confirmButtonText: "Tutup",
    confirmButtonColor: "#f59e0b",
  });
}

export function showSuccessDialog(message) {
  return fireAndClose({
    title: "Tindakan Berhasil",
    text: message,
    icon: "success",
    confirmButtonText: "Tutup",
    confirmButtonColor: "#10b981",
  });
}

export async function showConfirmDialog(message) {
  const Swal = await loadSwal();
  return Swal.fire({
    title: "Konfirmasi",
    text: message,
    icon: "question",
    showCancelButton: true,
    confirmButtonText: "Ya",
    cancelButtonText: "Tidak",
    confirmButtonColor: "#6366f1",
    cancelButtonColor: "#94a3b8",
  });
}

export function formatDate(date) {
  if (!date) return "-";
  return new Date(date).toLocaleString("id-ID", {
    day: "2-digit",
    month: "long",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export function hasCover(cover) {
  return typeof cover === "string" && cover !== "" && !cover.endsWith("/");
}
