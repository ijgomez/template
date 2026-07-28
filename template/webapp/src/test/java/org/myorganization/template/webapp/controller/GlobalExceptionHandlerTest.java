package org.myorganization.template.webapp.controller;

import java.time.Instant;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.myorganization.template.domain.dto.ErrorResponse;
import org.myorganization.template.domain.exception.AccessDeniedException;
import org.myorganization.template.domain.exception.AuthenticationException;
import org.myorganization.template.domain.exception.DuplicateEntityException;
import org.myorganization.template.domain.exception.EntityInUseException;
import org.myorganization.template.domain.exception.EntityNotFoundException;
import org.myorganization.template.domain.exception.MethodNotAllowedException;
import org.myorganization.template.domain.exception.ReportExportException;
import org.myorganization.template.domain.exception.ValidationException;
import org.springframework.http.ResponseEntity;
import org.springframework.security.authentication.BadCredentialsException;

import jakarta.servlet.http.HttpServletRequest;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.when;

/**
 * Unit tests for {@link GlobalExceptionHandler}.
 */
class GlobalExceptionHandlerTest {

    private GlobalExceptionHandler handler;
    private HttpServletRequest request;

    @BeforeEach
    void setUp() {
        handler = new GlobalExceptionHandler();
        request = mock(HttpServletRequest.class);
        when(request.getRequestURI()).thenReturn("/api/v1/administration/security/users/1");
    }

    @Test
    @DisplayName("EntityNotFoundException returns 404 Not Found")
    void handleEntityNotFound_shouldReturn404() {
        EntityNotFoundException ex = new EntityNotFoundException("User", 1L);

        ResponseEntity<ErrorResponse> response = handler.handleEntityNotFound(ex, request);

        assertThat(response.getStatusCode().value()).isEqualTo(404);
        assertThat(response.getBody()).isNotNull();
        assertThat(response.getBody().status()).isEqualTo(404);
        assertThat(response.getBody().error()).isEqualTo("Not Found");
        assertThat(response.getBody().message()).isEqualTo("User not found with id: 1");
        assertThat(response.getBody().path()).isEqualTo("/api/v1/administration/security/users/1");
        assertThat(response.getBody().timestamp()).isBeforeOrEqualTo(Instant.now());
    }

    @Test
    @DisplayName("DuplicateEntityException returns 409 Conflict")
    void handleDuplicateEntity_shouldReturn409() {
        DuplicateEntityException ex = new DuplicateEntityException("User", "username", "admin");

        ResponseEntity<ErrorResponse> response = handler.handleDuplicateEntity(ex, request);

        assertThat(response.getStatusCode().value()).isEqualTo(409);
        assertThat(response.getBody()).isNotNull();
        assertThat(response.getBody().status()).isEqualTo(409);
        assertThat(response.getBody().error()).isEqualTo("Conflict");
        assertThat(response.getBody().message()).isEqualTo("User already exists with username: admin");
    }

    @Test
    @DisplayName("EntityInUseException returns 409 Conflict")
    void handleEntityInUse_shouldReturn409() {
        EntityInUseException ex = new EntityInUseException("Profile", 5L);

        ResponseEntity<ErrorResponse> response = handler.handleEntityInUse(ex, request);

        assertThat(response.getStatusCode().value()).isEqualTo(409);
        assertThat(response.getBody()).isNotNull();
        assertThat(response.getBody().status()).isEqualTo(409);
        assertThat(response.getBody().error()).isEqualTo("Conflict");
        assertThat(response.getBody().message()).contains("is in use and cannot be deleted");
    }

    @Test
    @DisplayName("ValidationException returns 400 Bad Request")
    void handleValidation_shouldReturn400() {
        ValidationException ex = new ValidationException("Report list contains duplicates");

        ResponseEntity<ErrorResponse> response = handler.handleValidation(ex, request);

        assertThat(response.getStatusCode().value()).isEqualTo(400);
        assertThat(response.getBody()).isNotNull();
        assertThat(response.getBody().status()).isEqualTo(400);
        assertThat(response.getBody().error()).isEqualTo("Bad Request");
        assertThat(response.getBody().message()).isEqualTo("Report list contains duplicates");
    }

    @Test
    @DisplayName("AuthenticationException returns 401 Unauthorized")
    void handleAuthentication_shouldReturn401() {
        AuthenticationException ex = new AuthenticationException("Invalid credentials");

        ResponseEntity<ErrorResponse> response = handler.handleAuthentication(ex, request);

        assertThat(response.getStatusCode().value()).isEqualTo(401);
        assertThat(response.getBody()).isNotNull();
        assertThat(response.getBody().status()).isEqualTo(401);
        assertThat(response.getBody().error()).isEqualTo("Unauthorized");
        assertThat(response.getBody().message()).isEqualTo("Invalid credentials");
    }

    @Test
    @DisplayName("BadCredentialsException returns 401 Unauthorized")
    void handleBadCredentials_shouldReturn401() {
        BadCredentialsException ex = new BadCredentialsException("Invalid username or password");

        ResponseEntity<ErrorResponse> response = handler.handleBadCredentials(ex, request);

        assertThat(response.getStatusCode().value()).isEqualTo(401);
        assertThat(response.getBody()).isNotNull();
        assertThat(response.getBody().status()).isEqualTo(401);
        assertThat(response.getBody().error()).isEqualTo("Unauthorized");
        assertThat(response.getBody().message()).isEqualTo("Invalid username or password");
    }

    @Test
    @DisplayName("AccessDeniedException returns 403 Forbidden")
    void handleAccessDenied_shouldReturn403() {
        AccessDeniedException ex = new AccessDeniedException("Insufficient permissions");

        ResponseEntity<ErrorResponse> response = handler.handleAccessDenied(ex, request);

        assertThat(response.getStatusCode().value()).isEqualTo(403);
        assertThat(response.getBody()).isNotNull();
        assertThat(response.getBody().status()).isEqualTo(403);
        assertThat(response.getBody().error()).isEqualTo("Forbidden");
        assertThat(response.getBody().message()).isEqualTo("Insufficient permissions");
    }

    @Test
    @DisplayName("MethodNotAllowedException returns 405 Method Not Allowed")
    void handleMethodNotAllowed_shouldReturn405() {
        MethodNotAllowedException ex = new MethodNotAllowedException("Action creation is not allowed");

        ResponseEntity<ErrorResponse> response = handler.handleMethodNotAllowed(ex, request);

        assertThat(response.getStatusCode().value()).isEqualTo(405);
        assertThat(response.getBody()).isNotNull();
        assertThat(response.getBody().status()).isEqualTo(405);
        assertThat(response.getBody().error()).isEqualTo("Method Not Allowed");
        assertThat(response.getBody().message()).isEqualTo("Action creation is not allowed");
    }

    @Test
    @DisplayName("ReportExportException returns 500 Internal Server Error")
    void handleReportExport_shouldReturn500() {
        ReportExportException ex = new ReportExportException("Failed to generate PDF export");

        ResponseEntity<ErrorResponse> response = handler.handleReportExport(ex, request);

        assertThat(response.getStatusCode().value()).isEqualTo(500);
        assertThat(response.getBody()).isNotNull();
        assertThat(response.getBody().status()).isEqualTo(500);
        assertThat(response.getBody().error()).isEqualTo("Internal Server Error");
        assertThat(response.getBody().message()).isEqualTo("Failed to generate PDF export");
    }

}
