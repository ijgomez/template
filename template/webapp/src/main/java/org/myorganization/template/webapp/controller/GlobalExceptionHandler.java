package org.myorganization.template.webapp.controller;

import java.time.Instant;

import org.myorganization.template.domain.dto.ErrorResponse;
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
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.authentication.BadCredentialsException;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.RestControllerAdvice;

import jakarta.servlet.http.HttpServletRequest;

/**
 * Global exception handler for the REST API.
 * <p>
 * Maps domain exceptions to consistent HTTP error responses with a standard
 * JSON format: timestamp, status, error, message, path.
 */
@RestControllerAdvice
public class GlobalExceptionHandler {

    private static final Logger log = LoggerFactory.getLogger(GlobalExceptionHandler.class);

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

    private ResponseEntity<ErrorResponse> buildResponse(HttpStatus status, String message, HttpServletRequest request) {
        ErrorResponse errorResponse = new ErrorResponse(
                Instant.now(),
                status.value(),
                status.getReasonPhrase(),
                message,
                request.getRequestURI()
        );
        return ResponseEntity.status(status).body(errorResponse);
    }

}
