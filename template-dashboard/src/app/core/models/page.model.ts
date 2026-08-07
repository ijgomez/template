/**
 * Pagination metadata returned by Spring Boot when using
 * PageSerializationMode.VIA_DTO.
 */
export interface PageMetadata {
  size: number;
  number: number;
  totalElements: number;
  totalPages: number;
}

/**
 * Paginated response from the backend (Spring Boot VIA_DTO format).
 *
 * The response contains a `content` array and a nested `page` object
 * with pagination metadata.
 */
export interface Page<T> {
  content: T[];
  page: PageMetadata;
}
