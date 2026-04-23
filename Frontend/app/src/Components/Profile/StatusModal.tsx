import React from 'react';
import { View, Text, Modal, TouchableOpacity } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useTheme } from '@/app/src/context/ThemeContext';
import { UserStatus, StatusOption } from '@/app/src/hooks/Profile';
import { styles } from '@/app/src/utils/Profile';

interface StatusModalProps {
  visible: boolean;
  currentStatus: UserStatus;
  statusOptions: StatusOption[];
  onSelect: (status: UserStatus) => void;
  onClose: () => void;
}

export const StatusModal: React.FC<StatusModalProps> = ({
  visible,
  currentStatus,
  statusOptions,
  onSelect,
  onClose,
}) => {
  const { colors } = useTheme();

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <TouchableOpacity style={styles.modalOverlay} activeOpacity={1} onPress={onClose}>
        <View style={[styles.statusModal, { backgroundColor: colors.card }]}>
          <Text style={[styles.statusModalTitle, { color: colors.text }]}>Ubah Status</Text>
          {statusOptions.map(s => (
            <TouchableOpacity
              key={s.key}
              style={[
                styles.statusOption,
                { backgroundColor: currentStatus === s.key ? s.color + '15' : 'transparent' }
              ]}
              onPress={() => onSelect(s.key)}
            >
              <View style={[styles.statusOptionDot, { backgroundColor: s.color }]} />
              <Text style={[styles.statusOptionText, { color: colors.text }]}>{s.label}</Text>
              {currentStatus === s.key && (
                <MaterialCommunityIcons name="check" size={18} color={s.color} />
              )}
            </TouchableOpacity>
          ))}
        </View>
      </TouchableOpacity>
    </Modal>
  );
};