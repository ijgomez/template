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
 * The backend returns `actionIds` (number[]) in the DTO.
 * The `actions` field is used in detail views when enriched data is available.
 */
export interface Profile {
  id: number | null;
  name: string;
  description?: string;
  actions: Action[];
  actionIds?: number[];
  createdAt?: string;
  lastModifiedAt?: string;
}

/**
 * Criteria for filtering profiles in list views.
 */
export interface ProfileCriteria {
  name?: string;
}

