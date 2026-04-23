import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';

interface SupportMessageFormProps {
  onSend?: (message: string) => Promise<void>;
}

const SupportMessageForm: React.FC<SupportMessageFormProps> = ({ onSend }) => {
  const [message, setMessage] = useState('');
  const [sending, setSending] = useState(false);

  const handleSend = async () => {
    if (!message.trim()) {
      Alert.alert('Error', 'Pesan tidak boleh kosong');
      return;
    }

    setSending(true);
    try {
      if (onSend) {
        await onSend(message);
      } else {
        // Simulasi kirim pesan
        await new Promise(resolve => setTimeout(resolve, 1000));
      }
      Alert.alert('Sukses', 'Pesan dukungan telah dikirim. Kami akan merespon segera.');
      setMessage('');
    } catch (error) {
      Alert.alert('Error', 'Gagal mengirim pesan. Silakan coba lagi.');
    } finally {
      setSending(false);
    }
  };

  return (
    <View style={styles.container}>
      <TextInput
        style={styles.input}
        placeholder="Tulis pesan Anda di sini..."
        placeholderTextColor="#999"
        value={message}
        onChangeText={setMessage}
        multiline
        numberOfLines={4}
        textAlignVertical="top"
      />
      <TouchableOpacity
        style={[styles.sendButton, sending && styles.disabled]}
        onPress={handleSend}
        disabled={sending}
      >
        {sending ? (
          <ActivityIndicator size="small" color="#fff" />
        ) : (
          <>
            <MaterialCommunityIcons name="send" size={20} color="#fff" />
            <Text style={styles.sendText}>Kirim</Text>
          </>
        )}
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginTop: 8,
  },
  input: {
    backgroundColor: '#F5F5F5',
    borderRadius: 12,
    padding: 12,
    fontSize: 15,
    color: '#333',
    minHeight: 100,
  },
  sendButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FF6B35',
    paddingVertical: 12,
    borderRadius: 12,
    marginTop: 12,
    gap: 8,
  },
  disabled: {
    opacity: 0.6,
  },
  sendText: {
    fontSize: 15,
    fontWeight: '600',
    color: '#fff',
  },
});

export default SupportMessageForm;