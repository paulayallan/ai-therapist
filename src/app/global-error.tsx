"use client";

export default function GlobalError({ reset }: { error: Error; reset: () => void }) {
  return (
    <html lang="en-AU">
      <body
        style={{
          margin: 0,
          minHeight: "100dvh",
          display: "grid",
          placeItems: "center",
          background: "#faf6f0",
          color: "#292521",
          fontFamily: "ui-sans-serif, system-ui, sans-serif",
          padding: "1.5rem",
        }}
      >
        <main style={{ maxWidth: "26rem", textAlign: "center" }}>
          <h1 style={{ fontSize: "1.6rem", fontWeight: 500, margin: 0 }}>
            Something broke on our side
          </h1>
          <p style={{ marginTop: "0.75rem", lineHeight: 1.6, color: "#6e665c" }}>
            Nothing you saved has been lost. If you need support right now, call your local crisis
            line — in Australia, Lifeline on 13 11 14, or 000 in an emergency.
          </p>
          <button
            type="button"
            onClick={reset}
            style={{
              marginTop: "1.5rem",
              padding: "0.7rem 1.4rem",
              borderRadius: "0.75rem",
              border: "none",
              background: "#5c7a6b",
              color: "white",
              fontSize: "0.95rem",
              cursor: "pointer",
            }}
          >
            Try again
          </button>
        </main>
      </body>
    </html>
  );
}
