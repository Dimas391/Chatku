// utils/responsive.ts
import { Dimensions, PixelRatio, Platform, ScaledSize } from 'react-native';

const BASE_WIDTH = 390;
const BASE_HEIGHT = 844;

// Cache untuk menghindari re-render yang tidak perlu
let cachedWidth = Dimensions.get('window').width;
let cachedHeight = Dimensions.get('window').height;

// Update cached dimensions
export const updateCachedDimensions = (width: number, height: number) => {
  cachedWidth = width;
  cachedHeight = height;
};

// Scale width dengan parameter optional current width
export const scaleWidth = (size: number, currentWidth?: number): number => {
  const width = currentWidth || cachedWidth;
  const scale = width / BASE_WIDTH;
  const newSize = size * scale;
  
  if (Platform.OS === 'ios') {
    return Math.round(PixelRatio.roundToNearestPixel(newSize));
  } else {
    return Math.max(
      Math.round(PixelRatio.roundToNearestPixel(newSize)) - 
      (PixelRatio.get() > 3 ? 1 : 0),
      1 // Minimal 1px
    );
  }
};

// Scale height dengan parameter optional current height
export const scaleHeight = (size: number, currentHeight?: number): number => {
  const height = currentHeight || cachedHeight;
  const scale = height / BASE_HEIGHT;
  const newSize = size * scale;
  
  if (Platform.OS === 'ios') {
    return Math.round(PixelRatio.roundToNearestPixel(newSize));
  } else {
    return Math.max(
      Math.round(PixelRatio.roundToNearestPixel(newSize)) - 
      (PixelRatio.get() > 3 ? 1 : 0),
      1
    );
  }
};

// Scale font
export const scaleFont = (size: number, currentWidth?: number): number => {
  const width = currentWidth || cachedWidth;
  const scale = width / BASE_WIDTH;
  let newSize = size * scale;
  
  const fontScale = PixelRatio.getFontScale();
  newSize = newSize * fontScale;
  
  if (Platform.OS === 'ios') {
    return Math.round(PixelRatio.roundToNearestPixel(newSize));
  } else {
    return Math.max(Math.round(PixelRatio.roundToNearestPixel(newSize)) - 1, 8);
  }
};

// Get current dimensions
export const getCurrentDimensions = () => ({
  width: cachedWidth,
  height: cachedHeight,
});

// Check device type
export const isSmallDevice = (width?: number): boolean => 
  (width || cachedWidth) < 375;
export const isTablet = (width?: number): boolean => 
  (width || cachedWidth) >= 600;