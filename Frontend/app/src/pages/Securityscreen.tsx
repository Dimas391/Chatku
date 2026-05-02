import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  ScrollView,
  FlatList,
  TouchableOpacity,
  RefreshControl,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useTheme } from '@/app/src/context/ThemeContext';
import { BaseScreen } from '@/app/src/Components/BaseScreen';

// Import komponen
import { SecurityHeader } from '@/app/src/Components/Security/SecurityHeader';
import { StatusBanner } from '@/app/src/Components/Security/StatusBanner';
import { AnimatedRing } from '@/app/src/Components/Security/AnimatedRing';
import { FeatureCard } from '@/app/src/Components/Security/FeatureCard';
import { ThreatItem } from '@/app/src/Components/Security/ThreatItem';
import { KeyCard } from '@/app/src/Components/Security/KeyCard';
import { LogItem } from '@/app/src/Components/Security/LogItem';
import { LogDetailModal } from '@/app/src/Components/Security/LogDetailModal';
import { useSecurityData } from '@/app/src/hooks/useSecurityData';
import { ForensicLog } from '@/app/src/services/securityService';
import { styles } from '@/app/src/utils/Security';

type TabType = 'dashboard' | 'keys' | 'logs';

const SecurityScreen = () => {
  const navigation = useNavigation<any>();
  const { colors, isDarkMode } = useTheme();
  const [activeTab, setActiveTab] = useState<TabType>('dashboard');
  const [selectedLog, setSelectedLog] = useState<ForensicLog | null>(null);
  const [logModalVisible, setLogModalVisible] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  
  const { 
    keys, 
    logs, 
    score, 
    features, 
    verifyKey, 
    loading, 
    error, 
    refreshData 
  } = useSecurityData();

  // Log error jika ada
  useEffect(() => {
    if (error) {
      console.error('[Security] Error loading data:', error);
      // Tampilkan alert untuk error kritis
      if (error.includes('401') || error.includes('unauthorized')) {
        Alert.alert(
          'Sesi Expired',
          'Sesi Anda telah berakhir. Silakan login kembali.',
          [{ text: 'OK', onPress: () => navigation?.navigate('Login') }]
        );
      }
    }
  }, [error]);

  // Refresh data saat tab berubah
  useEffect(() => {
    refreshData();
  }, [activeTab]);

  // Pull to refresh handler
  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await refreshData();
    setRefreshing(false);
  }, [refreshData]);

  const handleLogDetail = (log: ForensicLog) => {
    setSelectedLog(log);
    setLogModalVisible(true);
  };

  const handleVerifyKey = async (keyId: string) => {
    try {
      await verifyKey(keyId);
      Alert.alert(
        'Berhasil',
        'Kunci publik kontak berhasil diverifikasi',
        [{ text: 'OK' }]
      );
    } catch (err) {
      Alert.alert(
        'Gagal',
        'Verifikasi kunci gagal. Pastikan QR code valid.',
        [{ text: 'OK' }]
      );
    }
  };

  const renderTabBar = () => (
    <View style={[styles.tabBar]}>
      {([
        { key: 'dashboard', icon: 'view-dashboard', label: 'Dashboard' },
        { key: 'keys', icon: 'key-chain', label: 'Key Verify' },
        { key: 'logs', icon: 'file-search', label: 'Forensic Log' },
      ] as const).map(tab => (
        <TouchableOpacity
          key={tab.key}
          style={[styles.tabItem, activeTab === tab.key && styles.tabItemActive]}
          onPress={() => setActiveTab(tab.key)}
        >
          <MaterialCommunityIcons
            name={tab.icon as any}
            size={18}
            color={activeTab === tab.key ? '#FF6B35' : colors.textSecondary}
          />
          <Text style={[
            styles.tabLabel,
            { color: activeTab === tab.key ? '#FF6B35' : colors.textSecondary }
          ]}>
            {tab.label}
          </Text>
          {activeTab === tab.key && <View style={styles.tabIndicator} />}
        </TouchableOpacity>
      ))}
    </View>
  );

  const renderDashboard = () => (
    <ScrollView 
      showsVerticalScrollIndicator={false}
      refreshControl={
        <RefreshControl 
          refreshing={refreshing} 
          onRefresh={onRefresh} 
          tintColor={colors.primary}
          colors={[colors.primary]}
        />
      }
    >
      <StatusBanner />

      <View style={[styles.card]}>
        <Text style={[styles.cardTitle, { color: colors.text }]}>Skor Keamanan</Text>
        <View style={styles.ringsRow}>
          <AnimatedRing score={score.overall} size={80} color="#FF6B35" label="Overall" />
          <AnimatedRing score={score.encryption} size={64} color="#4CAF50" label="Enkripsi" />
          <AnimatedRing score={score.authentication} size={64} color="#2196F3" label="Autentikasi" />
          <AnimatedRing score={score.integrity} size={64} color="#9C27B0" label="Integritas" />
        </View>
      </View>

      <Text style={[styles.sectionTitle, { color: colors.text }]}>Fitur Keamanan Aktif</Text>
      {features.length === 0 && !loading ? (
        <View style={[styles.emptyState, { backgroundColor: colors.card }]}>
          <MaterialCommunityIcons name="shield-off" size={48} color={colors.textSecondary} />
          <Text style={[styles.emptyStateText, { color: colors.textSecondary }]}>
            Tidak ada fitur keamanan
          </Text>
        </View>
      ) : (
        features.map((feature, i) => (
          <FeatureCard key={i} feature={feature} />
        ))
      )}

      <Text style={[styles.sectionTitle, { color: colors.text }]}>Ancaman Terbaru</Text>
      {logs.filter(l => l.severity !== 'info').slice(0, 3).length === 0 && !loading ? (
        <View style={[styles.emptyState]}>
          <MaterialCommunityIcons name="shield-check" size={48} color="#4CAF50" />
          <Text style={[styles.emptyStateText, { color: colors.textSecondary }]}>
            Tidak ada ancaman terdeteksi
          </Text>
        </View>
      ) : (
        logs.filter(l => l.severity !== 'info').slice(0, 3).map(log => (
          <ThreatItem key={log.id} log={log} onPress={handleLogDetail} />
        ))
      )}

      {/* Tombol Refresh Manual */}
      <TouchableOpacity 
        style={[styles.refreshButton]}
        onPress={refreshData}
      >
        <MaterialCommunityIcons name="refresh" size={20} color="#FF6B35" />
        <Text style={[styles.refreshButtonText, { color: colors.text }]}>
          Refresh Data
        </Text>
      </TouchableOpacity>

      <View style={{ height: 32 }} />
    </ScrollView>
  );

  const renderKeys = () => (
    <ScrollView 
      showsVerticalScrollIndicator={false}
      refreshControl={
        <RefreshControl 
          refreshing={refreshing} 
          onRefresh={onRefresh} 
          tintColor={colors.primary}
          colors={[colors.primary]}
        />
      }
    >
      <View style={[styles.infoBox, { backgroundColor: '#0d1a2e' }]}>
        <MaterialCommunityIcons name="information-outline" size={18} color="#2196F3" />
        <Text style={styles.infoText}>
          Verifikasi kunci publik kontak Anda untuk memastikan tidak ada serangan Man-in-the-Middle (MITM).
        </Text>
      </View>

      {loading && keys.length === 0 ? (
        <View style={[styles.loadingContainer]}>
          <ActivityIndicator size="large" color={colors.primary} />
          <Text style={[styles.loadingText, { color: colors.textSecondary }]}>
            Memuat data kunci...
          </Text>
        </View>
      ) : keys.length === 0 ? (
        <View style={[styles.emptyState]}>
          <MaterialCommunityIcons name="key-remove" size={48} color={colors.textSecondary} />
          <Text style={[styles.emptyStateText, { color: colors.textSecondary }]}>
            Belum ada kontak untuk diverifikasi
          </Text>
        </View>
      ) : (
        keys.map(key => (
          <KeyCard
            key={key.id}
            keyItem={key}
            isDarkMode={isDarkMode}
            onVerify={handleVerifyKey}
          />
        ))
      )}

      <View style={{ height: 32 }} />
    </ScrollView>
  );

  const renderLogs = () => (
    <View style={{ flex: 1 }}>
      <View style={[styles.infoBox, { backgroundColor: '#1a0d2e' }]}>
        <MaterialCommunityIcons name="database-search" size={18} color="#9C27B0" />
        <Text style={[styles.infoText, { color: '#bb86fc' }]}>
          Log forensik digital — setiap aktivitas tercatat dengan hash SHA-256 yang tidak bisa dimanipulasi.
        </Text>
      </View>

      <View style={styles.legendRow}>
        {(['info', 'warning', 'critical'] as const).map(s => {
          const color = s === 'info' ? '#4CAF50' : s === 'warning' ? '#FFA500' : '#FF4444';
          return (
            <View key={s} style={styles.legendItem}>
              <View style={[styles.legendDot, { backgroundColor: color }]} />
              <Text style={[styles.legendText, { color: colors.textSecondary }]}>
                {s === 'info' ? 'Informasi' : s === 'warning' ? 'Peringatan' : 'Kritis'}
              </Text>
            </View>
          );
        })}
      </View>

      {loading && logs.length === 0 ? (
        <View style={[styles.loadingContainer, { backgroundColor: colors.card }]}>
          <ActivityIndicator size="large" color={colors.primary} />
          <Text style={[styles.loadingText, { color: colors.textSecondary }]}>
            Memuat log forensik...
          </Text>
        </View>
      ) : (
        <FlatList
          data={logs}
          keyExtractor={item => item.id}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={{ paddingBottom: 40 }}
          refreshControl={
            <RefreshControl 
              refreshing={refreshing} 
              onRefresh={onRefresh} 
              tintColor={colors.primary}
              colors={[colors.primary]}
            />
          }
          renderItem={({ item }) => (
            <LogItem log={item} onPress={handleLogDetail} />
          )}
          ListEmptyComponent={
            <View style={[styles.emptyState, { backgroundColor: colors.card }]}>
              <MaterialCommunityIcons name="file-document-outline" size={48} color={colors.textSecondary} />
              <Text style={[styles.emptyStateText, { color: colors.textSecondary }]}>
                Belum ada log keamanan
              </Text>
            </View>
          }
        />
      )}
    </View>
  );

  // Loading state untuk pertama kali load
  if (loading && !keys.length && !logs.length) {
    return (
      <BaseScreen safeArea={false}>
        <View style={[styles.container, { backgroundColor: colors.background, justifyContent: 'center', alignItems: 'center' }]}>
          <ActivityIndicator size="large" color={colors.primary} />
          <Text style={[styles.loadingText, { color: colors.textSecondary, marginTop: 16 }]}>
            Memuat data keamanan...
          </Text>
        </View>
      </BaseScreen>
    );
  }

  return (
    <BaseScreen safeArea={false}>
      <View style={[styles.container, { backgroundColor: colors.background }]}>
        <SecurityHeader />
        {renderTabBar()}
        
        <View style={{ flex: 1, paddingHorizontal: 16 }}>
          {activeTab === 'dashboard' && renderDashboard()}
          {activeTab === 'keys' && renderKeys()}
          {activeTab === 'logs' && renderLogs()}
        </View>

        <LogDetailModal
          visible={logModalVisible}
          log={selectedLog}
          onClose={() => setLogModalVisible(false)}
        />
      </View>
    </BaseScreen>
  );
};

export default SecurityScreen;