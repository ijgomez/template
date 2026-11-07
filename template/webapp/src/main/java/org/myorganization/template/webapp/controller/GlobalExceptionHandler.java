package org.myorganization.template.webapp.controller;

import java.time.Instant;
import java.util.stream.Collectors;

import org.myorganization.template.domain.dto.ErrorResponse;
import org.myorganization.template.domain.exception.AccountLockedException;
import org.myorganization.template.domain.exception.AccessDeniedException;
import org.myorganization.template.domain.exception.AuthenticationException;
import org.myorganization.template.domain.exception.DuplicateEntityException;
import org.myorganization.template.domain.exception.EntityInUseException;
import org.myorganization.template.domain.exception.EntityNotFoundException;
import org.myorganization.template.domain.exception.MethodNotAllowedException;
import org.myorganization.template.domain.exception.ReportExportException;
import org.myorganization.template.domain.exception.ValidationException;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpStatus;
import org.springframework.http.HttpStatusCode;
import org.springframework.http.ProblemDetail;
import org.springframework.http.ResponseEntity;
import org.springframework.security.authentication.BadCredentialsException;
import org.springframework.web.bind.MethodArgumentNotValidException;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.RestControllerAdvice;
import org.springframework.web.context.request.ServletWebRequest;
import org.springframework.web.context.request.WebRequest;
import org.springframework.web.servlet.mvc.method.annotation.ResponseEntityExceptionHandler;

import jakarta.servlet.http.HttpServletRequest;

/**
 * Global exception handler for the REST API.
 * <p>
 * Maps domain exceptions to consistent HTTP error responses with a standard
 * JSON format: timestamp, status, error, message, path.
 * <p>
 * Extends {@link ResponseEntityExceptionHandler} so that standard Spring MVC
 * exceptions (bad request bodies, unsupported methods/media types, missing
 * resources, etc.) keep their correct status codes while being rendered in the
 * same JSON format. A catch-all handler guarantees that any remaining unexpected
 * exception returns a generic 500 without leaking internal details (SEC-10).
 */
@RestControllerAdvice
public class GlobalExceptionHandler extends ResponseEntityExceptionHandler {

    private static final Logger log = LoggerFactory.getLogger(GlobalExceptionHandler.class);

    private static final String GENERIC_ERROR_MESSAGE = "An unexpected internal error occurred";

    /**
     * Handles entity not found exceptions.
     *
     * @param ex      the exception
     * @param request the HTTP request
     * @return 404 Not Found
     */
    @ExceptionHandler(EntityNotFoundException.class)
    public ResponseEntity<ErrorResponse> handleEntityNotFound(EntityNotFoundException ex, HttpServletRequest request) {
        return buildResponse(HttpStatus.NOT_FOUND, ex.getMessage(), request);
    }

    /**
     * Handles duplicate entity exceptions (uniqueness constraint violations).
     *
     * @param ex      the exception
     * @param request the HTTP request
     * @return 409 Conflict
     */
    @ExceptionHandler(DuplicateEntityException.class)
    public ResponseEntity<ErrorResponse> handleDuplicateEntity(DuplicateEntityException ex, HttpServletRequest request) {
        return buildResponse(HttpStatus.CONFLICT, ex.getMessage(), request);
    }

    /**
     * Handles entity in use exceptions (delete blocked by referential integrity).
     *
     * @param ex      the exception
     * @param request the HTTP request
     * @return 409 Conflict
     */
    @ExceptionHandler(EntityInUseException.class)
    public ResponseEntity<ErrorResponse> handleEntityInUse(EntityInUseException ex, HttpServletRequest request) {
        return buildResponse(HttpStatus.CONFLICT, ex.getMessage(), request);
    }

    /**
     * Handles validation exceptions (invalid input).
     *
     * @param ex      the exception
     * @param request the HTTP request
     * @return 400 Bad Request
     */
    @ExceptionHandler(ValidationException.class)
    public ResponseEntity<ErrorResponse> handleValidation(ValidationException ex, HttpServletRequest request) {
        return buildResponse(HttpStatus.BAD_REQUEST, ex.getMessage(), request);
    }

    /**
     * Handles bean validation failures on request bodies ({@code @Valid}).
     * <p>
     * Aggregates the field errors into a single message so invalid payloads
     * consistently return 400 Bad Request instead of surfacing as 500 errors.
     *
     * @param ex      the exception
     * @param headers the response headers
     * @param status  the response status
     * @param request the web request
     * @return 400 Bad Request
     */
    @Override
    protected ResponseEntity<Object> handleMethodArgumentNotValid(MethodArgumentNotValidException ex,
                                                                  HttpHeaders headers, HttpStatusCode status,
                                                                  WebRequest request) {
        String message = ex.getBindingResult().getFieldErrors().stream()
                .map(fieldError -> fieldError.getField() + ": " + fieldError.getDefaultMessage())
                .collect(Collectors.joining("; "));
        if (message.isBlank()) {
            message = "Invalid request payload";
        }
        return new ResponseEntity<>(buildErrorResponse(HttpStatus.BAD_REQUEST, message, path(request)),
                headers, HttpStatus.BAD_REQUEST);
    }

    /**
     * Handles domain authentication exceptions.
     *
     * @param ex      the exception
     * @param request the HTTP request
     * @return 401 Unauthorized
     */
    @ExceptionHandler(AuthenticationException.class)
    public ResponseEntity<ErrorResponse> handleAuthentication(AuthenticationException ex, HttpServletRequest request) {
        return buildResponse(HttpStatus.UNAUTHORIZED, ex.getMessage(), request);
    }

    /**
     * Handles Spring Security BadCredentialsException.
     *
     * @param ex      the exception
     * @param request the HTTP request
     * @return 401 Unauthorized
     */
    @ExceptionHandler(BadCredentialsException.class)
    public ResponseEntity<ErrorResponse> handleBadCredentials(BadCredentialsException ex, HttpServletRequest request) {
        return buildResponse(HttpStatus.UNAUTHORIZED, ex.getMessage(), request);
    }

    /**
     * Handles domain access denied exceptions (insufficient permissions).
     *
     * @param ex      the exception
     * @param request the HTTP request
     * @return 403 Forbidden
     */
    @ExceptionHandler(AccessDeniedException.class)
    public ResponseEntity<ErrorResponse> handleAccessDenied(AccessDeniedException ex, HttpServletRequest request) {
        return buildResponse(HttpStatus.FORBIDDEN, ex.getMessage(), request);
    }

    /**
     * Handles Spring Security access denied exceptions raised by method-level security
     * (e.g. {@code GrantAuthorityChecker} enforcing segregation of duties).
     * <p>
     * Mapping them explicitly to 403 prevents the generic catch-all handler from
     * turning an authorization failure into a 500.
     *
     * @param ex      the exception
     * @param request the HTTP request
     * @return 403 Forbidden
     */
    @ExceptionHandler(org.springframework.security.access.AccessDeniedException.class)
    public ResponseEntity<ErrorResponse> handleSecurityAccessDenied(
            org.springframework.security.access.AccessDeniedException ex, HttpServletRequest request) {
        return buildResponse(HttpStatus.FORBIDDEN, ex.getMessage(), request);
    }

    /**
     * Handles temporarily locked accounts (too many failed login attempts).
     *
     * @param ex      the exception
     * @param request the HTTP request
     * @return 429 Too Many Requests with a {@code Retry-After} header
     */
    @ExceptionHandler(AccountLockedException.class)
    public ResponseEntity<ErrorResponse> handleAccountLocked(AccountLockedException ex, HttpServletRequest request) {
        return ResponseEntity.status(HttpStatus.TOO_MANY_REQUESTS)
                .header(HttpHeaders.RETRY_AFTER, Long.toString(ex.getRetryAfterSeconds()))
                .body(buildErrorResponse(HttpStatus.TOO_MANY_REQUESTS, ex.getMessage(), request.getRequestURI()));
    }

    /**
     * Handles method not allowed exceptions (disallowed operations).
     *
     * @param ex      the exception
     * @param request the HTTP request
     * @return 405 Method Not Allowed
     */
    @ExceptionHandler(MethodNotAllowedException.class)
    public ResponseEntity<ErrorResponse> handleMethodNotAllowed(MethodNotAllowedException ex, HttpServletRequest request) {
        return buildResponse(HttpStatus.METHOD_NOT_ALLOWED, ex.getMessage(), request);
    }

    /**
     * Handles report export exceptions (generation failure).
     *
     * @param ex      the exception
     * @param request the HTTP request
     * @return 500 Internal Server Error
     */
    @ExceptionHandler(ReportExportException.class)
    public ResponseEntity<ErrorResponse> handleReportExport(ReportExportException ex, HttpServletRequest request) {
        log.error("Report export failed for path {}: {}", request.getRequestURI(), ex.getMessage(), ex);
        return buildResponse(HttpStatus.INTERNAL_SERVER_ERROR, ex.getMessage(), request);
    }

    /**
     * Catch-all for unexpected exceptions.
     * <p>
     * Logs the full stack trace server-side and returns a generic 500 payload so no
     * internal detail (message, class name or trace) is exposed to the client (SEC-10).
     *
     * @param ex      the exception
     * @param request the HTTP request
     * @return 500 Internal Server Error with a generic message
     */
    @ExceptionHandler(Exception.class)
    public ResponseEntity<ErrorResponse> handleUnexpected(Exception ex, HttpServletRequest request) {
        log.error("Unhandled exception for path {}: {}", request.getRequestURI(), ex.getMessage(), ex);
        return buildResponse(HttpStatus.INTERNAL_SERVER_ERROR, GENERIC_ERROR_MESSAGE, request);
    }

    /**
     * Renders framework exceptions (those handled by {@link ResponseEntityExceptionHandler})
     * using the same JSON error format while preserving their original HTTP status.
     *
     * @param ex         the exception
     * @param body       the body built by the framework (a {@link ProblemDetail} when available)
     * @param headers    the response headers
     * @param statusCode the response status
     * @param request    the web request
     * @return a response with the standardized error body
     */
    @Override
    protected ResponseEntity<Object> handleExceptionInternal(Exception ex, Object body, HttpHeaders headers,
                                                            HttpStatusCode statusCode, WebRequest request) {
        HttpStatus status = HttpStatus.resolve(statusCode.value());
        if (status == null) {
            status = HttpStatus.INTERNAL_SERVER_ERROR;
        }
        String message = body instanceof ProblemDetail problemDetail && problemDetail.getDetail() != null
                ? problemDetail.getDetail()
                : ex.getMessage();
        if (message == null || message.isBlank()) {
            message = status.getReasonPhrase();
        }
        return new ResponseEntity<>(buildErrorResponse(status, message, path(request)), headers, statusCode);
    }

    private ResponseEntity<ErrorResponse> buildResponse(HttpStatus status, String message, HttpServletRequest request) {
        return ResponseEntity.status(status).body(buildErrorResponse(status, message, request.getRequestURI()));
    }

    private ErrorResponse buildErrorResponse(HttpStatus status, String message, String path) {
        return new ErrorResponse(
                Instant.now(),
                status.value(),
                status.getReasonPhrase(),
                message,
                path
        );
    }

    private String path(WebRequest request) {
        if (request instanceof ServletWebRequest servletWebRequest) {
            return servletWebRequest.getRequest().getRequestURI();
        }
        return "";
    }

}
