import type { Category, Product, StoreSettings } from "@/types";

/** Gera uma imagem SVG (data URI) com emoji, usada só nos dados de demonstração. */
function art(emoji: string, from: string, to: string): string {
  const svg =
    `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 600 600">` +
    `<defs><linearGradient id="g" x1="0" y1="0" x2="1" y2="1">` +
    `<stop offset="0" stop-color="${from}"/><stop offset="1" stop-color="${to}"/>` +
    `</linearGradient></defs><rect width="600" height="600" fill="url(#g)"/>` +
    `<text x="300" y="340" font-size="220" text-anchor="middle">${emoji}</text></svg>`;
  return `data:image/svg+xml;utf8,${encodeURIComponent(svg)}`;
}

export const DEMO_STORE: StoreSettings = {
  store_name: "Papelaria da Maria",
  tagline: "Artigos personalizados feitos com carinho",
  logo_url: null,
  brand_color: "#e11d74",
  banner_image_url: null,
  banner_title: "Novidades da semana",
  banner_text:
    "Cadernos e agendas personalizados com o seu nome. Faça seu pedido pelo WhatsApp!",
  whatsapp_number: "5521999998888",
  payment_methods: ["pix", "credito", "debito", "dinheiro"],
  accepts_delivery: true,
  accepts_pickup: true,
  store_info: "Atendimento de segunda a sábado, das 9h às 18h.",
};

export const DEMO_CATEGORIES: Category[] = [
  { id: "cat-cadernos", name: "Cadernos", position: 1 },
  { id: "cat-agendas", name: "Agendas", position: 2 },
  { id: "cat-presentes", name: "Presentes", position: 3 },
];

export const DEMO_PRODUCTS: Product[] = [
  {
    id: "caderno-personalizado",
    category_id: "cat-cadernos",
    name: "Caderno personalizado",
    description:
      "Caderno com capa dura e 96 folhas pautadas. Personalizamos a capa com o nome e a cor que você escolher. Ideal para presentear ou para o dia a dia.",
    price: 45,
    images: [art("📓", "#fbcfe8", "#f472b6")],
    available: true,
    variants: [
      { name: "Cor da capa", options: ["Rosa", "Azul", "Verde", "Lilás"] },
      { name: "Tamanho", options: ["A5", "A4"] },
    ],
  },
  {
    id: "caderno-universitario",
    category_id: "cat-cadernos",
    name: "Caderno universitário 10 matérias",
    description:
      "Caderno espiral com 200 folhas, divisórias coloridas e capa resistente. Perfeito para estudantes.",
    price: 38.9,
    images: [art("📚", "#bae6fd", "#38bdf8")],
    available: true,
    variants: [],
  },
  {
    id: "caderno-sketchbook",
    category_id: "cat-cadernos",
    name: "Sketchbook para desenho",
    description:
      "Papel 140g/m², ideal para lápis de cor, grafite e aquarela leve. Capa dura com elástico.",
    price: 52,
    images: [art("🎨", "#fde68a", "#f59e0b")],
    available: false,
    variants: [],
  },
  {
    id: "agenda-personalizada",
    category_id: "cat-agendas",
    name: "Agenda personalizada 2027",
    description:
      "Agenda diária com planejamento mensal, metas e espaço para anotações. O nome fica gravado na capa.",
    price: 60,
    images: [art("📅", "#ddd6fe", "#8b5cf6")],
    available: true,
    variants: [{ name: "Cor da capa", options: ["Lilás", "Preta", "Rosa"] }],
  },
  {
    id: "planner-semanal",
    category_id: "cat-agendas",
    name: "Planner semanal",
    description:
      "Bloco destacável com 52 semanas, lista de tarefas e acompanhamento de hábitos.",
    price: 34.5,
    images: [art("✅", "#bbf7d0", "#22c55e")],
    available: true,
    variants: [],
  },
  {
    id: "kit-presente",
    category_id: "cat-presentes",
    name: "Kit presente: caderno + caneta",
    description:
      "Caderno A5 personalizado e caneta gel, embalados em caixa de presente com laço.",
    price: 69.9,
    images: [art("🎁", "#fecdd3", "#fb7185")],
    available: true,
    variants: [{ name: "Cor do laço", options: ["Vermelho", "Dourado", "Rosa"] }],
  },
  {
    id: "marcador-de-pagina",
    category_id: "cat-presentes",
    name: "Marcador de página magnético",
    description: "Conjunto com 4 marcadores magnéticos em formatos divertidos.",
    price: 12,
    images: [art("🔖", "#fed7aa", "#fb923c")],
    available: true,
    variants: [],
  },
  {
    id: "adesivos",
    category_id: null,
    name: "Cartela de adesivos",
    description:
      "Cartela com 30 adesivos resistentes à água, para decorar cadernos, garrafas e notebooks.",
    price: 9.9,
    images: [art("⭐", "#fef08a", "#eab308")],
    available: true,
    variants: [],
  },
];
