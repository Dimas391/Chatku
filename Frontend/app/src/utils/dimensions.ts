// utils/dimensions.ts
import { useWindowDimensions } from 'react-native';
import { useMemo } from 'react';
import { 
  scaleWidth, 
  scaleHeight, 
  scaleFont, 
  isSmallDevice, 
  isTablet,
  updateCachedDimensions,
} from './responsive';

export const useDimensions = () => {
  const { width, height } = useWindowDimensions();
  
  // Update cached dimensions setiap kali berubah
  updateCachedDimensions(width, height);
  
  return useMemo(() => {
    // Hitung semua nilai berdasarkan width dan height saat ini
    const smallDevice = isSmallDevice(width);
    const tablet = isTablet(width);
    
    const DIMENSIONS = {
      // Padding
      paddingSmall: scaleWidth(8, width),
      paddingMedium: scaleWidth(16, width),
      paddingLarge: scaleWidth(24, width),
      paddingXL: scaleWidth(32, width),
      
      // Margin
      marginSmall: scaleWidth(8, width),
      marginMedium: scaleWidth(16, width),
      marginLarge: scaleWidth(24, width),
      
      // Border Radius
      radiusSmall: scaleWidth(4, width),
      radiusMedium: scaleWidth(8, width),
      radiusLarge: scaleWidth(12, width),
      radiusXL: scaleWidth(16, width),
      radiusRound: scaleWidth(999, width),
      
      // Icon sizes
      iconSmall: scaleWidth(18, width),
      iconMedium: scaleWidth(22, width),
      iconLarge: scaleWidth(28, width),
      iconXL: scaleWidth(36, width),
      
      // Avatar sizes
      avatarSmall: scaleWidth(32, width),
      avatarMedium: scaleWidth(40, width),
      avatarLarge: scaleWidth(52, width),
      avatarXL: scaleWidth(80, width),
      
      // Button sizes
      buttonHeight: Math.max(scaleHeight(44, height), 40),
      buttonHeightSmall: Math.max(scaleHeight(36, height), 36),
      buttonHeightLarge: Math.max(scaleHeight(52, height), 48),
      
      // Font sizes (minimal 10 untuk readability)
      fontTiny: Math.max(scaleFont(10, width), 10),
      fontSmall: Math.max(scaleFont(12, width), 11),
      fontRegular: Math.max(scaleFont(14, width), 13),
      fontMedium: Math.max(scaleFont(16, width), 14),
      fontLarge: Math.max(scaleFont(18, width), 16),
      fontXL: Math.max(scaleFont(20, width), 18),
      fontXXL: Math.max(scaleFont(24, width), 20),
      fontXXXL: Math.max(scaleFont(32, width), 24),
      
      // Device specific
      isSmallDevice: smallDevice,
      isTablet: tablet,
      
      // Screen dimensions
      screenWidth: width,
      screenHeight: height,
    };
    
    const SPACING = {
      xs: scaleWidth(4, width),
      sm: scaleWidth(8, width),
      md: scaleWidth(16, width),
      lg: scaleWidth(24, width),
      xl: scaleWidth(32, width),
      xxl: scaleWidth(48, width),
    };
    
    const RADIUS = {
      xs: scaleWidth(4, width),
      sm: scaleWidth(8, width),
      md: scaleWidth(12, width),
      lg: scaleWidth(16, width),
      xl: scaleWidth(24, width),
      round: scaleWidth(999, width),
    };
    
    return { DIMENSIONS, SPACING, RADIUS };
  }, [width, height]);
};