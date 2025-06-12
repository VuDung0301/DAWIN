// This file is a fallback for using MaterialIcons on Android and web.

import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import React from 'react';
import { StyleProp, ViewStyle } from 'react-native';

// Add your SFSymbol to MaterialIcons mappings here.
const MAPPING: Record<string, any> = {
  // See MaterialIcons here: https://icons.expo.fyi
  // See SF Symbols in the SF Symbols app on Mac.
  'house.fill': 'home',
  'paperplane.fill': 'send',
  'chevron.left.forwardslash.chevron.right': 'code',
  'chevron.right': 'chevron-right',
  'clock': 'schedule',
  'person.2': 'people',
  'calendar': 'calendar-today',
  'minus': 'remove',
  'plus': 'add',
  // Thêm các mapping thiếu
  'airplane': 'flight',
  'wifi': 'wifi',
  'fork.knife': 'restaurant',
  'tv': 'tv',
  'person.2.fill': 'people-alt',
  'mappin.and.ellipse': 'place',
  'chevron.left': 'chevron-left',
  'circle.fill': 'circle',
  'checkmark.circle.fill': 'check-circle',
  'xmark.circle.fill': 'cancel',
  // Bổ sung thêm các icon cho trang chủ
  'map': 'map',
  'house': 'home',
  'car': 'directions-car',
  'gift': 'card-giftcard',
  'magnifyingglass': 'search',
  'arrow.right': 'arrow-forward',
  'moon.stars.fill': 'nightlight',
  'cup.and.saucer.fill': 'local-cafe',
  'square.and.arrow.up': 'share',
  'chevron.up': 'expand-less',
  'chevron.down': 'expand-more',
  'star.fill': 'star',
  'eye.fill': 'visibility',
  'eye.slash.fill': 'visibility-off',
};

export type IconSymbolName = keyof typeof MAPPING;

interface IconSymbolProps {
  name: string;
  size?: number;
  color?: string;
  style?: StyleProp<ViewStyle>;
}

/**
 * An icon component that uses MaterialIcons as a fallback.
 * This ensures a consistent look on Android and web platforms.
 */
export const IconSymbol = ({ name, size = 24, color, style }: IconSymbolProps) => {
  // Map SF Symbol name to MaterialIcons name
  const iconName = MAPPING[name] || 'circle'; // Default to 'circle' if no mapping exists
  
  return (
    <MaterialIcons
      name={iconName}
      size={size}
      color={color}
      style={style}
    />
  );
};
