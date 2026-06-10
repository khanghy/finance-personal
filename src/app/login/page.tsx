import { Mail } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { signInWithMagicLink, signInWithPassword } from "./actions";

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ sent?: string; error?: string }>;
}) {
  const params = await searchParams;

  return (
    <main className="flex min-h-screen items-center justify-center bg-slate-50 px-4">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle>Đăng nhập Finance Personal</CardTitle>
          <CardDescription>Nhập email để nhận magic link từ Supabase Auth.</CardDescription>
        </CardHeader>
        <CardContent>
          <form action={signInWithPassword} className="grid gap-4">
            <Input name="email" type="email" placeholder="ban@example.com" required />
            <Input name="password" type="password" placeholder="Mật khẩu" required />
            <Button type="submit">Đăng nhập</Button>
          </form>

          <div className="my-5 h-px bg-slate-200" />

          <form action={signInWithMagicLink} className="grid gap-4">
            <Input name="email" type="email" placeholder="ban@example.com" required />
            <Button type="submit">
              <Mail size={16} /> Gửi magic link
            </Button>
            {params.sent ? <p className="text-sm text-emerald-700">Đã gửi link đăng nhập. Hãy kiểm tra email của bạn.</p> : null}
            {params.error ? <p className="text-sm text-rose-700">Không thể gửi link: {params.error}</p> : null}
          </form>
        </CardContent>
      </Card>
    </main>
  );
}
