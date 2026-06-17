/** Telegram WebApp helpers — expand + fullscreen where supported. */

type TelegramThemeParams = {
  bg_color?: string;
  header_bg_color?: string;
  secondary_bg_color?: string;
};

type SafeAreaInset = {
  top?: number;
  bottom?: number;
  left?: number;
  right?: number;
};

export type TelegramWebAppLike = {
  ready: () => void;
  expand: () => void;
  initData?: string;
  isExpanded?: boolean;
  themeParams: TelegramThemeParams;
  initDataUnsafe: { start_param?: string };
  requestFullscreen?: () => void;
  disableVerticalSwipes?: () => void;
  enableVerticalSwipes?: () => void;
  setHeaderColor?: (color: string) => void;
  setBackgroundColor?: (color: string) => void;
  safeAreaInset?: SafeAreaInset;
  contentSafeAreaInset?: SafeAreaInset;
  onEvent?: (event: string, handler: () => void) => void;
  offEvent?: (event: string, handler: () => void) => void;
};

function applySafeAreaInsets(
  root: HTMLElement,
  inset: SafeAreaInset | undefined,
  prefix: string
): void {
  if (!inset) return;
  if (inset.top != null) {
    root.style.setProperty(`--tg-${prefix}-top`, `${inset.top}px`);
  }
  if (inset.bottom != null) {
    root.style.setProperty(`--tg-${prefix}-bottom`, `${inset.bottom}px`);
  }
  if (inset.left != null) {
    root.style.setProperty(`--tg-${prefix}-left`, `${inset.left}px`);
  }
  if (inset.right != null) {
    root.style.setProperty(`--tg-${prefix}-right`, `${inset.right}px`);
  }
}

function applyThemeCss(root: HTMLElement, theme: TelegramThemeParams): void {
  const themeVars: Record<string, string | undefined> = {
    "--tg-theme-bg-color": theme.bg_color,
    "--tg-theme-header-bg-color": theme.header_bg_color,
    "--tg-theme-secondary-bg-color": theme.secondary_bg_color,
  };

  for (const [key, value] of Object.entries(themeVars)) {
    if (value) root.style.setProperty(key, value);
  }

  if (theme.bg_color) {
    root.style.setProperty("--jobchat-surface", theme.bg_color);
  }
}

function maximizeViewport(WebApp: TelegramWebAppLike): void {
  WebApp.expand();

  if (typeof WebApp.requestFullscreen === "function") {
    try {
      WebApp.requestFullscreen();
    } catch {
      // Unsupported on older Telegram clients
    }
  }

  if (typeof WebApp.disableVerticalSwipes === "function") {
    try {
      WebApp.disableVerticalSwipes();
    } catch {
      // ignore
    }
  }

  const bg = WebApp.themeParams.bg_color ?? WebApp.themeParams.header_bg_color;
  if (bg) {
    try {
      WebApp.setBackgroundColor?.(bg);
      WebApp.setHeaderColor?.(bg);
    } catch {
      // ignore
    }
  }
}

export function initTelegramWebApp(WebApp: TelegramWebAppLike): void {
  WebApp.ready();
  maximizeViewport(WebApp);

  const root = document.documentElement;
  root.classList.add("telegram-mini-app");
  applyThemeCss(root, WebApp.themeParams);
  applySafeAreaInsets(root, WebApp.safeAreaInset, "safe-area");
  applySafeAreaInsets(root, WebApp.contentSafeAreaInset, "content-safe-area");

  const onViewportChange = () => {
    if (WebApp.isExpanded === false) {
      maximizeViewport(WebApp);
    }
  };

  WebApp.onEvent?.("viewportChanged", onViewportChange);
  WebApp.onEvent?.("safeAreaChanged", () => {
    applySafeAreaInsets(root, WebApp.safeAreaInset, "safe-area");
  });
  WebApp.onEvent?.("contentSafeAreaChanged", () => {
    applySafeAreaInsets(root, WebApp.contentSafeAreaInset, "content-safe-area");
  });
}
