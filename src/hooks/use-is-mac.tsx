import { useMemo } from "react";

export function useIsMac() {
  const isMac = useMemo(() => {
    if (typeof navigator !== "undefined") {
      const userAgent = navigator.userAgent || navigator.vendor;
      return /Macintosh|MacIntel|MacPPC|Mac68K/.test(userAgent);
    }
    return false;
  }, []);

  return isMac;
}
