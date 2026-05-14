import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  TextInput,
  Text,
  Animated,
  StyleSheet,
  TextInputProps,
  TouchableOpacity,
  Platform,
} from 'react-native';
import { HugeiconsIcon } from '@hugeicons/react-native';
import { InformationCircleIcon } from '@hugeicons/core-free-icons';

interface FloatingLabelInputProps extends TextInputProps {
  label: string;
  error?: string;
  right?: React.ReactNode;
  icon?: any;
}

export const FloatingLabelInput: React.FC<FloatingLabelInputProps> = ({
  label,
  value,
  onFocus,
  onBlur,
  error,
  right,
  icon,
  secureTextEntry,
  ...props
}) => {
  const [isFocused, setIsFocused] = useState(false);
  const animatedIsFocused = useRef(new Animated.Value(value ? 1 : 0)).current;

  useEffect(() => {
    Animated.timing(animatedIsFocused, {
      toValue: isFocused || value ? 1 : 0,
      duration: 150,
      useNativeDriver: false,
    }).start();
  }, [isFocused, value]);

  const handleFocus = (e: any) => {
    setIsFocused(true);
    onFocus?.(e);
  };

  const handleBlur = (e: any) => {
    setIsFocused(false);
    onBlur?.(e);
  };

  const labelStyle = {
    position: 'absolute' as const,
    left: icon ? 44 : 16,
    top: animatedIsFocused.interpolate({
      inputRange: [0, 1],
      outputRange: [14, -10],
    }),
    fontSize: animatedIsFocused.interpolate({
      inputRange: [0, 1],
      outputRange: [16, 12],
    }),
    color: animatedIsFocused.interpolate({
      inputRange: [0, 1],
      outputRange: ['#94a3b8', error ? '#dc2626' : '#0095f6'],
    }),
    backgroundColor: animatedIsFocused.interpolate({
      inputRange: [0, 1],
      outputRange: ['transparent', '#ffffff'],
    }),
    paddingHorizontal: animatedIsFocused.interpolate({
      inputRange: [0, 1],
      outputRange: [0, 4],
    }),
    zIndex: 1,
  };

  return (
    <View style={styles.container}>
      <View
        style={[
          styles.inputGroup,
          {
            borderColor: error ? '#fca5a5' : isFocused ? '#0095f6' : '#e2e8f0',
            borderWidth: isFocused || error ? 1.5 : 1.5,
          },
        ]}
      >
        {icon && (
          <View style={styles.iconContainer}>
            <HugeiconsIcon
              icon={icon}
              size={18}
              color={isFocused ? '#0095f6' : error ? '#dc2626' : '#64748b'}
            />
          </View>
        )}
        <Animated.Text style={labelStyle} pointerEvents="none">
          {label}
        </Animated.Text>
        <TextInput
          {...props}
          style={[
            styles.input,
            { paddingLeft: icon ? 12 : 16 },
          ]}
          onFocus={handleFocus}
          onBlur={handleBlur}
          value={value}
          secureTextEntry={secureTextEntry}
          placeholder="" // Managed by floating label
        />
        {right && <View style={styles.rightContainer}>{right}</View>}
      </View>
      {error && (
        <View style={styles.errorRow}>
          <HugeiconsIcon icon={InformationCircleIcon} size={14} color="#dc2626" />
          <Text style={styles.errorText}>{error}</Text>
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginBottom: 20,
    width: '100%',
  },
  inputGroup: {
    position: 'relative',
    height: 52,
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 16,
    backgroundColor: '#ffffff',
  },
  input: {
    flex: 1,
    height: '100%',
    fontSize: 16,
    color: '#0f172a',
    ...Platform.select({
      web: {
        outlineStyle: 'none',
      } as any,
    }),
  },
  iconContainer: {
    paddingLeft: 16,
    justifyContent: 'center',
    alignItems: 'center',
  },
  rightContainer: {
    paddingRight: 16,
    justifyContent: 'center',
    alignItems: 'center',
  },
  errorRow: {
    marginTop: 6,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 4,
  },
  errorText: {
    color: '#dc2626',
    fontSize: 12,
    fontWeight: '500',
  },
});
