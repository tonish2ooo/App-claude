/**
 * Éligibilité au paiement par titre-restaurant (France) et classement par rayon.
 *
 * Règle générale (réglementation CNTR) : un titre-restaurant permet de régler
 * des produits alimentaires directement consommables ou préparables, ainsi que
 * les fruits et légumes. Sont exclus l'alcool, les produits d'hygiène,
 * d'entretien, pour animaux et plus généralement tout produit non alimentaire.
 *
 * La déduction automatique reste une estimation : l'utilisateur peut toujours
 * corriger manuellement l'éligibilité d'une fiche produit.
 */

import type { ProductCategory, TicketRestoEligibility } from "@/lib/types";

/** Libellé lisible d'une catégorie. */
export const CATEGORY_LABELS: Record<ProductCategory, string> = {
  fruits_legumes: "Fruits & légumes",
  boulangerie: "Boulangerie",
  cremerie: "Crèmerie & œufs",
  viande_poisson: "Viande & poisson",
  epicerie_salee: "Épicerie salée",
  epicerie_sucree: "Épicerie sucrée",
  plats_prepares: "Plats préparés",
  boissons: "Boissons",
  alcool: "Alcool",
  surgeles: "Surgelés",
  hygiene: "Hygiène & beauté",
  entretien: "Entretien & ménage",
  bebe: "Bébé",
  animaux: "Animaux",
  maison: "Maison & divers",
  autre: "Autre",
};

/** Emoji par rayon (affichage). */
export const CATEGORY_EMOJI: Record<ProductCategory, string> = {
  fruits_legumes: "🥦",
  boulangerie: "🥖",
  cremerie: "🧀",
  viande_poisson: "🥩",
  epicerie_salee: "🥫",
  epicerie_sucree: "🍫",
  plats_prepares: "🍱",
  boissons: "🧃",
  alcool: "🍷",
  surgeles: "🧊",
  hygiene: "🧴",
  entretien: "🧽",
  bebe: "🍼",
  animaux: "🐾",
  maison: "🏠",
  autre: "🛒",
};

/** Éligibilité titre-restaurant par défaut d'un rayon. */
const CATEGORY_ELIGIBILITY: Record<ProductCategory, TicketRestoEligibility> = {
  fruits_legumes: "eligible",
  boulangerie: "eligible",
  cremerie: "eligible",
  viande_poisson: "eligible",
  epicerie_salee: "eligible",
  epicerie_sucree: "eligible",
  plats_prepares: "eligible",
  boissons: "eligible", // boissons non alcoolisées
  surgeles: "eligible",
  alcool: "ineligible",
  hygiene: "ineligible",
  entretien: "ineligible",
  animaux: "ineligible",
  maison: "ineligible",
  bebe: "unknown", // dépend : petits pots (oui) vs couches (non)
  autre: "unknown",
};

/**
 * Mots-clés par rayon. L'ordre du tableau définit la priorité : les rayons
 * "exclusifs" (alcool, hygiène…) sont testés avant les rayons alimentaires
 * génériques pour éviter les faux positifs (ex : "bière" ≠ épicerie).
 */
const CATEGORY_KEYWORDS: Array<[ProductCategory, string[]]> = [
  [
    "alcool",
    [
      "vin", "rouge", "blanc", "rosé", "champagne", "bière", "biere", "pastis",
      "whisky", "vodka", "rhum", "gin", "apéritif", "aperitif", "alcool",
      "cidre", "porto", "martini", "spiritueux", "cubi", "ricard",
    ],
  ],
  [
    "hygiene",
    [
      "shampoing", "shampooing", "savon", "gel douche", "dentifrice", "brosse à dents",
      "déodorant", "deodorant", "rasoir", "mousse à raser", "coton", "mouchoir",
      "papier toilette", "pq", "serviette hygiénique", "tampon", "maquillage",
      "crème", "creme visage", "parfum", "cotons-tiges", "hygiène",
    ],
  ],
  [
    "entretien",
    [
      "lessive", "liquide vaisselle", "vaisselle", "éponge", "eponge", "javel",
      "nettoyant", "désinfectant", "desinfectant", "sopalin", "essuie-tout",
      "sac poubelle", "poubelle", "détergent", "detergent", "adoucissant",
      "spray", "balai", "serpillère", "serpilliere", "ménage", "menage",
    ],
  ],
  [
    "animaux",
    ["croquettes", "pâtée", "patee", "litière", "litiere", "chat", "chien", "animaux"],
  ],
  [
    "bebe",
    ["couche", "couches", "lingette", "lingettes", "petit pot", "lait bébé", "lait bebe", "bébé", "bebe", "biberon"],
  ],
  [
    "maison",
    ["ampoule", "pile", "piles", "bougie", "vaisselle jetable", "aluminium", "film étirable", "papier cuisson"],
  ],
  [
    // Testé avant les fruits/légumes : "jus d'orange" est une boisson, pas un fruit.
    "boissons",
    [
      "eau", "jus", "soda", "coca", "limonade", "sirop", "thé", "the", "café", "cafe",
      "infusion", "boisson", "ice tea", "perrier", "diabolo", "smoothie",
    ],
  ],
  [
    "fruits_legumes",
    [
      "pomme", "pommes", "banane", "bananes", "orange", "oranges", "citron", "citrons",
      "fraise", "fraises", "raisin", "tomate", "tomates", "salade", "carotte", "carottes",
      "pomme de terre", "patate", "patates", "oignon", "oignons", "ail", "courgette",
      "courgettes", "poivron", "poivrons", "concombre", "champignon", "champignons",
      "brocoli", "épinard", "epinard", "haricot", "haricots", "avocat", "kiwi", "melon",
      "pastèque", "pasteque", "poire", "poires", "clémentine", "clementine", "mandarine",
      "fruits", "légumes", "legumes", "ananas", "mangue", "framboise", "myrtille",
    ],
  ],
  [
    "boulangerie",
    [
      "pain", "baguette", "baguettes", "croissant", "croissants", "viennoiserie",
      "brioche", "pain de mie", "pain au chocolat", "chocolatine", "tartine",
      "biscotte", "biscottes",
    ],
  ],
  [
    "cremerie",
    [
      "lait", "beurre", "yaourt", "yaourts", "fromage", "fromages", "crème fraîche",
      "creme fraiche", "oeuf", "oeufs", "œuf", "œufs", "emmental", "camembert",
      "comté", "comte", "mozzarella", "gruyère", "gruyere", "petit suisse", "skyr",
      "fromage blanc", "crème", "creme",
    ],
  ],
  [
    "viande_poisson",
    [
      "poulet", "boeuf", "bœuf", "porc", "steak", "haché", "hache", "jambon", "lardons",
      "saucisse", "saucisses", "viande", "côte", "cote", "escalope", "dinde", "agneau",
      "poisson", "saumon", "thon", "cabillaud", "crevette", "crevettes", "moules",
      "filet", "merguez", "chipolata", "rôti", "roti",
    ],
  ],
  [
    "surgeles",
    ["surgelé", "surgele", "surgelés", "glace", "glaces", "frites surgelées", "pizza surgelée", "légumes surgelés"],
  ],
  [
    "plats_prepares",
    [
      "pizza", "quiche", "lasagne", "lasagnes", "plat préparé", "plat prepare",
      "sandwich", "salade composée", "sushi", "soupe", "raviolis", "gratin",
      "tarte", "croque-monsieur", "nuggets",
    ],
  ],
  [
    "epicerie_salee",
    [
      "pâtes", "pates", "riz", "farine", "huile", "sel", "poivre", "épice", "epice",
      "épices", "epices", "conserve", "sauce", "ketchup", "mayonnaise", "moutarde",
      "lentilles", "semoule", "couscous", "bouillon", "vinaigre",
      "chips", "gâteau apéritif", "olives", "cornichons", "soja",
    ],
  ],
  [
    "epicerie_sucree",
    [
      "sucre", "chocolat", "chocolats", "bonbon", "bonbons", "biscuit", "biscuits",
      "gâteau", "gateau", "céréales", "cereales", "confiture", "miel", "nutella",
      "compote", "gaufre", "madeleine", "barre chocolatée", "pâte à tartiner", "pate a tartiner",
    ],
  ],
];

function normalize(text: string): string {
  return text
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "") // retire les accents pour matcher "creme" ~ "crème"
    .trim();
}

/**
 * Devine le rayon d'un produit à partir de son libellé.
 * Renvoie "autre" si aucun mot-clé ne correspond.
 */
export function inferCategory(label: string): ProductCategory {
  const n = normalize(label);
  for (const [category, keywords] of CATEGORY_KEYWORDS) {
    for (const kw of keywords) {
      const nk = normalize(kw);
      // Correspondance par mot entier pour éviter "thé" dans "thon", etc.
      const re = new RegExp(`(^|\\W)${escapeRegExp(nk)}(\\W|$)`);
      if (re.test(n)) return category;
    }
  }
  return "autre";
}

/** Éligibilité titre-restaurant déduite d'un rayon. */
export function eligibilityForCategory(category: ProductCategory): TicketRestoEligibility {
  return CATEGORY_ELIGIBILITY[category];
}

/**
 * Déduit l'éligibilité titre-restaurant d'un produit à partir de son libellé
 * (et de sa catégorie si déjà connue).
 */
export function inferEligibility(label: string, category?: ProductCategory): TicketRestoEligibility {
  const cat = category ?? inferCategory(label);
  return CATEGORY_ELIGIBILITY[cat];
}

/** Libellé court de l'éligibilité (UI). */
export function eligibilityLabel(e: TicketRestoEligibility): string {
  switch (e) {
    case "eligible":
      return "Ticket resto";
    case "ineligible":
      return "Hors ticket resto";
    default:
      return "À vérifier";
  }
}

function escapeRegExp(s: string): string {
  return s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}
