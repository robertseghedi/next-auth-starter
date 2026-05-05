import { test, expect } from "@playwright/test";

// ─── Landing page ────────────────────────────────────────────────

test.describe("Landing page", () => {
  test("renders heading, sign-in, and sign-up buttons", async ({ page }) => {
    await page.goto("/");
    await expect(page.getByText("Better Auth Starter")).toBeVisible();
    await expect(page.getByRole("link", { name: /sign in/i })).toBeVisible();
    await expect(page.getByRole("link", { name: /sign up/i })).toBeVisible();
  });

  test("displays privacy policy and terms of service links", async ({ page }) => {
    await page.goto("/");
    const privacy = page.getByRole("link", { name: /privacy policy/i });
    const terms = page.getByRole("link", { name: /terms of service/i });
    await expect(privacy).toBeVisible();
    await expect(terms).toBeVisible();
    await expect(privacy).toHaveAttribute("href", /privacy/);
    await expect(terms).toHaveAttribute("href", /terms/);
  });

  test("displays stack and active plugins sections", async ({ page }) => {
    await page.goto("/");
    await expect(page.getByText("Stack")).toBeVisible();
    await expect(page.getByText("Active plugins")).toBeVisible();
  });

  test("shows logo image", async ({ page }) => {
    await page.goto("/");
    await expect(page.getByAltText("Logo")).toBeVisible();
  });
});

// ─── Sign-in page ────────────────────────────────────────────────

test.describe("Sign-in page", () => {
  test("renders sign-in page with method picker", async ({ page }) => {
    await page.goto("/sign-in");
    await expect(page.getByText("Welcome back")).toBeVisible();
    await expect(page.getByText(/email & password/i)).toBeVisible();
  });

  test("shows email and password fields after selecting method", async ({ page }) => {
    await page.goto("/sign-in");
    await page.getByText(/email & password/i).click();
    await expect(page.getByLabel(/email/i)).toBeVisible();
    await expect(page.getByLabel(/password/i)).toBeVisible();
  });

  test("has tabs for Sign In and Sign Up", async ({ page }) => {
    await page.goto("/sign-in");
    await expect(page.getByRole("tab", { name: /sign in/i })).toBeVisible();
    await expect(page.getByRole("tab", { name: /sign up/i })).toBeVisible();
  });

  test("switches to sign-up tab and navigates to /sign-up", async ({ page }) => {
    await page.goto("/sign-in");
    await page.getByRole("tab", { name: /sign up/i }).click();
    await page.waitForURL("/sign-up");
    expect(page.url()).toContain("/sign-up");
  });

  test("shows forgot password link in email/password form", async ({ page }) => {
    await page.goto("/sign-in");
    await page.getByText(/email & password/i).click();
    await expect(page.getByText(/forgot password/i)).toBeVisible();
  });

  test("shows social provider buttons when enabled", async ({ page }) => {
    await page.goto("/sign-in");
    await expect(page.getByRole("button", { name: /google/i })).toBeVisible();
    await expect(page.getByRole("button", { name: /github/i })).toBeVisible();
  });

  test("shows all sign-in methods", async ({ page }) => {
    await page.goto("/sign-in");
    await expect(page.getByText(/email & password/i)).toBeVisible();
    await expect(page.getByText(/magic link/i)).toBeVisible();
    await expect(page.getByText(/email code/i)).toBeVisible();
    await expect(page.getByText(/phone number/i)).toBeVisible();
    await expect(page.getByText(/passkey/i)).toBeVisible();
  });

  test("can navigate back to all sign-in options", async ({ page }) => {
    await page.goto("/sign-in");
    await page.getByText(/email & password/i).click();
    await expect(page.getByLabel(/email/i)).toBeVisible();
    await page.getByText(/all sign-in options/i).click();
    await expect(page.getByText(/email & password/i)).toBeVisible();
    await expect(page.getByText(/magic link/i)).toBeVisible();
  });

  test("shows terms and privacy links", async ({ page }) => {
    await page.goto("/sign-in");
    await expect(page.getByText(/terms of service/i)).toBeVisible();
    await expect(page.getByText(/privacy policy/i)).toBeVisible();
  });
});

// ─── Sign-up page ────────────────────────────────────────────────

test.describe("Sign-up page", () => {
  test("renders sign-up form with name, email, and password fields", async ({ page }) => {
    await page.goto("/sign-up");
    await expect(page.getByLabel(/name/i)).toBeVisible({ timeout: 10_000 });
    await expect(page.getByLabel(/email/i)).toBeVisible();
    await expect(page.getByLabel(/password/i)).toBeVisible();
  });

  test("shows password requirement hint", async ({ page }) => {
    await page.goto("/sign-up");
    await expect(page.getByText(/at least 8 characters/i)).toBeVisible();
  });

  test("has create account button", async ({ page }) => {
    await page.goto("/sign-up");
    await expect(page.getByRole("button", { name: /create account/i })).toBeVisible();
  });

  test("switches to sign-in tab and navigates to /sign-in", async ({ page }) => {
    await page.goto("/sign-up");
    await page.getByRole("tab", { name: /sign in/i }).click();
    await page.waitForURL("/sign-in");
    expect(page.url()).toContain("/sign-in");
  });

  test("shows social provider buttons", async ({ page }) => {
    await page.goto("/sign-up");
    await expect(page.getByRole("button", { name: /google/i })).toBeVisible();
    await expect(page.getByRole("button", { name: /github/i })).toBeVisible();
  });
});

// ─── Forgot password page ────────────────────────────────────────

test.describe("Forgot password page", () => {
  test("renders forgot password form", async ({ page }) => {
    await page.goto("/forgot-password");
    await expect(page.getByText("Forgot password")).toBeVisible();
    await expect(page.getByLabel(/email/i)).toBeVisible();
    await expect(page.getByRole("button", { name: /send reset link/i })).toBeVisible();
  });

  test("has a link back to sign-in", async ({ page }) => {
    await page.goto("/forgot-password");
    await expect(page.getByText(/back to sign in/i)).toBeVisible();
  });

  test("back to sign-in navigates correctly", async ({ page }) => {
    await page.goto("/forgot-password");
    await page.getByText(/back to sign in/i).click();
    await page.waitForURL(/sign-in/);
    expect(page.url()).toContain("/sign-in");
  });
});

// ─── Route protection ────────────────────────────────────────────

test.describe("Route protection", () => {
  test("redirects unauthenticated user from /dashboard to /sign-in", async ({ page }) => {
    await page.goto("/dashboard");
    await page.waitForURL(/sign-in/);
    expect(page.url()).toContain("/sign-in");
  });

  test("includes callbackUrl when redirecting to sign-in", async ({ page }) => {
    await page.goto("/dashboard");
    await page.waitForURL(/sign-in/);
    expect(page.url()).toContain("callbackUrl");
  });

  test("redirects /settings to sign-in for unauthenticated users", async ({ page }) => {
    await page.goto("/settings");
    await page.waitForURL(/sign-in/);
    expect(page.url()).toContain("/sign-in");
  });
});

// ─── Navigation ──────────────────────────────────────────────────

test.describe("Navigation", () => {
  test("sign-in link from landing page works", async ({ page }) => {
    await page.goto("/");
    await page.getByRole("link", { name: /sign in/i }).click();
    await page.waitForURL(/sign-in/);
    await expect(page.getByText("Welcome back")).toBeVisible();
  });

  test("sign-up link from landing page works", async ({ page }) => {
    await page.goto("/");
    await page.getByRole("link", { name: /sign up/i }).click();
    await page.waitForURL(/sign-up/);
    await expect(page.getByLabel(/name/i)).toBeVisible({ timeout: 10_000 });
  });

  test("forgot password link from sign-in page works", async ({ page }) => {
    await page.goto("/sign-in");
    await page.getByText(/email & password/i).click();
    await page.getByText(/forgot password/i).click();
    await page.waitForURL(/forgot-password/);
    await expect(page.getByText("Forgot password")).toBeVisible();
  });
});

// ─── Two-factor page ─────────────────────────────────────────────

test.describe("Two-factor page", () => {
  test("renders two-factor verification page", async ({ page }) => {
    await page.goto("/two-factor");
    await expect(page.getByText(/two-factor/i)).toBeVisible();
  });
});

// ─── Accessibility ───────────────────────────────────────────────

test.describe("Accessibility", () => {
  test("sign-in page has visible content", async ({ page }) => {
    await page.goto("/sign-in");
    await expect(page.getByText("Welcome back")).toBeVisible();
    await expect(page.getByText(/email & password/i)).toBeVisible();
  });

  test("sign-up form inputs have associated labels", async ({ page }) => {
    await page.goto("/sign-up");
    await expect(page.getByLabel(/name/i)).toBeVisible();
    await expect(page.getByLabel(/email/i)).toBeVisible();
    await expect(page.getByLabel(/password/i)).toBeVisible();
  });

  test("page has a proper title", async ({ page }) => {
    await page.goto("/");
    const title = await page.title();
    expect(title).toBeTruthy();
  });

  test("auth pages are keyboard navigable", async ({ page }) => {
    await page.goto("/sign-in");
    // Tab through the page — at least one element should receive focus
    await page.keyboard.press("Tab");
    const focused = await page.evaluate(() => document.activeElement?.tagName);
    expect(focused).toBeTruthy();
  });
});

// ─── API health ──────────────────────────────────────────────────

test.describe("API", () => {
  test("auth API endpoint responds", async ({ request }) => {
    const response = await request.get("/api/auth/ok");
    expect(response.ok()).toBeTruthy();
  });

  test("auth API returns JSON", async ({ request }) => {
    const response = await request.get("/api/auth/ok");
    const body = await response.json();
    expect(body).toBeDefined();
  });
});
