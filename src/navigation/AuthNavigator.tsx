import React, { useState } from 'react';
import { LoginScreen } from '../screens/LoginScreen';
import { SignUpScreen } from '../screens/SignUpScreen';
import { ForgotPasswordScreen } from '../screens/ForgotPasswordScreen';
import { AuthScreenType } from '../types';

export function AuthNavigator() {
  const [currentScreen, setCurrentScreen] = useState<AuthScreenType>('login');

  const navigateToLogin = () => setCurrentScreen('login');
  const navigateToSignUp = () => setCurrentScreen('signup');
  const navigateToForgotPassword = () => setCurrentScreen('forgotPassword');

  switch (currentScreen) {
    case 'login':
      return (
        <LoginScreen
          onNavigateToSignUp={navigateToSignUp}
          onNavigateToForgotPassword={navigateToForgotPassword}
        />
      );
    case 'signup':
      return <SignUpScreen onNavigateToLogin={navigateToLogin} />;
    case 'forgotPassword':
      return <ForgotPasswordScreen onNavigateToLogin={navigateToLogin} />;
    default:
      return (
        <LoginScreen
          onNavigateToSignUp={navigateToSignUp}
          onNavigateToForgotPassword={navigateToForgotPassword}
        />
      );
  }
}
