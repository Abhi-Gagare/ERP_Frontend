const BASE = "/api";

export interface AuthResponse {
  accessToken: string;
  refreshToken: string;
  tokenType: string;
  expiresIn: number;
  user: {
    id: number;
    email: string;
    fullName: string;
    role: "STUDENT" | "FACULTY" | "ADMIN";
  };
}

export interface ApiError {
  status: number;
  message: string;
  errors: string[];
}

async function request<T>(
  path: string,
  options: RequestInit = {}
): Promise<T> {
  const token = typeof window !== "undefined" ? localStorage.getItem("accessToken") : null;

  const res = await fetch(`${BASE}${path}`, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...options.headers,
    },
  });

  if (res.status === 401 || res.status === 403) {
    if (typeof window !== "undefined") {
      localStorage.removeItem("accessToken");
      localStorage.removeItem("refreshToken");
      localStorage.removeItem("user");
      window.location.href = "/login";
    }
    throw { status: res.status, message: "Session expired. Please log in again.", errors: [] } as ApiError;
  }

  const contentType = res.headers.get("content-type") ?? "";
  const hasBody = contentType.includes("application/json") || contentType.includes("text/");
  const data = hasBody ? await res.json() : undefined;
  if (!res.ok) throw (data ?? { status: res.status, message: res.statusText, errors: [] }) as ApiError;
  return data as T;
}

export interface AdmissionData {
  id: number;
  admissionId: string;
  firstName: string;
  lastName: string;
  dateOfBirth: string;
  gender: string;
  email: string;
  phone: string;
  address: string;
  city: string;
  state: string;
  pincode: string;
  nationality: string;
  program: string;
  semester: number;
  batchYear: number;
  prevSchool: string;
  prevBoard: string;
  prevYear: string;
  prevPercentage: string;
  guardianName: string;
  guardianRelation: string;
  guardianPhone: string;
  guardianEmail: string;
  status: "PENDING" | "REVIEW" | "APPROVED" | "REJECTED";
  createdAt: string;
}

export interface FeeData {
  id: number;
  feeId: string;
  admissionId: string;
  studentName: string;
  program: string;
  feeType: string;
  amount: number;
  amountPaid: number;
  balance: number;
  dueDate: string;
  paidDate: string | null;
  status: "PENDING" | "PARTIAL" | "PAID" | "OVERDUE" | "WAIVED";
  remarks: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface AdmissionFeeSummary {
  admissionId: string;
  studentName: string;
  program: string;
  status: string;
  createdAt: string;
  feeCount: number;
  totalBilled: number;
  totalPaid: number;
}

export interface FeeStats {
  total: number;
  paid: number;
  pending: number;
  overdue: number;
  totalAmount: number;
  totalCollected: number;
}

export interface PageResponse<T> {
  content: T[];
  totalElements: number;
  totalPages: number;
  number: number;
  size: number;
}

export interface ProgramData {
  id: number;
  code: string;
  name: string;
  description: string | null;
  deanName: string | null;
  deanEmail: string | null;
  deanPhone: string | null;
  degrees: string[];
  status: "ACTIVE" | "INACTIVE";
  createdAt: string;
  updatedAt: string;
}

export interface StudentData {
  id: number;
  rollNumber: string;
  fullName: string;
  email: string;
  program: string;
  semester: number;
  batchYear: number;
  dateOfBirth: string | null;
  phone: string | null;
  address: string | null;
  guardianName: string | null;
  guardianPhone: string | null;
  enrollmentDate: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface CourseFeeComponent {
  id: number;
  feeType: string;
  amount: number;
  frequency: string;
  remarks: string | null;
}

export interface CourseData {
  id: number;
  courseCode: string;
  name: string;
  description: string | null;
  program: string;
  credits: number;
  durationMonths: number;
  level: string;
  mode: string;
  totalSeats: number;
  availableSeats: number;
  status: "ACTIVE" | "INACTIVE" | "UPCOMING";
  feeComponents: CourseFeeComponent[];
  totalFeePerSemester: number;
  totalFeePerYear: number;
  totalOneTime: number;
  createdAt: string;
  updatedAt: string;
}

export interface SubjectData {
  id: number;
  subjectCode: string;
  name: string;
  description: string | null;
  course: string;
  semester: number;
  year: number;
  credits: number;
  type: string;
  facultyName: string | null;
  status: "ACTIVE" | "INACTIVE";
  createdAt: string;
  updatedAt: string;
}

export interface AttendanceRecord {
  id: number;
  studentId: number;
  rollNumber: string;
  studentName: string;
  subjectCode: string;
  subjectName: string;
  date: string;
  timeSlot: string;
  status: "PRESENT" | "ABSENT" | "LATE" | "EXCUSED";
  remarks: string | null;
  markedBy: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface AttendanceSummary {
  studentId: number;
  rollNumber: string;
  name: string;
  present: number;
  total: number;
  percentage: number;
}

export const api = {
  programs: {
    create: (data: Record<string, unknown>) =>
      request<ProgramData>("/programs", { method: "POST", body: JSON.stringify(data) }),

    list: (search = "", status = "", page = 0) =>
      request<PageResponse<ProgramData>>(
        `/programs?search=${encodeURIComponent(search)}&status=${status}&page=${page}&size=20`
      ),

    get: (code: string) =>
      request<ProgramData>(`/programs/${code}`),

    update: (code: string, data: Record<string, unknown>) =>
      request<ProgramData>(`/programs/${code}`, { method: "PUT", body: JSON.stringify(data) }),

    delete: (code: string) =>
      request<void>(`/programs/${code}`, { method: "DELETE" }),
  },

  /** @deprecated use api.programs */
  departments: {
    create: (data: Record<string, unknown>) =>
      request<ProgramData>("/programs", { method: "POST", body: JSON.stringify(data) }),

    list: (search = "", status = "", page = 0) =>
      request<PageResponse<ProgramData>>(
        `/programs?search=${encodeURIComponent(search)}&status=${status}&page=${page}&size=20`
      ),

    get: (code: string) =>
      request<ProgramData>(`/programs/${code}`),

    update: (code: string, data: Record<string, unknown>) =>
      request<ProgramData>(`/programs/${code}`, { method: "PUT", body: JSON.stringify(data) }),

    delete: (code: string) =>
      request<void>(`/programs/${code}`, { method: "DELETE" }),
  },

  login: (email: string, password: string) =>
    request<AuthResponse>("/auth/login", {
      method: "POST",
      body: JSON.stringify({ email, password }),
    }),

  me: () => request<AuthResponse["user"]>("/auth/me"),

  refresh: (refreshToken: string) =>
    request<AuthResponse>("/auth/refresh", {
      method: "POST",
      body: JSON.stringify({ refreshToken }),
    }),

  courses: {
    create: (data: Record<string, unknown>) =>
      request<CourseData>("/courses", { method: "POST", body: JSON.stringify(data) }),

    list: (search = "", program = "", status = "", page = 0) =>
      request<PageResponse<CourseData>>(
        `/courses?search=${encodeURIComponent(search)}&program=${encodeURIComponent(program)}&status=${status}&page=${page}&size=20`
      ),

    get: (courseCode: string) =>
      request<CourseData>(`/courses/${courseCode}`),

    update: (courseCode: string, data: Record<string, unknown>) =>
      request<CourseData>(`/courses/${courseCode}`, { method: "PUT", body: JSON.stringify(data) }),
  },

  fees: {
    create: (data: Record<string, unknown>) =>
      request<FeeData>("/fees", { method: "POST", body: JSON.stringify(data) }),

    list: (search = "", status = "", page = 0) =>
      request<PageResponse<FeeData>>(
        `/fees?search=${encodeURIComponent(search)}&status=${status}&page=${page}&size=20`
      ),

    get: (feeId: string) =>
      request<FeeData>(`/fees/${feeId}`),

    pay: (feeId: string, amountPaid: number, remarks?: string) =>
      request<FeeData>(`/fees/${feeId}/pay`, {
        method: "POST",
        body: JSON.stringify({ amountPaid, remarks }),
      }),

    waive: (feeId: string, remarks?: string) =>
      request<FeeData>(`/fees/${feeId}/waive`, {
        method: "POST",
        body: JSON.stringify({ remarks }),
      }),

    stats: () => request<FeeStats>("/fees/stats"),

    admissionsSummary: (limit = 20) =>
      request<AdmissionFeeSummary[]>(`/fees/admissions-summary?limit=${limit}`),
  },

  students: {
    list: (search = "", program = "", active?: boolean, page = 0) => {
      const activeParam = active !== undefined ? `&active=${active}` : "";
      return request<PageResponse<StudentData>>(
        `/students?search=${encodeURIComponent(search)}&program=${encodeURIComponent(program)}${activeParam}&page=${page}&size=20`
      );
    },

    get: (rollNumber: string) =>
      request<StudentData>(`/students/${rollNumber}`),
  },

  admissions: {
    create: (data: Record<string, unknown>) =>
      request<AdmissionData>("/admissions", { method: "POST", body: JSON.stringify(data) }),

    list: (search = "", status = "", page = 0) =>
      request<PageResponse<AdmissionData>>(
        `/admissions?search=${encodeURIComponent(search)}&status=${status}&page=${page}&size=20`
      ),

    get: (admissionId: string) =>
      request<AdmissionData>(`/admissions/${admissionId}`),
  },

  attendance: {
    mark: (data: Record<string, unknown>) =>
      request<AttendanceRecord[]>("/attendance", { method: "POST", body: JSON.stringify(data) }),

    session: (program: string, batchYear: number | undefined, subjectCode: string, date: string, timeSlot: string) => {
      const byParam = batchYear !== undefined ? `&batchYear=${batchYear}` : "";
      return request<AttendanceRecord[]>(
        `/attendance/session?program=${encodeURIComponent(program)}${byParam}&subjectCode=${encodeURIComponent(subjectCode)}&date=${date}&timeSlot=${encodeURIComponent(timeSlot)}`
      );
    },

    summary: (program: string, batchYear: number | undefined, subjectCode: string) => {
      const byParam = batchYear !== undefined ? `&batchYear=${batchYear}` : "";
      return request<AttendanceSummary[]>(
        `/attendance/summary?program=${encodeURIComponent(program)}${byParam}&subjectCode=${encodeURIComponent(subjectCode)}`
      );
    },
  },

  subjects: {
    create: (data: Record<string, unknown>) =>
      request<SubjectData>("/subjects", { method: "POST", body: JSON.stringify(data) }),

    list: (search = "", course = "", semester?: number, year?: number, status = "", page = 0) => {
      const semParam  = semester !== undefined ? `&semester=${semester}` : "";
      const yearParam = year     !== undefined ? `&year=${year}`         : "";
      return request<PageResponse<SubjectData>>(
        `/subjects?search=${encodeURIComponent(search)}&course=${encodeURIComponent(course)}${semParam}${yearParam}&status=${status}&page=${page}&size=50`
      );
    },

    get: (id: number) => request<SubjectData>(`/subjects/${id}`),

    update: (id: number, data: Record<string, unknown>) =>
      request<SubjectData>(`/subjects/${id}`, { method: "PUT", body: JSON.stringify(data) }),

    delete: (id: number) =>
      request<void>(`/subjects/${id}`, { method: "DELETE" }),
  },
};
