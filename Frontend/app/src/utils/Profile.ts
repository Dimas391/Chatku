import { StyleSheet } from 'react-native';

export const styles = StyleSheet.create({
  container: { flex: 1 },

  // Profile Card
  profileCard: {
    marginHorizontal: 16,
    marginTop: 12,
    marginBottom: 8,
    borderRadius: 20,
    padding: 20,
    alignItems: 'center',
  },
 avatarWrapper: { 
  marginBottom: 14, 
  width: 120,      // tambah ukuran wrapper
  height: 120, 
},
helperText: {
    fontSize: 11,
    marginTop: -8,
    marginBottom: 8,
    marginLeft: 4,
},
avatar: { 
  width: 120,      // ukuran avatar diperbesar
  height: 120, 
  borderRadius: 60, // tetap bulat
},
avatarPlaceholder: {
  width: 120,      // placeholder juga diperbesar
  height: 120,
  borderRadius: 60,
  backgroundColor: '#FF6B3520',
  justifyContent: 'center', 
  alignItems: 'center',
  borderWidth: 3, 
  borderColor: '#FF6B3540',
},
avatarInitial: { 
  fontSize: 48,   // font inisial disesuaikan agar proporsional
  fontWeight: '800', 
  color: '#FF6B35' 
},
avatarEditBadge: {
  position: 'absolute', 
  bottom: 0, 
  right: 0,
  width: 30,     // badge sedikit diperbesar
  height: 30,
  borderRadius: 15,
  justifyContent: 'center', 
  alignItems: 'center',
  borderWidth: 2, 
  borderColor: '#FF6B35',
},
charCount: {
    fontSize: 11,
    textAlign: 'right',
    marginTop: -8,
    marginBottom: 8,
},

  profileInfo: { alignItems: 'center', marginBottom: 12 },
  nameRow: { flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 3 },
  profileName: { fontSize: 22, fontWeight: '800' },
  profileUsername: { fontSize: 13, marginBottom: 6 },
  profileBio: { fontSize: 13, textAlign: 'center', lineHeight: 18 },
  statusPill: {
    flexDirection: 'row', alignItems: 'center', gap: 6,
    paddingHorizontal: 14, paddingVertical: 6,
    borderRadius: 20, borderWidth: 1, marginBottom: 16,
  },
  statusDot: { width: 8, height: 8, borderRadius: 4 },
  statusText: { fontSize: 12, fontWeight: '700' },
  statsRow: {
    flexDirection: 'row', width: '100%',
    borderTopWidth: 1, paddingTop: 14,
  },
  statItem: { flex: 1, alignItems: 'center' },
  statValue: { fontSize: 16, fontWeight: '800' },
  statLabel: { fontSize: 11, marginTop: 2 },

  // Section Header
  sectionHeader: {
    fontSize: 11, fontWeight: '700', letterSpacing: 1.2,
    marginHorizontal: 16, marginTop: 20, marginBottom: 6,
  },

  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },

  // Setting Row
  settingRow: {
    flexDirection: 'row', alignItems: 'center', gap: 12,
    paddingHorizontal: 16, paddingVertical: 13,
    marginHorizontal: 16, marginBottom: 2, borderRadius: 12,
  },
  settingIcon: {
    width: 38, height: 38, borderRadius: 10,
    justifyContent: 'center', alignItems: 'center',
  },
  settingLabel: { flex: 1 },
  settingLabelText: { fontSize: 14, fontWeight: '500' },
  settingSubLabel: { fontSize: 11, marginTop: 2 },

  // Logout / Delete
  logoutButton: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 10,
    marginHorizontal: 16, marginBottom: 10,
    paddingVertical: 14, borderRadius: 14, borderWidth: 1,
  },
  logoutText: { color: '#FF6B35', fontSize: 15, fontWeight: '700' },
  deleteButton: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 10,
    marginHorizontal: 16, marginBottom: 10,
    paddingVertical: 14, borderRadius: 14, borderWidth: 1,
  },
  deleteText: { color: '#FF4444', fontSize: 15, fontWeight: '600' },

  // Modals
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
    alignSelf: 'center', marginBottom: 18,
  },
  modalTitle: { fontSize: 17, fontWeight: '700', marginBottom: 14 },
  modalInput: {
    borderRadius: 12, borderWidth: 1,
    paddingHorizontal: 14, paddingVertical: 12,
    fontSize: 15, marginBottom: 16,
  },
  modalActions: { flexDirection: 'row', gap: 10 },
  modalBtn: {
    flex: 1, paddingVertical: 13, borderRadius: 12, alignItems: 'center',
  },
  modalBtnText: { fontSize: 15, fontWeight: '700' },

  // Status Modal
  statusModal: {
    marginHorizontal: 40,
    marginTop: 'auto',
    marginBottom: 'auto',
    borderRadius: 20,
    padding: 16,
    elevation: 10,
  },
  securityBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 20,
    marginBottom: 12,
    alignSelf: 'center',
  },
  securityBadgeText: {
    fontSize: 11,
    fontWeight: '600',
  },
  statusModalTitle: { fontSize: 15, fontWeight: '700', marginBottom: 12, textAlign: 'center' },
  statusOption: {
    flexDirection: 'row', alignItems: 'center', gap: 12,
    paddingVertical: 12, paddingHorizontal: 10, borderRadius: 10, marginBottom: 4,
  },
  statusOptionDot: { width: 10, height: 10, borderRadius: 5 },
  statusOptionText: { flex: 1, fontSize: 14, fontWeight: '500' },
});