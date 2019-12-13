import Color from "color";

export function ensureDarkColor(color: string) {
  const col = Color(color);
  if (col.isLight()) return col.darken(0.5).hex();
  return color;
}
