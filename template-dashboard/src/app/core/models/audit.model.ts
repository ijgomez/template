/**
 * Operation types for audit log entries.
 */
export type OperationType = 'CREATE' | 'UPDATE' | 'DELETE' | 'EXECUTE';

/**
 * Audit sections representing different application areas.
 */
export type AuditSection = 'SECURITY' | 'REPORTS' | 'INTERFACES' | 'CLUSTER' | 'SYSTEM';

/**
 * Represents an audit log entry from the backend.
 */
export interface AuditLog {
  id: number;
  timestamp: string;
  username: string;
  operationType: OperationType;
  section: AuditSection;
  entityId: string;
  entityName: string;
  detail: string;
}

/**
 * Criteria for filtering audit log entries.
 */
export interface AuditCriteria {
  dateFrom?: string;
  dateTo?: string;
  username?: string;
  operationType?: OperationType;
  section?: AuditSection;
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
