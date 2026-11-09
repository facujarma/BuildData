import Icon from "../_components/Icon";

const ITEMS = [
  {
    icon: "clock",
    title: "La información vive en cinco chats",
    body: "Avances, pedidos y problemas repartidos entre grupos de WhatsApp, planillas y un cuaderno. Nadie tiene el panorama completo.",
    quote: '"Me entero de los problemas cuando ya frenaron la obra."',
    who: "JM",
    role: "Director de obra",
  },
  {
    icon: "chart",
    title: "Armar un reporte te lleva 2 días",
    body: "Cada vez que el cliente pide el estado de la obra, alguien consolida datos a mano durante horas.",
    quote: '"La información llega tarde — y cuando llega, ya no sirve."',
    who: "AG",
    role: "Arquitecta",
  },
  {
    icon: "dollar",
    title: "No sabés el costo real hasta que es tarde",
    body: "El presupuesto vive en un Excel desactualizado. El desvío aparece cuando ya no tiene corrección.",
    quote: '"Las cifras no reflejan lo que realmente pasa en obra."',
    who: "LB",
    role: "Compras",
  },
];

export default function Problema() {
  return (
    <section id="problema" className="relative py-[110px] bg-white overflow-hidden">
      <div className="bd-dots bd-dots-tr" aria-hidden="true" />
      <div className="relative max-w-[1180px] mx-auto px-6">
        <div className="max-w-[680px] mb-14">
          <div className="eyebrow text-primary mb-4">El problema</div>
          <h2 className="text-[clamp(30px,4.2vw,48px)] leading-[1.08] font-extrabold display-tight text-slate950 mb-4">
            Si gestionás más de una obra,
            <br />
            al menos dos de estas te pasan.
          </h2>
          <p className="text-[16px] text-slate500 leading-relaxed">
            No es falta de información: está dispersa y desactualizada cuando más la necesitás.
          </p>
        </div>

        <div className="grid md:grid-cols-3 gap-6">
          {ITEMS.map((item) => (
            <div key={item.title} className="bg-paper rounded-[26px] p-8 flex flex-col">
              <span className="w-14 h-14 rounded-2xl bg-primary-50 text-primary flex items-center justify-center mb-7">
                <Icon name={item.icon} size={24} />
              </span>
              <h3 className="text-[21px] font-extrabold display-tight text-slate950 leading-tight mb-3">
                {item.title}
              </h3>
              <p className="text-[14.5px] text-slate600 leading-relaxed mb-7 flex-1">
                {item.body}
              </p>
              <div className="bg-primary-50 rounded-2xl p-4 flex items-start gap-3">
                <p className="text-[13px] text-slate700 leading-snug flex-1">{item.quote}</p>
                <span className="w-9 h-9 rounded-full bg-primary text-white text-[11px] font-extrabold flex items-center justify-center flex-none">
                  {item.who}
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
