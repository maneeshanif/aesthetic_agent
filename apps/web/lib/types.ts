export type Role = "owner" | "manager" | "front_desk";

export type Channel = "chat_tester" | "instagram" | "web" | "voice";

export type PatientStatus =
  | "new"
  | "qualifying"
  | "medically_cleared"
  | "contraindication_flagged"
  | "booked"
  | "abandoned";

export type SessionStatus = "active" | "qualifying" | "completed" | "abandoned" | "error";

export type KnowledgeStatus = "uploaded" | "chunking" | "embedded" | "failed";

export interface Tenant {
  id: string;
  name: string;
  slug: string;
  booking_url: string | null;
  timezone: string;
  pms_provider: string;
  status: string;
  created_at: string;
  updated_at: string;
}

export interface Member {
  id: string;
  spa_id: string;
  user_id: string;
  role: Role;
  status: string;
  invited_email: string | null;
  created_at: string;
}

export interface MedicalFlag {
  rule: string;
  detail: string;
  source_chunk_id?: string | null;
}

export interface Patient {
  id: string;
  spa_id: string;
  full_name: string | null;
  phone: string | null;
  email: string | null;
  instagram_handle: string | null;
  channel: Channel;
  requested_treatment: string | null;
  status: PatientStatus;
  medical_flags: MedicalFlag[];
  estimated_value: number | null;
  notes: string | null;
  created_at: string;
  updated_at: string;
}

export interface SessionSummary {
  id: string;
  status: SessionStatus;
  channel: Channel;
  booking_url_issued: string | null;
  last_message_at: string | null;
  created_at: string;
}

export interface PatientDetail extends Patient {
  sessions: SessionSummary[];
}

export interface Paginated<T> {
  items: T[];
  total: number;
  limit: number;
  offset: number;
}

export interface KnowledgeDoc {
  id: string;
  spa_id: string;
  filename: string;
  file_type: "pdf" | "markdown";
  byte_size: number | null;
  status: KnowledgeStatus;
  chunk_count: number;
  error_message: string | null;
  created_at: string;
  embedded_at: string | null;
}

export interface RetrievedChunk {
  chunk_id: string;
  score: number;
  source: string;
  text: string;
}

export interface ReasoningStep {
  step: number;
  agent: string;
  action: string;
  retrieved: RetrievedChunk[];
  rules_enforced: string[];
  ts: string;
}

export interface ChatMessage {
  role: "user" | "assistant" | "system";
  content: string;
  ts: string;
}

export interface ChatResponse {
  session_id: string;
  reply: string;
  status: SessionStatus;
  patient_status: PatientStatus;
  booking_url: string | null;
  medical_flags: MedicalFlag[];
  reasoning: ReasoningStep[];
  patient_id: string | null;
}

export interface SessionDetail {
  id: string;
  spa_id: string;
  patient_id: string | null;
  channel: Channel;
  status: SessionStatus;
  messages: ChatMessage[];
  ai_transcript: ReasoningStep[];
  booking_url_issued: string | null;
  last_message_at: string | null;
  created_at: string;
}

export interface Overview {
  leads_captured: number;
  ai_conversations: number;
  booking_click_through_rate: number;
  after_hours_bookings: number;
  contraindication_flag_rate: number;
  bookings: number;
}
