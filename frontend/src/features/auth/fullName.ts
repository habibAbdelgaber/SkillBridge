/** Split a free-text name into backend first_name / last_name fields. */
export function splitFullName(fullName: string): {
  first_name: string;
  last_name: string;
} {
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
