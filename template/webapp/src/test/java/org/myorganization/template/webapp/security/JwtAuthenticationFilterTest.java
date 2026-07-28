package org.myorganization.template.webapp.security;

import java.util.List;

import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.mock.web.MockFilterChain;
import org.springframework.mock.web.MockHttpServletRequest;
import org.springframework.mock.web.MockHttpServletResponse;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

/**
 * Unit tests for {@link JwtAuthenticationFilter}.
 */
@ExtendWith(MockitoExtension.class)
class JwtAuthenticationFilterTest {

    @Mock
    private JwtTokenProvider jwtTokenProvider;

    @InjectMocks
    private JwtAuthenticationFilter filter;

    private MockHttpServletRequest request;
    private MockHttpServletResponse response;
    private MockFilterChain filterChain;

    @BeforeEach
    void setUp() {
        request = new MockHttpServletRequest();
        response = new MockHttpServletResponse();
        filterChain = new MockFilterChain();
        SecurityContextHolder.clearContext();
    }

    @AfterEach
    void tearDown() {
        SecurityContextHolder.clearContext();
    }

    @Test
    void doFilterInternal_validToken_setsAuthentication() throws Exception {
        String token = "valid.jwt.token";
        request.addHeader("Authorization", "Bearer " + token);

        when(jwtTokenProvider.validateToken(token)).thenReturn(true);
        when(jwtTokenProvider.isRefreshToken(token)).thenReturn(false);
        when(jwtTokenProvider.extractUsername(token)).thenReturn("admin");
        when(jwtTokenProvider.extractActions(token)).thenReturn(List.of("USER_READ", "PROFILE_WRITE"));

        filter.doFilterInternal(request, response, filterChain);

        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        assertThat(authentication).isNotNull();
        assertThat(authentication.getPrincipal()).isEqualTo("admin");
        assertThat(authentication.getAuthorities()).hasSize(2);
        assertThat(authentication.getAuthorities())
                .extracting("authority")
                .containsExactlyInAnyOrder("USER_READ", "PROFILE_WRITE");
    }

    @Test
    void doFilterInternal_noAuthorizationHeader_continuesWithoutAuthentication() throws Exception {
        filter.doFilterInternal(request, response, filterChain);

        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        assertThat(authentication).isNull();
    }

    @Test
    void doFilterInternal_invalidToken_continuesWithoutAuthentication() throws Exception {
        String token = "invalid.jwt.token";
        request.addHeader("Authorization", "Bearer " + token);

        when(jwtTokenProvider.validateToken(token)).thenReturn(false);

        filter.doFilterInternal(request, response, filterChain);

        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        assertThat(authentication).isNull();
        verify(jwtTokenProvider, never()).extractUsername(token);
    }

    @Test
    void doFilterInternal_refreshToken_continuesWithoutAuthentication() throws Exception {
        String token = "refresh.jwt.token";
        request.addHeader("Authorization", "Bearer " + token);

        when(jwtTokenProvider.validateToken(token)).thenReturn(true);
        when(jwtTokenProvider.isRefreshToken(token)).thenReturn(true);

        filter.doFilterInternal(request, response, filterChain);

        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        assertThat(authentication).isNull();
        verify(jwtTokenProvider, never()).extractUsername(token);
    }

    @Test
    void doFilterInternal_malformedAuthorizationHeader_continuesWithoutAuthentication() throws Exception {
        request.addHeader("Authorization", "Basic dXNlcjpwYXNz");

        filter.doFilterInternal(request, response, filterChain);

        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        assertThat(authentication).isNull();
    }

    @Test
    void doFilterInternal_emptyBearerToken_continuesWithoutAuthentication() throws Exception {
        request.addHeader("Authorization", "Bearer ");

        // Empty string token validation returns false
        when(jwtTokenProvider.validateToken("")).thenReturn(false);

        filter.doFilterInternal(request, response, filterChain);

        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        assertThat(authentication).isNull();
    }

    @Test
    void doFilterInternal_alwaysContinuesFilterChain() throws Exception {
        String token = "valid.jwt.token";
        request.addHeader("Authorization", "Bearer " + token);

        when(jwtTokenProvider.validateToken(token)).thenReturn(true);
        when(jwtTokenProvider.isRefreshToken(token)).thenReturn(false);
        when(jwtTokenProvider.extractUsername(token)).thenReturn("user1");
        when(jwtTokenProvider.extractActions(token)).thenReturn(List.of("DASHBOARD_READ"));

        filter.doFilterInternal(request, response, filterChain);

        // Filter chain should always be invoked
        assertThat(filterChain.getRequest()).isNotNull();
        assertThat(filterChain.getResponse()).isNotNull();
    }

    @Test
    void doFilterInternal_emptyActionsList_setsAuthenticationWithNoAuthorities() throws Exception {
        String token = "valid.jwt.token";
        request.addHeader("Authorization", "Bearer " + token);

        when(jwtTokenProvider.validateToken(token)).thenReturn(true);
        when(jwtTokenProvider.isRefreshToken(token)).thenReturn(false);
        when(jwtTokenProvider.extractUsername(token)).thenReturn("user1");
        when(jwtTokenProvider.extractActions(token)).thenReturn(List.of());

        filter.doFilterInternal(request, response, filterChain);

        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        assertThat(authentication).isNotNull();
        assertThat(authentication.getPrincipal()).isEqualTo("user1");
        assertThat(authentication.getAuthorities()).isEmpty();
    }

}
