import LiveBot from "../_components/LiveBot";

export default function ChatbotSection() {
  return (
    <section id="chatbot" className="relative py-[110px] bg-paper overflow-hidden">
      <div className="bd-dots bd-dots-chat" aria-hidden="true" />
      <div className="relative max-w-[1180px] mx-auto px-6">
        <div className="max-w-[640px] mb-12">
          <div className="text-[12px] font-bold text-primary mb-3">El bot de WhatsApp</div>
          <h2 className="text-[clamp(30px,4vw,44px)] leading-[1.1] font-extrabold display-tight text-slate950 mb-4">
            Tu equipo le habla como a un compañero.
          </h2>
          <p className="text-[16px] leading-relaxed text-slate600">
            Está dentro del grupo de WhatsApp de la obra. Probá cómo responde a un pedido, a una
            falla o a un mensaje incompleto.
          </p>
        </div>
        <LiveBot />
      </div>
    </section>
  );
}
