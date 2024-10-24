import CreateVaultPage from "@/components/create-vault/createVaultPage";

export default async function Home() {
  return (
    <main className="z-10 flex flex-col items-center justify-center text-white">
      <CreateVaultPage />
    </main>
  );
}
