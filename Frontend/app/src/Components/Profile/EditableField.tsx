import React from 'react';
import {
  View,
  Text,
  TextInput,
  StyleSheet,
} from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useTheme } from '@/app/src/context/ThemeContext';

interface EditableFieldProps {
  icon: string;
  label: string;
  value: string;
  isEditing: boolean;
  onChangeText?: (text: string) => void;
  multiline?: boolean;
  placeholder?: string;
  maxLength?: number;
}

const EditableField: React.FC<EditableFieldProps> = ({
  icon,
  label,
  value,
  isEditing,
  onChangeText,
  multiline = false,
  placeholder = '',
  maxLength,
}) => {
  const { colors } = useTheme();

  return (
    <View style={styles.container}>
      <View style={styles.iconContainer}>
        <MaterialCommunityIcons name={icon as any} size={22} color={colors.primary} />
      </View>
      <View style={styles.content}>
        <Text style={[styles.label, { color: colors.textTertiary }]}>{label}</Text>
        {isEditing ? (
          <TextInput
            style={[
              styles.input, 
              { 
                color: colors.text,
                borderBottomColor: colors.primary,
              },
              multiline && styles.multilineInput
            ]}
            value={value}
            onChangeText={onChangeText}
            placeholder={placeholder}
            placeholderTextColor={colors.textTertiary}
            multiline={multiline}
            maxLength={maxLength}
          />
        ) : (
          <Text style={[styles.value, { color: colors.text }]}>{value || '-'}</Text>
        )}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    marginBottom: 20,
  },
  iconContainer: {
    width: 40,
    marginRight: 12,
    alignItems: 'center',
  },
  content: {
    flex: 1,
  },
  label: {
    fontSize: 12,
    marginBottom: 4,
  },
  value: {
    fontSize: 16,
    fontWeight: '500',
  },
  input: {
    fontSize: 16,
    borderBottomWidth: 1,
    paddingVertical: 4,
    paddingHorizontal: 0,
  },
  multilineInput: {
    minHeight: 60,
    textAlignVertical: 'top',
  },
});

export default EditableField;