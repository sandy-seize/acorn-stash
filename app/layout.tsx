import type { Metadata, Viewport } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "세니의 도토리 모으기 🌰",
  description: "종목·원자재 단발 심층 리서치 + VR법 운용 비서",
  formatDetection: { telephone: false },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
  themeColor: "#EC4899",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="ko">
      <head>
        <link
          rel="stylesheet"
          href="https://cdn.jsdelivr.net/gh/orioncactus/pretendard@v1.3.9/dist/web/static/pretendard.css"
        />
      </head>
      <body>
        {children}
        <footer className="mt-16 border-t border-dashed border-[rgb(var(--border-strong))] py-6 text-center text-xs tracking-wide text-[rgb(var(--muted))]">
          🌰 세니의 도토리 모으기 · 도토리 한 알도 신중하게
        </footer>
      </body>
    </html>
  );
}
