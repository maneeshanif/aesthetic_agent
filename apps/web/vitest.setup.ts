import "@testing-library/jest-dom/vitest";

process.env.NEXT_PUBLIC_API_BASE_URL ??= "http://localhost:8000";
process.env.NEXT_PUBLIC_SUPABASE_URL ??= "http://localhost:54321";
process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ??= "test-anon-key";
