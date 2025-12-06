/**
 * Seed Shop Items
 * Populates the shop with initial items
 * Run: bun run backend/src/utils/seed-shop.ts
 */

import { db } from "../db";

const SHOP_ITEMS = [
  // ============================================
  // FOOD - Consumables
  // ============================================
  {
    key: "apple",
    name: "Apple",
    description: "A crisp, juicy apple. Reduces hunger by 15.",
    category: "FOOD",
    priceCoins: 50,
    priceVoltGems: null,
    iconKey: "🍎",
    effectType: "FEED",
    effectValue: 15,
  },
  {
    key: "banana",
    name: "Banana",
    description: "A sweet banana. Reduces hunger by 15.",
    category: "FOOD",
    priceCoins: 50,
    priceVoltGems: null,
    iconKey: "🍌",
    effectType: "FEED",
    effectValue: 15,
  },
  {
    key: "sushi",
    name: "Sushi",
    description: "Delicious sushi! Reduces hunger by 30 and boosts bond.",
    category: "FOOD",
    priceCoins: 150,
    priceVoltGems: null,
    iconKey: "🍣",
    effectType: "FEED",
    effectValue: 30,
  },
  {
    key: "pizza",
    name: "Pizza",
    description: "A whole pizza! Reduces hunger by 40.",
    category: "FOOD",
    priceCoins: 200,
    priceVoltGems: null,
    iconKey: "🍕",
    effectType: "FEED",
    effectValue: 40,
  },
  {
    key: "energy_drink",
    name: "Energy Drink",
    description: "Restores 25 energy instantly!",
    category: "FOOD",
    priceCoins: 100,
    priceVoltGems: null,
    iconKey: "🥤",
    effectType: "ENERGY_BOOST",
    effectValue: 25,
  },

  // ============================================
  // TOYS - Interactive items
  // ============================================
  {
    key: "ball",
    name: "Ball",
    description: "A bouncy ball. Boosts mood by 10.",
    category: "TOY",
    priceCoins: 100,
    priceVoltGems: null,
    iconKey: "⚽",
    effectType: "MOOD_BOOST",
    effectValue: 10,
  },
  {
    key: "puzzle",
    name: "Puzzle",
    description: "A challenging puzzle. Grants 15 XP.",
    category: "TOY",
    priceCoins: 200,
    priceVoltGems: null,
    iconKey: "🧩",
    effectType: "XP_BOOST",
    effectValue: 15,
  },
  {
    key: "dice",
    name: "Lucky Dice",
    description: "Roll for fun! Boosts mood.",
    category: "TOY",
    priceCoins: 150,
    priceVoltGems: null,
    iconKey: "🎲",
    effectType: "MOOD_BOOST",
    effectValue: 8,
  },

  // ============================================
  // ROOM ITEMS - Decorations
  // ============================================
  {
    key: "bed",
    name: "Cozy Bed",
    description: "A comfortable bed for your Blipkin.",
    category: "ROOM_ITEM",
    priceCoins: 500,
    priceVoltGems: null,
    iconKey: "🛏️",
    effectType: "ROOM_DECOR",
    effectValue: 0,
  },
  {
    key: "chair",
    name: "Chair",
    description: "A simple chair.",
    category: "ROOM_ITEM",
    priceCoins: 300,
    priceVoltGems: null,
    iconKey: "🪑",
    effectType: "ROOM_DECOR",
    effectValue: 0,
  },
  {
    key: "lamp",
    name: "Lamp",
    description: "Lights up your room!",
    category: "ROOM_ITEM",
    priceCoins: 200,
    priceVoltGems: null,
    iconKey: "💡",
    effectType: "ROOM_DECOR",
    effectValue: 0,
  },
  {
    key: "plant",
    name: "Plant",
    description: "A nice green plant.",
    category: "ROOM_ITEM",
    priceCoins: 150,
    priceVoltGems: null,
    iconKey: "🪴",
    effectType: "ROOM_DECOR",
    effectValue: 0,
  },
  {
    key: "rug",
    name: "Rug",
    description: "Cozy floor covering.",
    category: "ROOM_ITEM",
    priceCoins: 250,
    priceVoltGems: null,
    iconKey: "🟫",
    effectType: "ROOM_DECOR",
    effectValue: 0,
  },
  {
    key: "bookshelf",
    name: "Bookshelf",
    description: "Stores knowledge! Boosts curiosity.",
    category: "ROOM_ITEM",
    priceCoins: 600,
    priceVoltGems: null,
    iconKey: "📚",
    effectType: "ROOM_DECOR",
    effectValue: 0,
  },

  // ============================================
  // ACCESSORIES - Cosmetics
  // ============================================
  {
    key: "bow",
    name: "Cute Bow",
    description: "A stylish bow accessory.",
    category: "ACCESSORY",
    priceCoins: 300,
    priceVoltGems: null,
    iconKey: "🎀",
    effectType: "COSMETIC",
    effectValue: 0,
  },
  {
    key: "hat",
    name: "Top Hat",
    description: "Classy headwear.",
    category: "ACCESSORY",
    priceCoins: 400,
    priceVoltGems: null,
    iconKey: "🎩",
    effectType: "COSMETIC",
    effectValue: 0,
  },

  // ============================================
  // BOOSTS - Premium items (optional VoltGems)
  // ============================================
  {
    key: "xp_boost_7d",
    name: "XP Boost (7 days)",
    description: "10% bonus XP for 7 days!",
    category: "BOOST",
    priceCoins: 1000,
    priceVoltGems: 50,
    iconKey: "⚡",
    effectType: "XP_BOOST",
    effectValue: 10,
  },
  {
    key: "rainbow_palette",
    name: "Rainbow Color Palette",
    description: "Rare rainbow colors for your Blipkin!",
    category: "BOOST",
    priceCoins: 2000,
    priceVoltGems: 100,
    iconKey: "🌈",
    effectType: "COSMETIC",
    effectValue: 0,
  },
];

async function seedShop() {
  console.log("🌱 Seeding shop items...");

  for (const item of SHOP_ITEMS) {
    // Upsert to avoid duplicates
    await db.shopItem.upsert({
      where: { key: item.key },
      update: item,
      create: item,
    });
  }

  console.log(`✅ Seeded ${SHOP_ITEMS.length} shop items!`);

  const items = await db.shopItem.findMany();
  console.log(`📊 Total items in shop: ${items.length}`);
}

// Run seed
seedShop()
  .then(() => {
    console.log("✅ Seed complete!");
    process.exit(0);
  })
  .catch((error) => {
    console.error("❌ Seed failed:", error);
    process.exit(1);
  });
