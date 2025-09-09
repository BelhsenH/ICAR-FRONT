import React, { useState } from 'react';
import { View, TextInput, Text, StyleSheet, ViewStyle, TextStyle, TouchableOpacity } from 'react-native';
import { Colors, Typography, BorderRadius, Spacing, Shadows } from '../../constants/Theme';
import FontAwesome from 'react-native-vector-icons/FontAwesome';

interface ModernInputProps {
  label?: string;
  placeholder?: string;
  value: string;
  onChangeText: (text: string) => void;
  error?: string;
  secureTextEntry?: boolean;
  keyboardType?: 'default' | 'email-address' | 'numeric' | 'phone-pad';
  multiline?: boolean;
  numberOfLines?: number;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
  style?: ViewStyle;
  inputStyle?: TextStyle;
  disabled?: boolean;
  autoFocus?: boolean;
  maxLength?: number;
}

export const ModernInput: React.FC<ModernInputProps> = ({
  label,
  placeholder,
  value,
  onChangeText,
  error,
  secureTextEntry = false,
  keyboardType = 'default',
  multiline = false,
  numberOfLines = 1,
  leftIcon,
  rightIcon,
  style,
  inputStyle,
  disabled = false,
  autoFocus = false,
  maxLength,
}) => {
  const [isFocused, setIsFocused] = useState(false);
  const [isSecure, setIsSecure] = useState(secureTextEntry);

  const containerStyle: ViewStyle = {
    marginBottom: Spacing.md,
    ...style,
  };

  const inputContainerStyle: ViewStyle = {
    flexDirection: 'row',
    alignItems: multiline ? 'flex-start' : 'center',
    backgroundColor: Colors.surface,
    borderRadius: BorderRadius.lg,
    borderWidth: 2,
    borderColor: error ? Colors.error : isFocused ? Colors.primary : Colors.textLight,
    paddingHorizontal: Spacing.md,
    paddingVertical: multiline ? Spacing.md : Spacing.sm,
    minHeight: multiline ? 80 : 48,
    ...Shadows.sm,
  };

  const textInputStyle: TextStyle = {
    flex: 1,
    fontSize: Typography.fontSize.base,
    color: Colors.text,
    paddingVertical: 0,
    textAlignVertical: multiline ? 'top' : 'center',
    ...inputStyle,
  };

  const labelStyle: TextStyle = {
    fontSize: Typography.fontSize.sm,
    fontWeight: '500',
    color: error ? Colors.error : Colors.text,
    marginBottom: Spacing.xs,
  };

  const errorStyle: TextStyle = {
    fontSize: Typography.fontSize.xs,
    color: Colors.error,
    marginTop: Spacing.xs,
  };

  const toggleSecureEntry = () => {
    setIsSecure(!isSecure);
  };

  return (
    <View style={containerStyle}>
      {label && <Text style={labelStyle}>{label}</Text>}
      
      <View style={inputContainerStyle}>
        {leftIcon && (
          <View style={{ marginRight: Spacing.sm }}>
            {leftIcon}
          </View>
        )}
        
        <TextInput
          style={textInputStyle}
          placeholder={placeholder}
          placeholderTextColor={Colors.textSecondary}
          value={value}
          onChangeText={onChangeText}
          secureTextEntry={isSecure}
          keyboardType={keyboardType}
          multiline={multiline}
          numberOfLines={numberOfLines}
          onFocus={() => setIsFocused(true)}
          onBlur={() => setIsFocused(false)}
          editable={!disabled}
          autoFocus={autoFocus}
          maxLength={maxLength}
        />
        
        {secureTextEntry && (
          <TouchableOpacity onPress={toggleSecureEntry} style={{ marginLeft: Spacing.sm }}>
            <FontAwesome name={isSecure ? 'eye' : 'eye-slash'} size={20} color={Colors.primary} />
          </TouchableOpacity>
        )}
        
        {rightIcon && !secureTextEntry && (
          <View style={{ marginLeft: Spacing.sm }}>
            {rightIcon}
          </View>
        )}
      </View>
      
      {error && <Text style={errorStyle}>{error}</Text>}
    </View>
  );
};