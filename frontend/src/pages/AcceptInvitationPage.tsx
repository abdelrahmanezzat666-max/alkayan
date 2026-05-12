import { Building2, ShieldCheck } from "lucide-react";
import { FormEvent, useMemo, useState } from "react";
import { Navigate, useSearchParams } from "react-router-dom";
import { Button } from "../components/Button";
import { useAuth } from "../context/AuthContext";
import { useToast } from "../context/ToastContext";

export function AcceptInvitationPage() {
  const [params] = useSearchParams();
  const token = useMemo(() => params.get("token") ?? "", [params]);
  const { acceptInvitation, user } = useAuth();
  const { showToast } = useToast();
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);

  if (user) {
    return <Navigate to="/" replace />;
  }

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();

    if (password !== confirmPassword) {
      showToast("كلمتا المرور غير متطابقتين", "error");
      return;
    }

    setLoading(true);
    try {
      await acceptInvitation(token, password);
      showToast("تم تفعيل الحساب", "success");
    } catch (error) {
      showToast(error instanceof Error ? error.message : "تعذر تفعيل الدعوة", "error");
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="flex min-h-screen items-center justify-center px-4 py-10" dir="rtl">
      <form className="surface w-full max-w-md rounded-lg p-6" onSubmit={handleSubmit}>
        <div className="mb-8 flex items-center gap-3">
          <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-teal-700 text-white">
            <Building2 className="h-7 w-7" />
          </div>
          <div>
            <p className="text-2xl font-extrabold text-slate-950">تفعيل الدعوة</p>
            <p className="text-sm font-semibold text-slate-500">Al Kayan</p>
          </div>
        </div>

        {!token ? (
          <div className="rounded-lg border border-rose-200 bg-rose-50 p-4 text-sm font-semibold text-rose-900">رابط الدعوة غير صالح</div>
        ) : (
          <>
            <div className="grid gap-4">
              <label>
                <span className="label">كلمة المرور الجديدة</span>
                <input className="field" type="password" value={password} onChange={(event) => setPassword(event.target.value)} required minLength={8} />
              </label>
              <label>
                <span className="label">تأكيد كلمة المرور</span>
                <input className="field" type="password" value={confirmPassword} onChange={(event) => setConfirmPassword(event.target.value)} required minLength={8} />
              </label>
            </div>

            <Button className="mt-6 w-full" type="submit" loading={loading}>
              <ShieldCheck className="h-4 w-4" />
              إنشاء الحساب
            </Button>
          </>
        )}
      </form>
    </main>
  );
}
