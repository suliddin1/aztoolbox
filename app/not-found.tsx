import Link from "next/link";

export default function NotFound() {
  return (
    <div className="mx-auto flex w-full max-w-3xl flex-col items-center px-4 py-20 text-center">
      <h1 className="text-3xl font-semibold">Səhifə tapılmadı</h1>
      <p className="mt-3 text-muted">Axtardığınız alət və ya səhifə mövcud deyil.</p>
      <Link
        href="/"
        className="mt-6 inline-flex h-11 items-center rounded-md bg-accent px-5 text-sm font-semibold text-white hover:bg-accent-strong"
      >
        Ana səhifəyə qayıt
      </Link>
    </div>
  );
}
