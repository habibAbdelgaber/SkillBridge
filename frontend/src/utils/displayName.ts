export function titleCaseName(value: string): string {
  return value
    .trim()
    .split(/\s+/u)
    .map((part) => part.split("-").map(capitalizeWord).join("-"))
    .join(" ");
}

export function formatUserFullName(
  firstName: string,
  lastName: string,
  fallback: string,
): string {
  const fullName = titleCaseName(`${firstName} ${lastName}`);
  return fullName || fallback;
}

function capitalizeWord(word: string): string {
  if (!word) return word;
  return `${word[0]!.toLocaleUpperCase()}${word.slice(1).toLocaleLowerCase()}`;
}
