import { Pressable, Text } from "react-native";

export function PrimaryButton({
  title,
  onPress,
  disabled = false,
}: {
  title: string;
  onPress: () => void;
  disabled?: boolean;
}) {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityState={{ disabled }}
      className={`h-14 items-center justify-center rounded-2xl ${
        disabled ? "bg-violet-300" : "bg-[#6049E8]"
      }`}
      disabled={disabled}
      onPress={onPress}
    >
      <Text className="text-[15px] font-bold text-white">{title}</Text>
    </Pressable>
  );
}
