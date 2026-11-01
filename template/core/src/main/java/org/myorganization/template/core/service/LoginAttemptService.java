package org.myorganization.template.core.service;

import java.time.Duration;
import java.time.OffsetDateTime;
import java.time.ZoneOffset;

import org.myorganization.template.core.repository.UserRepository;
import org.myorganization.template.domain.entity.User;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Propagation;
import org.springframework.transaction.annotation.Transactional;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;

/**
 * Tracks failed login attempts and temporarily locks user accounts.
 * <p>
 * The counter and the lock timestamp live in the {@code users} table, so the
 * state
 * is shared by every node of the cluster (unlike an in-memory counter).
 * <p>
 * The write operations run in a new transaction
 * ({@link Propagation#REQUIRES_NEW}) on
 * purpose: authentication failures roll back the surrounding transaction, so
 * the
 * attempt must be committed independently to be remembered.
 */
@Slf4j
@Service
@RequiredArgsConstructor
public class LoginAttemptService {

    private final UserRepository userRepository;

    @Value("${auth.login-attempts.max-attempts:5}")
    private final int maxAttempts;

    @Value("${auth.login-attempts.lockout-minutes:15}")
    private final long lockoutMinutes;

    /**
     * Indicates whether the given account is locked at this moment, either by an
     * administrator or by the temporary lock caused by repeated failed logins.
     *
     * @param username the account username
     * @return true if the account is locked
     */
    @Transactional(readOnly = true)
    public boolean isLocked(String username) {
        return userRepository.findByUsername(username)
                .map(User::isCurrentlyLocked)
                .orElse(false);
    }

    /**
     * Returns the seconds remaining until the temporary account lock expires.
     * <p>
     * A permanent block set by an administrator has no expiry, so it reports 0: there is
     * no window to wait for, the account must be unblocked from the administration.
     *
     * @param username the account username
     * @return remaining seconds, or 0 if the account is not locked or has no expiry
     */
    @Transactional(readOnly = true)
    public long remainingLockSeconds(String username) {
        return userRepository.findByUsername(username)
                .filter(User::isCurrentlyLocked)
                .map(User::getLockedUntil)
                .filter(lockedUntil -> lockedUntil.isAfter(OffsetDateTime.now(ZoneOffset.UTC)))
                .map(lockedUntil -> Duration.between(OffsetDateTime.now(ZoneOffset.UTC), lockedUntil).toSeconds())
                .orElse(0L);
    }

    /**
     * Registers a failed authentication attempt for the given account.
     * <p>
     * When the number of consecutive failures reaches the configured threshold, the
     * account is locked until the lock window elapses. An expired lock resets the
     * counter, so a new window starts after the lock is over.
     *
     * @param username the account username
     */
    @Transactional(propagation = Propagation.REQUIRES_NEW)
    public void registerFailure(String username) {
        userRepository.findByUsername(username).ifPresent(user -> {
            OffsetDateTime now = OffsetDateTime.now(ZoneOffset.UTC);

            int previousAttempts = isLockExpired(user, now) ? 0 : user.getFailedLoginAttempts();
            int attempts = previousAttempts + 1;

            user.setFailedLoginAttempts(attempts);
            user.setLockedUntil(attempts >= maxAttempts ? now.plusMinutes(lockoutMinutes) : null);
            userRepository.save(user);

            if (attempts >= maxAttempts) {
                log.warn("Account '{}' locked until {} after {} failed login attempts",
                        username, user.getLockedUntil(), attempts);
            }
        });
    }

    /**
     * Clears the failed attempt counter after a successful authentication.
     *
     * @param username the account username
     */
    @Transactional(propagation = Propagation.REQUIRES_NEW)
    public void resetFailures(String username) {
        userRepository.findByUsername(username).ifPresent(user -> {
            if (user.getFailedLoginAttempts() != 0 || user.getLockedUntil() != null) {
                user.setFailedLoginAttempts(0);
                user.setLockedUntil(null);
                userRepository.save(user);
            }
        });
    }

    private boolean isLockExpired(User user, OffsetDateTime now) {
        return user.getLockedUntil() != null && !user.getLockedUntil().isAfter(now);
    }

}
