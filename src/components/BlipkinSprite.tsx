import React, { useEffect, useState } from 'react';
import { View, Image, Text } from 'react-native';
import type { ImageSourcePropType } from 'react-native';

// Sprite mapping (will use actual images once generated)
const SPRITE_MAP: Record<string, Record<string, ImageSourcePropType | null>> = {
  baby: {
    idle: null, // require('@/assets/blipkin-baby-idle.png'),
    happy: null,
    hungry: null,
    sleep: null,
    sick: null,
    excited: null,
  },
  child: {
    idle: null,
    happy: null,
    hungry: null,
    sleep: null,
    sick: null,
    excited: null,
  },
  teen: {
    idle: null,
    happy: null,
    hungry: null,
    sleep: null,
    sick: null,
    excited: null,
    frustrated: null,
  },
  adult: {
    idle: null,
    happy: null,
    sad: null,
    hungry: null,
    sleep: null,
    sick: null,
    playful: null,
    excited: null,
  },
  mega: {
    'nurturer-idle': null,
    'explorer-idle': null,
    'chaos-idle': null,
    'calm-idle': null,
  },
  elder: {
    idle: null,
  },
};

// Emoji fallbacks for each evolution stage + mood
const EMOJI_FALLBACKS: Record<string, Record<string, string>> = {
  baby: {
    idle: '🐣',
    happy: '😊',
    hungry: '🤤',
    sleep: '😴',
    sick: '🤢',
    excited: '🤩',
  },
  child: {
    idle: '🐥',
    happy: '😄',
    hungry: '😋',
    sleep: '😴',
    sick: '🤒',
    excited: '🎉',
  },
  teen: {
    idle: '🦜',
    happy: '😁',
    hungry: '😩',
    sleep: '😪',
    sick: '🤧',
    excited: '⚡',
    frustrated: '😤',
  },
  adult: {
    idle: '🦅',
    happy: '😊',
    sad: '😢',
    hungry: '😫',
    sleep: '💤',
    sick: '🤮',
    playful: '🎮',
    excited: '✨',
  },
  mega: {
    'nurturer-idle': '💖',
    'explorer-idle': '🌟',
    'chaos-idle': '⚡',
    'calm-idle': '🧘',
  },
  elder: {
    idle: '👴',
  },
};

interface BlipkinSpriteProps {
  evolutionStage: string;
  megaForm?: string | null;
  currentAnimation?: string;
  size?: number;
}

/**
 * Blipkin Sprite Component
 * Displays the Blipkin with proper sprite based on evolution stage and animation
 * Falls back to emoji if sprite images not yet generated
 */
export function BlipkinSprite({
  evolutionStage,
  megaForm,
  currentAnimation = 'idle',
  size = 128,
}: BlipkinSpriteProps) {
  const [frame, setFrame] = useState(0);

  // Animation frame cycling (2-frame animation loop)
  useEffect(() => {
    const interval = setInterval(() => {
      setFrame((prev) => (prev + 1) % 2);
    }, 500); // Change frame every 500ms

    return () => clearInterval(interval);
  }, []);

  // Determine sprite key
  let spriteKey = currentAnimation || 'idle';
  let stageKey = evolutionStage || 'baby';

  // Handle mega forms
  if (evolutionStage === 'mega' && megaForm) {
    spriteKey = `${megaForm}-idle`;
  }

  // Get sprite source
  const sprites = SPRITE_MAP[stageKey];
  const sprite = sprites?.[spriteKey];

  // Get fallback emoji
  const emojiFallback = EMOJI_FALLBACKS[stageKey]?.[spriteKey] || '🥚';

  return (
    <View
      className="items-center justify-center"
      style={{ width: size, height: size }}
    >
      {sprite ? (
        // TODO: Use actual sprite image once generated
        <Image
          source={sprite}
          style={{ width: size, height: size }}
          resizeMode="contain"
        />
      ) : (
        // Fallback to emoji with animation
        <View className="items-center justify-center" style={{ width: size, height: size }}>
          <Text
            style={{
              fontSize: size * 0.7,
              transform: [{ scale: frame === 0 ? 1 : 1.05 }], // Subtle bounce animation
            }}
          >
            {emojiFallback}
          </Text>
        </View>
      )}

      {/* Evolution stage indicator */}
      <View className="absolute bottom-0 bg-purple-600/90 px-2 py-0.5 rounded-full">
        <Text className="text-white text-xs font-semibold capitalize">
          {evolutionStage === 'mega' && megaForm ? `${megaForm}` : evolutionStage}
        </Text>
      </View>
    </View>
  );
}
