package org.myorganization.template.core.service;

import java.time.OffsetDateTime;
import java.time.ZoneOffset;
import java.util.Optional;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.myorganization.template.core.repository.UserRepository;
import org.myorganization.template.domain.entity.User;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class LoginAttemptServiceTest {

    private static final int MAX_ATTEMPTS = 3;
    private static final long LOCKOUT_MINUTES = 15L;

    @Mock
    private UserRepository userRepository;

    private LoginAttemptService loginAttemptService;

    @BeforeEach
    void setUp() {
        loginAttemptService = new LoginAttemptService(userRepository, MAX_ATTEMPTS, LOCKOUT_MINUTES);
    }

    private User user(int attempts, OffsetDateTime lockedUntil) {
        User user = new User();
        user.setUsername("admin");
        user.setFailedLoginAttempts(attempts);
        user.setLockedUntil(lockedUntil);
        return user;
    }

    @Test
    @DisplayName("registerFailure: increments the counter without locking below the threshold")
    void registerFailure_belowThreshold_incrementsCounterWithoutLocking() {
        User user = user(1, null);
        when(userRepository.findByUsername("admin")).thenReturn(Optional.of(user));

        loginAttemptService.registerFailure("admin");

        assertThat(user.getFailedLoginAttempts()).isEqualTo(2);
        assertThat(user.getLockedUntil()).isNull();
        verify(userRepository).save(user);
    }

    @Test
    @DisplayName("registerFailure: locks the account once the threshold is reached")
    void registerFailure_reachingThreshold_locksAccount() {
        User user = user(MAX_ATTEMPTS - 1, null);
        when(userRepository.findByUsername("admin")).thenReturn(Optional.of(user));

        loginAttemptService.registerFailure("admin");

        assertThat(user.getFailedLoginAttempts()).isEqualTo(MAX_ATTEMPTS);
        assertThat(user.getLockedUntil()).isNotNull();
        assertThat(user.getLockedUntil()).isAfter(OffsetDateTime.now(ZoneOffset.UTC));
        assertThat(user.isLocked()).isTrue();
    }

    @Test
    @DisplayName("registerFailure: an expired lock resets the counter before counting the new failure")
    void registerFailure_expiredLock_resetsCounter() {
        OffsetDateTime expired = OffsetDateTime.now(ZoneOffset.UTC).minusMinutes(1);
        User user = user(MAX_ATTEMPTS, expired);
        when(userRepository.findByUsername("admin")).thenReturn(Optional.of(user));

        loginAttemptService.registerFailure("admin");

        assertThat(user.getFailedLoginAttempts()).isEqualTo(1);
        assertThat(user.getLockedUntil()).isNull();
    }

    @Test
    @DisplayName("registerFailure: unknown user is silently ignored")
    void registerFailure_unknownUser_doesNothing() {
        when(userRepository.findByUsername("ghost")).thenReturn(Optional.empty());

        loginAttemptService.registerFailure("ghost");

        verify(userRepository, never()).save(any());
    }

    @Test
    @DisplayName("resetFailures: clears the counter and the lock after a successful login")
    void resetFailures_clearsCounterAndLock() {
        User user = user(MAX_ATTEMPTS, OffsetDateTime.now(ZoneOffset.UTC).plusMinutes(10));
        when(userRepository.findByUsername("admin")).thenReturn(Optional.of(user));

        loginAttemptService.resetFailures("admin");

        assertThat(user.getFailedLoginAttempts()).isZero();
        assertThat(user.getLockedUntil()).isNull();
        verify(userRepository).save(user);
    }

    @Test
    @DisplayName("resetFailures: nothing to clear does not write to the database")
    void resetFailures_nothingToClear_doesNotSave() {
        User user = user(0, null);
        when(userRepository.findByUsername("admin")).thenReturn(Optional.of(user));

        loginAttemptService.resetFailures("admin");

        verify(userRepository, never()).save(any());
    }

    @Test
    @DisplayName("isLocked: reflects the current account lock state")
    void isLocked_reflectsLockState() {
        when(userRepository.findByUsername("locked"))
                .thenReturn(Optional.of(user(MAX_ATTEMPTS, OffsetDateTime.now(ZoneOffset.UTC).plusMinutes(5))));
        when(userRepository.findByUsername("expired"))
                .thenReturn(Optional.of(user(MAX_ATTEMPTS, OffsetDateTime.now(ZoneOffset.UTC).minusMinutes(5))));
        when(userRepository.findByUsername("unknown")).thenReturn(Optional.empty());

        assertThat(loginAttemptService.isLocked("locked")).isTrue();
        assertThat(loginAttemptService.isLocked("expired")).isFalse();
        assertThat(loginAttemptService.isLocked("unknown")).isFalse();
    }

    @Test
    @DisplayName("remainingLockSeconds: returns the seconds left, or 0 when not locked")
    void remainingLockSeconds_returnsRemainingOrZero() {
        when(userRepository.findByUsername("locked"))
                .thenReturn(Optional.of(user(MAX_ATTEMPTS, OffsetDateTime.now(ZoneOffset.UTC).plusMinutes(10))));
        when(userRepository.findByUsername("free")).thenReturn(Optional.of(user(0, null)));

        assertThat(loginAttemptService.remainingLockSeconds("locked")).isBetween(500L, 600L);
        assertThat(loginAttemptService.remainingLockSeconds("free")).isZero();
    }
}
