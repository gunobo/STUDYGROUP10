export type UserRole = "member" | "admin";

export interface User {
  id: number;
  name: string;
  email: string;
  profile_image_url: string | null;
  role: UserRole;
  created_at: string;
}

export type SessionStatus = "예정" | "완료" | "취소" | "연기";

export interface StudySession {
  id: number;
  presenter_id: number;
  topic: string;
  scheduled_date: string;
  status: SessionStatus;
  material_url: string | null;
  concept_note: string | null;
  example_note: string | null;
  demo_note: string | null;
  summary_note: string | null;
  quiz_json: Record<string, unknown> | null;
  created_at: string;
}

export interface Question {
  id: number;
  session_id: number;
  author_id: number;
  content: string;
  answered: boolean;
  resolved: boolean;
  answer_note: string | null;
  resolved_before_session_id: number | null;
  created_at: string;
}

export type FineReason = "무단불참" | "자료미준비" | "무단지각" | "당일취소" | "기타";

export interface Fine {
  id: number;
  user_id: number;
  session_id: number | null;
  reason: FineReason;
  amount: number;
  exempted: boolean;
  created_at: string;
}

export interface FineSummary {
  by_user: { user_id: number; name: string; total_amount: number }[];
  total_amount: number;
}

export type ApplicationStatus = "대기" | "승인" | "거절";

export interface Application {
  id: number;
  user: User;
  student_id: string;
  name: string;
  phone: string;
  topics: string[];
  available_time: string;
  status: ApplicationStatus;
  orientation_at: string | null;
  orientation_place: string | null;
  sms_sent: boolean;
  created_at: string;
}

export interface StudySettings {
  application_opens_at: string | null;
  application_closes_at: string | null;
  is_open: boolean;
  orientation_options: string[];
}

export interface UserDetail extends User {
  sessions: StudySession[];
}
