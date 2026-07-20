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
export type SessionClaimStatus = "대기" | "승인";

export interface StudySession {
  id: number;
  presenter_id: number | null;
  topic: string | null;
  claim_status: SessionClaimStatus | null;
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

export type CalendarEventType = "설명회" | "공지" | "회의";

export interface CalendarEvent {
  id: number;
  type: CalendarEventType;
  title: string;
  description: string | null;
  event_date: string;
  event_time: string | null;
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

export interface Feedback {
  id: number;
  session_id: number;
  author_id: number;
  content: string;
  created_at: string;
}

export type FineReason = "무단불참" | "자료미준비" | "무단지각" | "당일취소" | "숙제안함" | "기타";

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
  discord_id: string | null;
  status: ApplicationStatus;
  orientation_at: string | null;
  orientation_place: string | null;
  sms_sent: boolean;
  created_at: string;
}

export interface ChecklistItem {
  user_id: number;
  name: string;
  email: string;
  presentation_count: number;
  latest_session_id: number | null;
  latest_session_date: string | null;
  content_complete: boolean | null;
  discord_id: string | null;
  discord_joined: boolean;
}

export interface StudySettings {
  application_opens_at: string | null;
  application_closes_at: string | null;
  is_open: boolean;
  orientation_options: string[];
  discord_guild_id: string | null;
  discord_voice_channel_id: string | null;
  presentation_time: string | null;
  presentation_duration_minutes: number | null;
}

export interface UserDetail extends User {
  sessions: StudySession[];
}

export type AttendanceStatus = "출석" | "지각" | "불참";

export interface Attendance {
  id: number;
  session_id: number;
  user_id: number;
  status: AttendanceStatus;
  checked_at: string;
}

export type ScheduleItem =
  | { kind: "session"; date: string; session: StudySession }
  | { kind: "event"; date: string; event: CalendarEvent };
