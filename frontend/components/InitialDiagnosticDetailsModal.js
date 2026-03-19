import React from 'react';
import {
  Modal,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { getInitialDiagnosticSections } from '../utils/initialDiagnostic';

const InitialDiagnosticDetailsModal = ({ visible, onClose, diagnosticData }) => {
  const sections = getInitialDiagnosticSections(diagnosticData);

  return (
    <Modal visible={visible} animationType="slide" transparent onRequestClose={onClose}>
      <View style={styles.overlay}>
        <View style={styles.modalContent}>
          <View style={styles.header}>
            <View>
              <Text style={styles.title}>Initial Diagnostic</Text>
              <Text style={styles.subtitle}>Extracted self-report profile</Text>
            </View>
            <TouchableOpacity onPress={onClose} style={styles.closeButton}>
              <Ionicons name="close" size={24} color="#111827" />
            </TouchableOpacity>
          </View>

          <ScrollView style={styles.body} contentContainerStyle={styles.bodyContent} showsVerticalScrollIndicator={false}>
            {sections.map((section) => (
              <View key={section.title} style={styles.sectionCard}>
                <Text style={styles.sectionTitle}>{section.title}</Text>
                {section.items.map(([label, value]) => (
                  <View key={label} style={styles.itemRow}>
                    <Text style={styles.itemLabel}>{label}</Text>
                    <Text style={styles.itemValue}>{value}</Text>
                  </View>
                ))}
              </View>
            ))}
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(15, 23, 42, 0.45)',
    justifyContent: 'center',
    padding: 16,
  },
  modalContent: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    overflow: 'hidden',
    maxHeight: '88%',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 18,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  title: {
    fontSize: 20,
    fontWeight: '700',
    color: '#111827',
  },
  subtitle: {
    marginTop: 4,
    fontSize: 13,
    color: '#6B7280',
  },
  closeButton: {
    padding: 6,
  },
  body: {
    backgroundColor: '#F9FAFB',
  },
  bodyContent: {
    padding: 18,
  },
  sectionCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 16,
    marginBottom: 14,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#1F2937',
    marginBottom: 12,
  },
  itemRow: {
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  itemLabel: {
    fontSize: 12,
    fontWeight: '700',
    color: '#6B7280',
    textTransform: 'uppercase',
    marginBottom: 4,
  },
  itemValue: {
    fontSize: 15,
    lineHeight: 21,
    color: '#111827',
  },
});

export default InitialDiagnosticDetailsModal;
