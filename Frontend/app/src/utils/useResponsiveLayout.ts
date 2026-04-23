import { useWindowDimensions, Platform } from 'react-native';
import { useState, useEffect } from 'react';

interface LayoutInfo {
  isLandscape: boolean;
  isSmallDevice: boolean;
  isTablet: boolean;
  screenWidth: number;
  screenHeight: number;
  availableWidth: number;
  availableHeight: number;
  headerHeight: number;
  inputHeight: number;
  contentHeight: number;
}

export const useResponsiveLayout = (): LayoutInfo => {
  const { width, height } = useWindowDimensions();

  const baseHeaderHeight = Platform.select({
    ios: 44,
    android: 56,
    default: 56,
  });

  const initialHeaderHeight = (baseHeaderHeight ?? 56) + 20;
  const initialInputHeight = 60;
  const initialStatusBarHeight = Platform.OS === 'ios' ? 47 : 0;

  const [layout, setLayout] = useState<LayoutInfo>({
    isLandscape: width > height,
    isSmallDevice: width < 375,
    isTablet: width >= 600,
    screenWidth: width,
    screenHeight: height,
    availableWidth: width,
    availableHeight: height,
    headerHeight: initialHeaderHeight,
    inputHeight: initialInputHeight,
    contentHeight: height - initialStatusBarHeight - initialHeaderHeight - initialInputHeight,
  });

  useEffect(() => {
    const baseHeaderHeight = Platform.select({
      ios: 44,
      android: 56,
      default: 56,
    });

    const headerHeight = (baseHeaderHeight ?? 56) + 20;
    const inputHeight = 60;
    const statusBarHeight = Platform.OS === 'ios' ? 47 : 0;

    setLayout({
      isLandscape: width > height,
      isSmallDevice: width < 375,
      isTablet: width >= 600,
      screenWidth: width,
      screenHeight: height,
      availableWidth: width - 32,
      availableHeight: height - statusBarHeight - headerHeight - inputHeight,
      headerHeight,
      inputHeight,
      contentHeight: height - statusBarHeight - headerHeight - inputHeight,
    });
  }, [width, height]);

  return layout;
};