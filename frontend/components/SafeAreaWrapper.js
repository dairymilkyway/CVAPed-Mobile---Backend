import React from 'react';
import { SafeAreaView, StyleSheet, Platform, StatusBar } from 'react-native';

/**
 * Global SafeAreaWrapper component
 * Wraps all screens with consistent safe area handling
 */
const SafeAreaWrapper = ({ children, style, disableTopInset = false }) => {
  return (
    <SafeAreaView style={[styles.safeArea, disableTopInset && styles.noTopInset, style]}>
      {children}
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#fff',
    // Add padding for Android to account for status bar
    paddingTop: Platform.OS === 'android' ? StatusBar.currentHeight : 0,
  },
  noTopInset: {
    paddingTop: 0,
  },
});

export default SafeAreaWrapper;
