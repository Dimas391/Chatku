import React from 'react';
import { View, Text, StyleSheet, Animated } from 'react-native';

interface WelcomeChatPreviewProps {
  fadeAnim: Animated.Value;
}

const WelcomeChatPreview = ({ fadeAnim }: WelcomeChatPreviewProps) => {
  return (
    <View style={styles.container}>
      <Animated.View
        style={[
          styles.chatBubbleLeft,
          {
            opacity: fadeAnim,
            transform: [
              {
                translateX: fadeAnim.interpolate({
                  inputRange: [0, 1],
                  outputRange: [-30, 0],
                }),
              },
            ],
          },
        ]}
      >
      <Text style={styles.chatText}>Halo! </Text>
      </Animated.View>

      <Animated.View
        style={[
          styles.chatBubbleRight,
          {
            opacity: fadeAnim,
            transform: [
              {
                translateX: fadeAnim.interpolate({
                  inputRange: [0, 1],
                  outputRange: [30, 0],
                }),
              },
            ],
          },
        ]}
      >
        <Text style={styles.chatText}>Hai, apa kabar? </Text>
      </Animated.View>

      <Animated.View
        style={[
          styles.chatBubbleLeft,
          styles.chatBubbleSmall,
          {
            opacity: fadeAnim,
            transform: [
              {
                translateX: fadeAnim.interpolate({
                  inputRange: [0, 1],
                  outputRange: [-30, 0],
                }),
              },
            ],
          },
        ]}
      >
        <Text style={styles.chatText}>Baik, kamu?</Text>
      </Animated.View>

      {/* Loading dots */}
      <Animated.View style={[styles.loadingContainer, { opacity: fadeAnim }]}>
        <View style={styles.loadingDot} />
        <View style={[styles.loadingDot, styles.loadingDotDelay]} />
        <View style={[styles.loadingDot, styles.loadingDotDelay2]} />
      </Animated.View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    width: '100%',
    marginTop: 20,
  },
  chatBubbleLeft: {
    backgroundColor: 'rgba(255, 255, 255, 0.15)',
    paddingVertical: 12,
    paddingHorizontal: 18,
    borderRadius: 25,
    borderBottomLeftRadius: 5,
    alignSelf: 'flex-start',
    marginBottom: 12,
    maxWidth: '70%',
  },
  chatBubbleRight: {
    backgroundColor: 'rgba(255, 255, 255, 0.25)',
    paddingVertical: 12,
    paddingHorizontal: 18,
    borderRadius: 25,
    borderBottomRightRadius: 5,
    alignSelf: 'flex-end',
    marginBottom: 12,
    maxWidth: '70%',
  },
  chatBubbleSmall: {
    maxWidth: '50%',
  },
  chatText: {
    color: '#ffffff',
    fontSize: 14,
    fontWeight: '500',
  },
  loadingContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginTop: 30,
  },
  loadingDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#ffffff',
    marginHorizontal: 4,
    opacity: 0.8,
  },
  loadingDotDelay: {
    opacity: 0.5,
  },
  loadingDotDelay2: {
    opacity: 0.3,
  },
});

export default WelcomeChatPreview;