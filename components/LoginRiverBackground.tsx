"use client";

import { useEffect, useState } from "react";
import {
  LOGIN_WAVES_DISPLAY_HEIGHT,
  LOGIN_WAVES_DISPLAY_WIDTH,
  LOGIN_WAVES_FRAMES,
  LOGIN_WAVES_VIEWBOX,
} from "@/lib/login-waves-paths";

/** River swells that travel left → right. */
export function LoginRiverBackground() {
  const [frame, setFrame] = useState(0);

  useEffect(() => {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      return;
    }

    const id = window.setInterval(() => {
      setFrame((f) => (f + 1) % LOGIN_WAVES_FRAMES.length);
    }, 200);

    return () => window.clearInterval(id);
  }, []);

  const paths = LOGIN_WAVES_FRAMES[frame];

  return (
    <div
      className="login-river relative mx-auto h-[92px] shrink-0"
      aria-hidden
    >
      <svg
        className="login-river-svg block h-full w-full"
        viewBox={LOGIN_WAVES_VIEWBOX}
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
      >
        {paths.map((d, index) => (
          <path
            key={index}
            d={d}
            className="login-river-stroke"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        ))}
      </svg>
    </div>
  );
}
