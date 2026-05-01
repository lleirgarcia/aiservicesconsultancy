import { AdminLoginForm } from "@/components/blog/admin/AdminLoginForm";

interface PageProps {
  searchParams: Promise<{ from?: string }>;
}

export default async function AdminLoginPage({ searchParams }: PageProps) {
  const { from } = await searchParams;
  return <AdminLoginForm from={from} />;
}
