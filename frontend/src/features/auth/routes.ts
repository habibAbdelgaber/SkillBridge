export function pickPostLoginRoute(
  role: string | undefined,
  from: string | null,
): string {
  if (role === "provider") {
    return "/dashboard/provider";
  }
  if (from && isCustomerPath(from)) {
    return from;
  }
  return "/home";
}

const CUSTOMER_PATH_PREFIXES = [
  "/home",
  "/marketplace",
  "/providers/",
  "/book/",
  "/bookings/",
  "/booking/",
];

function isCustomerPath(path: string): boolean {
  return CUSTOMER_PATH_PREFIXES.some((prefix) => path.startsWith(prefix));
}
