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
  ip: string;
  status: NodeStatus;
  master: boolean;
  freeMemory: number;
  totalMemory: number;
  usedMemory: number;
  startedAt: string;
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
 * Represents a job assigned to a cluster node (ClusterJob).
 */
export interface ClusterJob {
  clusterNodeId: number;
  clusterTaskId: number;
  priority: number | null;
  enabled: boolean;
}

/**
 * Represents a cluster task from the task catalogue.
 */
export interface ClusterTask {
  id: number;
  name: string;
  description: string | null;
  nodes: number | null;
  minNodes: number | null;
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
