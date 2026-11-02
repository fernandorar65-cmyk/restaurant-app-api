export const STAFF_DIRECTORY = Symbol('IAM_STAFF_DIRECTORY');

/** An employee record of the user, as the staff profile shows it. */
export interface StaffEmployment {
  employeeId: string;
  organizationId: string;
  organizationName: string;
  employeeCode: string;
  status: string;
  hiredAt: string | null;
  jobPosition: { id: string; name: string } | null;
  workArea: { id: string; name: string } | null;
}

/** IAM's view of the organizations context: where a user works. */
export interface StaffDirectoryPort {
  findEmployments(userId: string): Promise<StaffEmployment[]>;
  /** Organization names by id (the ids come from memberships, so they exist). */
  organizationNames(ids: string[]): Promise<Map<string, string>>;
}
