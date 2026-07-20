"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { getSupabaseBrowser } from "@/lib/supabase-browser";

export default function AuthCallbackPage() {
  const router = useRouter();
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    const sb = getSupabaseBrowser();
    if (!sb) {
      setFailed(true);
      return;
    }
    let done = false;
    // detectSessionInUrl 会自动解析回跳里的 token；这里等会话就绪再跳。
    const finish = (ok: boolean) => {
      if (done) return;
      done = true;
      if (ok) router.replace("/me");
      else setFailed(true);
    };
    const { data: sub } = sb.auth.onAuthStateChange((_e, session) => {
      if (session) finish(true);
    });
    sb.auth.getSession().then(({ data }) => {
      if (data.session) finish(true);
    });
    const t = setTimeout(() => finish(false), 6000);
    return () => {
      sub.subscription.unsubscribe();
      clearTimeout(t);
    };
  }, [router]);

  return (
    <div className="mx-auto flex min-h-[60vh] max-w-md flex-col items-center justify-center px-6 text-center">
      {failed ? (
        <>
          <h1 className="display text-2xl text-bone">登录链接失效了</h1>
          <p className="mt-3 text-sm text-ash">
            链接可能过期或已用过。
            <Link href="/login" className="text-volt hover:underline">
              {" "}重新发一封
            </Link>
            。
          </p>
        </>
      ) : (
        <>
          <div className="size-8 animate-spin rounded-full border-2 border-fog-2 border-t-volt" />
          <p className="mt-4 text-sm text-dust">登录中…</p>
        </>
      )}
    </div>
  );
}
