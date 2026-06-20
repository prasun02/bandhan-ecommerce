"use client";

import Image, { type ImageProps } from "next/image";
import { useState } from "react";

type ProductImageProps = Omit<ImageProps, "src"> & {
  src?: string;
};

export function ProductImage({ src, alt, ...props }: ProductImageProps) {
  const [currentSrc, setCurrentSrc] = useState(src || "/images/products/product-1.svg");

  return (
    <Image
      {...props}
      src={currentSrc}
      alt={alt}
      onError={() => setCurrentSrc("/images/products/product-1.svg")}
    />
  );
}
