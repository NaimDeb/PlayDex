import Image from "next/image";

export function Logo({width = 100, height = 100}: {width?: number; height?: number}) {
  return (
    <Image src="/logo.png" alt="Logo" width={width} height={height} style={{ objectFit: 'cover' }} />
  );
}