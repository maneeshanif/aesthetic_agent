import { describe, expect, it } from "vitest";
import { cn, apiBaseUrl } from "@/lib/utils";
import { ApiClientError } from "@/lib/api-client";

describe("cn", () => {
  it("joins truthy class names", () => {
    expect(cn("a", false && "b", "c")).toBe("a c");
  });

  it("de-duplicates conflicting tailwind utilities (last wins)", () => {
    expect(cn("px-2 py-1", "px-4")).toBe("py-1 px-4");
  });
});

describe("apiBaseUrl", () => {
  it("reads NEXT_PUBLIC_API_BASE_URL from the environment", () => {
    expect(apiBaseUrl()).toBe("http://localhost:8000");
  });
});

describe("ApiClientError", () => {
  it("carries the error envelope contract", () => {
    const err = new ApiClientError(404, { code: "http_404", message: "Not Found" });
    expect(err).toBeInstanceOf(Error);
    expect(err.status).toBe(404);
    expect(err.code).toBe("http_404");
    expect(err.message).toBe("Not Found");
  });
});
