"use client";

import { useEffect, useState } from "react";

function urlBase64ToUint8Array(base64: string): Uint8Array {
  const padding = "=".repeat((4 - (base64.length % 4)) % 4);
  const b64 = (base64 + padding).replace(/-/g, "+").replace(/_/g, "/");
  const raw = atob(b64);
  const arr = new Uint8Array(raw.length);
  for (let i = 0; i < raw.length; i++) arr[i] = raw.charCodeAt(i);
  return arr;
}

export function PushToggle() {
  const [msg, setMsg] = useState<string>("");
  const [busy, setBusy] = useState(false);
  const [subscribed, setSubscribed] = useState(false);
  const [supported, setSupported] = useState(true);
  const [iosNeedsInstall, setIosNeedsInstall] = useState(false);

  useEffect(() => {
    const supp = "serviceWorker" in navigator && "PushManager" in window && "Notification" in window;
    setSupported(supp);
    const isIos = /iPad|iPhone|iPod/.test(navigator.userAgent);
    const standalone =
      window.matchMedia("(display-mode: standalone)").matches ||
      (navigator as unknown as { standalone?: boolean }).standalone === true;
    if (isIos && !standalone) setIosNeedsInstall(true);
    if (supp) {
      navigator.serviceWorker.getRegistration().then((reg) => {
        reg?.pushManager.getSubscription().then((s) => setSubscribed(!!s));
      });
    }
  }, []);

  async function enable() {
    setBusy(true);
    setMsg("");
    try {
      const reg = await navigator.serviceWorker.register("/sw.js");
      await navigator.serviceWorker.ready;
      const perm = await Notification.requestPermission();
      if (perm !== "granted") {
        setMsg("알림 권한이 거부됐어요. 브라우저 설정에서 허용해 주세요.");
        setBusy(false);
        return;
      }
      const key = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY;
      if (!key) {
        setMsg("서버 VAPID 키가 설정되지 않았어요.");
        setBusy(false);
        return;
      }
      const sub = await reg.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array(key) as BufferSource,
      });
      const res = await fetch("/api/push/subscribe", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ subscription: sub.toJSON() }),
      });
      if (res.ok) {
        setSubscribed(true);
        setMsg("✅ 알림이 켜졌어요. 자동매매 실행 시 알려드릴게요.");
      } else {
        setMsg("구독 저장에 실패했어요.");
      }
    } catch (e) {
      setMsg("오류: " + String(e instanceof Error ? e.message : e));
    }
    setBusy(false);
  }

  async function test() {
    setBusy(true);
    const r = await fetch("/api/push/test", { method: "POST" }).then((x) => x.json()).catch(() => null);
    setMsg(r ? `테스트 발송: ${r.sent}건 성공${r.failed ? `, ${r.failed} 실패` : ""}${r.reason ? ` (${r.reason})` : ""}` : "테스트 실패");
    setBusy(false);
  }

  if (!supported) {
    return <p className="text-xs text-[rgb(var(--muted))]">이 브라우저는 웹 푸시를 지원하지 않아요.</p>;
  }

  return (
    <div className="flex flex-wrap items-center gap-2">
      <button
        onClick={enable}
        disabled={busy}
        className="rounded-full bg-[rgb(var(--accent))] px-4 py-1.5 text-xs font-bold text-white disabled:opacity-50"
      >
        {subscribed ? "🔔 알림 켜짐 (재구독)" : "🔔 알림 켜기"}
      </button>
      {subscribed && (
        <button
          onClick={test}
          disabled={busy}
          className="rounded-full border border-[rgb(var(--accent))] px-4 py-1.5 text-xs font-bold text-[rgb(var(--accent))] disabled:opacity-50"
        >
          테스트 알림
        </button>
      )}
      {iosNeedsInstall && (
        <span className="text-[11px] text-[rgb(var(--warning))]">
          아이폰은 공유 → <b>홈 화면에 추가</b> 후 열어야 알림이 가능해요.
        </span>
      )}
      {msg && <span className="w-full text-[11px] text-[rgb(var(--muted))]">{msg}</span>}
    </div>
  );
}
