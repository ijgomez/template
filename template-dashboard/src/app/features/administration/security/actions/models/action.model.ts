/**
 * Represents a system action (permission) as returned by the backend.
 */
export interface Action {
  id: number;
  code: string;
  type: string;
  name: string;
  description: string | null;
  createdAt: string;
  lastModifiedAt: string;
}

/**
 * Criteria object for filtering actions in paginated queries.
 */
export interface ActionCriteria {
  code?: string;
  name?: string;
  type?: string;
}

