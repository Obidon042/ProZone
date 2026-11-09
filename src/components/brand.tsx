import { Image, View } from "react-native";

export function BrandLogo({
  compact = false,
  light = false,
}: {
  compact?: boolean;
  light?: boolean;
}) {
  return (
    <View className={`items-center ${light ? "rounded-2xl bg-white p-2" : ""}`}>
      <Image
        accessibilityLabel="ProZone"
        className={compact ? "h-[84px] w-[128px]" : "h-[150px] w-[226px]"}
        resizeMode="contain"
        source={require("../../assets/images/prozone-logo.png")}
      />
    </View>
  );
}
