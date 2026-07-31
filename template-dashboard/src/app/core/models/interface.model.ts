/**
 * Interface status values.
 */
export type InterfaceStatus = 'ACTIVE' | 'INACTIVE' | 'ERROR';

/**
 * Interface operation types.
 */
export type InterfaceOperationType = 'IN' | 'OUT';

/**
 * Interface log status.
 */
export type InterfaceLogStatus = 'SUCCESS' | 'ERROR';

/**
 * Represents a system interface configuration.
 */
export interface InterfaceConfig {
  id: number;
  name: string;
  description: string;
  url: string;
  protocol: string;
  checkFrequency: number;
  status: InterfaceStatus;
  createdAt: string;
  lastModifiedAt: string;
}

/**
 * Represents an interface operation log entry.
 */
export interface InterfaceLog {
  id: number;
  timestamp: string;
  operationType: InterfaceOperationType;
  interfaceName: string;
  interfaceId: number;
  requestPayload: string | null;
  responsePayload: string | null;
  status: InterfaceLogStatus;
  errorMessage: string | null;
}

/**
 * Criteria for filtering interface logs.
 */
export interface InterfaceLogCriteria {
  dateFrom?: string;
  dateTo?: string;
  operationType?: InterfaceOperationType;
  interfaceId?: number;
  status?: InterfaceLogStatus;
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
