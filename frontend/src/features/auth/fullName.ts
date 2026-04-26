/**
 * Split a free-text "Full name" field into the `first_name` / `last_name`
 * pair that the backend serializer expects. The heuristic is intentionally
 * simple — first whitespace-separated token becomes the first name, the
 * remainder becomes the last name. Users with single-word names are
 * accepted; the last name is left blank.
 */
export function splitFullName(fullName: string): { first_name: string; last_name: string } {
  const trimmed = fullName.trim().replace(/\s+/g, " ");
  if (!trimmed) return { first_name: "", last_name: "" };
  const firstSpace = trimmed.indexOf(" ");
  if (firstSpace === -1) return { first_name: trimmed, last_name: "" };
  return {
    first_name: trimmed.slice(0, firstSpace),
    last_name: trimmed.slice(firstSpace + 1),
  };
}

export function joinFullName(first: string, last: string): string {
  return `${first} ${last}`.trim();
}
