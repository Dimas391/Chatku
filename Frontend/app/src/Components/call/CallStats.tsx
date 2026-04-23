import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useTheme } from '@/app/src/context/ThemeContext';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { styles as globalStyles } from '@/app/src/utils/styles';

interface CallStatsProps {
  totalCalls: number;
  missedCalls: number;
  videoCalls: number;
  onMenuPress?: () => void;
}

export const CallStats: React.FC<CallStatsProps> = ({
  totalCalls,
  missedCalls,
  videoCalls,
  onMenuPress,
}) => {
  const { colors } = useTheme();
  const insets = useSafeAreaInsets(); // Mendapatkan ukuran area aman (top, bottom, etc)

  return (
    // Tambahkan padding top berdasarkan inset area aman
    <View style={[
      globalStyles.headerContainer, 
      { paddingTop: insets.top + 10, backgroundColor: colors.background }
    ]}>
      <View style={globalStyles.headerTop}>
        <Text style={[globalStyles.headerTitle, { color: colors.text }]}>
          Riwayat Panggilan
        </Text>
        <TouchableOpacity style={globalStyles.menuButton} onPress={onMenuPress}>
          <MaterialCommunityIcons name="dots-vertical" size={24} color={colors.text} />
        </TouchableOpacity>
      </View>
      
      <View style={globalStyles.statsContainer}>
        <View style={[globalStyles.statItem, { backgroundColor: colors.card }]}>
          <MaterialCommunityIcons name="phone" size={20} color="#FF6B35" />
          <Text style={[globalStyles.statValue, { color: colors.text }]}>{totalCalls}</Text>
          <Text style={[globalStyles.statLabel, { color: colors.textSecondary }]}>Total</Text>
        </View>
        
        <View style={[globalStyles.statItem, { backgroundColor: colors.card }]}>
          <MaterialCommunityIcons name="phone-missed" size={20} color="#FF4444" />
          <Text style={[globalStyles.statValue, { color: colors.text }]}>{missedCalls}</Text>
          <Text style={[globalStyles.statLabel, { color: colors.textSecondary }]}>Missed</Text>
        </View>
        
        <View style={[globalStyles.statItem, { backgroundColor: colors.card }]}>
          <MaterialCommunityIcons name="video" size={20} color="#4CAF50" />
          <Text style={[globalStyles.statValue, { color: colors.text }]}>{videoCalls}</Text>
          <Text style={[globalStyles.statLabel, { color: colors.textSecondary }]}>Video</Text>
        </View>
      </View>
    </View>
  );
};