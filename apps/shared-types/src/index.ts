/**
 * Contract types shared between `apps/web` and `apps/api`.
 *
 * Foundation set only. Request/response DTOs for patients, knowledge, chat, and
 * tenant endpoints are added alongside the API in Commit 2 and consumed by the
 * web client in Commit 3.
 */

export type SpaRole = "owner" | "manager" | "front_desk";

export type TriageStatus =
  | "new"
  | "qualifying"
  | "medically_cleared"
  | "contraindication_flagged"
  | "booked"
  | "abandoned";

export type KnowledgeDocStatus = "uploaded" | "chunking" | "embedded" | "failed";

/** Uniform API error envelope returned by the FastAPI backend. */
export interface ApiErrorEnvelope {
  error: {
    code: string;
    message: string;
  };
}

export interface HealthResponse {
  status: "ok";
  version: string;
}
