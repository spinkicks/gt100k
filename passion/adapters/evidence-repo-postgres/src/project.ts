/** Project row shape mirrored by the `projects` table. Not part of the domain port. */
export interface Project {
  id: string;
  name: string;
  studentId: string;
  status: string;
  createdAt: string;
  updatedAt: string;
}
