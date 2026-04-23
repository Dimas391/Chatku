import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';

type TabType = 'phone' | 'email';

interface TabSelectorProps {
  activeTab: TabType;
  onTabChange: (tab: TabType) => void;
}

const TabSelector = ({ activeTab, onTabChange }: TabSelectorProps) => {
  return (
    <View style={styles.tabContainer}>
      <TouchableOpacity
        style={[styles.tab, activeTab === 'phone' && styles.tabActive]}
        onPress={() => onTabChange('phone')}
      >
        <MaterialCommunityIcons 
          name="cellphone" 
          size={18} 
          color={activeTab === 'phone' ? '#FF6B35' : '#999'} 
        />
        <Text style={[styles.tabText, activeTab === 'phone' && styles.tabTextActive]}>
          Telepon
        </Text>
      </TouchableOpacity>
      <TouchableOpacity
        style={[styles.tab, activeTab === 'email' && styles.tabActive]}
        onPress={() => onTabChange('email')}
      >
        <MaterialCommunityIcons 
          name="email" 
          size={18} 
          color={activeTab === 'email' ? '#FF6B35' : '#999'} 
        />
        <Text style={[styles.tabText, activeTab === 'email' && styles.tabTextActive]}>
          Email
        </Text>
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  tabContainer: {
    flexDirection: 'row',
    backgroundColor: '#F5F5F5',
    borderRadius: 30,
    padding: 4,
    marginBottom: 24,
  },
  tab: {
    flex: 1,
    flexDirection: 'row',
    paddingVertical: 12,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 26,
    gap: 6,
  },
  tabActive: {
    backgroundColor: '#FFFFFF',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  tabText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#999999',
  },
  tabTextActive: {
    color: '#FF6B35',
  },
});

export default TabSelector;