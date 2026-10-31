import React from "react";
import { MTA_SUBWAY_LINE_ICONS_SMALL } from "@/utils/constants";
import { cn } from "@/lib/utils";

const SIZES = {
  sm: "size-[22px] [&:not(:first-child)]:-ml-[7px]",
  md: "size-6 [&:not(:first-child)]:-ml-2",
  lg: "size-8 [&:not(:first-child)]:-ml-2.5",
};

// Bullets overlap like a stack and fan out when the stack (or a parent
// `group/row`) is hovered. Hover-capable pointers only, so taps don't jitter.
const FAN_OUT =
  "[@media(hover:hover)]:group-hover/lines:[&:not(:first-child)]:ml-0.5 [@media(hover:hover)]:group-hover/row:[&:not(:first-child)]:ml-0.5";

interface LineBulletsProps {
  routes: string[];
  size?: keyof typeof SIZES;
  className?: string;
}

export function LineBullets({ routes, size = "md", className }: LineBulletsProps) {
  return (
    <span
      className={cn("group/lines inline-flex shrink-0 items-center align-middle", className)}
      aria-hidden="true"
    >
      {routes.map((route) => (
        <span
          key={route}
          className={cn(
            "relative grid shrink-0 place-items-center rounded-full bg-white ring-[1.5px] ring-white transition-[margin] duration-200 ease-out motion-reduce:transition-none [&_svg]:size-full",
            SIZES[size],
            FAN_OUT,
          )}
        >
          {MTA_SUBWAY_LINE_ICONS_SMALL[route] ?? (
            <span className="text-caption font-bold">{route}</span>
          )}
        </span>
      ))}
    </span>
  );
}

export default LineBullets;
