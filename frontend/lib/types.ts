export type Role = "admin" | "staff";

export type Staff = {
  staff_id: number;
  staff_name: string;
  staff_email: string;
  role: Role;
};

export type StaffOption = Pick<Staff, "staff_id" | "staff_name" | "staff_email">;

export type EmailItem = {
  id: number;
  sender_email: string;
  subject: string | null;
  snippet: string | null;
  thread_id: string;
  assigned_staff_id: number | null;
  received_at: string;
};

export type InboxResponse = {
  current_user: Staff;
  emails: EmailItem[];
  staff: StaffOption[];
};
