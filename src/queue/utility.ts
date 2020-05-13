export function fileIsExcluded(exclude: string[], file: string) {
  return exclude.some((regStr) =>
    new RegExp(regStr, "i").test(file.toLowerCase())
  );
}
