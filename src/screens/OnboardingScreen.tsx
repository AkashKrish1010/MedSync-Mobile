import React, { useState, useRef, useCallback } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Image,
  Animated,
  NativeSyntheticEvent,
  NativeScrollEvent,
  useWindowDimensions,
  Platform,
  PanResponder,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { ArrowRight, Bookmark, BookOpen } from "lucide-react-native";
import { FontFamily } from "../theme/typography";

// Local bundled assets ensuring guaranteed immediate offline rendering
const imgSlide1 = require("../../assets/onboarding_m.jpg");
const imgSlide2 = require("../../assets/onboarding_books.jpg");
const imgSlide3 = require("../../assets/onboarding_girl.jpg");

interface OnboardingScreenProps {
  onComplete: () => void;
}

interface SlideItem {
  id: string;
  image: any;
  headlineBold1: string;
  headlineNorm1: string;
  headlineBold2: string;
  headlineNorm2?: string;
  headlineEmoji?: string;
  subtitle: string;
  isCutout?: boolean;
}

const SLIDES: SlideItem[] = [
  {
    id: "0",
    image: imgSlide1,
    headlineBold1: "Empower",
    headlineNorm1: " Yourself With\n",
    headlineBold2: "Quick",
    headlineNorm2: " Knowledge",
    subtitle:
      "Get instant access to bite-sized summaries, key insights, and learn smarter in minutes.",
    isCutout: false,
  },
  {
    id: "1",
    image: imgSlide2,
    headlineBold1: "Elevate",
    headlineNorm1: " Your Reading\nWith ",
    headlineBold2: "Quick Insights",
    subtitle:
      "Unlock key insights from top books, learn effectively, and expand your thinking every day.",
    isCutout: false,
  },
  {
    id: "2",
    image: imgSlide3,
    headlineBold1: "Stay Motivated",
    headlineNorm1: " And\n",
    headlineBold2: "Achieve Goals",
    headlineEmoji: " 📖",
    subtitle:
      "Track your daily progress, unlock key achievements, and reach your goals faster every day.",
    isCutout: true,
  },
];

export default function OnboardingScreen({ onComplete }: OnboardingScreenProps) {
  const { width: screenWidth, height: screenHeight } = useWindowDimensions();
  const [currentIndex, setCurrentIndex] = useState(0);
  const flatListRef = useRef<Animated.FlatList>(null);
  const scrollX = useRef(new Animated.Value(0)).current;

  // Handle smooth next slide navigation
  const handleNext = () => {
    if (currentIndex < SLIDES.length - 1) {
      const nextIndex = currentIndex + 1;
      flatListRef.current?.scrollToOffset({
        offset: nextIndex * screenWidth,
        animated: true,
      });
      setCurrentIndex(nextIndex);
    } else {
      onComplete();
    }
  };

  // Web mouse drag support for desktop browser testing
  const panResponder = useRef(
    PanResponder.create({
      onMoveShouldSetPanResponder: (_, gestureState) => {
        return Platform.OS === "web" && Math.abs(gestureState.dx) > 15;
      },
      onPanResponderRelease: (_, gestureState) => {
        if (Platform.OS === "web") {
          if (gestureState.dx < -40 && currentIndex < SLIDES.length - 1) {
            handleNext();
          } else if (gestureState.dx > 40 && currentIndex > 0) {
            const prevIndex = currentIndex - 1;
            flatListRef.current?.scrollToOffset({
              offset: prevIndex * screenWidth,
              animated: true,
            });
            setCurrentIndex(prevIndex);
          }
        }
      },
    })
  ).current;

  const onScrollEvent = Animated.event(
    [{ nativeEvent: { contentOffset: { x: scrollX } } }],
    {
      useNativeDriver: false,
      listener: (e: NativeSyntheticEvent<NativeScrollEvent>) => {
        const offsetX = e.nativeEvent.contentOffset.x;
        const index = Math.round(offsetX / screenWidth);
        if (index !== currentIndex && index >= 0 && index < SLIDES.length) {
          setCurrentIndex(index);
        }
      },
    }
  );

  const renderSlideItem = useCallback(
    ({ item, index }: { item: SlideItem; index: number }) => {
      const inputRange = [
        (index - 1) * screenWidth,
        index * screenWidth,
        (index + 1) * screenWidth,
      ];

      // Smooth subtle card scale and opacity during horizontal slide
      const cardScale = scrollX.interpolate({
        inputRange,
        outputRange: [0.93, 1, 0.93],
        extrapolate: "clamp",
      });

      const cardOpacity = scrollX.interpolate({
        inputRange,
        outputRange: [0.65, 1, 0.65],
        extrapolate: "clamp",
      });

      return (
        <View style={[styles.slideOuter, { width: screenWidth }]}>
          <View style={styles.slideInner}>
            {/* Top Hero Container (Card) */}
            <Animated.View
              style={[
                styles.slideHeroContainer,
                {
                  height: Math.min(screenHeight * 0.44, 350),
                  transform: [{ scale: cardScale }],
                  opacity: cardOpacity,
                },
              ]}
            >
              <Image
                source={item.image}
                style={item.isCutout ? styles.slideHeroImageCutout : styles.slideHeroImage}
                resizeMode={item.isCutout ? "cover" : "contain"}
              />

              {/* Floating badges on Slide 3 */}
              {item.isCutout && (
                <>
                  <View style={styles.floatingBadgeTopRight}>
                    <Bookmark size={20} color="#FFFFFF" fill="#7C3AED" strokeWidth={1.5} />
                  </View>
                  <View style={styles.floatingBadgeBottomLeft}>
                    <BookOpen size={20} color="#7C3AED" strokeWidth={2.2} />
                    <View style={styles.badgeMiniTextWrap}>
                      <Text style={styles.badgeMiniText}>Goals</Text>
                    </View>
                  </View>
                </>
              )}
            </Animated.View>

            {/* Typography & Subtitle below visual */}
            <View style={styles.textContainer}>
              <Text style={styles.slideHeadline}>
                <Text style={styles.headlineBoldWord}>{item.headlineBold1}</Text>
                <Text style={styles.headlineNormalWord}>{item.headlineNorm1}</Text>
                <Text style={styles.headlineBoldWord}>{item.headlineBold2}</Text>
                {item.headlineNorm2 && (
                  <Text style={styles.headlineNormalWord}>{item.headlineNorm2}</Text>
                )}
                {item.headlineEmoji && <Text>{item.headlineEmoji}</Text>}
              </Text>
              <Text style={styles.slideSubtitle}>{item.subtitle}</Text>
            </View>
          </View>
        </View>
      );
    },
    [screenWidth, screenHeight, scrollX]
  );

  return (
    <SafeAreaView style={styles.safeArea}>
      {/* Sliding Content Carousel */}
      <View style={styles.carouselContainer} {...panResponder.panHandlers}>
        <Animated.FlatList
          ref={flatListRef}
          data={SLIDES}
          keyExtractor={(item) => item.id}
          horizontal
          pagingEnabled={Platform.OS === "ios"}
          snapToInterval={screenWidth}
          snapToAlignment="center"
          decelerationRate="fast"
          disableIntervalMomentum={true}
          showsHorizontalScrollIndicator={false}
          bounces={true}
          scrollEventThrottle={16}
          getItemLayout={(_, index) => ({
            length: screenWidth,
            offset: screenWidth * index,
            index,
          })}
          onScroll={onScrollEvent}
          renderItem={renderSlideItem}
        />
      </View>

      {/* Persistent Fixed Bottom Navigation Bar */}
      <View style={styles.bottomRow}>
        <TouchableOpacity onPress={onComplete} style={styles.skipBtn} activeOpacity={0.7}>
          <Text style={styles.skipText}>Skip</Text>
        </TouchableOpacity>

        {/* Morphing smooth pagination indicator dots */}
        <View style={styles.dotsRow}>
          {SLIDES.map((_, i) => {
            const dotInputRange = [
              (i - 1) * screenWidth,
              i * screenWidth,
              (i + 1) * screenWidth,
            ];

            const dotWidth = scrollX.interpolate({
              inputRange: dotInputRange,
              outputRange: [6, 20, 6],
              extrapolate: "clamp",
            });

            const dotOpacity = scrollX.interpolate({
              inputRange: dotInputRange,
              outputRange: [0.35, 1, 0.35],
              extrapolate: "clamp",
            });

            const dotBgColor = scrollX.interpolate({
              inputRange: dotInputRange,
              outputRange: ["#E4E4E7", "#7C3AED", "#E4E4E7"],
              extrapolate: "clamp",
            });

            return (
              <Animated.View
                key={i}
                style={[
                  styles.dotBase,
                  {
                    width: dotWidth,
                    opacity: dotOpacity,
                    backgroundColor: dotBgColor,
                  },
                ]}
              />
            );
          })}
        </View>

        <TouchableOpacity
          style={styles.purpleCircleBtnBottom}
          onPress={handleNext}
          activeOpacity={0.85}
        >
          <ArrowRight size={22} color="#FFFFFF" strokeWidth={2.4} />
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: "#FBF9FE",
  },
  carouselContainer: {
    flex: 1,
  },
  slideOuter: {
    height: "100%",
  },
  slideInner: {
    flex: 1,
    paddingHorizontal: 24,
    paddingTop: 12,
    justifyContent: "flex-start",
  },

  // ─── UNIFIED HERO CARD CONTAINER (Used by all 3 slides) ──────────
  slideHeroContainer: {
    width: "100%",
    justifyContent: "center",
    alignItems: "center",
    position: "relative",
    marginTop: 4,
    borderRadius: 24,
    overflow: "hidden",
    backgroundColor: "#FFFFFF",
    shadowColor: "#4C1D95",
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.08,
    shadowRadius: 18,
    elevation: 4,
    borderWidth: 1,
    borderColor: "rgba(224, 231, 255, 0.6)",
  },
  slideHeroImage: {
    width: "88%",
    height: "88%",
  },
  slideHeroImageCutout: {
    width: "100%",
    height: "100%",
  },

  // ─── FLOATING BADGES (Slide 3) ───────────────────────────────────
  floatingBadgeTopRight: {
    position: "absolute",
    top: 16,
    right: 16,
    width: 42,
    height: 42,
    borderRadius: 12,
    backgroundColor: "#7C3AED",
    justifyContent: "center",
    alignItems: "center",
    shadowColor: "#7C3AED",
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.35,
    shadowRadius: 10,
    elevation: 6,
  },
  floatingBadgeBottomLeft: {
    position: "absolute",
    bottom: 14,
    left: 16,
    backgroundColor: "#FFFFFF",
    borderRadius: 14,
    paddingHorizontal: 12,
    paddingVertical: 7,
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    shadowColor: "#000000",
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.12,
    shadowRadius: 12,
    elevation: 5,
  },
  badgeMiniTextWrap: {
    backgroundColor: "#F5F3FF",
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
  },
  badgeMiniText: {
    fontSize: 10,
    fontFamily: FontFamily.dataMonoBold,
    color: "#7C3AED",
  },

  // ─── TYPOGRAPHY BELOW HERO (Unified across all 3 slides) ─────────
  textContainer: {
    paddingTop: 24,
    paddingHorizontal: 4,
  },
  slideHeadline: {
    fontSize: 28,
    lineHeight: 36,
    letterSpacing: -0.5,
  },
  headlineBoldWord: {
    fontFamily: FontFamily.headlineBold,
    color: "#18181B",
  },
  headlineNormalWord: {
    fontFamily: FontFamily.bodyRegular,
    color: "#18181B",
  },
  slideSubtitle: {
    fontSize: 14,
    fontFamily: FontFamily.bodyRegular,
    color: "#71717A",
    lineHeight: 22,
    marginTop: 10,
  },

  // ─── FIXED BOTTOM NAVIGATION ROW ─────────────────────────────────
  bottomRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 28,
    paddingBottom: 24,
    paddingTop: 12,
    backgroundColor: "#FBF9FE",
  },
  skipBtn: {
    paddingVertical: 10,
    paddingHorizontal: 6,
  },
  skipText: {
    fontSize: 15,
    fontFamily: FontFamily.bodySemiBold,
    color: "#71717A",
  },
  dotsRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  dotBase: {
    height: 6,
    borderRadius: 3,
  },
  purpleCircleBtnBottom: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: "#7C3AED",
    justifyContent: "center",
    alignItems: "center",
    shadowColor: "#7C3AED",
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.38,
    shadowRadius: 10,
    elevation: 6,
  },
});
