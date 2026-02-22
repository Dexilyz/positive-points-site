export default function App() {
  return (
    <div style={{
      minHeight: "100vh",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      background: "#0b0f1a",
      color: "white",
      fontFamily: "system-ui, -apple-system, Segoe UI, Roboto, Arial"
    }}>
      <div style={{
        width: 720,
        maxWidth: "92vw",
        padding: 28,
        borderRadius: 18,
        background: "rgba(255,255,255,0.06)",
        border: "1px solid rgba(255,255,255,0.12)"
      }}>
        <h1 style={{ margin: 0, fontSize: 34 }}>Teacher Points</h1>
        <p style={{ opacity: 0.85, lineHeight: 1.5 }}>
          Скачай файл приложения и открой его на компьютере.
          Работает как отдельное приложение (пока в формате HTML).
        </p>

        <a
          href="/Приложение%20для%20учителя%20v2.9.html"
          download
          style={{
            display: "inline-block",
            marginTop: 14,
            padding: "12px 18px",
            borderRadius: 12,
            background: "#4f8cff",
            color: "white",
            textDecoration: "none",
            fontWeight: 700
          }}
        >
          ⬇️ Скачать приложение
        </a>

        <div style={{ marginTop: 16, opacity: 0.7, fontSize: 13 }}>
          Если файл не скачивается, нажми правой кнопкой → “Сохранить как…”
        </div>
      </div>
    </div>
  );
}