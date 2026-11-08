import Link from "next/link";

export default function NotFound() {
  return (
    <div className="min-h-[60vh] flex items-center justify-center px-4">
      <div className="max-w-md w-full border border-border bg-surface p-8 text-center">
        <p className="text-xs uppercase tracking-[0.24em] text-secondary-text mb-3">
          404
        </p>
        <h1 className="text-2xl font-bold text-primary-text font-display uppercase">
          Halaman tidak ditemukan
        </h1>
        <p className="text-secondary-text mt-4 leading-relaxed">
          Konten yang Anda cari sudah dihapus atau alamatnya salah.
        </p>
        <div className="mt-8 flex flex-col sm:flex-row gap-3 justify-center">
          <Link
            href="/"
            className="px-6 py-3 bg-accent text-charcoal text-sm font-medium uppercase tracking-widest hover:opacity-90 transition-opacity"
          >
            Ke Beranda
          </Link>
          <Link
            href="/schedule"
            className="px-6 py-3 border border-border text-primary-text text-sm font-medium uppercase tracking-widest hover:bg-elevated transition-colors"
          >
            Lihat Jadwal
          </Link>
        </div>
      </div>
    </div>
  );
}
