/**
 * DTO representing a user entity from the backend.
 */
export interface UserDTO {
  id: number | null;
  username: string;
  password?: string;
  firstName: string | null;
  lastName: string | null;
  email: string | null;
  profileId: number | null;
  profileName?: string;
  reportIds: number[];
  lastAccess: string | null;
  createdAt: string | null;
  lastModifiedAt: string | null;
}

/**
 * Criteria for filtering and paginating user lists.
 */
export interface UserCriteria {
  username?: string;
  firstName?: string;
  lastName?: string;
  email?: string;
  profileId?: number;
}

/**
 * Paginated response from the backend.
 */
export interface Page<T> {
  content: T[];
  totalElements: number;
  totalPages: number;
  size: number;
  number: number;
}

/**
 * Profile reference for selectors.
 */
export interface ProfileRef {
  id: number;
  name: string;
}

/**
 * Report reference for multi-select.
 */
export interface ReportRef {
  id: number;
  name: string;
}
