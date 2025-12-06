import { Hono } from "hono";
import { zValidator } from "@hono/zod-validator";
import { z } from "zod";
import type { AppType } from "../index";
import { db } from "../db";

const roomRouter = new Hono<AppType>();

// Get user's room layout
roomRouter.get("/", async (c) => {
  const user = c.get("user");
  if (!user) return c.json({ message: "Unauthorized" }, 401);

  try {
    // Get or create room
    let room = await db.blipkinRoom.findUnique({
      where: { userId: user.id },
      include: {
        furniture: {
          include: {
            shopItem: true,
          },
        },
      },
    });

    if (!room) {
      // Create default room
      room = await db.blipkinRoom.create({
        data: {
          userId: user.id,
          name: "My Room",
          wallpaperKey: "default",
          floorKey: "wood",
        },
        include: {
          furniture: {
            include: {
              shopItem: true,
            },
          },
        },
      });
    }

    // Transform to DTO
    const roomLayout = {
      id: room.id,
      name: room.name,
      wallpaperKey: room.wallpaperKey,
      floorKey: room.floorKey,
      furniture: room.furniture.map((f) => ({
        id: f.id,
        shopItemId: f.shopItemId,
        itemName: f.shopItem.name,
        itemKey: f.shopItem.key,
        iconKey: f.shopItem.iconKey,
        posX: f.posX,
        posY: f.posY,
        rotation: f.rotation,
      })),
    };

    return c.json(roomLayout);
  } catch (error) {
    console.error("Error fetching room:", error);
    return c.json({ message: "Failed to fetch room" }, 500);
  }
});

// Update room settings (wallpaper, floor, name)
const updateRoomSchema = z.object({
  name: z.string().min(1).max(50).optional(),
  wallpaperKey: z.string().optional(),
  floorKey: z.string().optional(),
});

roomRouter.patch("/", zValidator("json", updateRoomSchema), async (c) => {
  const user = c.get("user");
  if (!user) return c.json({ message: "Unauthorized" }, 401);

  const body = c.req.valid("json");

  try {
    // Upsert room with new settings
    const room = await db.blipkinRoom.upsert({
      where: { userId: user.id },
      update: {
        ...(body.name && { name: body.name }),
        ...(body.wallpaperKey && { wallpaperKey: body.wallpaperKey }),
        ...(body.floorKey && { floorKey: body.floorKey }),
      },
      create: {
        userId: user.id,
        name: body.name || "My Room",
        wallpaperKey: body.wallpaperKey || "default",
        floorKey: body.floorKey || "wood",
      },
    });

    return c.json({
      success: true,
      room: {
        id: room.id,
        name: room.name,
        wallpaperKey: room.wallpaperKey,
        floorKey: room.floorKey,
      },
    });
  } catch (error) {
    console.error("Error updating room:", error);
    return c.json({ message: "Failed to update room" }, 500);
  }
});

// Place furniture in room
const placeFurnitureSchema = z.object({
  shopItemId: z.string(),
  posX: z.number().int().min(0).max(15),
  posY: z.number().int().min(0).max(15),
  rotation: z.number().int().min(0).max(270).multipleOf(90).default(0),
});

roomRouter.post("/furniture", zValidator("json", placeFurnitureSchema), async (c) => {
  const user = c.get("user");
  if (!user) return c.json({ message: "Unauthorized" }, 401);

  const body = c.req.valid("json");

  try {
    // Verify user owns this item in inventory
    const inventoryItem = await db.inventoryItem.findFirst({
      where: {
        userId: user.id,
        shopItemId: body.shopItemId,
      },
      include: {
        shopItem: true,
      },
    });

    if (!inventoryItem) {
      return c.json({ message: "Item not in inventory" }, 404);
    }

    // Check item is a ROOM_ITEM or DECOR
    if (!["ROOM_ITEM", "DECOR"].includes(inventoryItem.shopItem.category)) {
      return c.json({ message: "Item cannot be placed in room" }, 400);
    }

    // Get or create room
    let room = await db.blipkinRoom.findUnique({
      where: { userId: user.id },
    });

    if (!room) {
      room = await db.blipkinRoom.create({
        data: {
          userId: user.id,
          name: "My Room",
          wallpaperKey: "default",
          floorKey: "wood",
        },
      });
    }

    // Place furniture
    const furniture = await db.roomFurniture.create({
      data: {
        roomId: room.id,
        shopItemId: body.shopItemId,
        posX: body.posX,
        posY: body.posY,
        rotation: body.rotation,
      },
      include: {
        shopItem: true,
      },
    });

    return c.json({
      success: true,
      furniture: {
        id: furniture.id,
        shopItemId: furniture.shopItemId,
        itemName: furniture.shopItem.name,
        iconKey: furniture.shopItem.iconKey,
        posX: furniture.posX,
        posY: furniture.posY,
        rotation: furniture.rotation,
      },
    });
  } catch (error) {
    console.error("Error placing furniture:", error);
    return c.json({ message: "Failed to place furniture" }, 500);
  }
});

// Remove furniture from room
roomRouter.delete("/furniture/:furnitureId", async (c) => {
  const user = c.get("user");
  if (!user) return c.json({ message: "Unauthorized" }, 401);

  const furnitureId = c.req.param("furnitureId");

  try {
    // Verify user owns this room and furniture
    const furniture = await db.roomFurniture.findUnique({
      where: { id: furnitureId },
      include: {
        room: true,
      },
    });

    if (!furniture) {
      return c.json({ message: "Furniture not found" }, 404);
    }

    if (furniture.room.userId !== user.id) {
      return c.json({ message: "Not your room" }, 403);
    }

    // Remove furniture
    await db.roomFurniture.delete({
      where: { id: furnitureId },
    });

    return c.json({ success: true, message: "Furniture removed" });
  } catch (error) {
    console.error("Error removing furniture:", error);
    return c.json({ message: "Failed to remove furniture" }, 500);
  }
});

// Move furniture
const moveFurnitureSchema = z.object({
  posX: z.number().int().min(0).max(15),
  posY: z.number().int().min(0).max(15),
  rotation: z.number().int().min(0).max(270).multipleOf(90).optional(),
});

roomRouter.patch("/furniture/:furnitureId", zValidator("json", moveFurnitureSchema), async (c) => {
  const user = c.get("user");
  if (!user) return c.json({ message: "Unauthorized" }, 401);

  const furnitureId = c.req.param("furnitureId");
  const body = c.req.valid("json");

  try {
    // Verify ownership
    const furniture = await db.roomFurniture.findUnique({
      where: { id: furnitureId },
      include: {
        room: true,
      },
    });

    if (!furniture) {
      return c.json({ message: "Furniture not found" }, 404);
    }

    if (furniture.room.userId !== user.id) {
      return c.json({ message: "Not your room" }, 403);
    }

    // Update position/rotation
    const updated = await db.roomFurniture.update({
      where: { id: furnitureId },
      data: {
        posX: body.posX,
        posY: body.posY,
        ...(body.rotation !== undefined && { rotation: body.rotation }),
      },
      include: {
        shopItem: true,
      },
    });

    return c.json({
      success: true,
      furniture: {
        id: updated.id,
        posX: updated.posX,
        posY: updated.posY,
        rotation: updated.rotation,
      },
    });
  } catch (error) {
    console.error("Error moving furniture:", error);
    return c.json({ message: "Failed to move furniture" }, 500);
  }
});

export { roomRouter };
