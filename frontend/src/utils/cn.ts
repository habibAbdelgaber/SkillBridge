/**
 * Tiny class-name joiner.
 *
 * Accepts any number of string | false | null | undefined arguments and
 * returns a single space-separated string with the falsy values dropped.
 * Keeps the bundle free from an extra dependency while covering 95% of
 * the use cases of `clsx` / `classnames`.
 */
export function cn(...classes: Array<string | false | null | undefined>): string {
  return classes.filter(Boolean).join(" ");
}
