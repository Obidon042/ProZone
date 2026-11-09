import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import { useState } from "react";
import { Image, Pressable, ScrollView, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { handleSafeBack } from "../components/back-button";
import { BrandLogo } from "../components/brand";
import { PrimaryButton } from "../components/primary-button";

const slides = [
  {
    image:
      "https://www.edenoasisrealty.com/wp-content/uploads/2026/09/0C5A0259-592x444.jpg",
    imageLabel: "Modern home surrounded by greenery",
    badge: "A home you’ll love, made easy",
    title: "Find the right property, with ease.",
    description:
      "Explore beautiful homes and find a place that feels like it was made for you.",
    benefits: [
      { icon: "search-outline" as const, label: "Explore homes in your favorite areas" },
      { icon: "home-outline" as const, label: "Find a place that feels like home" },
    ],
  },
  {
    image:
      "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcQSBOCxfkvxKmFdKuQ5UgS_KKaWl-ovSl-zeOo0r2Ssfw&s=10",
    imageLabel: "Beautiful house with thoughtfully designed interiors",
    badge: "Your next move starts here",
    title: "Discover a place to call yours.",
    description:
      "Browse handpicked homes for rent and sale, with the details you need to choose confidently.",
    benefits: [
      { icon: "options-outline" as const, label: "Explore homes for rent or sale" },
      { icon: "location-outline" as const, label: "Find the right neighborhood for you" },
    ],
  },
  {
    image:
      "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcS2bo0T68pXxMdpXU5GE8SJBwkLfoHhRusdC9FHDWWeSw&s=10",
    imageLabel: "Contemporary home ready to discover",
    badge: "Make yourself at home",
    title: "Your favorite homes, all in one place.",
    description:
      "Save the properties you love and make it easier to find your next home.",
    benefits: [
      { icon: "heart-outline" as const, label: "Save and compare your favorites" },
      { icon: "chatbubble-ellipses-outline" as const, label: "Take your next step with confidence" },
    ],
  },
];

export default function OnboardingScreen() {
  const [activeSlide, setActiveSlide] = useState(0);
  const isLastSlide = activeSlide === slides.length - 1;
  const slide = slides[activeSlide];

  const continueOnboarding = () => {
    if (isLastSlide) {
      router.push("/role");
      return;
    }

    setActiveSlide((current) => current + 1);
  };

  return (
    <SafeAreaView className="flex-1 bg-white">
      <View className="flex-row items-center justify-between px-6 pb-3 pt-2">
        <Pressable
          accessibilityLabel="Go back"
          accessibilityRole="button"
          className="h-10 w-10 items-center justify-center rounded-full bg-slate-50"
          onPress={() => {
            if (activeSlide > 0) {
              setActiveSlide((current) => current - 1);
            } else {
              handleSafeBack("/");
            }
          }}
        >
          <Ionicons name="arrow-back" size={20} color="#1E293B" />
        </Pressable>

        <BrandLogo compact />

        <Pressable
          accessibilityRole="button"
          onPress={() => router.push("/role")}
        >
          <Text className="font-semibold text-[#6D5CE7]">Skip</Text>
        </Pressable>
      </View>

      <ScrollView
        className="flex-1"
        contentContainerClassName="px-6 pb-5"
        showsVerticalScrollIndicator={false}
      >
        <View className="mt-4 overflow-hidden rounded-[28px] bg-violet-100">
          <Image
            accessibilityLabel={slide.imageLabel}
            className="h-64 w-full"
            resizeMode="cover"
            source={{ uri: slide.image }}
          />
          <View className="absolute bottom-4 left-4 flex-row items-center rounded-full bg-white px-3 py-2">
            <Ionicons name="sparkles" size={15} color="#6049E8" />
            <Text className="ml-2 text-xs font-semibold text-slate-800">
              {slide.badge}
            </Text>
          </View>
        </View>

        <Text className="mt-7 text-[30px] font-extrabold leading-9 text-slate-900">
          {slide.title}
        </Text>
        <Text className="mt-3 text-[15px] leading-6 text-slate-500">
          {slide.description}
        </Text>

        <View className="mt-6 gap-4">
          {slide.benefits.map((benefit) => (
            <View key={benefit.label} className="flex-row items-center">
              <View className="h-10 w-10 items-center justify-center rounded-xl bg-violet-50">
                <Ionicons name={benefit.icon} size={20} color="#6049E8" />
              </View>
              <Text className="ml-3 flex-1 text-sm font-medium text-slate-700">
                {benefit.label}
              </Text>
            </View>
          ))}
        </View>
      </ScrollView>

      <View className="px-6 pb-4 pt-3">
        <PrimaryButton
          title={isLastSlide ? "Get started" : "Continue"}
          onPress={continueOnboarding}
        />
        <View className="mt-5 flex-row justify-center gap-2">
          {slides.map((item, index) => (
            <Pressable
              key={item.title}
              accessibilityLabel={`Onboarding page ${index + 1}`}
              accessibilityRole="button"
              accessibilityState={{ selected: activeSlide === index }}
              className={`h-1.5 rounded-full ${activeSlide === index ? "w-6 bg-[#6049E8]" : "w-1.5 bg-violet-200"
                }`}
              onPress={() => setActiveSlide(index)}
            />
          ))}
        </View>
      </View>
    </SafeAreaView>
  );
}
