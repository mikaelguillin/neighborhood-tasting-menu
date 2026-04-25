import type { StaticImageData } from "next/image";

export type AppImage = string | StaticImageData;

export function imageSrc(src: AppImage): string {
  return typeof src === "string" ? src : src.src;
}
