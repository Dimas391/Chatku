import { StyleSheet } from 'react-native';

export const styles = StyleSheet.create({
  container: { flex: 1 },

  // Header
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 12,
  },
  headerLeft: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  headerTitle: { fontSize: 22, fontWeight: '800' },
  headerSub: { fontSize: 11, marginTop: 1 },
  headerBadge: {
    flexDirection: 'row', alignItems: 'center', gap: 6,
    paddingHorizontal: 10, paddingVertical: 5, borderRadius: 20,
  },
  headerDot: { width: 7, height: 7, borderRadius: 3.5, backgroundColor: '#4CAF50' },
  headerBadgeText: { color: '#4CAF50', fontWeight: '800', fontSize: 10 },

  // Tab Bar
  tabBar: {
    flexDirection: 'row',
    marginHorizontal: 16,
    borderRadius: 14,
    marginBottom: 12,
    padding: 4,
  },
  tabItem: {
    flex: 1, alignItems: 'center', paddingVertical: 8,
    borderRadius: 10, gap: 3, position: 'relative',
  },
  tabItemActive: { backgroundColor: '#FF6B3515' },
  tabLabel: { fontSize: 10, fontWeight: '600' },
  tabIndicator: {
    position: 'absolute', bottom: 3, width: 16, height: 2,
    backgroundColor: '#FF6B35', borderRadius: 1,
  },

  // Status Banner
  statusBanner: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    borderRadius: 16, padding: 20, marginBottom: 16,
    borderWidth: 1, borderColor: '#4CAF5030',
  },
  statusLeft: { flex: 1 },
  statusLabel: { color: '#4CAF50', fontSize: 10, fontWeight: '800', letterSpacing: 1.5 },
  statusTitle: { color: '#fff', fontSize: 20, fontWeight: '800', marginTop: 4 },
  statusSub: { color: '#4CAF5099', fontSize: 12, marginTop: 2 },

  // Cards
  card: { borderRadius: 16, padding: 16, marginBottom: 16 },
  cardTitle: { fontSize: 14, fontWeight: '700', marginBottom: 16 },
  ringsRow: {
    flexDirection: 'row', justifyContent: 'space-around',
    alignItems: 'center', flexWrap: 'wrap', gap: 8,
  },

  sectionTitle: {
    fontSize: 14, fontWeight: '700', marginBottom: 10, marginTop: 4,
  },

  // Feature Rows
  featureRow: {
    flexDirection: 'row', alignItems: 'center', gap: 12,
    borderRadius: 12, padding: 14, marginBottom: 8,
  },
  featureIcon: { width: 40, height: 40, borderRadius: 10, justifyContent: 'center', alignItems: 'center' },
  featureText: { flex: 1 },
  featureName: { fontSize: 14, fontWeight: '600' },
  featureDesc: { fontSize: 11, marginTop: 2 },
  activeBadge: { paddingHorizontal: 8, paddingVertical: 4, borderRadius: 8 },

  // Threat Rows
  threatRow: {
    flexDirection: 'row', alignItems: 'center', gap: 12,
    borderRadius: 12, padding: 14, marginBottom: 8,
  },
  threatDot: { width: 8, height: 8, borderRadius: 4 },
  threatEvent: { fontSize: 13, fontWeight: '600' },
  threatTime: { fontSize: 11, marginTop: 2 },

  // Info Box
  infoBox: {
    flexDirection: 'row', gap: 10, alignItems: 'flex-start',
    borderRadius: 12, padding: 14, marginBottom: 14,
  },
  infoText: { flex: 1, color: '#90caf9', fontSize: 12, lineHeight: 18 },

  // Key Cards
  keyCard: { borderRadius: 16, padding: 16, marginBottom: 12 },
  keyHeader: { flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 12 },
  keyAvatar: {
    width: 44, height: 44, borderRadius: 22,
    justifyContent: 'center', alignItems: 'center',
  },
  keyAvatarText: { fontSize: 20, fontWeight: '800', color: '#FF6B35' },
  keyName: { fontSize: 15, fontWeight: '700' },
  keyAlgo: { fontSize: 11, marginTop: 2 },
  keyStatus: {
    flexDirection: 'row', alignItems: 'center',
    paddingHorizontal: 8, paddingVertical: 5, borderRadius: 10,
  },
  fingerprintBox: { borderRadius: 10, padding: 12, marginBottom: 12 },
  fingerprintLabel: { color: '#666', fontSize: 9, fontWeight: '700', letterSpacing: 1.5, marginBottom: 6 },
  fingerprintValue: { color: '#FF6B35', fontFamily: 'monospace', fontSize: 12, letterSpacing: 0.5 },
  keyFooter: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  keyVerifiedAt: { color: '#4CAF50', fontSize: 11 },
  verifyButton: {
    flexDirection: 'row', alignItems: 'center', gap: 8,
    backgroundColor: '#2196F3', borderRadius: 10,
    paddingVertical: 10, paddingHorizontal: 16, justifyContent: 'center',
  },
  verifyButtonText: { color: '#fff', fontWeight: '700', fontSize: 13 },

  // Log Rows
  legendRow: { flexDirection: 'row', gap: 16, marginBottom: 12, paddingHorizontal: 2 },
  legendItem: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  legendDot: { width: 8, height: 8, borderRadius: 4 },
  legendText: { fontSize: 11 },

  logRow: {
    flexDirection: 'row', alignItems: 'center', gap: 10,
    borderRadius: 12, marginBottom: 8, overflow: 'hidden',
    paddingVertical: 12, paddingRight: 12,
  },
  logBar: { width: 4, height: '100%', borderRadius: 2, alignSelf: 'stretch' },
  logIcon: {
    width: 36, height: 36, borderRadius: 10,
    justifyContent: 'center', alignItems: 'center', marginLeft: 4,
  },
  logContent: { flex: 1 },
  logEvent: { fontSize: 13, fontWeight: '700' },
  logDetail: { fontSize: 11, marginTop: 2 },
  logHash: { fontSize: 9, marginTop: 3, fontFamily: 'monospace' },
  logTime: { fontSize: 10, marginLeft: 4, width: 60, textAlign: 'right' },

  // Modal
  modalOverlay: {
    flex: 1, backgroundColor: '#00000088',
    justifyContent: 'flex-end',
  },
  modalCard: {
    borderTopLeftRadius: 24, borderTopRightRadius: 24,
    padding: 20, paddingBottom: 40,
  },
  modalHandle: {
    width: 40, height: 4, borderRadius: 2,
    alignSelf: 'center', marginBottom: 20,
  },
  modalHeader: { alignItems: 'center', marginBottom: 20 },
  modalBadge: {
    flexDirection: 'row', alignItems: 'center', gap: 6,
    paddingHorizontal: 12, paddingVertical: 6, borderRadius: 20, marginBottom: 10,
  },
  modalBadgeText: { fontWeight: '800', fontSize: 12 },
  modalEvent: { fontSize: 18, fontWeight: '800', textAlign: 'center', marginBottom: 4 },
  modalTime: { fontSize: 12, textAlign: 'center' },
  modalSection: { borderRadius: 12, padding: 14, marginBottom: 10 },
  modalSectionLabel: { color: '#666', fontSize: 9, fontWeight: '800', letterSpacing: 1.5, marginBottom: 6 },
  modalSectionValue: { fontSize: 13, lineHeight: 20 },
  modalClose: {
    backgroundColor: '#FF6B35', borderRadius: 14,
    paddingVertical: 14, marginTop: 8, alignItems: 'center',
  },
  modalCloseText: { color: '#fff', fontWeight: '800', fontSize: 15 },

  someText: { fontSize: 14 },
});