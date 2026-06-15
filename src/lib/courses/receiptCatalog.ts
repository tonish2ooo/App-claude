/**
 * Catalogue de produits extrait de tickets de caisse réels (Auchan).
 *
 * Source : deux tickets fournis par l'utilisateur. L'éligibilité titre-restaurant
 * (`ticketResto`) provient du marqueur `*` imprimé devant chaque article
 * alimentaire sur le ticket (les tickets totalisent d'ailleurs les « articles
 * éligibles TR ») : c'est donc une donnée d'origine, plus fiable que la
 * déduction automatique par mots-clés. Les prix sont les prix unitaires en
 * centimes. Les doublons inter-tickets ont été fusionnés.
 */

import type { ProductCategory, TicketRestoEligibility } from "@/lib/types";

export interface CatalogProduct {
  name: string;
  brand?: string;
  priceCents: number;
  category: ProductCategory;
  ticketResto: TicketRestoEligibility;
}

const E: TicketRestoEligibility = "eligible";
const I: TicketRestoEligibility = "ineligible";

export const RECEIPT_CATALOG: CatalogProduct[] = [
  // --- Crèmerie & œufs (éligibles TR) ---
  { name: "Mozzarella", brand: "Auchan", priceCents: 146, category: "cremerie", ticketResto: E },
  { name: "Boursin ail & fines herbes", brand: "Boursin", priceCents: 267, category: "cremerie", ticketResto: E },
  { name: "Boursin salade", brand: "Boursin", priceCents: 246, category: "cremerie", ticketResto: E },
  { name: "Mini Babybel", brand: "Babybel", priceCents: 211, category: "cremerie", ticketResto: E },
  { name: "Mini Babybel filet", brand: "Babybel", priceCents: 239, category: "cremerie", ticketResto: E },
  { name: "Caprice des Dieux", brand: "Caprice des Dieux", priceCents: 389, category: "cremerie", ticketResto: E },
  { name: "Cheddar râpé", brand: "Auchan", priceCents: 272, category: "cremerie", ticketResto: E },
  { name: "Fromage frais", brand: "Auchan", priceCents: 140, category: "cremerie", ticketResto: E },
  { name: "Tartare ail & fines herbes", brand: "Tartare", priceCents: 221, category: "cremerie", ticketResto: E },
  { name: "Parmesan", brand: "Parmareggio", priceCents: 161, category: "cremerie", ticketResto: E },
  { name: "La Vache qui rit 24 portions", brand: "La Vache qui rit", priceCents: 415, category: "cremerie", ticketResto: E },
  { name: "Emmental tranché", brand: "Président", priceCents: 265, category: "cremerie", ticketResto: E },
  { name: "Emmental", brand: "Entremont", priceCents: 247, category: "cremerie", ticketResto: E },
  { name: "Comté râpé", brand: "Entremont", priceCents: 273, category: "cremerie", ticketResto: E },
  { name: "Fromage tranché", brand: "Entremont", priceCents: 285, category: "cremerie", ticketResto: E },
  { name: "Gouda tranché", brand: "Auchan", priceCents: 214, category: "cremerie", ticketResto: E },
  { name: "Edam tranché", brand: "Auchan", priceCents: 218, category: "cremerie", ticketResto: E },
  { name: "Feta", brand: "Auchan", priceCents: 277, category: "cremerie", ticketResto: E },
  { name: "Kiri Goûter", brand: "Kiri", priceCents: 232, category: "cremerie", ticketResto: E },
  { name: "Leerdammer", brand: "Leerdammer", priceCents: 292, category: "cremerie", ticketResto: E },
  { name: "Salakis basilic", brand: "Salakis", priceCents: 400, category: "cremerie", ticketResto: E },
  { name: "Salakis herbes", brand: "Salakis", priceCents: 375, category: "cremerie", ticketResto: E },
  { name: "Mousse de fromage", brand: "Auchan", priceCents: 187, category: "cremerie", ticketResto: E },
  { name: "Crème fraîche épaisse", brand: "Président", priceCents: 239, category: "cremerie", ticketResto: E },
  { name: "Lait entier", priceCents: 124, category: "cremerie", ticketResto: E },
  { name: "Lait demi-écrémé", brand: "Lactel", priceCents: 75, category: "cremerie", ticketResto: E },
  { name: "Beurre", brand: "Elle & Vire", priceCents: 285, category: "cremerie", ticketResto: E },
  { name: "Œufs moyens", brand: "Loué", priceCents: 479, category: "cremerie", ticketResto: E },
  { name: "Œufs nouvelle agriculture", brand: "Auchan", priceCents: 407, category: "cremerie", ticketResto: E },

  // --- Yaourts & desserts frais (éligibles TR) ---
  { name: "Yaourt à la framboise", brand: "Siggi's", priceCents: 226, category: "cremerie", ticketResto: E },
  { name: "Skyr nature", brand: "Yoplait", priceCents: 349, category: "cremerie", ticketResto: E },
  { name: "Yaourt nature", brand: "Auchan", priceCents: 103, category: "cremerie", ticketResto: E },
  { name: "Danonino", brand: "Danone", priceCents: 324, category: "cremerie", ticketResto: E },
  { name: "Danonino Go", brand: "Danone", priceCents: 256, category: "cremerie", ticketResto: E },
  { name: "P'tit Filou", brand: "Yoplait", priceCents: 351, category: "cremerie", ticketResto: E },
  { name: "Petits Filous", brand: "Yoplait", priceCents: 340, category: "cremerie", ticketResto: E },
  { name: "Les 2 Vaches p'tits miam (bio)", brand: "Les 2 Vaches", priceCents: 267, category: "cremerie", ticketResto: E },
  { name: "Yaourt Smarties", brand: "Nestlé", priceCents: 249, category: "cremerie", ticketResto: E },
  { name: "Danette pop chocolat", brand: "Danette", priceCents: 262, category: "cremerie", ticketResto: E },
  { name: "Danette expresso", brand: "Danette", priceCents: 175, category: "cremerie", ticketResto: E },
  { name: "Danette caramel", brand: "Danette", priceCents: 156, category: "cremerie", ticketResto: E },
  { name: "Tiramisu", brand: "Auchan", priceCents: 285, category: "cremerie", ticketResto: E },
  { name: "Tiramisu spéculoos", brand: "Auchan", priceCents: 257, category: "cremerie", ticketResto: E },
  { name: "Mousse au chocolat", brand: "Bonne Maman", priceCents: 249, category: "cremerie", ticketResto: E },
  { name: "Pot de crème", brand: "La Laitière", priceCents: 236, category: "cremerie", ticketResto: E },

  // --- Boulangerie (éligibles TR) ---
  { name: "Krisprolls complets", brand: "Krisprolls", priceCents: 315, category: "boulangerie", ticketResto: E },
  { name: "Baguette", brand: "Auchan", priceCents: 110, category: "boulangerie", ticketResto: E },
  { name: "Mini briochettes", brand: "Auchan", priceCents: 299, category: "boulangerie", ticketResto: E },
  { name: "Briochettes", priceCents: 279, category: "boulangerie", ticketResto: E },
  { name: "Pain naan", brand: "Delis World", priceCents: 538, category: "boulangerie", ticketResto: E },
  { name: "Pain de mie complet", brand: "Auchan", priceCents: 232, category: "boulangerie", ticketResto: E },

  // --- Fruits & légumes (éligibles TR) ---
  { name: "Oranges à jus", brand: "Auchan", priceCents: 549, category: "fruits_legumes", ticketResto: E },
  { name: "Citrons à jus", brand: "Auchan", priceCents: 429, category: "fruits_legumes", ticketResto: E },
  { name: "Tomates cerises", brand: "Auchan", priceCents: 249, category: "fruits_legumes", ticketResto: E },
  { name: "Mâche", brand: "Auchan", priceCents: 151, category: "fruits_legumes", ticketResto: E },
  { name: "Roquette", brand: "Auchan", priceCents: 179, category: "fruits_legumes", ticketResto: E },
  { name: "Champignons blancs", priceCents: 299, category: "fruits_legumes", ticketResto: E },
  { name: "Pommes bio", brand: "Auchan", priceCents: 313, category: "fruits_legumes", ticketResto: E },
  { name: "Prune rouge", priceCents: 124, category: "fruits_legumes", ticketResto: E },
  { name: "Nectarine jaune", priceCents: 172, category: "fruits_legumes", ticketResto: E },
  { name: "Bananes des Antilles", priceCents: 245, category: "fruits_legumes", ticketResto: E },
  { name: "Échalotes (sachet)", brand: "Auchan", priceCents: 363, category: "fruits_legumes", ticketResto: E },
  { name: "Oignons émincés", brand: "Auchan", priceCents: 185, category: "fruits_legumes", ticketResto: E },

  // --- Viande & poisson (éligibles TR) ---
  { name: "Thon entier", brand: "Saupiquet", priceCents: 286, category: "viande_poisson", ticketResto: E },
  { name: "Knacki", brand: "Herta", priceCents: 226, category: "viande_poisson", ticketResto: E },
  { name: "Allumettes de bacon", brand: "Auchan", priceCents: 239, category: "viande_poisson", ticketResto: E },

  // --- Épicerie salée (éligibles TR) ---
  { name: "Salsifis coupés", brand: "Auchan", priceCents: 225, category: "epicerie_salee", ticketResto: E },
  { name: "Tajine de légumes", brand: "Cassegrain", priceCents: 461, category: "epicerie_salee", ticketResto: E },
  { name: "Légumes", brand: "Cassegrain", priceCents: 490, category: "epicerie_salee", ticketResto: E },
  { name: "Ratatouille", brand: "Cassegrain", priceCents: 386, category: "epicerie_salee", ticketResto: E },
  { name: "Haricots verts", brand: "Auchan", priceCents: 279, category: "epicerie_salee", ticketResto: E },
  { name: "Macédoine de légumes", brand: "Auchan", priceCents: 129, category: "epicerie_salee", ticketResto: E },
  { name: "Maïs croquant", brand: "Bonduelle", priceCents: 369, category: "epicerie_salee", ticketResto: E },
  { name: "Croustilégumes", brand: "Bonduelle", priceCents: 354, category: "epicerie_salee", ticketResto: E },
  { name: "Tagliatelles", brand: "Barilla", priceCents: 219, category: "epicerie_salee", ticketResto: E },
  { name: "Spaghetti", brand: "Barilla", priceCents: 103, category: "epicerie_salee", ticketResto: E },
  { name: "Macaroni", brand: "Barilla", priceCents: 109, category: "epicerie_salee", ticketResto: E },
  { name: "Coquillettes", brand: "Barilla", priceCents: 206, category: "epicerie_salee", ticketResto: E },
  { name: "Pâtes", brand: "Lustucru", priceCents: 189, category: "epicerie_salee", ticketResto: E },
  { name: "Gnocchi", brand: "Lustucru", priceCents: 299, category: "epicerie_salee", ticketResto: E },
  { name: "Couscous", brand: "Tipiak", priceCents: 228, category: "epicerie_salee", ticketResto: E },
  { name: "Sauce tomate basilic (bio)", brand: "Panzani", priceCents: 210, category: "epicerie_salee", ticketResto: E },
  { name: "Sauce tomate", brand: "Zapetti", priceCents: 181, category: "epicerie_salee", ticketResto: E },
  { name: "Ketchup", brand: "Heinz", priceCents: 201, category: "epicerie_salee", ticketResto: E },
  { name: "Sauce cocktail", brand: "Auchan", priceCents: 265, category: "epicerie_salee", ticketResto: E },
  { name: "Vinaigre", brand: "Pouce", priceCents: 48, category: "epicerie_salee", ticketResto: E },
  { name: "Moulin d'épices", brand: "Ducros", priceCents: 147, category: "epicerie_salee", ticketResto: E },
  { name: "Pâte feuilletée", brand: "Herta", priceCents: 159, category: "epicerie_salee", ticketResto: E },
  { name: "Cacahuètes", brand: "Auchan", priceCents: 175, category: "epicerie_salee", ticketResto: E },
  { name: "Curly cacahuète", priceCents: 97, category: "epicerie_salee", ticketResto: E },

  // --- Plats préparés (éligibles TR) ---
  { name: "Mini gratins", brand: "Auchan", priceCents: 369, category: "plats_prepares", ticketResto: E },
  { name: "Hachis parmentier de canard", priceCents: 1125, category: "plats_prepares", ticketResto: E },

  // --- Surgelés (éligibles TR) ---
  { name: "Churros à la pomme", priceCents: 479, category: "surgeles", ticketResto: E },
  { name: "Potatoes", brand: "McCain", priceCents: 284, category: "surgeles", ticketResto: E },
  { name: "Pommes rissolées", priceCents: 349, category: "surgeles", ticketResto: E },
  { name: "Bâtonnets de colin", brand: "Findus", priceCents: 449, category: "surgeles", ticketResto: E },
  { name: "Cônes glacés", brand: "Extrême", priceCents: 487, category: "surgeles", ticketResto: E },
  { name: "Soufflés", brand: "Auchan", priceCents: 642, category: "surgeles", ticketResto: E },

  // --- Épicerie sucrée (éligibles TR) ---
  { name: "Fondant au chocolat", brand: "Bonne Maman", priceCents: 364, category: "epicerie_sucree", ticketResto: E },
  { name: "Petit Écolier chocolat", brand: "LU", priceCents: 428, category: "epicerie_sucree", ticketResto: E },
  { name: "Biscuits chocolat", brand: "Cadbury", priceCents: 199, category: "epicerie_sucree", ticketResto: E },
  { name: "Barquette chocolat", brand: "LU", priceCents: 225, category: "epicerie_sucree", ticketResto: E },
  { name: "Petit beurre", brand: "Bonne Maman", priceCents: 403, category: "epicerie_sucree", ticketResto: E },
  { name: "Lulu l'Ourson chocolat", brand: "LU", priceCents: 155, category: "epicerie_sucree", ticketResto: E },
  { name: "Petits Cœurs chocolat", brand: "LU", priceCents: 284, category: "epicerie_sucree", ticketResto: E },
  { name: "Coqueline chocolat", brand: "LU", priceCents: 182, category: "epicerie_sucree", ticketResto: E },
  { name: "Kinder Délice", brand: "Kinder", priceCents: 363, category: "epicerie_sucree", ticketResto: E },
  { name: "Sucre Perruche", brand: "Béghin Say", priceCents: 280, category: "epicerie_sucree", ticketResto: E },
  { name: "Compote de pommes", priceCents: 589, category: "epicerie_sucree", ticketResto: E },
  { name: "Abricots moelleux", brand: "Auchan", priceCents: 269, category: "epicerie_sucree", ticketResto: E },
  { name: "Confiture fruits des Weppes", priceCents: 259, category: "epicerie_sucree", ticketResto: E },

  // --- Boissons (éligibles TR) ---
  { name: "Eau minérale gazeuse", brand: "Perrier", priceCents: 394, category: "boissons", ticketResto: E },
  { name: "Eau minérale", brand: "Evian", priceCents: 370, category: "boissons", ticketResto: E },
  { name: "Jus fruit du dragon", brand: "Pago", priceCents: 250, category: "boissons", ticketResto: E },
  { name: "Jus ACE orange", brand: "Pago", priceCents: 175, category: "boissons", ticketResto: E },
  { name: "Jus pêche cerise", brand: "Pago", priceCents: 249, category: "boissons", ticketResto: E },
  { name: "Nectar bio", brand: "Pressade", priceCents: 292, category: "boissons", ticketResto: E },
  { name: "Jus pomme fraise", priceCents: 329, category: "boissons", ticketResto: E },
  { name: "Jus de pomme framboise", priceCents: 299, category: "boissons", ticketResto: E },
  { name: "Infusion", brand: "Les 2 Marmottes", priceCents: 499, category: "boissons", ticketResto: E },
  { name: "Infusion bio", brand: "Auchan", priceCents: 192, category: "boissons", ticketResto: E },
  { name: "Café Origines", brand: "L'Or", priceCents: 975, category: "boissons", ticketResto: E },

  // --- Entretien & ménage (NON éligibles TR) ---
  { name: "Essuie-tout", brand: "Auchan", priceCents: 585, category: "entretien", ticketResto: I },
  { name: "Spray nettoyant Life", brand: "Auchan", priceCents: 200, category: "entretien", ticketResto: I },
  { name: "Sacs poubelle", brand: "Auchan", priceCents: 231, category: "entretien", ticketResto: I },
  { name: "Percarbonate", brand: "Auchan", priceCents: 550, category: "entretien", ticketResto: I },
  { name: "Détachant linge", brand: "Auchan", priceCents: 306, category: "entretien", ticketResto: I },
  { name: "Harpic détartrant", brand: "Harpic", priceCents: 181, category: "entretien", ticketResto: I },
  { name: "Recharge nettoyant pure source", priceCents: 124, category: "entretien", ticketResto: I },
  { name: "Lingettes WC", brand: "Auchan", priceCents: 235, category: "entretien", ticketResto: I },
  { name: "Capsules lave-vaisselle", brand: "Finish", priceCents: 1119, category: "entretien", ticketResto: I },
  { name: "Lave-vaisselle", brand: "Sun", priceCents: 1096, category: "entretien", ticketResto: I },
  { name: "Additifs lave-vaisselle", brand: "Sun", priceCents: 499, category: "entretien", ticketResto: I },
  { name: "Adoucissant", brand: "Soupline", priceCents: 681, category: "entretien", ticketResto: I },
  { name: "Bicarbonate", brand: "Auchan", priceCents: 599, category: "entretien", ticketResto: I },
  { name: "Savon ménager", brand: "Briochin", priceCents: 384, category: "entretien", ticketResto: I },
  { name: "Nettoyant vitres", brand: "Auchan", priceCents: 369, category: "entretien", ticketResto: I },
  { name: "Gel désinfectant", brand: "Sanytol", priceCents: 223, category: "entretien", ticketResto: I },
  { name: "Spray désinfectant", priceCents: 449, category: "entretien", ticketResto: I },

  // --- Hygiène & beauté (NON éligibles TR) ---
  { name: "Mouchoirs", brand: "Auchan", priceCents: 125, category: "hygiene", ticketResto: I },
  { name: "Papier hygiénique", brand: "Auchan", priceCents: 1440, category: "hygiene", ticketResto: I },
  { name: "Papier toilette Confort", brand: "Lotus", priceCents: 1450, category: "hygiene", ticketResto: I },
  { name: "Gel douche", brand: "Sanex", priceCents: 448, category: "hygiene", ticketResto: I },
  { name: "Déodorant", brand: "Axe", priceCents: 377, category: "hygiene", ticketResto: I },
  { name: "Dentifrice blancheur", brand: "Sanogyl", priceCents: 325, category: "hygiene", ticketResto: I },
  { name: "Rasoir Power Flex", brand: "Gillette", priceCents: 550, category: "hygiene", ticketResto: I },
  { name: "Serviettes hygiéniques", brand: "Always", priceCents: 466, category: "hygiene", ticketResto: I },
  { name: "Crème dépilatoire", brand: "Veet", priceCents: 492, category: "hygiene", ticketResto: I },

  // --- Bébé (NON éligibles TR) ---
  { name: "Lingettes bébé", brand: "Biolane", priceCents: 186, category: "bebe", ticketResto: I },

  // --- Maison & divers (NON éligibles TR) ---
  { name: "Film aluminium", brand: "Auchan", priceCents: 288, category: "maison", ticketResto: I },
  { name: "Papier cuisson", brand: "Auchan", priceCents: 119, category: "maison", ticketResto: I },
  { name: "Sacs congélation", brand: "Auchan", priceCents: 180, category: "maison", ticketResto: I },
  { name: "Bonbons Ricola", brand: "Ricola", priceCents: 209, category: "epicerie_sucree", ticketResto: I },
  { name: "Gourde de fruits", brand: "Auchan", priceCents: 316, category: "epicerie_sucree", ticketResto: I },
  { name: "Kinder Surprise", brand: "Kinder", priceCents: 369, category: "epicerie_sucree", ticketResto: I },
  { name: "Smarties (œuf)", brand: "Nestlé", priceCents: 310, category: "epicerie_sucree", ticketResto: I },
  { name: "Œuf surprise", priceCents: 150, category: "epicerie_sucree", ticketResto: I },

  // --- Jouets, livres & loisirs (NON éligibles TR) ---
  { name: "Coffret 104 pièces", priceCents: 1199, category: "autre", ticketResto: I },
  { name: "Livre « J'apprends à lire avec Martine »", priceCents: 595, category: "autre", ticketResto: I },
  { name: "Jouet Disney Vilains", brand: "Disney", priceCents: 1499, category: "autre", ticketResto: I },
  { name: "Cahier effaçable Disney", brand: "Disney", priceCents: 650, category: "autre", ticketResto: I },
  { name: "Jouet Petites Princesses Disney", brand: "Disney", priceCents: 699, category: "autre", ticketResto: I },
];
