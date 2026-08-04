export type Role = "teacher" | "student";

export interface Profile {
  id: string;
  full_name: string;
  role: Role;
  class_id: string | null;
  created_at: string;
}

export interface Class {
  id: string;
  name: string;
  teacher_id: string;
  join_code: string;
  created_at: string;
}

export interface Homework {
  id: string;
  class_id: string;
  title: string;
  description: string | null;
  due_date: string | null;
  attachment_url: string | null;
  visible_from: string | null;
  created_at: string;
}

export interface Announcement {
  id: string;
  class_id: string;
  title: string;
  body: string;
  image_url: string | null;
  created_at: string;
}

export interface Survey {
  id: string;
  class_id: string;
  question: string;
  options: string[];
  closes_at: string | null;
  created_at: string;
}

export interface SurveyResponse {
  id: string;
  survey_id: string;
  student_id: string;
  answer: string;
  created_at: string;
}

// --- Exam Types ---

export type QuestionType = "multiple_choice" | "essay";

export interface ExamQuestion {
  id: string;          // unique client-generated id for keying
  type: QuestionType;
  text: string;
  image_url: string | null;
  options: string[];   // only for multiple_choice
  correct: number;     // index of correct option (0-based), only for multiple_choice
  points: number;      // points for this question
}

export interface Exam {
  id: string;
  class_id: string;
  title: string;
  questions: ExamQuestion[];
  time_limit_minutes: number | null;
  visible_from: string;
  closes_at: string | null;
  created_at: string;
}

export interface ExamSubmissionAnswer {
  question_index: number;
  selected: number | null;  // for multiple_choice
  text: string | null;      // for essay
}

export interface ExamSubmission {
  id: string;
  exam_id: string;
  student_id: string;
  answers: ExamSubmissionAnswer[];
  score: number;
  total: number;
  submitted_at: string;
  profiles?: { full_name: string };
}

// ---

export type SubmissionType = "photo" | "text";
export type AiCheckLabel = "low" | "medium" | "high";

export interface Submission {
  id: string;
  homework_id: string;
  student_id: string;
  submission_type: SubmissionType;
  file_urls: string[] | null;
  text_content: string | null;
  ai_check_label: AiCheckLabel | null;
  ai_check_notes: string | null;
  teacher_reviewed: boolean;
  grade: string | null;
  submitted_at: string;
}

export interface Message {
  id: string;
  sender_id: string;
  receiver_id: string;
  class_id: string;
  body: string;
  read_at: string | null;
  created_at: string;
}