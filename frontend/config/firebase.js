import { GoogleSignin } from '@react-native-google-signin/google-signin';

const GOOGLE_WEB_CLIENT_ID = process.env.EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID || '292803901437-fk6kg98k8gj8e61k39osqlvf03cq3aer.apps.googleusercontent.com';

GoogleSignin.configure({
  webClientId: GOOGLE_WEB_CLIENT_ID,
  offlineAccess: true,
  scopes: ['profile', 'email'],
});

export { GoogleSignin };
