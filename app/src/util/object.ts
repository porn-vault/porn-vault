export function copy<T>(t: T) {
  return JSON.parse(JSON.stringify(t)) as T;
}
