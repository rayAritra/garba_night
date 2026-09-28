"use client";

// Last-resort boundary when the root layout itself fails; must render its own <html>.
export default function GlobalError({ reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return (
    <html lang="en">
      <body style={{ margin: 0, minHeight: "100dvh", display: "grid", placeItems: "center", background: "#050505", color: "#F4F1EC", fontFamily: "system-ui, sans-serif", textAlign: "center" }}>
        <main>
          <h1 style={{ fontSize: 28, margin: "0 0 12px" }}>Something slipped.</h1>
          <button type="button" onClick={reset} style={{ height: 52, padding: "0 24px", border: 0, borderRadius: 999, fontWeight: 700, background: "linear-gradient(135deg,#FFC15E,#F08A2C)", color: "#1A0E05", cursor: "pointer" }}>
            Try again
          </button>
        </main>
      </body>
    </html>
  );
}
