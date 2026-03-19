import React, { useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Image,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Ionicons } from '@expo/vector-icons';
import { GoogleSignin } from '@react-native-google-signin/google-signin';
import { authAPI } from '../services/api';
import InitialDiagnosticModal from './InitialDiagnosticModal';
import InitialDiagnosticDetailsModal from './InitialDiagnosticDetailsModal';
import { getLabel } from '../utils/initialDiagnostic';

const ProfileScreen = ({ userData, onBack, onLogout }) => {
  const [currentUserData, setCurrentUserData] = useState(userData || null);
  const [isEditing, setIsEditing] = useState(false);
  const [loading, setLoading] = useState(false);
  const [showDiagnosticWizard, setShowDiagnosticWizard] = useState(false);
  const [showDiagnosticDetails, setShowDiagnosticDetails] = useState(false);
  const [diagnosticLoading, setDiagnosticLoading] = useState(false);
  const [firstName, setFirstName] = useState(userData?.firstName || '');
  const [lastName, setLastName] = useState(userData?.lastName || '');
  const [email, setEmail] = useState(userData?.email || '');
  const [phone, setPhone] = useState('');

  const syncUserState = async (nextUserData) => {
    setCurrentUserData(nextUserData);
    setFirstName(nextUserData?.firstName || '');
    setLastName(nextUserData?.lastName || '');
    setEmail(nextUserData?.email || '');
    setPhone(
      nextUserData?.phone ||
      nextUserData?.parentInfo?.phone ||
      nextUserData?.patientInfo?.phone ||
      ''
    );

    if (nextUserData) {
      await AsyncStorage.setItem('userData', JSON.stringify(nextUserData));
    }
  };

  useEffect(() => {
    if (userData) {
      syncUserState(userData);
    }
  }, [userData]);

  useEffect(() => {
    const loadStoredUser = async () => {
      try {
        const storedUserData = await AsyncStorage.getItem('userData');
        if (storedUserData) {
          await syncUserState(JSON.parse(storedUserData));
        }
      } catch (error) {
        console.error('Error loading stored user data:', error);
      }
    };

    loadStoredUser();
  }, []);

  const diagnosticData = currentUserData?.diagnosticData;

  const diagnosticSummary = useMemo(() => {
    if (!diagnosticData?.completedWizard) {
      return null;
    }

    return {
      therapyFocus: getLabel('therapyFocus', diagnosticData.therapyFocus),
      facilityStatus: diagnosticData.hasInitialDiagnostic ? 'Completed' : 'Not yet completed',
      recommendedTherapy: getLabel('recommendedTherapy', diagnosticData.recommendedTherapy),
      recommendedLevel: diagnosticData.recommendedLevelName || getLabel('recommendedLevel', diagnosticData.recommendedLevel),
      recommendedFocus: diagnosticData.recommendedFocus || 'Not available',
    };
  }, [diagnosticData]);

  const handleSaveProfile = async () => {
    setLoading(true);
    try {
      if (!currentUserData?.token) {
        Alert.alert('Error', 'Authentication token not found. Please login again.');
        setLoading(false);
        return;
      }

      const response = await authAPI.updateProfile(currentUserData.token, {
        firstName,
        lastName,
        phone,
      });

      if (response.success && response.data) {
        const mergedUser = {
          ...currentUserData,
          ...response.data,
          token: currentUserData.token,
        };

        await syncUserState(mergedUser);
        setIsEditing(false);
        Alert.alert('Success', 'Profile updated successfully!');
      } else {
        Alert.alert('Error', response.message || 'Failed to update profile');
      }
    } catch (error) {
      Alert.alert('Error', error.message || 'Failed to update profile. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleCancelEdit = () => {
    setFirstName(currentUserData?.firstName || '');
    setLastName(currentUserData?.lastName || '');
    setEmail(currentUserData?.email || '');
    setPhone(
      currentUserData?.phone ||
      currentUserData?.parentInfo?.phone ||
      currentUserData?.patientInfo?.phone ||
      ''
    );
    setIsEditing(false);
  };

  const handleSaveDiagnostic = async (wizardPayload) => {
    setDiagnosticLoading(true);
    try {
      const response = await authAPI.saveDiagnosticData(wizardPayload);
      const nextUserData = {
        ...currentUserData,
        ...response.data.data,
        token: currentUserData?.token,
      };

      await syncUserState(nextUserData);
      setShowDiagnosticWizard(false);
      Alert.alert('Diagnostic Saved', 'Your initial diagnostic has been updated successfully.');
    } catch (error) {
      Alert.alert('Error', error.message || 'Failed to save diagnostic data.');
    } finally {
      setDiagnosticLoading(false);
    }
  };

  const handleLogout = async () => {
    Alert.alert('Logout', 'Are you sure you want to logout?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Logout',
        style: 'destructive',
        onPress: async () => {
          try {
            if (currentUserData?.googleId) {
              try {
                await GoogleSignin.signOut();
              } catch (error) {
                console.log('Google sign out error:', error);
              }
            }

            if (onLogout) {
              onLogout();
            }
          } catch (error) {
            console.error('Logout error:', error);
            Alert.alert('Error', 'Failed to logout properly');
          }
        },
      },
    ]);
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <View style={styles.headerLeft} />
        <Text style={styles.headerTitle}>Profile</Text>
        <View style={styles.headerRight}>
          {!isEditing ? (
            <TouchableOpacity onPress={() => setIsEditing(true)} style={styles.editButton}>
              <Ionicons name="create-outline" size={24} color="#C9302C" />
            </TouchableOpacity>
          ) : null}
        </View>
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.profileHeader}>
          <View style={styles.avatarContainer}>
            {currentUserData?.picture ? (
              <Image source={{ uri: currentUserData.picture }} style={styles.avatar} />
            ) : (
              <View style={styles.avatarPlaceholder}>
                <Ionicons name="person" size={50} color="#FFFFFF" />
              </View>
            )}
          </View>
          <Text style={styles.userName}>{firstName} {lastName}</Text>
          <View style={styles.roleBadge}>
            <Text style={styles.roleText}>{currentUserData?.role || 'Patient'}</Text>
          </View>
        </View>

        <View style={styles.card}>
          <View style={styles.cardHeader}>
            <Ionicons name="person-outline" size={24} color="#C9302C" />
            <Text style={styles.cardTitle}>Personal Information</Text>
          </View>

          <View style={styles.formGroup}>
            <Text style={styles.label}>First Name</Text>
            <TextInput style={[styles.input, !isEditing && styles.inputDisabled]} value={firstName} onChangeText={setFirstName} editable={isEditing} />
          </View>

          <View style={styles.formGroup}>
            <Text style={styles.label}>Last Name</Text>
            <TextInput style={[styles.input, !isEditing && styles.inputDisabled]} value={lastName} onChangeText={setLastName} editable={isEditing} />
          </View>

          <View style={styles.formGroup}>
            <Text style={styles.label}>Email Address</Text>
            <TextInput style={[styles.input, styles.inputDisabled]} value={email} editable={false} />
            <Text style={styles.helperText}>Email cannot be changed</Text>
          </View>

          <View style={styles.formGroup}>
            <Text style={styles.label}>Phone Number</Text>
            <TextInput style={[styles.input, !isEditing && styles.inputDisabled]} value={phone} onChangeText={setPhone} editable={isEditing} keyboardType="phone-pad" />
          </View>
        </View>

        {currentUserData?.therapyType ? (
          <View style={styles.card}>
            <View style={styles.cardHeader}>
              <Ionicons name="medkit-outline" size={24} color="#C9302C" />
              <Text style={styles.cardTitle}>Therapy Information</Text>
            </View>

            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>Therapy Type</Text>
              <Text style={styles.infoValue}>{currentUserData.therapyType === 'speech' ? 'Speech Therapy' : 'Physical Therapy'}</Text>
            </View>

            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>Patient Type</Text>
              <Text style={styles.infoValue}>
                {currentUserData.patientType === 'myself'
                  ? 'Myself'
                  : currentUserData.patientType === 'child'
                    ? 'Child'
                    : 'Dependent'}
              </Text>
            </View>
          </View>
        ) : null}

        <View style={styles.card}>
          <View style={styles.cardHeader}>
            <Ionicons name="clipboard-outline" size={24} color="#C9302C" />
            <Text style={styles.cardTitle}>Initial Diagnostic</Text>
          </View>

          {diagnosticSummary ? (
            <>
              <View style={styles.infoRow}>
                <Text style={styles.infoLabel}>Therapy Focus</Text>
                <Text style={styles.infoValue}>{diagnosticSummary.therapyFocus}</Text>
              </View>
              <View style={styles.infoRow}>
                <Text style={styles.infoLabel}>Facility Assessment</Text>
                <Text style={styles.infoValue}>{diagnosticSummary.facilityStatus}</Text>
              </View>
              <View style={styles.infoRow}>
                <Text style={styles.infoLabel}>Recommended Therapy</Text>
                <Text style={styles.infoValue}>{diagnosticSummary.recommendedTherapy}</Text>
              </View>
              <View style={styles.infoRow}>
                <Text style={styles.infoLabel}>Recommended Level</Text>
                <Text style={styles.infoValue}>{diagnosticSummary.recommendedLevel}</Text>
              </View>
              <View style={styles.infoRowLast}>
                <Text style={styles.infoLabel}>Recommended Focus</Text>
                <Text style={[styles.infoValue, styles.multilineValue]}>{diagnosticSummary.recommendedFocus}</Text>
              </View>

              <View style={styles.diagnosticActions}>
                <TouchableOpacity style={styles.secondaryActionButton} onPress={() => setShowDiagnosticDetails(true)}>
                  <Ionicons name="eye-outline" size={18} color="#1D4ED8" />
                  <Text style={styles.secondaryActionText}>View Initial Diagnostic</Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.primaryActionButton} onPress={() => setShowDiagnosticWizard(true)}>
                  <Ionicons name="create-outline" size={18} color="#FFFFFF" />
                  <Text style={styles.primaryActionText}>Update Diagnostic</Text>
                </TouchableOpacity>
              </View>
            </>
          ) : (
            <>
              <Text style={styles.emptyDiagnosticText}>
                Complete the initial diagnostic to unlock the extracted therapy selection logic and recommendations from CVAPed Web.
              </Text>
              <TouchableOpacity style={styles.primaryActionButtonFull} onPress={() => setShowDiagnosticWizard(true)}>
                <Ionicons name="add-circle-outline" size={18} color="#FFFFFF" />
                <Text style={styles.primaryActionText}>Complete Initial Diagnostic</Text>
              </TouchableOpacity>
            </>
          )}
        </View>

        {isEditing ? (
          <View style={styles.editActions}>
            <TouchableOpacity style={styles.cancelButton} onPress={handleCancelEdit} disabled={loading}>
              <Text style={styles.cancelButtonText}>Cancel</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.saveButton} onPress={handleSaveProfile} disabled={loading}>
              {loading ? <ActivityIndicator color="#FFFFFF" /> : <Text style={styles.saveButtonText}>Save Changes</Text>}
            </TouchableOpacity>
          </View>
        ) : (
          <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
            <Ionicons name="log-out-outline" size={22} color="#FFFFFF" />
            <Text style={styles.logoutButtonText}>Logout</Text>
          </TouchableOpacity>
        )}

        <Text style={styles.versionText}>CVACare Mobile v1.0.0</Text>
        <View style={styles.bottomSpacing} />
      </ScrollView>

      <InitialDiagnosticModal
        isOpen={showDiagnosticWizard}
        onClose={() => setShowDiagnosticWizard(false)}
        onConfirm={handleSaveDiagnostic}
        loading={diagnosticLoading}
        initialData={diagnosticData}
      />

      <InitialDiagnosticDetailsModal
        visible={showDiagnosticDetails}
        onClose={() => setShowDiagnosticDetails(false)}
        diagnosticData={diagnosticData}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F5F5F5',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 15,
    paddingVertical: 15,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E0E0E0',
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },
  headerLeft: {
    width: 34,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#2C3E50',
  },
  headerRight: {
    width: 34,
    alignItems: 'flex-end',
  },
  editButton: {
    padding: 5,
  },
  content: {
    flex: 1,
  },
  profileHeader: {
    alignItems: 'center',
    paddingVertical: 30,
    backgroundColor: '#FFFFFF',
    marginBottom: 15,
  },
  avatarContainer: {
    position: 'relative',
    marginBottom: 15,
  },
  avatar: {
    width: 100,
    height: 100,
    borderRadius: 50,
    borderWidth: 3,
    borderColor: '#C9302C',
  },
  avatarPlaceholder: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: '#C9302C',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 3,
    borderColor: '#C9302C',
  },
  userName: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#2C3E50',
    marginBottom: 5,
  },
  roleBadge: {
    backgroundColor: '#C9302C',
    paddingHorizontal: 15,
    paddingVertical: 5,
    borderRadius: 15,
  },
  roleText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '600',
    textTransform: 'uppercase',
  },
  card: {
    backgroundColor: '#FFFFFF',
    marginHorizontal: 15,
    marginBottom: 15,
    borderRadius: 12,
    padding: 20,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#2C3E50',
    marginLeft: 10,
  },
  formGroup: {
    marginBottom: 20,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: '#555',
    marginBottom: 8,
  },
  input: {
    backgroundColor: '#F5F5F5',
    borderWidth: 1,
    borderColor: '#E0E0E0',
    borderRadius: 8,
    paddingHorizontal: 15,
    paddingVertical: 12,
    fontSize: 16,
    color: '#333',
  },
  inputDisabled: {
    backgroundColor: '#FAFAFA',
    color: '#999',
  },
  helperText: {
    fontSize: 12,
    color: '#999',
    marginTop: 5,
    fontStyle: 'italic',
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
  },
  infoRowLast: {
    paddingVertical: 12,
  },
  infoLabel: {
    fontSize: 14,
    color: '#666',
    fontWeight: '500',
    flex: 1,
  },
  infoValue: {
    fontSize: 14,
    color: '#2C3E50',
    fontWeight: '600',
    flex: 1,
    textAlign: 'right',
  },
  multilineValue: {
    lineHeight: 20,
  },
  emptyDiagnosticText: {
    fontSize: 14,
    color: '#4B5563',
    lineHeight: 21,
    marginBottom: 16,
  },
  diagnosticActions: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 16,
  },
  secondaryActionButton: {
    flex: 1,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 6,
    borderWidth: 1,
    borderColor: '#BFDBFE',
    borderRadius: 8,
    paddingVertical: 12,
    backgroundColor: '#EFF6FF',
  },
  secondaryActionText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1D4ED8',
  },
  primaryActionButton: {
    flex: 1,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 6,
    borderRadius: 8,
    paddingVertical: 12,
    backgroundColor: '#C9302C',
  },
  primaryActionButtonFull: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 6,
    borderRadius: 8,
    paddingVertical: 12,
    backgroundColor: '#C9302C',
  },
  primaryActionText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  editActions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: 15,
    marginTop: 10,
    marginBottom: 20,
  },
  cancelButton: {
    flex: 1,
    backgroundColor: '#E0E0E0',
    borderRadius: 8,
    paddingVertical: 15,
    marginRight: 10,
    alignItems: 'center',
  },
  cancelButtonText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#666',
  },
  saveButton: {
    flex: 1,
    backgroundColor: '#C9302C',
    borderRadius: 8,
    paddingVertical: 15,
    marginLeft: 10,
    alignItems: 'center',
  },
  saveButtonText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
  logoutButton: {
    flexDirection: 'row',
    backgroundColor: '#C9302C',
    marginHorizontal: 15,
    borderRadius: 8,
    paddingVertical: 15,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 10,
    marginBottom: 20,
  },
  logoutButtonText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#FFFFFF',
    marginLeft: 10,
  },
  versionText: {
    textAlign: 'center',
    fontSize: 12,
    color: '#999',
    marginBottom: 10,
  },
  bottomSpacing: {
    height: 100,
  },
});

export default ProfileScreen;
