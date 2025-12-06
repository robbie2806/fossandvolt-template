import { Hono } from "hono";
import { zValidator } from "@hono/zod-validator";
import { db } from "../db";
import { type AppType } from "../types";
import {
  purchaseItemRequestSchema,
  type PurchaseItemRequest,
  type PurchaseItemResponse,
  type ShopCatalogResponse,
} from "../../../shared/blipnet-contracts";

const shopRouter = new Hono<AppType>();

// ============================================
// GET /api/shop/catalog - Get shop items + wallet + inventory
// ============================================
shopRouter.get("/catalog", async (c) => {
  const user = c.get("user");
  if (!user) {
    return c.json({ message: "Unauthorized" }, 401);
  }

  // Get or create wallet
  let wallet = await db.currencyWallet.findUnique({
    where: { userId: user.id },
  });

  if (!wallet) {
    // Create wallet with starting coins
    wallet = await db.currencyWallet.create({
      data: {
        userId: user.id,
        coins: 100, // Starting bonus
        voltGems: 0,
      },
    });
  }

  // Get all shop items
  const items = await db.shopItem.findMany({
    orderBy: [{ category: "asc" }, { priceCoins: "asc" }],
  });

  // Get user inventory
  const inventory = await db.inventoryItem.findMany({
    where: { userId: user.id },
    include: { shopItem: true },
  });

  return c.json({
    wallet: {
      coins: wallet.coins,
      voltGems: wallet.voltGems,
    },
    items: items.map((item) => ({
      id: item.id,
      key: item.key,
      name: item.name,
      description: item.description,
      category: item.category,
      priceCoins: item.priceCoins,
      priceVoltGems: item.priceVoltGems,
      iconKey: item.iconKey,
      effectType: item.effectType,
      effectValue: item.effectValue,
    })),
    inventory: inventory.map((inv) => ({
      id: inv.id,
      shopItemId: inv.shopItemId,
      shopItem: {
        id: inv.shopItem.id,
        key: inv.shopItem.key,
        name: inv.shopItem.name,
        description: inv.shopItem.description,
        category: inv.shopItem.category,
        priceCoins: inv.shopItem.priceCoins,
        priceVoltGems: inv.shopItem.priceVoltGems,
        iconKey: inv.shopItem.iconKey,
        effectType: inv.shopItem.effectType,
        effectValue: inv.shopItem.effectValue,
      },
      quantity: inv.quantity,
      obtainedAt: inv.obtainedAt.toISOString(),
    })),
  } satisfies ShopCatalogResponse);
});

// ============================================
// POST /api/shop/buy - Purchase item
// ============================================
shopRouter.post("/buy", zValidator("json", purchaseItemRequestSchema), async (c) => {
  const user = c.get("user");
  if (!user) {
    return c.json({ message: "Unauthorized" }, 401);
  }

  const { shopItemId, currency } = c.req.valid("json");

  // Get shop item
  const shopItem = await db.shopItem.findUnique({
    where: { id: shopItemId },
  });

  if (!shopItem) {
    return c.json(
      {
        success: false,
        wallet: { coins: 0, voltGems: 0 },
        newItem: null,
        message: "Item not found",
      } satisfies PurchaseItemResponse,
      404
    );
  }

  // Get wallet
  const wallet = await db.currencyWallet.findUnique({
    where: { userId: user.id },
  });

  if (!wallet) {
    return c.json(
      {
        success: false,
        wallet: { coins: 0, voltGems: 0 },
        newItem: null,
        message: "Wallet not found",
      } satisfies PurchaseItemResponse,
      404
    );
  }

  // Check if user has enough currency
  let canAfford = false;
  let price = 0;

  if (currency === "COINS") {
    price = shopItem.priceCoins;
    canAfford = wallet.coins >= price;
  } else if (currency === "VOLT_GEMS") {
    if (!shopItem.priceVoltGems) {
      return c.json(
        {
          success: false,
          wallet: { coins: wallet.coins, voltGems: wallet.voltGems },
          newItem: null,
          message: "This item cannot be purchased with VoltGems",
        } satisfies PurchaseItemResponse,
        400
      );
    }
    price = shopItem.priceVoltGems;
    canAfford = wallet.voltGems >= price;
  }

  if (!canAfford) {
    return c.json(
      {
        success: false,
        wallet: { coins: wallet.coins, voltGems: wallet.voltGems },
        newItem: null,
        message: `Not enough ${currency === "COINS" ? "coins" : "VoltGems"}!`,
      } satisfies PurchaseItemResponse,
      400
    );
  }

  // Deduct currency
  const updatedWallet = await db.currencyWallet.update({
    where: { userId: user.id },
    data: {
      coins: currency === "COINS" ? wallet.coins - price : wallet.coins,
      voltGems: currency === "VOLT_GEMS" ? wallet.voltGems - price : wallet.voltGems,
    },
  });

  // Add to inventory (or increment quantity if already owned)
  const existingItem = await db.inventoryItem.findFirst({
    where: {
      userId: user.id,
      shopItemId: shopItemId,
    },
    include: { shopItem: true },
  });

  let newItem;
  if (existingItem) {
    // Increment quantity
    newItem = await db.inventoryItem.update({
      where: { id: existingItem.id },
      data: { quantity: existingItem.quantity + 1 },
      include: { shopItem: true },
    });
  } else {
    // Create new inventory item
    newItem = await db.inventoryItem.create({
      data: {
        userId: user.id,
        shopItemId: shopItemId,
        quantity: 1,
      },
      include: { shopItem: true },
    });
  }

  return c.json({
    success: true,
    wallet: {
      coins: updatedWallet.coins,
      voltGems: updatedWallet.voltGems,
    },
    newItem: {
      id: newItem.id,
      shopItemId: newItem.shopItemId,
      shopItem: {
        id: newItem.shopItem.id,
        key: newItem.shopItem.key,
        name: newItem.shopItem.name,
        description: newItem.shopItem.description,
        category: newItem.shopItem.category,
        priceCoins: newItem.shopItem.priceCoins,
        priceVoltGems: newItem.shopItem.priceVoltGems,
        iconKey: newItem.shopItem.iconKey,
        effectType: newItem.shopItem.effectType,
        effectValue: newItem.shopItem.effectValue,
      },
      quantity: newItem.quantity,
      obtainedAt: newItem.obtainedAt.toISOString(),
    },
    message: `Successfully purchased ${shopItem.name}!`,
  } satisfies PurchaseItemResponse);
});

export { shopRouter };
