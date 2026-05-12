import { Building2, KeyRound, Loader2 } from "lucide-react";
import { FormEvent, useState } from "react";
import { Navigate } from "react-router-dom";
import { Button } from "../components/Button";
import { useAuth } from "../context/AuthContext";
import { useToast } from "../context/ToastContext";

export function LoginPage() {
  const { login, user } = useAuth();
  const { showToast } = useToast();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  if (user) {
    return <Navigate to="/" replace />;
  }

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    setLoading(true);
    try {
      await login(email, password);
      showToast("تم تسجيل الدخول", "success");
    } catch (error) {
      showToast(error instanceof Error ? error.message : "تعذر تسجيل الدخول", "error");
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="grid min-h-screen grid-cols-1 lg:grid-cols-[1.05fr_0.95fr]" dir="rtl">
      <section className="hidden bg-[url('https://images.unsplash.com/photo-1600585154340-be6161a56a0c?auto=format&fit=crop&w=1500&q=80')] bg-cover bg-center lg:block">
        <div className="flex h-full items-end bg-slate-950/35 p-10 text-white">
          <div>
            <p className="text-sm font-bold uppercase tracking-[0.2em]">Al Kayan</p>
            <h1 className="mt-3 max-w-xl text-5xl font-extrabold leading-tight">إدارة عقارات المكتب بثقة وسرعة</h1>
          </div>
        </div>
      </section>

      <section className="flex items-center justify-center px-4 py-10">
        <form className="surface w-full max-w-md rounded-lg p-6" onSubmit={handleSubmit}>
          <div className="mb-8 flex items-center gap-3">
            <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-teal-700 text-white">
              <Building2 className="h-7 w-7" />
            </div>
            <div>
              <p className="text-2xl font-extrabold text-slate-950">Al Kayan</p>
              <p className="text-sm font-semibold text-slate-500">لوحة العقارات</p>
            </div>
          </div>

          <div className="grid gap-4">
            <label>
              <span className="label">البريد الإلكتروني</span>
              <input className="field" type="email" value={email} onChange={(event) => setEmail(event.target.value)} required />
            </label>
            <label>
              <span className="label">كلمة المرور</span>
              <input className="field" type="password" value={password} onChange={(event) => setPassword(event.target.value)} required minLength={8} />
            </label>
          </div>

          <Button className="mt-6 w-full" type="submit" loading={loading}>
            {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <KeyRound className="h-4 w-4" />}
            دخول
          </Button>
        </form>
      </section>
    </main>
  );
}
