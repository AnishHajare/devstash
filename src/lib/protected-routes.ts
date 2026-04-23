const PROTECTED_PATH_PREFIXES = ["/dashboard", "/settings", "/favorites"];

export function isProtectedPath(pathname: string) {
  return PROTECTED_PATH_PREFIXES.some(
    (prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`)
  );
}
