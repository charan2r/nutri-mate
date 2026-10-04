import React, { useState } from "react";
import { ActivityIndicator, StyleSheet, View } from "react-native";
import { useAuthStore } from "@/lib/auth-store";
import { KemaMateSplash } from "./splash/splash";
import { KemaMateLogin } from "./login/kema-mate-login";
import { KemaMatePersonalization } from "./personalization/personalization";
import { KemaMateHome } from "./home/home";

export default function HomeScreen() {
  const { isAuthenticated, isOnboarded, isLoading } = useAuthStore();
  const [showLogin, setShowLogin] = useState<boolean>(false);

  if (isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#438e3b" />
      </View>
    );
  }

  if (!isAuthenticated) {
    if (!showLogin) {
      return (
        <KemaMateSplash
          onGetStarted={() => setShowLogin(true)}
          onSignIn={() => setShowLogin(true)}
        />
      );
    }
    return <KemaMateLogin onBackToSplash={() => setShowLogin(false)} />;
  }

  if (!isOnboarded) {
    return <KemaMatePersonalization />;
  }

  return <KemaMateHome />;
}

const styles = StyleSheet.create({
  loadingContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#f7faf5',
  },
});
