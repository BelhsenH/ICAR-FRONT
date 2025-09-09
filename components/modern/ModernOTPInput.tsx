import React, { useState, useRef, useEffect } from 'react';
import { View, TextInput, StyleSheet, Animated, Dimensions } from 'react-native';
import { Colors, Typography, BorderRadius, Spacing, Shadows } from '../../constants/Theme';

interface ModernOTPInputProps {
  length?: number;
  onComplete: (otp: string) => void;
  onChangeText?: (otp: string) => void;
  error?: boolean;
  autoFocus?: boolean;
}

export const ModernOTPInput: React.FC<ModernOTPInputProps> = ({
  length = 6,
  onComplete,
  onChangeText,
  error = false,
  autoFocus = true,
}) => {
  const [otp, setOtp] = useState<string[]>(new Array(length).fill(''));
  const [focusedIndex, setFocusedIndex] = useState<number>(autoFocus ? 0 : -1);
  const inputRefs = useRef<(TextInput | null)[]>([]);
  const animatedValues = useRef(
    new Array(length).fill(0).map(() => new Animated.Value(1))
  ).current;

  useEffect(() => {
    if (autoFocus && inputRefs.current[0]) {
      inputRefs.current[0].focus();
    }
  }, [autoFocus]);

  useEffect(() => {
    const otpString = otp.join('');
    onChangeText?.(otpString);
    
    if (otpString.length === length) {
      onComplete(otpString);
    }
  }, [otp, length, onComplete, onChangeText]);

  const handleChangeText = (text: string, index: number) => {
    // Only allow numeric input
    const numericText = text.replace(/[^0-9]/g, '');
    
    if (numericText.length <= 1) {
      const newOtp = [...otp];
      newOtp[index] = numericText;
      setOtp(newOtp);

      // Auto-focus next input
      if (numericText && index < length - 1) {
        inputRefs.current[index + 1]?.focus();
      }
    }
  };

  const handleKeyPress = (key: string, index: number) => {
    if (key === 'Backspace') {
      const newOtp = [...otp];
      
      if (otp[index]) {
        // Clear current input
        newOtp[index] = '';
        setOtp(newOtp);
      } else if (index > 0) {
        // Move to previous input and clear it
        newOtp[index - 1] = '';
        setOtp(newOtp);
        inputRefs.current[index - 1]?.focus();
      }
    }
  };

  const handleFocus = (index: number) => {
    setFocusedIndex(index);
    
    // Animate the focused input
    Animated.sequence([
      Animated.timing(animatedValues[index], {
        toValue: 1.1,
        duration: 150,
        useNativeDriver: true,
      }),
      Animated.timing(animatedValues[index], {
        toValue: 1,
        duration: 150,
        useNativeDriver: true,
      }),
    ]).start();
  };

  const handleBlur = () => {
    setFocusedIndex(-1);
  };

  const getInputStyle = (index: number) => {
    const isFocused = focusedIndex === index;
    const hasValue = otp[index] !== '';
    
    return [
      styles.input,
      {
        borderColor: error 
          ? Colors.error 
          : isFocused 
            ? Colors.primary 
            : hasValue 
              ? Colors.accent 
              : Colors.textLight,
        backgroundColor: hasValue ? 'rgba(59, 89, 152, 0.05)' : Colors.surface,
        // Remove scale animation to avoid Animated.Value error
      },
    ];
  };

  return (
    <View style={styles.container}>
      {otp.map((digit, index) => (
        <Animated.View key={index} style={styles.inputWrapper}>
          <TextInput
            ref={(ref) => { inputRefs.current[index] = ref; }}
            style={getInputStyle(index)}
            value={digit}
            onChangeText={(text) => handleChangeText(text, index)}
            onKeyPress={({ nativeEvent }) => handleKeyPress(nativeEvent.key, index)}
            onFocus={() => handleFocus(index)}
            onBlur={handleBlur}
            keyboardType="numeric"
            maxLength={1}
            selectTextOnFocus
            textAlign="center"
            autoComplete="sms-otp"
            textContentType="oneTimeCode"
          />
        </Animated.View>
      ))}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: Spacing.sm,
  },
  inputWrapper: {
    flex: 1,
    marginHorizontal: Spacing.xs,
  },
  input: {
    height: 56,
    borderWidth: 2,
    borderRadius: BorderRadius.lg,
    fontSize: Typography.fontSize.xl,
    fontWeight: '600',
    color: Colors.text,
    textAlign: 'center',
    ...Shadows.sm,
  },
});