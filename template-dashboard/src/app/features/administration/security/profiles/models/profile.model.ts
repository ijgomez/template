/**
 * Represents an action that can be assigned to a profile.
 */
export interface Action {
  id: number;
  code: string;
  type: string;
  name: string;
  description?: string;
}

/**
 * Represents a security profile with assigned actions.
 */
export interface Profile {
  id: number | null;
  name: string;
  description?: string;
  actions: Action[];
  createdAt?: string;
  lastModifiedAt?: string;
}

/**
 * Criteria for filtering profiles in list views.
 */
export interface ProfileCriteria {
  name?: string;
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
