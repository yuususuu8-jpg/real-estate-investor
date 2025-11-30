// Animated Components for Smooth Transitions and Feedback
import React, { useEffect, useRef, ReactNode } from 'react';
import {
  View,
  Animated,
  ViewStyle,
  StyleProp,
  TouchableOpacity,
  TouchableOpacityProps,
  Easing,
} from 'react-native';

interface FadeInViewProps {
  children: ReactNode;
  delay?: number;
  duration?: number;
  style?: StyleProp<ViewStyle>;
}

// Fade in animation on mount
export function FadeInView({
  children,
  delay = 0,
  duration = 300,
  style,
}: FadeInViewProps) {
  const fadeAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.timing(fadeAnim, {
      toValue: 1,
      duration,
      delay,
      useNativeDriver: true,
    }).start();
  }, [fadeAnim, delay, duration]);

  return (
    <Animated.View style={[{ opacity: fadeAnim }, style]}>
      {children}
    </Animated.View>
  );
}

interface SlideInViewProps {
  children: ReactNode;
  direction?: 'left' | 'right' | 'up' | 'down';
  delay?: number;
  duration?: number;
  distance?: number;
  style?: StyleProp<ViewStyle>;
}

// Slide in animation
export function SlideInView({
  children,
  direction = 'up',
  delay = 0,
  duration = 300,
  distance = 30,
  style,
}: SlideInViewProps) {
  const slideAnim = useRef(new Animated.Value(distance)).current;
  const fadeAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(slideAnim, {
        toValue: 0,
        duration,
        delay,
        useNativeDriver: true,
        easing: Easing.out(Easing.cubic),
      }),
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration,
        delay,
        useNativeDriver: true,
      }),
    ]).start();
  }, [slideAnim, fadeAnim, delay, duration]);

  const translateStyle = {
    left: { translateX: slideAnim.interpolate({
      inputRange: [0, distance],
      outputRange: [0, -distance],
    })},
    right: { translateX: slideAnim },
    up: { translateY: slideAnim },
    down: { translateY: slideAnim.interpolate({
      inputRange: [0, distance],
      outputRange: [0, -distance],
    })},
  };

  return (
    <Animated.View
      style={[
        {
          opacity: fadeAnim,
          transform: [translateStyle[direction]],
        },
        style,
      ]}
    >
      {children}
    </Animated.View>
  );
}

interface ScaleInViewProps {
  children: ReactNode;
  delay?: number;
  duration?: number;
  initialScale?: number;
  style?: StyleProp<ViewStyle>;
}

// Scale in animation
export function ScaleInView({
  children,
  delay = 0,
  duration = 300,
  initialScale = 0.9,
  style,
}: ScaleInViewProps) {
  const scaleAnim = useRef(new Animated.Value(initialScale)).current;
  const fadeAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.spring(scaleAnim, {
        toValue: 1,
        delay,
        useNativeDriver: true,
        tension: 100,
        friction: 8,
      }),
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration,
        delay,
        useNativeDriver: true,
      }),
    ]).start();
  }, [scaleAnim, fadeAnim, delay, duration]);

  return (
    <Animated.View
      style={[
        {
          opacity: fadeAnim,
          transform: [{ scale: scaleAnim }],
        },
        style,
      ]}
    >
      {children}
    </Animated.View>
  );
}

interface StaggeredListProps {
  children: ReactNode[];
  staggerDelay?: number;
  duration?: number;
  direction?: 'left' | 'right' | 'up' | 'down';
}

// Staggered list animation
export function StaggeredList({
  children,
  staggerDelay = 50,
  duration = 300,
  direction = 'up',
}: StaggeredListProps) {
  return (
    <>
      {children.map((child, index) => (
        <SlideInView
          key={index}
          delay={index * staggerDelay}
          duration={duration}
          direction={direction}
        >
          {child}
        </SlideInView>
      ))}
    </>
  );
}

interface AnimatedButtonProps extends TouchableOpacityProps {
  children: ReactNode;
  scaleValue?: number;
}

// Animated button with press feedback
export function AnimatedButton({
  children,
  scaleValue = 0.95,
  style,
  onPressIn,
  onPressOut,
  ...props
}: AnimatedButtonProps) {
  const scaleAnim = useRef(new Animated.Value(1)).current;

  const handlePressIn = (e: any) => {
    Animated.spring(scaleAnim, {
      toValue: scaleValue,
      useNativeDriver: true,
      speed: 50,
      bounciness: 4,
    }).start();
    onPressIn?.(e);
  };

  const handlePressOut = (e: any) => {
    Animated.spring(scaleAnim, {
      toValue: 1,
      useNativeDriver: true,
      speed: 50,
      bounciness: 4,
    }).start();
    onPressOut?.(e);
  };

  return (
    <TouchableOpacity
      activeOpacity={1}
      onPressIn={handlePressIn}
      onPressOut={handlePressOut}
      {...props}
    >
      <Animated.View style={[{ transform: [{ scale: scaleAnim }] }, style]}>
        {children}
      </Animated.View>
    </TouchableOpacity>
  );
}

interface PulseViewProps {
  children: ReactNode;
  style?: StyleProp<ViewStyle>;
  minScale?: number;
  maxScale?: number;
  duration?: number;
}

// Pulsing animation (for highlights or attention)
export function PulseView({
  children,
  style,
  minScale = 0.97,
  maxScale = 1.03,
  duration = 1000,
}: PulseViewProps) {
  const scaleAnim = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    const animation = Animated.loop(
      Animated.sequence([
        Animated.timing(scaleAnim, {
          toValue: maxScale,
          duration: duration / 2,
          useNativeDriver: true,
          easing: Easing.inOut(Easing.ease),
        }),
        Animated.timing(scaleAnim, {
          toValue: minScale,
          duration: duration / 2,
          useNativeDriver: true,
          easing: Easing.inOut(Easing.ease),
        }),
      ])
    );
    animation.start();
    return () => animation.stop();
  }, [scaleAnim, minScale, maxScale, duration]);

  return (
    <Animated.View style={[{ transform: [{ scale: scaleAnim }] }, style]}>
      {children}
    </Animated.View>
  );
}

interface CountUpAnimationProps {
  value: number;
  duration?: number;
  formatter?: (val: number) => string;
  style?: StyleProp<ViewStyle>;
}

// Animated counter (for numeric values)
export function useCountUpAnimation(
  targetValue: number,
  duration: number = 1000
) {
  const animatedValue = useRef(new Animated.Value(0)).current;
  const [displayValue, setDisplayValue] = React.useState(0);

  useEffect(() => {
    // Reset for new target
    animatedValue.setValue(0);

    const animation = Animated.timing(animatedValue, {
      toValue: targetValue,
      duration,
      useNativeDriver: false,
      easing: Easing.out(Easing.cubic),
    });

    const listener = animatedValue.addListener(({ value }) => {
      setDisplayValue(Math.round(value));
    });

    animation.start();

    return () => {
      animatedValue.removeListener(listener);
      animation.stop();
    };
  }, [targetValue, duration, animatedValue]);

  return displayValue;
}

interface ExpandableViewProps {
  children: ReactNode;
  expanded: boolean;
  duration?: number;
  style?: StyleProp<ViewStyle>;
}

// Expandable/Collapsible animation
export function ExpandableView({
  children,
  expanded,
  duration = 200,
  style,
}: ExpandableViewProps) {
  const [contentHeight, setContentHeight] = React.useState(0);
  const animatedHeight = useRef(new Animated.Value(0)).current;
  const animatedOpacity = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(animatedHeight, {
        toValue: expanded ? contentHeight : 0,
        duration,
        useNativeDriver: false,
      }),
      Animated.timing(animatedOpacity, {
        toValue: expanded ? 1 : 0,
        duration,
        useNativeDriver: false,
      }),
    ]).start();
  }, [expanded, contentHeight, animatedHeight, animatedOpacity, duration]);

  return (
    <Animated.View
      style={[
        {
          height: animatedHeight,
          opacity: animatedOpacity,
          overflow: 'hidden',
        },
        style,
      ]}
    >
      <View
        onLayout={(e) => setContentHeight(e.nativeEvent.layout.height)}
        style={{ position: 'absolute', width: '100%' }}
      >
        {children}
      </View>
    </Animated.View>
  );
}

interface ShakeViewProps {
  children: ReactNode;
  shake: boolean;
  style?: StyleProp<ViewStyle>;
}

// Shake animation (for errors or validation)
export function ShakeView({ children, shake, style }: ShakeViewProps) {
  const shakeAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (shake) {
      Animated.sequence([
        Animated.timing(shakeAnim, { toValue: 10, duration: 50, useNativeDriver: true }),
        Animated.timing(shakeAnim, { toValue: -10, duration: 50, useNativeDriver: true }),
        Animated.timing(shakeAnim, { toValue: 10, duration: 50, useNativeDriver: true }),
        Animated.timing(shakeAnim, { toValue: -10, duration: 50, useNativeDriver: true }),
        Animated.timing(shakeAnim, { toValue: 0, duration: 50, useNativeDriver: true }),
      ]).start();
    }
  }, [shake, shakeAnim]);

  return (
    <Animated.View style={[{ transform: [{ translateX: shakeAnim }] }, style]}>
      {children}
    </Animated.View>
  );
}

interface SuccessCheckmarkProps {
  visible: boolean;
  size?: number;
  color?: string;
}

// Success checkmark animation
export function SuccessCheckmark({
  visible,
  size = 60,
  color = '#10B981',
}: SuccessCheckmarkProps) {
  const scaleAnim = useRef(new Animated.Value(0)).current;
  const opacityAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (visible) {
      Animated.parallel([
        Animated.spring(scaleAnim, {
          toValue: 1,
          useNativeDriver: true,
          tension: 100,
          friction: 6,
        }),
        Animated.timing(opacityAnim, {
          toValue: 1,
          duration: 200,
          useNativeDriver: true,
        }),
      ]).start();
    } else {
      Animated.parallel([
        Animated.timing(scaleAnim, {
          toValue: 0,
          duration: 150,
          useNativeDriver: true,
        }),
        Animated.timing(opacityAnim, {
          toValue: 0,
          duration: 150,
          useNativeDriver: true,
        }),
      ]).start();
    }
  }, [visible, scaleAnim, opacityAnim]);

  return (
    <Animated.View
      style={{
        width: size,
        height: size,
        borderRadius: size / 2,
        backgroundColor: color,
        justifyContent: 'center',
        alignItems: 'center',
        transform: [{ scale: scaleAnim }],
        opacity: opacityAnim,
      }}
    >
      <View
        style={{
          width: size * 0.3,
          height: size * 0.5,
          borderRightWidth: 3,
          borderBottomWidth: 3,
          borderColor: '#fff',
          transform: [{ rotate: '45deg' }, { translateX: -size * 0.05 }, { translateY: -size * 0.05 }],
        }}
      />
    </Animated.View>
  );
}
