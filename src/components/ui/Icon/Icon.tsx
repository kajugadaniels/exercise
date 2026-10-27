import { HugeiconsIcon, type IconSvgElement } from "@hugeicons/react";

type IconProps = {
  icon: IconSvgElement;
  size?: 18 | 20 | 24;
};

export function Icon({ icon, size = 20 }: IconProps) {
  return (
    <HugeiconsIcon
      aria-hidden="true"
      focusable="false"
      icon={icon}
      size={size}
      strokeWidth={1.8}
    />
  );
}
