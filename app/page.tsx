import FingerprintScanner from "@/app/UI/finger-print";

export default function Page() {
  return (
    <main className="p-8">
      <h1 className="text-2xl font-bold mb-4">SecuGen Scanner POC</h1>
      <FingerprintScanner />
    </main>
  );
}
