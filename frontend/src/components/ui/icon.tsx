import { PrimitiveIcon, UIIcon } from "@gluestack-ui/core/icon/creator";
import type { LucideIcon } from "lucide-react-native";
import { cssInterop } from "nativewind";

cssInterop(PrimitiveIcon, {
  className: {
    target: "style",
    nativeStyleToProp: {
      height: true,
      width: true,
      fill: true,
      color: "classNameColor",
      stroke: true,
    },
  },
});

type IconProps = React.ComponentProps<typeof UIIcon> & {
  as: LucideIcon;
};

function Icon(props: IconProps) {
  return <UIIcon {...props} />;
}

export { Icon };
