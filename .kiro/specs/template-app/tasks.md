# Implementation Plan: Template App

## Overview

Full-stack enterprise application template implementing authentication/authorization with JWT, user/profile/action management, reports with multi-format export, AOP-based auditing, interface monitoring, and a high-availability cluster with task governance. Backend in Java 21 + Spring Boot 4.1.0 (multi-module Maven), frontend in Angular 22 + Bootstrap 5.3.8, database PostgreSQL 18 with Liquibase XML migrations.

## Tasks

- [x] 0. Project structure scaffolding
  - [x] 0.1 Create the multi-module Maven project structure (backend)
    - Create parent POM with module declarations and dependency management (Spring Boot 4.1.0, Java 21, PostgreSQL 18 driver, Liquibase, JUnit 5, Mockito, AssertJ, jqwik, Testcontainers, JaCoCo)
    - Create module directories and POMs: template-commons, template-cluster, template-domain, template-core, template-webapp (WAR), template-liquibase
    - Configure module dependency chain: commons → cluster → domain → core → webapp
    - Configure Maven profiles: local, dist, test
    - Add Spring Data JPA, Spring Security, Spring Web dependencies in appropriate modules
    - Domain module must NOT include Spring dependencies (only JPA API)
    - _Requirements: 10.1, 10.2_

  - [x] 0.2 Initialize the Angular project (frontend)
    - Create template-dashboard Angular 22 project with Angular CLI
    - Add Bootstrap 5.3.8 dependency
    - Add @ngx-translate for i18n
    - Add @angular/service-worker for PWA support
    - Configure base project structure: core/, shared/, features/ directories
    - Configure environment.ts and environment.prod.ts
    - _Requirements: 10.3, 13.8_

- [ ] 1. Database schema and domain model foundation
  - [~] 1.1 Create Liquibase XML migrations for all database tables
    - Create master changelog and versioned changesets for: users, profiles, actions, profile2action, user2report, reports, parameters, audit_log, interfaces, interface_log, cluster_node, cluster_block, cluster_task, cluster_job
    - All timestamp fields use TIMESTAMP WITH TIME ZONE (timestamptz)
    - Define enums, unique constraints, composite keys, foreign keys, and indexes as specified in design
    - Include NOT NULL constraints and DEFAULT CURRENT_TIMESTAMP for created_at/last_modified_at
    - Define cluster_block.name FK → cluster_task.name (ON DELETE RESTRICT, ON UPDATE CASCADE)
    - Include seed data changeset with the 14 predefined actions (DASHBOARD_READ, REPORT_EXECUTE, INTERFACES_READ, USER_READ, USER_WRITE, PROFILE_READ, PROFILE_WRITE, ACTION_READ, SYSTEM_PARAMETER_READ, SYSTEM_PARAMETER_WRITE, SYSTEM_LOG_READ, CLUSTER_NODE_READ, CLUSTER_NODE_WRITE, CLUSTER_LOCK_READ) ensuring the authorization system works from first startup
    - _Requirements: 8.1, 8.2, 8.4, 8.5, 8.6, 16.1, 16.2, 16.3, 16.4, 16.5, 16.6, 17.1, 17.2, 17.3, 17.4, 17.5, 26.1, 26.2, 26.3, 26.4, 26.5, 26.6, 27.7, 28.1, 28.2, 28.3, 29.1, 29.2, 29.3, 31.1, 31.2, 31.3, 31.5, 33.1, 33.2, 33.3, 33.4, 33.5, 33.6, 34.1, 34.2, 34.7, 36.1, 36.2, 36.3, 36.4, 36.5, 37.1, 37.2, 37.3_


  - [~] 1.2 Create JPA entities in the domain module
    - Implement all entities as Java classes with JPA annotations: User, Profile, Action, Parameter, Report, AuditLog, Interface, InterfaceLog, ClusterNode, ClusterBlock, ClusterTask, ClusterJob
    - Implement join table entities: Profile2Action, User2Report
    - Implement composite key class: ClusterJobPK
    - Use @CreatedDate and @LastModifiedDate for timestamp auditing
    - Domain module must have no Spring dependencies (except JPA)
    - _Requirements: 8.1, 16.1, 17.1, 28.1, 29.1, 31.1, 33.1, 34.2, 34.3, 34.5, 34.6, 36.1, 37.1_

  - [~] 1.3 Create domain enums in the domain module
    - Implement enums: ActionType (READ, WRITE, EXECUTE), ParameterType (STRING, INTEGER, BOOLEAN, DATE), OperationType (CREATE, UPDATE, DELETE, EXECUTE), AuditSection (SECURITY, REPORTS, INTERFACES, CLUSTER, SYSTEM), NodeStatus (ALIVE, DEAD), InterfaceStatus (ACTIVE, INACTIVE, ERROR), InterfaceOperationType (IN, OUT), InterfaceLogStatus (SUCCESS, ERROR), ExportFormat (PDF, XLSX, CSV, TXT)
    - _Requirements: 16.3, 28.3, 29.3, 33.3_

  - [~] 1.4 Create DTOs and Criteria classes in the domain module
    - Implement Java records: UserDTO, ProfileDTO, ActionDTO, ParameterDTO, ReportDTO, ReportFilterDTO, AuditLogDTO, InterfaceDTO, InterfaceLogDTO, ClusterNodeDTO, ClusterBlockDTO, ClusterTaskDTO, ClusterJobDTO
    - Implement request/response: LoginRequest, TokenResponse (only non-entity objects allowed)
    - Implement Criteria classes: UserCriteria, ProfileCriteria, ActionCriteria, ParameterCriteria, AuditCriteria, InterfaceLogCriteria, ClusterBlockCriteria
    - _Requirements: 40.1, 40.2, 40.3, 40.4, 40.5, 40.6, 40.7, 40.8_


- [~] 2. Checkpoint - Verify database schema and domain model
  - Ensure Liquibase migrations apply successfully against PostgreSQL
  - Ensure all entities compile and JPA mappings are valid
  - Ensure all tests pass, ask the user if questions arise.

- [ ] 3. Security infrastructure (backend)
  - [~] 3.1 Implement Spring Security configuration with JWT
    - Configure SecurityFilterChain with stateless session management
    - Implement JwtTokenProvider: generate access + refresh tokens, validate, extract claims
    - Include profile name and action codes list in JWT payload
    - Configure BCrypt password encoder with strength ≥ 12
    - Configure CORS for Angular frontend
    - _Requirements: 1.1, 5.1, 8.3_

  - [~] 3.2 Implement AuthService in core module
    - authenticate(username, password): validate credentials, update lastAccess, generate TokenResponse
    - refreshToken(refreshToken): validate refresh token, issue new token pair
    - logout(refreshToken): invalidate refresh token
    - Return 401 for invalid credentials
    - _Requirements: 1.1, 1.2, 1.3, 2.2, 3.1, 3.3_

  - [~] 3.3 Implement AuthController in webapp module
    - POST /api/v1/auth/login
    - POST /api/v1/auth/refresh
    - POST /api/v1/auth/logout
    - _Requirements: 35.2_


  - [~] 3.4 Implement authorization filter and access control
    - Create JwtAuthenticationFilter that extracts token from Authorization header
    - Implement action-based authorization: check user actions against endpoint requirements
    - Return 403 Forbidden when user lacks required action
    - Return 405 Method Not Allowed for restricted operations (create/delete actions, create/delete nodes, CUD blocks, CUD audit, CUD interfaces)
    - _Requirements: 5.4, 15.5, 15.6, 21.7, 22.7, 23.8, 23.9, 24.5, 32.5_

  - [ ]* 3.5 Write property test for JWT payload (Property 4)
    - **Property 4: JWT payload contains user authorization data**
    - For any authenticated user with profile and actions, decoded JWT payload yields profile name and complete action codes list
    - **Validates: Requirements 5.1**

  - [ ]* 3.6 Write property test for authorization enforcement (Property 5)
    - **Property 5: Authorization enforcement returns 403**
    - For any user without a required action, accessing a protected resource returns 403
    - For any user without report assignment, executing/exporting that report returns 403
    - **Validates: Requirements 5.4, 18.9**

- [ ] 4. Global exception handling and error response format
  - [~] 4.1 Implement GlobalExceptionHandler in webapp module
    - Create @RestControllerAdvice with handlers for: EntityNotFoundException (404), DuplicateEntityException (409), EntityInUseException (409), ValidationException (400), AuthenticationException (401), AccessDeniedException (403), MethodNotAllowedException (405), ReportExportException (500)
    - Consistent error response JSON format: timestamp, status, error, message, path
    - _Requirements: 4.6, 4.7, 4.8, 14.6, 14.7, 14.8, 14.9, 15.4, 15.5, 15.6, 20.6, 20.7, 20.8, 22.6, 23.7, 24.4, 32.6_


- [ ] 5. User management (backend CRUD)
  - [~] 5.1 Implement UserService in core module
    - create(UserDTO): validate unique username, hash password BCrypt, persist user + user2report associations (no duplicates)
    - findById(id): return UserDTO or 404
    - findByCriteria(UserCriteria, Pageable): paginated listing with filters (username, nombre, apellidos, email, perfil)
    - countByCriteria(UserCriteria): total matching count
    - update(id, UserDTO): update nombre, apellidos, email, perfil, reportes (no duplicates)
    - delete(id): remove user
    - updateProfile(userId, UserDTO): self-service update (nombre, apellidos, email only)
    - _Requirements: 4.1, 4.2, 4.3, 4.4, 4.5, 4.6, 4.7, 4.8, 9.3_

  - [~] 5.2 Implement UserController in webapp module
    - GET /api/v1/administration/security/users (paginated + filters)
    - GET /api/v1/administration/security/users/count
    - POST /api/v1/administration/security/users
    - GET /api/v1/administration/security/users/{id}
    - PUT /api/v1/administration/security/users/{id}
    - DELETE /api/v1/administration/security/users/{id}
    - GET /api/v1/administration/security/users/me
    - PUT /api/v1/administration/security/users/me
    - _Requirements: 35.3, 9.1, 9.2, 9.3_

  - [ ]* 5.3 Write property test for CRUD round-trip (Property 1 - Users)
    - **Property 1: CRUD round-trip preserves entity data**
    - For any valid user creation request, create then retrieve should return equivalent fields (excluding system-generated)
    - **Validates: Requirements 4.1, 4.3**

  - [ ]* 5.4 Write property test for uniqueness constraint (Property 2 - Users)
    - **Property 2: Uniqueness constraint enforcement**
    - For any duplicate username, creation should return 409 Conflict
    - **Validates: Requirements 4.6**


  - [ ]* 5.5 Write property test for duplicate list detection (Property 3 - Users)
    - **Property 3: Duplicate list item detection**
    - For any user creation/update with duplicate reports in list, should return 400 Bad Request
    - **Validates: Requirements 4.8**

- [ ] 6. Profile management (backend CRUD)
  - [~] 6.1 Implement ProfileService in core module
    - create(ProfileDTO): validate unique name, persist profile + profile2action associations (no duplicates)
    - findById(id): return ProfileDTO with actions list or 404
    - findByCriteria(ProfileCriteria, Pageable): paginated listing with filters (nombre)
    - countByCriteria(ProfileCriteria): total matching count
    - update(id, ProfileDTO): update nombre, descripción, acciones (no duplicates)
    - delete(id): fail with 409 if profile has assigned users
    - _Requirements: 14.1, 14.2, 14.3, 14.4, 14.5, 14.6, 14.7, 14.8, 14.9_

  - [~] 6.2 Implement ProfileController in webapp module
    - GET /api/v1/administration/security/profiles (paginated + filters)
    - GET /api/v1/administration/security/profiles/count
    - POST /api/v1/administration/security/profiles
    - GET /api/v1/administration/security/profiles/{id}
    - PUT /api/v1/administration/security/profiles/{id}
    - DELETE /api/v1/administration/security/profiles/{id}
    - _Requirements: 35.4_

  - [ ]* 6.3 Write property test for CRUD round-trip (Property 1 - Profiles)
    - **Property 1: CRUD round-trip preserves entity data**
    - For any valid profile creation request, create then retrieve should return equivalent fields
    - **Validates: Requirements 14.1, 14.3**

  - [ ]* 6.4 Write property test for uniqueness constraint (Property 2 - Profiles)
    - **Property 2: Uniqueness constraint enforcement**
    - For any duplicate profile name, creation should return 409 Conflict
    - **Validates: Requirements 14.6**


  - [ ]* 6.5 Write property test for duplicate list detection (Property 3 - Profiles)
    - **Property 3: Duplicate list item detection**
    - For any profile creation/update with duplicate actions in list, should return 400 Bad Request
    - **Validates: Requirements 14.9**

- [ ] 7. Action management (backend read/update only)
  - [~] 7.1 Implement ActionService in core module
    - findById(id): return ActionDTO or 404
    - findByCriteria(ActionCriteria, Pageable): paginated listing with filters (código, nombre, tipo)
    - countByCriteria(ActionCriteria): total matching count
    - update(id, ActionDTO): update nombre, descripción, tipo
    - Reject create (405) and delete (405) operations
    - _Requirements: 15.1, 15.2, 15.3, 15.4, 15.5, 15.6_

  - [~] 7.2 Implement ActionController in webapp module
    - GET /api/v1/administration/security/actions (paginated + filters)
    - GET /api/v1/administration/security/actions/count
    - GET /api/v1/administration/security/actions/{id}
    - PUT /api/v1/administration/security/actions/{id}
    - POST /api/v1/administration/security/actions → 405
    - DELETE /api/v1/administration/security/actions/{id} → 405
    - _Requirements: 35.5_

- [ ] 8. Parameter management (backend CRUD)
  - [~] 8.1 Implement ParameterService in core module
    - create(ParameterDTO): validate unique code, validate type-value compatibility, persist
    - findByCode(code): return ParameterDTO or 404
    - findByCriteria(ParameterCriteria, Pageable): paginated listing with filters (código, descripción, tipo)
    - countByCriteria(ParameterCriteria): total matching count
    - update(code, ParameterDTO): validate type-value compatibility, update descripción, valor, tipo
    - delete(code): remove parameter
    - Type-value validation: INTEGER→integer, BOOLEAN→"true"/"false", DATE→ISO 8601, STRING→any
    - _Requirements: 20.1, 20.2, 20.3, 20.4, 20.5, 20.6, 20.7, 20.8, 20.9, 28.5_


  - [~] 8.2 Implement ParameterController in webapp module
    - GET /api/v1/administration/parameters (paginated + filters)
    - GET /api/v1/administration/parameters/count
    - POST /api/v1/administration/parameters
    - GET /api/v1/administration/parameters/{code}
    - PUT /api/v1/administration/parameters/{code}
    - DELETE /api/v1/administration/parameters/{code}
    - _Requirements: 35.6_

  - [ ]* 8.3 Write property test for CRUD round-trip (Property 1 - Parameters)
    - **Property 1: CRUD round-trip preserves entity data**
    - For any valid parameter creation request, create then retrieve should return equivalent fields
    - **Validates: Requirements 20.1, 20.3**

  - [ ]* 8.4 Write property test for uniqueness constraint (Property 2 - Parameters)
    - **Property 2: Uniqueness constraint enforcement**
    - For any duplicate parameter code, creation should return 409 Conflict
    - **Validates: Requirements 20.6**

  - [ ]* 8.5 Write property test for parameter type-value validation (Property 9)
    - **Property 9: Parameter type-value validation**
    - For any parameter type and invalid value string, create/update returns 400; for valid value string, operation succeeds
    - **Validates: Requirements 20.7, 28.5**

- [~] 9. Checkpoint - Verify backend CRUD services
  - Ensure all tests pass, ask the user if questions arise.

- [ ] 10. Audit system (backend AOP)
  - [~] 10.1 Implement AuditAspect with AOP in core module
    - Create @Aspect that intercepts service methods annotated for audit
    - Record: timestamp, username, operation_type, section, entity_id, entity_name, detail
    - Fail silently: audit errors must NOT propagate to business operations (log at ERROR level)
    - Independent of entity created_at/last_modified_at fields
    - _Requirements: 21.1, 21.2, 21.5, 21.8, 34.8_


  - [~] 10.2 Implement AuditService in core module
    - findByCriteria(AuditCriteria, Pageable): paginated listing with filters (fecha desde/hasta, username, operation_type, section)
    - countByCriteria(AuditCriteria): total matching count
    - log(AuditLogEntry): internal method called by AOP aspect
    - Expose only GET endpoints (no create/update/delete via API)
    - Implement retention archival when configured period exceeded
    - _Requirements: 21.3, 21.5, 21.6, 21.7_

  - [~] 10.3 Implement AuditController in webapp module
    - GET /api/v1/administration/audit (paginated + filters)
    - GET /api/v1/administration/audit/count
    - _Requirements: 35.7_

  - [ ]* 10.4 Write property test for audit log immutability (Property 10)
    - **Property 10: Audit log immutability**
    - For any existing audit log record, any UPDATE or DELETE attempt should be rejected
    - **Validates: Requirements 21.5, 26.3**

- [ ] 11. Report system (backend)
  - [~] 11.1 Implement ReportService in core module
    - findByUser(userId): list reports assigned via user2report
    - getFilters(reportId): return filter definitions for a report
    - execute(reportId, filters, pageable): execute report with server-side pagination
    - export(reportId, filters, format): generate file in PDF, XLSX, CSV, TXT
    - Validate mandatory filters (400 if missing)
    - Validate user has report assigned (403 if not)
    - _Requirements: 18.1, 18.2, 18.5, 18.6, 18.8, 18.9, 19.2, 19.3, 19.4, 19.5, 19.6, 19.8_

  - [~] 11.2 Implement ReportController in webapp module
    - GET /api/v1/reports (user's reports)
    - GET /api/v1/reports/{id}/filters
    - POST /api/v1/reports/{id}/execute (paginated)
    - POST /api/v1/reports/{id}/export/{format} (PDF, XLSX, CSV, TXT)
    - _Requirements: 35.12_


- [ ] 12. Interface monitoring (backend read-only)
  - [~] 12.1 Implement InterfaceService in core module
    - findAll(): list all interfaces with current status
    - findById(id): interface detail or 404
    - findLogsByCriteria(InterfaceLogCriteria, Pageable): paginated logs with filters (fecha, tipo operación, interfaz, status)
    - countLogsByCriteria(InterfaceLogCriteria): total matching count
    - findLogById(id): log detail or 404
    - Expose only GET endpoints (reject CUD with 405)
    - Automatic logging of interface operations (append-only, immutable)
    - _Requirements: 22.1, 22.2, 22.3, 22.5, 22.6, 22.7, 32.1, 32.2, 32.3, 32.5, 32.6_

  - [~] 12.2 Implement InterfaceController in webapp module
    - GET /api/v1/interfaces/configuration (list interfaces with status)
    - GET /api/v1/interfaces/configuration/{id} (interface detail)
    - GET /api/v1/interfaces/monitor (paginated + filters)
    - GET /api/v1/interfaces/monitor/count
    - GET /api/v1/interfaces/monitor/{id} (operation detail)
    - _Requirements: 35.8, 35.9_

- [ ] 13. Cluster management (backend)
  - [~] 13.1 Implement ClusterService in core module
    - findAllNodes(): list all cluster nodes
    - findNodeById(id): node detail or 404
    - setMaster(id): set node as master (deactivate previous master, ensure single-master invariant)
    - registerNode(): auto-register on startup (create or update by hostname)
    - heartbeat(): periodic status update (30s)
    - detectDeadNodes(): mark nodes with timeout > 5min as DEAD
    - electMaster(): auto-elect master if no ALIVE master exists
    - findBlocksByCriteria/countBlocksByCriteria: paginated blocks listing
    - findBlockById(id): block detail or 404
    - Reject create/delete nodes (405), reject CUD blocks (405)
    - _Requirements: 23.1, 23.2, 23.3, 23.4, 23.7, 23.8, 23.9, 24.1, 24.2, 24.4, 24.5, 29.4, 29.5, 30.1, 30.2, 30.7, 30.8_


  - [~] 13.2 Implement ClusterController in webapp module
    - GET /api/v1/administration/cluster/nodes
    - GET /api/v1/administration/cluster/nodes/{id}
    - PATCH /api/v1/administration/cluster/nodes/{id} (master field only)
    - POST /api/v1/administration/cluster/nodes → 405
    - DELETE /api/v1/administration/cluster/nodes/{id} → 405
    - GET /api/v1/administration/cluster/blocks (paginated + filters)
    - GET /api/v1/administration/cluster/blocks/count
    - GET /api/v1/administration/cluster/blocks/{id}
    - _Requirements: 35.10, 35.11_

  - [~] 13.3 Implement ClusterLockService in core module
    - acquireLock(resourceName): intra-instance (synchronized) + inter-instance (SQL lock)
    - releaseLock(resourceName): release lock, update ClusterBlock metrics (avg, min, max, total)
    - isLocked(resourceName): check if resource has active lock
    - Use database time (not JVM local time) to avoid clock drift
    - _Requirements: 39.1, 39.2, 39.3, 39.4, 39.5, 39.6, 39.7, 39.8_

  - [~] 13.4 Implement AbstractClusterWorker in cluster module
    - Template method execute(): getTaskName → verify ClusterTask exists → verify ClusterJob enabled → verify ALIVE ≥ minNodes → calculate priority → acquire lock if nodes > 1 → handleExecute() → release lock
    - Abstract methods: handleExecute(), getTaskName()
    - Ignore DEAD nodes when calculating candidates
    - _Requirements: 38.1, 38.2, 38.3, 38.4, 38.5, 38.6, 38.7, 38.8_

  - [~] 13.5 Implement HeartbeatWorker in cluster module
    - Scheduled task (30s configurable interval)
    - Acquire lock on "NODOS" resource before processing
    - Update current node: status ALIVE, memory data, last_modified_at
    - Detect dead nodes: last_modified_at > 5min → mark DEAD
    - Auto-elect master if no ALIVE master exists
    - Abstract extension points: onDeadNodeDetected(node), onFirstInvocation()
    - Log FATAL if own node not found by hostname on startup
    - _Requirements: 30.1, 30.2, 30.3, 30.4, 30.5, 30.6, 30.7, 30.8, 30.9, 30.10_


  - [ ]* 13.6 Write property test for single master node (Property 11)
    - **Property 11: Single master node invariant**
    - For any sequence of setMaster operations, at most one node has master=true at any time
    - **Validates: Requirements 23.4, 29.4**

  - [ ]* 13.7 Write property test for cluster task execution governance (Property 17)
    - **Property 17: Cluster task execution governance**
    - For any cluster config (task, jobs, node states), AbstractClusterWorker decisions follow: no task→abort, no enabled job→abort, ALIVE<minNodes→abort, not in top N priority→abort, else→execute
    - **Validates: Requirements 38.1, 38.2, 38.3, 38.4, 38.5, 38.8**

- [~] 14. Checkpoint - Verify backend services complete
  - Ensure all tests pass, ask the user if questions arise.

- [ ] 15. Backend cross-cutting concerns
  - [~] 15.1 Implement pagination metadata consistency
    - Ensure all paginated endpoints return consistent metadata: totalPages = ceil(totalElements/size), content.length ≤ size
    - Standardize Page response serialization across all controllers
    - _Requirements: 25.1, 25.13_

  - [ ]* 15.2 Write property test for pagination metadata (Property 12)
    - **Property 12: Pagination metadata consistency**
    - For any valid page size and number, totalPages = ceil(totalElements/size), content ≤ size, page < totalPages → non-empty
    - **Validates: Requirements 25.1, 4.2, 14.2, 20.2**

  - [~] 15.3 Implement UTC timezone configuration
    - Configure JVM timezone to UTC
    - Configure PostgreSQL connection with timestamptz
    - Ensure all API responses use ISO 8601 with Z suffix
    - _Requirements: 27.1, 27.2, 27.7, 34.1_

  - [ ]* 15.4 Write property test for API date format compliance (Property 14)
    - **Property 14: API date format compliance**
    - For any API response with timestamp fields, all values conform to ISO 8601 with Z suffix
    - **Validates: Requirements 27.2**


  - [ ]* 15.5 Write property test for system-managed timestamps (Property 16)
    - **Property 16: System-managed timestamps are read-only**
    - For any create/update request with client-provided created_at/last_modified_at, the system ignores them and sets its own values
    - **Validates: Requirements 34.4, 34.5, 34.6**

  - [~] 15.6 Implement multi-environment configuration
    - Configure Maven profiles: local, dist, test
    - Externalize environment-specific settings (DB URL, JWT secret, timeouts)
    - Configure Spring profiles for each environment
    - _Requirements: 10.1, 10.2_

- [ ] 16. Frontend core infrastructure
  - [~] 16.1 Set up Angular 22 project structure with PWA and i18n
    - Initialize template-dashboard Angular project
    - Configure @angular/service-worker for PWA
    - Configure manifest.json (name, icons 192x192+512x512, theme-color, background-color, standalone)
    - Configure service worker with stale-while-revalidate strategy for static assets
    - Implement update notification for new versions
    - Configure i18n with @ngx-translate: en.json and es.json translation files
    - _Requirements: 13.1, 13.2, 13.3, 13.6, 13.7, 13.8, 12.1, 12.2_

  - [~] 16.2 Implement frontend AuthService and token management
    - AuthService: login(), logout(), refreshToken(), getAccessToken(), getCurrentUser(), isAuthenticated(), hasAction()
    - Store tokens in memory (not localStorage for security)
    - Decode JWT payload to extract profile and actions
    - _Requirements: 1.4, 2.1, 2.3_

  - [~] 16.3 Implement HTTP interceptor with JWT and auto-refresh
    - Add Authorization: Bearer header to all requests
    - Detect token expiration proximity (configurable margin) and auto-refresh
    - On refresh failure, redirect to login
    - Error handling pipeline: 401→refresh/login, 403→notification, 4xx→server message, 5xx→generic error, network→offline warning
    - _Requirements: 3.1, 3.2, 3.3_


  - [~] 16.4 Implement AuthGuard and ActionGuard
    - AuthGuard: redirect unauthenticated users to /login
    - ActionGuard: redirect users without required action to Dashboard
    - _Requirements: 1.5, 5.5_

  - [ ]* 16.5 Write property test for auth guard redirect (Property 7)
    - **Property 7: Auth guard redirects unauthenticated users**
    - For any protected route, unauthenticated user is redirected to login
    - **Validates: Requirements 1.5**

  - [ ]* 16.6 Write property test for action guard redirect (Property 8)
    - **Property 8: Action guard redirects unauthorized users**
    - For any route with required action, user without that action is redirected to Dashboard
    - **Validates: Requirements 5.5**

  - [~] 16.7 Implement I18nService with auto-detection
    - Detect browser language via navigator.language
    - Fallback to English if unsupported language
    - Persist preference in localStorage
    - Support language change without page reload
    - Supported languages: en, es
    - _Requirements: 12.3, 12.4, 12.5, 12.6, 12.7, 12.8_

  - [~] 16.8 Implement DateService and DatePipe for timezone conversion
    - Convert UTC → local timezone (Intl.DateTimeFormat().resolvedOptions().timeZone)
    - Convert local → UTC before sending to backend
    - Centralized service/pipe used consistently across all components
    - _Requirements: 27.3, 27.4, 27.5, 27.6_

  - [ ]* 16.9 Write property test for timezone conversion round-trip (Property 13)
    - **Property 13: Timezone conversion round-trip**
    - For any valid UTC timestamp and timezone offset, UTC→local→UTC produces original timestamp (within ms precision)
    - **Validates: Requirements 27.3, 27.4**


- [~] 17. Checkpoint - Verify frontend core infrastructure
  - Ensure all tests pass, ask the user if questions arise.

- [ ] 18. Frontend layout and navigation
  - [~] 18.1 Implement LayoutComponent (header, sidebar, content, footer)
    - Use Bootstrap 5 grid system and utility classes
    - Header: application name + user menu
    - Sidebar: navigation menu with expand/collapse sub-levels
    - Content area: router-outlet
    - Footer: application info
    - _Requirements: 6.1, 6.3, 6.8_

  - [~] 18.2 Implement responsive behavior (RWD + Adaptive Design)
    - Mobile (<576px): hide sidebar, hamburger menu, single column, prioritize content
    - Tablet (576px–991px): collapsible slide panel, two-column forms/tables
    - Desktop (≥992px): permanent expanded sidebar, multi-column layout
    - Bootstrap breakpoints: xs, sm, md, lg, xl, xxl
    - _Requirements: 6.2, 6.4, 6.5, 6.6, 6.7_

  - [~] 18.3 Implement navigation with lazy loading and action-based visibility
    - Client-side routing without full page reloads
    - Lazy load modules on navigation
    - Show/hide menu items based on user actions using the action↔menu mapping: DASHBOARD_READ→Dashboard, REPORT_EXECUTE→Informes, INTERFACES_READ→Interfaces, USER_READ/USER_WRITE→Usuarios, PROFILE_READ/PROFILE_WRITE→Perfiles, ACTION_READ→Acciones, SYSTEM_PARAMETER_READ/SYSTEM_PARAMETER_WRITE→Parámetros, SYSTEM_LOG_READ→Auditoría, CLUSTER_NODE_READ/CLUSTER_NODE_WRITE→Nodos, CLUSTER_LOCK_READ→Bloqueos
    - Show a menu item if user has at least one of its associated actions
    - Implement parent section inheritance: Seguridad visible if any child action present, Cluster visible if any child action present, Administración visible if any subsection accessible
    - Interfaces section governed by single action (INTERFACES_READ); Informes section governed by single action (REPORT_EXECUTE)
    - Menu structure: Dashboard, Informes, Interfaces > (Monitor, Configuración), Administración > (Seguridad > Usuarios/Perfiles/Acciones, Parámetros, Auditoría, Cluster > Nodos/Bloqueos)
    - Expandable/collapsible sub-levels (Interfaces, Administración, Seguridad, Cluster)
    - 404 page with link to Dashboard
    - _Requirements: 7.1, 7.2, 7.3, 7.4, 7.5, 7.6, 7.7, 7.8, 7.9, 7.10, 7.11, 7.12_

  - [ ]* 18.4 Write property test for navigation visibility (Property 6)
    - **Property 6: Navigation visibility matches user actions**
    - For any set of actions, visible nav items = menu items whose required action is in user's set; parent sections inherit visibility from children
    - **Validates: Requirements 5.6, 7.2, 7.8, 7.9, 7.10, 7.11, 7.12**


- [ ] 19. Frontend notification system
  - [~] 19.1 Implement NotificationService and notification component
    - Three types: progress (in-progress with spinner), success (auto-dismiss 5s), error (auto-dismiss 8s with message)
    - Progress → Success transition on operation completion
    - Progress → Error transition on operation failure
    - Manual dismiss for all notification types
    - Show progress for: create, update, delete, export, pagination, filter
    - _Requirements: 11.1, 11.2, 11.3, 11.4, 11.5, 11.6, 25.5_

- [ ] 20. Frontend environment configuration
  - [~] 20.1 Configure Angular environment files
    - environment.ts (development) and environment.prod.ts (production)
    - API URL, token refresh margin, notification timeouts
    - _Requirements: 10.3_

- [ ] 21. Frontend CRUD views - Security module
  - [~] 21.1 Implement Users list and form views
    - List view: paginated table, filters (username, nombre, apellidos, email, perfil), CSV export
    - Create/Edit form: username, password, nombre, apellidos, email, perfil selector, report assignments (multi-select)
    - Detail view: all user fields read-only
    - Action-based button visibility: Create, Edit, Delete (with confirmation)
    - _Requirements: 25.1, 25.2, 25.3, 25.4, 25.6, 25.7, 25.8, 25.9, 25.10_

  - [~] 21.2 Implement Profiles list and form views
    - List view: paginated table, filters (nombre), CSV export
    - Create/Edit form: nombre, descripción, action assignments (multi-select)
    - Detail view: profile fields + assigned actions list
    - Action-based button visibility: Create, Edit, Delete (with confirmation)
    - _Requirements: 25.1, 25.2, 25.3, 25.4, 25.6, 25.7, 25.8, 25.9, 25.10_


  - [~] 21.3 Implement Actions list and form views
    - List view: paginated table, filters (código, nombre, tipo), CSV export
    - Edit form: nombre, descripción, tipo (no create/delete buttons)
    - Detail view: all action fields read-only
    - Only Edit option (no Create/Delete per Req 25.11)
    - _Requirements: 25.1, 25.2, 25.3, 25.4, 25.7, 25.9, 25.11_

  - [~] 21.4 Implement User Profile page (self-service)
    - Display: username (read-only), nombre, apellidos, email, lastAccess (read-only)
    - Editable fields: nombre, apellidos, email
    - Save calls PUT /api/v1/administration/security/users/me
    - _Requirements: 9.1, 9.2, 9.3_

- [ ] 22. Frontend CRUD views - Parameters module
  - [~] 22.1 Implement Parameters list and form views
    - List view: paginated table, filters (código, descripción, tipo), CSV export
    - Create/Edit form: código, descripción, valor, tipo (with type-value validation feedback)
    - Detail view: all parameter fields read-only
    - Action-based button visibility: Create, Edit, Delete (with confirmation)
    - _Requirements: 25.1, 25.2, 25.3, 25.4, 25.6, 25.7, 25.8, 25.9, 25.10_

- [ ] 23. Frontend CRUD views - Audit module
  - [~] 23.1 Implement Audit log list view (read-only)
    - List view: paginated table, filters (fecha desde/hasta, username, operation_type, section), CSV export
    - Detail view only (no Create, Edit, Delete per Req 25.12)
    - _Requirements: 21.3, 21.4, 25.1, 25.2, 25.3, 25.4, 25.9, 25.12_


- [ ] 24. Frontend CRUD views - Interfaces module (top-level)
  - [~] 24.1 Implement Interfaces Monitor view (read-only)
    - List view: paginated table, filters (fecha, tipo operación, interfaz, status), CSV export
    - Detail view: timestamp, operation_type, interface_name, request_payload, response_payload, status
    - No Create/Edit/Delete per Req 25.12
    - _Requirements: 32.2, 32.3, 32.4, 25.1, 25.2, 25.3, 25.4, 25.9, 25.12_

  - [~] 24.2 Implement Interfaces Configuration panel (read-only)
    - List view: all interfaces with status indicators (green=active, red=error, grey=inactive)
    - Detail view: name, description, URL, protocol, check frequency
    - No Create/Edit/Delete per Req 25.12
    - _Requirements: 22.1, 22.2, 22.4, 25.9, 25.12_

- [ ] 25. Frontend CRUD views - Cluster module
  - [~] 25.1 Implement Cluster Nodes list and edit views
    - List view: nodes with status indicators (green=ALIVE, red=DEAD), master indicator
    - All fields read-only except master (editable)
    - Edit form: master toggle only
    - No Create/Delete per Req 25.11
    - _Requirements: 23.1, 23.5, 23.6, 25.1, 25.7, 25.9, 25.11_

  - [~] 25.2 Implement Cluster Blocks list view (read-only)
    - List view: paginated table, filters (nombre de tarea), CSV export
    - Detail view: name, start_date, avg_time, min_time, max_time, total
    - No Create/Edit/Delete per Req 25.12
    - _Requirements: 24.1, 24.2, 24.3, 25.1, 25.2, 25.3, 25.4, 25.9, 25.12_

- [ ] 26. Frontend CRUD views - Reports module
  - [~] 26.1 Implement Reports list, execution and export views
    - List view: user's assigned reports with "Execute" button per row
    - Execution view: filter form (dynamic based on report definition) + results table (paginated)
    - Export buttons: PDF, XLSX, CSV, TXT (apply same filters as current execution)
    - Download file on successful export
    - _Requirements: 18.1, 18.3, 18.4, 18.5, 18.6, 18.7, 19.1, 19.7_

- [~] 27. Checkpoint - Verify frontend views complete
  - Ensure all tests pass, ask the user if questions arise.


- [ ] 28. Frontend i18n translation files
  - [~] 28.1 Create complete translation files for en and es
    - en.json: all UI labels, messages, notifications, menu items, errors in English
    - es.json: all UI labels, messages, notifications, menu items, errors in Spanish
    - Ensure every key used in templates exists in both files with non-empty value
    - _Requirements: 12.1, 12.2_

  - [ ]* 28.2 Write property test for translation key completeness (Property 15)
    - **Property 15: Translation key completeness**
    - For any translation key in any Angular template/component, that key exists in all locale files (en.json, es.json) with non-empty value
    - **Validates: Requirements 12.1**

- [ ] 29. Frontend PWA offline behavior
  - [~] 29.1 Implement offline detection and messaging
    - Show cached static resources when offline
    - Display connectivity warning message when no internet
    - Auto-recover full functionality when connection restored
    - _Requirements: 13.4, 13.5_

- [ ] 30. Integration and wiring
  - [~] 30.1 Wire frontend modules with backend API endpoints
    - Ensure all Angular services call correct backend URLs per Req 35 conventions
    - Verify lazy loading of all feature modules
    - Verify interceptor attaches JWT to all requests
    - Verify notification service integrated in all CRUD operations
    - Verify DateService applied consistently across all date displays
    - _Requirements: 35.1, 35.13, 7.3, 27.5_

  - [ ]* 30.2 Write integration tests for full authentication flow
    - Test login → token issuance → protected access → refresh → logout with Testcontainers PostgreSQL
    - Test Liquibase migrations apply successfully
    - _Requirements: 1.1, 1.2, 1.3, 2.2, 3.1, 3.2_


  - [ ]* 30.3 Write integration tests for audit AOP and cluster
    - Test AuditAspect captures operations end-to-end without contaminating business code
    - Test cluster node auto-registration, heartbeat, dead node detection, master election
    - Test ClusterLockService acquire/release with ClusterBlock metric update
    - Test AbstractClusterWorker full governance flow
    - _Requirements: 21.1, 30.1, 30.7, 30.8, 39.2, 38.1_

- [~] 31. Final checkpoint - Ensure all tests pass
  - Ensure all tests pass, ask the user if questions arise.

## Notes

- Tasks marked with `*` are optional and can be skipped for faster MVP
- Each task references specific requirements for traceability
- Checkpoints ensure incremental validation
- Property tests validate universal correctness properties (jqwik for backend, fast-check for frontend)
- Unit tests validate specific examples and edge cases
- Backend uses Java 21 + Spring Boot 4.1.0, frontend uses Angular 22 + TypeScript
- Liquibase migrations use XML format exclusively
- Domain module (entities, DTOs, enums) has no Spring dependencies (except JPA)
- All timestamps stored as TIMESTAMP WITH TIME ZONE in UTC

## Task Dependency Graph

```json
{
  "waves": [
    { "id": 0, "tasks": ["0.1", "0.2"] },
    { "id": 1, "tasks": ["1.1", "1.3"] },
    { "id": 2, "tasks": ["1.2", "1.4"] },
    { "id": 3, "tasks": ["3.1", "4.1", "16.1", "20.1"] },
    { "id": 4, "tasks": ["3.2", "3.3", "15.3", "15.6", "16.2", "16.7", "16.8"] },
    { "id": 5, "tasks": ["3.4", "5.1", "6.1", "7.1", "8.1", "16.3", "16.4"] },
    { "id": 6, "tasks": ["5.2", "6.2", "7.2", "8.2", "10.1", "11.1", "12.1", "13.1", "16.5", "16.6", "16.9"] },
    { "id": 7, "tasks": ["3.5", "3.6", "5.3", "5.4", "5.5", "6.3", "6.4", "6.5", "8.3", "8.4", "8.5", "10.2", "11.2", "12.2", "13.2", "13.3", "15.1"] },
    { "id": 8, "tasks": ["10.3", "10.4", "13.4", "13.5", "13.6", "13.7", "15.2", "15.4", "15.5"] },
    { "id": 9, "tasks": ["18.1", "19.1"] },
    { "id": 10, "tasks": ["18.2", "18.3", "18.4"] },
    { "id": 11, "tasks": ["21.1", "21.2", "21.3", "21.4", "22.1", "23.1", "24.1", "24.2", "25.1", "25.2", "26.1", "28.1", "29.1"] },
    { "id": 12, "tasks": ["28.2", "30.1"] },
    { "id": 13, "tasks": ["30.2", "30.3"] }
  ]
}
```
