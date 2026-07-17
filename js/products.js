/* Nexus Health: product catalog (real products) */
const PRODUCTS = [
  {
    id: "glp1-support",
    name: "GLP-1 Support",
    subtitle: "Metabolic Support",
    category: "performance",
    goals: [],
    tagline: "Daily support for appetite balance and metabolic health.",
    description: "GLP-1 Support blends berberine, chromium, and cinnamon bark extract to help support healthy blood sugar balance and appetite regulation. A simple daily capsule for anyone working on their metabolic health, no prescription needed.",
    price: 60.00,
    subPrice: 48,
    rating: 4.8,
    reviews: 412,
    badge: "Best seller",
    ingredients: [
      { name: "Berberine HCl", dose: "500 mg" },
      { name: "Cinnamon Bark Extract", dose: "250 mg" },
      { name: "Chromium Picolinate", dose: "200 mcg" }
    ],
    howToUse: "Take two capsules daily with your largest meal.",
    img: "capsules-bottle-grey"
  },
  {
    id: "digestive-enzyme",
    name: "Digestive Enzyme Pro Blend",
    subtitle: "Digestive Enzymes",
    category: "daily",
    goals: [],
    tagline: "A full-spectrum enzyme blend for easier digestion.",
    description: "Digestive Enzyme Pro Blend combines protease, amylase, and lipase to help your body break down protein, carbs, and fat. Take it with heavier meals to support comfortable digestion and better nutrient absorption.",
    price: 28.90,
    subPrice: 23,
    rating: 4.7,
    reviews: 189,
    ingredients: [
      { name: "Protease", dose: "included" },
      { name: "Amylase", dose: "included" },
      { name: "Lipase", dose: "included" },
      { name: "Bromelain", dose: "included" }
    ],
    howToUse: "Take one capsule at the start of each meal.",
    img: "capsules"
  },
  {
    id: "ashwagandha-plus",
    name: "Ashwagandha Plus",
    subtitle: "KSM-66 Ashwagandha",
    category: "daily",
    goals: ["sleep", "recovery"],
    tagline: "Clinical-dose ashwagandha for stress and calm.",
    description: "Ashwagandha Plus uses KSM-66, the most studied root extract, to help your body manage everyday stress and support restful sleep. Paired with black pepper extract so your body actually absorbs it.",
    price: 29.50,
    subPrice: 24,
    rating: 4.8,
    reviews: 526,
    ingredients: [
      { name: "Ashwagandha Extract (KSM-66)", dose: "600 mg" },
      { name: "Black Pepper Extract (BioPerine)", dose: "5 mg" }
    ],
    howToUse: "Take one capsule in the morning and one in the evening.",
    img: "capsules-bottle-grey"
  },
  {
    id: "collagen-chocolate",
    name: "Grass-Fed Collagen Peptides",
    subtitle: "Chocolate Collagen",
    category: "performance",
    goals: ["muscle", "recovery"],
    tagline: "Grass-fed collagen for skin, joints, and hair, in rich chocolate.",
    description: "Grass-Fed Collagen Peptides deliver types I and III collagen to support skin elasticity, joint comfort, and hair strength. This chocolate blend dissolves smooth into coffee, milk, or a shake with no chalk.",
    price: 35.90,
    subPrice: 29,
    rating: 4.9,
    reviews: 703,
    ingredients: [
      { name: "Hydrolyzed Bovine Collagen (Type I & III)", dose: "11 g" },
      { name: "Natural Cocoa", dose: "included" }
    ],
    howToUse: "Mix one scoop into your drink of choice once daily.",
    img: "choc-shake"
  },
  {
    id: "shilajit",
    name: "Shilajit Adaptogen Complex",
    subtitle: "Purified Shilajit",
    category: "vitality",
    goals: ["focus"],
    tagline: "Himalayan shilajit for natural energy and drive.",
    description: "Shilajit Adaptogen Complex is purified Himalayan resin rich in fulvic acid and trace minerals, traditionally used to support energy, stamina, and vitality. A daily dose of one of nature's most storied adaptogens.",
    price: 35.00,
    subPrice: 28,
    rating: 4.6,
    reviews: 254,
    ingredients: [
      { name: "Purified Shilajit Extract", dose: "500 mg" },
      { name: "Fulvic Acid", dose: "50%" }
    ],
    howToUse: "Take one serving daily with water.",
    img: "dropper-stone"
  },
  {
    id: "libido-strips",
    name: "Libido Support Strips",
    subtitle: "Dissolvable Strips",
    category: "vitality",
    goals: [],
    tagline: "Fast-dissolving strips for drive and vitality.",
    description: "Libido Support Strips deliver a blend of L-citrulline, maca, and epimedium in a convenient dissolvable strip. No water, no pills, just place one on your tongue and go.",
    price: 37.90,
    subPrice: 30,
    rating: 4.5,
    reviews: 137,
    ingredients: [
      { name: "L-Citrulline", dose: "included" },
      { name: "Maca Root Extract", dose: "included" },
      { name: "Epimedium (Horny Goat Weed)", dose: "included" }
    ],
    howToUse: "Place one strip on your tongue and let it dissolve as needed.",
    img: "dropper-white"
  },
  {
    id: "creatine-hydration",
    name: "Creatine Hydration Powder",
    subtitle: "Creatine + Electrolytes",
    category: "performance",
    goals: ["muscle"],
    tagline: "Creatine monohydrate plus electrolytes in one scoop.",
    description: "Creatine Hydration Powder pairs 5g of pure creatine monohydrate with a full electrolyte blend to support strength, power, and hydration. Mixes clear and clean into water with no chalk.",
    price: 42.00,
    subPrice: 34,
    rating: 4.8,
    reviews: 419,
    ingredients: [
      { name: "Creatine Monohydrate", dose: "5 g" },
      { name: "Sodium", dose: "200 mg" },
      { name: "Potassium", dose: "100 mg" },
      { name: "Magnesium", dose: "60 mg" }
    ],
    howToUse: "Mix one scoop with 12 to 16 oz of water daily.",
    img: "shaker-tape"
  },
  {
    id: "colostrum",
    name: "Colostrum Powder",
    subtitle: "Bovine Colostrum",
    category: "daily",
    goals: ["recovery"],
    tagline: "Grass-fed colostrum for gut and immune support.",
    description: "Colostrum Powder is grass-fed bovine colostrum rich in immunoglobulins and lactoferrin, used to support gut lining, immune resilience, and recovery. An unflavored powder that blends into anything.",
    price: 39.95,
    subPrice: 32,
    rating: 4.7,
    reviews: 168,
    badge: "New",
    ingredients: [
      { name: "Grass-Fed Bovine Colostrum", dose: "3 g" },
      { name: "Immunoglobulins (IgG)", dose: "included" },
      { name: "Lactoferrin", dose: "included" }
    ],
    howToUse: "Mix one scoop into water, milk, or a smoothie daily.",
    img: "jar-white"
  },
  {
    id: "mushroom-coffee",
    name: "Vitality Mushroom Coffee",
    subtitle: "Medium Roast",
    category: "vitality",
    goals: ["focus"],
    tagline: "Medium roast coffee with lion's mane and cordyceps.",
    description: "Vitality Mushroom Coffee blends smooth medium roast with lion's mane and cordyceps to support focus and steady energy without the jitters or the crash. Brews just like your regular cup.",
    price: 34.50,
    subPrice: 28,
    rating: 4.7,
    reviews: 302,
    ingredients: [
      { name: "Arabica Coffee", dose: "included" },
      { name: "Lion's Mane Extract", dose: "included" },
      { name: "Cordyceps Extract", dose: "included" }
    ],
    howToUse: "Brew one scoop or sachet as you would normal coffee.",
    img: "protein-top"
  }
];

function getProductById(id) {
  return PRODUCTS.find(function (p) { return p.id === id; });
}
