/* Nexus Health: product catalog
   Fields: id, name, category, goals[], tagline, description, price, subPrice,
   rating, reviews, badge, ingredients[], howToUse, img
   img refers to a file in img/<name>.webp, real product photography.
*/
const PRODUCTS = [
  {
    id: "charge",
    name: "Charge",
    subtitle: "Creatine Monohydrate",
    category: "supplements",
    goals: ["muscle"],
    tagline: "Pure micronized creatine for strength that sticks.",
    description: "Charge is 5g of pure micronized creatine monohydrate, the most studied ingredient in sports nutrition. It helps you push one more rep, recover between sets, and build strength over time. No fillers, no flavoring, just creatine.",
    price: 34,
    subPrice: 27,
    rating: 4.8,
    reviews: 1204,
    badge: "Best seller",
    ingredients: [
      { name: "Creatine Monohydrate", dose: "5 g" }
    ],
    howToUse: "Mix one scoop with water, juice, or your shake once daily. Timing doesn't matter, consistency does. Loading phase optional.",
    img: "shaker-tape"
  },
  {
    id: "wind-down",
    name: "Wind Down",
    subtitle: "Magnesium Glycinate",
    category: "supplements",
    goals: ["sleep"],
    tagline: "The calm, absorbable magnesium that helps you actually sleep.",
    description: "Wind Down uses magnesium glycinate, the gentlest and most bioavailable form of magnesium, to support relaxation and deep sleep without the digestive upset of cheaper forms. Take it an hour before bed.",
    price: 28,
    subPrice: 22,
    rating: 4.7,
    reviews: 892,
    ingredients: [
      { name: "Magnesium (as Glycinate)", dose: "200 mg" }
    ],
    howToUse: "Take two capsules 30 to 60 minutes before bed with water.",
    img: "pills-water"
  },
  {
    id: "daylight",
    name: "Daylight",
    subtitle: "Vitamin D3 + K2",
    category: "supplements",
    goals: ["muscle", "focus"],
    tagline: "The sunshine vitamin, dosed the way your blood work wants it.",
    description: "Daylight pairs D3 with K2 so calcium ends up in your bones, not your arteries. Supports immune function, mood, and bone density, especially if you don't get much sun.",
    price: 24,
    subPrice: 19,
    rating: 4.8,
    reviews: 641,
    ingredients: [
      { name: "Vitamin D3", dose: "5000 IU" },
      { name: "Vitamin K2 (MK-7)", dose: "100 mcg" }
    ],
    howToUse: "Take one softgel daily with a meal containing fat for best absorption.",
    img: "capsules"
  },
  {
    id: "deep-sea",
    name: "Deep Sea",
    subtitle: "Omega-3 Fish Oil",
    category: "supplements",
    goals: ["recovery", "focus"],
    tagline: "Triple-strength EPA and DHA, molecularly distilled and tested clean.",
    description: "Deep Sea delivers a clinical dose of EPA and DHA from wild-caught, sustainably sourced fish. Supports joint recovery, heart health, and cognitive function. Enteric coated, no fish burps.",
    price: 38,
    subPrice: 30,
    rating: 4.7,
    reviews: 553,
    ingredients: [
      { name: "EPA", dose: "600 mg" },
      { name: "DHA", dose: "400 mg" }
    ],
    howToUse: "Take two softgels daily with food.",
    img: "omega-bottle"
  },
  {
    id: "steady",
    name: "Steady",
    subtitle: "Ashwagandha KSM-66",
    category: "supplements",
    goals: ["sleep", "focus"],
    tagline: "Clinical-grade ashwagandha to keep cortisol from running the show.",
    description: "Steady uses KSM-66, the most clinically studied ashwagandha extract, to help your body manage stress, support steady energy, and take the edge off a loud nervous system.",
    price: 29,
    subPrice: 23,
    rating: 4.6,
    reviews: 478,
    ingredients: [
      { name: "Ashwagandha Extract (KSM-66)", dose: "600 mg" }
    ],
    howToUse: "Take one capsule in the morning and one in the evening with food.",
    img: "capsules-bottle-grey"
  },
  {
    id: "off-switch",
    name: "Off Switch",
    subtitle: "Sleep Stack",
    category: "supplements",
    goals: ["sleep"],
    tagline: "Magnesium, glycine, and theanine, layered for real deep sleep.",
    description: "Off Switch combines magnesium glycinate, glycine, and L-theanine into one nightly stack. It quiets a racing mind and helps you fall asleep faster and stay there longer, without next-day grogginess.",
    price: 42,
    subPrice: 34,
    rating: 4.9,
    reviews: 705,
    ingredients: [
      { name: "Magnesium (as Glycinate)", dose: "150 mg" },
      { name: "Glycine", dose: "1 g" },
      { name: "L-Theanine", dose: "200 mg" }
    ],
    howToUse: "Take three capsules 30 minutes before bed.",
    img: "bottle-white"
  },
  {
    id: "locked-in",
    name: "Locked In",
    subtitle: "Focus Stack",
    category: "supplements",
    goals: ["focus"],
    tagline: "Citicoline, theanine, and clean caffeine for hours of sharp focus.",
    description: "Locked In is built for deep work. Citicoline supports cognitive function, L-theanine smooths out the caffeine, and a moderate 100mg dose keeps you sharp without the crash.",
    price: 44,
    subPrice: 35,
    rating: 4.7,
    reviews: 389,
    ingredients: [
      { name: "Citicoline (CDP-Choline)", dose: "250 mg" },
      { name: "L-Theanine", dose: "200 mg" },
      { name: "Caffeine (natural)", dose: "100 mg" }
    ],
    howToUse: "Take one capsule in the morning or early afternoon, 30 minutes before focused work.",
    img: "capsules-bottle-grey"
  },
  {
    id: "rebuild",
    name: "Rebuild",
    subtitle: "Collagen Peptides",
    category: "peptides",
    goals: ["recovery"],
    tagline: "Hydrolyzed collagen peptides for joints, skin, and connective tissue.",
    description: "Rebuild is hydrolyzed bovine collagen broken down into peptides small enough to actually absorb. Supports joint comfort, skin elasticity, and tendon resilience so training doesn't wear you down.",
    price: 46,
    subPrice: 37,
    rating: 4.7,
    reviews: 512,
    ingredients: [
      { name: "Hydrolyzed Collagen Peptides (Type I & III)", dose: "10 g" }
    ],
    howToUse: "Mix one scoop into coffee, a shake, or water once daily. Unflavored and dissolves fully.",
    img: "collagen-glass"
  },
  {
    id: "reboot",
    name: "Reboot",
    subtitle: "NAD+ Precursor (NMN)",
    category: "peptides",
    goals: ["recovery", "focus"],
    tagline: "NMN to support your cells' energy production as you age.",
    description: "Reboot delivers nicotinamide mononucleotide, a direct precursor to NAD+, the molecule your cells use to produce energy and repair DNA. Levels decline with age. Reboot is formulated to help support them.",
    price: 68,
    subPrice: 54,
    rating: 4.6,
    reviews: 298,
    ingredients: [
      { name: "Nicotinamide Mononucleotide (NMN)", dose: "500 mg" }
    ],
    howToUse: "Take one capsule each morning, ideally on an empty stomach.",
    img: "dropper-white"
  },
  {
    id: "clear",
    name: "Clear",
    subtitle: "Glutathione Support",
    category: "peptides",
    goals: ["recovery"],
    tagline: "The master antioxidant, in a form your body can actually use.",
    description: "Clear pairs setria glutathione with supportive cofactors to help your body's primary antioxidant do its job: cellular repair, detox support, and recovery from oxidative stress.",
    price: 52,
    subPrice: 42,
    rating: 4.6,
    reviews: 214,
    ingredients: [
      { name: "L-Glutathione (Setria)", dose: "250 mg" },
      { name: "Vitamin C", dose: "90 mg" }
    ],
    howToUse: "Take one capsule daily on an empty stomach.",
    img: "dropper-wood"
  },
  {
    id: "comeback",
    name: "Comeback",
    subtitle: "Recovery Peptide Stack",
    category: "peptides",
    goals: ["recovery", "muscle"],
    tagline: "Our most advanced recovery formula. Built for the days after the hard days.",
    description: "Comeback layers collagen peptides, glutathione, and NMN into one stack engineered for total recovery: joints, cellular repair, and energy production, all in one daily dose. This is the one we built for ourselves.",
    price: 74,
    subPrice: 59,
    rating: 4.9,
    reviews: 167,
    badge: "New",
    ingredients: [
      { name: "Hydrolyzed Collagen Peptides", dose: "8 g" },
      { name: "L-Glutathione (Setria)", dose: "250 mg" },
      { name: "NMN", dose: "300 mg" }
    ],
    howToUse: "Mix one scoop daily into water or a shake. Best taken consistently for at least 8 weeks to feel the full effect.",
    img: "dropper-stone"
  },
  {
    id: "base-vanilla",
    name: "Base Vanilla",
    subtitle: "Whey Isolate",
    category: "protein",
    goals: ["muscle"],
    tagline: "25g of clean whey isolate, real vanilla, almost no sugar.",
    description: "Base Vanilla is a pure whey protein isolate: fast-absorbing, low in lactose, and mixes smooth. 25 grams of protein per scoop with real vanilla flavor and just one gram of sugar.",
    price: 54,
    subPrice: 43,
    rating: 4.8,
    reviews: 933,
    ingredients: [
      { name: "Whey Protein Isolate", dose: "25 g" },
      { name: "Natural Vanilla Flavor", dose: "included" }
    ],
    howToUse: "Mix one scoop with 8 to 10 oz of water or milk. Great post-workout or as a meal add-in.",
    img: "protein-scoop"
  },
  {
    id: "base-chocolate",
    name: "Base Chocolate",
    subtitle: "Whey Isolate",
    category: "protein",
    goals: ["muscle"],
    tagline: "25g of clean whey isolate, rich chocolate, almost no sugar.",
    description: "Base Chocolate is the same clean whey isolate as Base Vanilla, in rich cocoa. 25 grams of protein per scoop, low lactose, mixes smooth with no chalky aftertaste.",
    price: 54,
    subPrice: 43,
    rating: 4.8,
    reviews: 861,
    ingredients: [
      { name: "Whey Protein Isolate", dose: "25 g" },
      { name: "Natural Cocoa Flavor", dose: "included" }
    ],
    howToUse: "Mix one scoop with 8 to 10 oz of water or milk. Great post-workout or as a meal add-in.",
    img: "choc-shake"
  },
  {
    id: "field",
    name: "Field",
    subtitle: "Plant Protein",
    category: "protein",
    goals: ["muscle"],
    tagline: "A complete plant protein blend that doesn't taste like a compromise.",
    description: "Field blends pea, brown rice, and pumpkin seed proteins into a complete amino acid profile. 24 grams of plant protein per scoop, dairy-free, and genuinely smooth.",
    price: 49,
    subPrice: 39,
    rating: 4.6,
    reviews: 402,
    ingredients: [
      { name: "Pea Protein", dose: "15 g" },
      { name: "Brown Rice Protein", dose: "6 g" },
      { name: "Pumpkin Seed Protein", dose: "3 g" }
    ],
    howToUse: "Mix one scoop with 10 oz of water or plant milk. Shake well, plant proteins settle.",
    img: "protein-top"
  },
  {
    id: "clarity",
    name: "Clarity",
    subtitle: "Clear Whey Peach",
    category: "protein",
    goals: ["muscle", "recovery"],
    tagline: "Protein that drinks like juice, not a shake.",
    description: "Clarity is a clear whey protein isolate, light and fruity like a juice instead of a milky shake. 20 grams of protein per serving in a refreshing peach flavor. Great on hot days or between meals.",
    price: 52,
    subPrice: 42,
    rating: 4.7,
    reviews: 276,
    ingredients: [
      { name: "Hydrolyzed Whey Protein Isolate", dose: "20 g" },
      { name: "Natural Peach Flavor", dose: "included" }
    ],
    howToUse: "Mix one scoop with 12 oz of cold water. Shake or stir, no blender needed.",
    img: "collagen-glass"
  }
];

// Convenience lookup
function getProductById(id) {
  return PRODUCTS.find(function (p) { return p.id === id; });
}
