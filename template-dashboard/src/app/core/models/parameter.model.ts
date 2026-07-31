/**
 * Parameter types supported by the system.
 */
export type ParameterType = 'STRING' | 'INTEGER' | 'BOOLEAN' | 'DATE';

/**
 * Parameter DTO matching the backend ParameterDTO.
 * Parameters are keyed by code (string), not numeric ID.
 */
export interface Parameter {
  id: number | null;
  code: string;
  description: string;
  value: string;
  type: ParameterType;
  createdAt: string | null;
  lastModifiedAt: string | null;
}

/**
 * Criteria for filtering parameters in paginated queries.
 */
export interface ParameterCriteria {
  code?: string;
  description?: string;
  type?: ParameterType;
}

/**
 * Paginated response structure from the backend.
 */
export interface Page<T> {
  content: T[];
  totalElements: number;
  totalPages: number;
  size: number;
  number: number;
}
