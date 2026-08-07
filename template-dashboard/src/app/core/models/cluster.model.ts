/**
 * Node status in the cluster.
 */
export type NodeStatus = 'ACTIVE' | 'INACTIVE';

/**
 * Represents a cluster node.
 */
export interface ClusterNode {
  id: number;
  hostname: string;
  status: NodeStatus;
  master: boolean;
  freeMemory: number;
  totalMemory: number;
  usedMemory: number;
  createdAt: string;
  lastModifiedAt: string;
}

/**
 * Represents a cluster block (lock entry).
 */
export interface ClusterBlock {
  id: number;
  name: string;
  startDate: string | null;
  avgTime: number;
  minTime: number;
  maxTime: number;
  total: number;
  createdAt: string;
  lastModifiedAt: string;
}

/**
 * Criteria for filtering cluster blocks.
 */
export interface ClusterBlockCriteria {
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
