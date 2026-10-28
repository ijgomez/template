package org.myorganization.template.core.service;

import java.time.Duration;
import java.time.OffsetDateTime;
import java.time.ZoneOffset;

import org.myorganization.template.core.repository.UserRepository;
import org.myorganization.template.domain.entity.User;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Propagation;
import org.springframework.transaction.annotation.Transactional;

/**
 * Tracks failed login attempts and temporarily locks user accounts.
 * <p>
 * The counter and the lock timestamp live in the {@code users} table, so the state
 * is shared by every node of the cluster (unlike an in-memory counter).
 * <p>
 * The write operations run in a new transaction ({@link Propagation#REQUIRES_NEW}) on
 * purpose: authentication failures roll back the surrounding transaction, so the
 * attempt must be committed independently to be remembered.
 */
@Service
public class LoginAttemptService {

    private static final Logger log = LoggerFactory.getLogger(LoginAttemptService.class);

    private final UserRepository userRepository;
    private final int maxAttempts;
    private final long lockoutMinutes;

    public LoginAttemptService(UserRepository userRepository,
                               @Value("${auth.login-attempts.max-attempts:5}") int maxAttempts,
                               @Value("${auth.login-attempts.lockout-minutes:15}") long lockoutMinutes) {
        this.userRepository = userRepository;
        this.maxAttempts = maxAttempts;
        this.lockoutMinutes = lockoutMinutes;
    }

    /**
     * Indicates whether the given account is locked at this moment.
     *
     * @param username the account username
     * @return true if the account is locked
     */
    @Transactional(readOnly = true)
    public boolean isLocked(String username) {
        return userRepository.findByUsername(username)
                .map(User::isLocked)
                .orElse(false);
    }

    /**
     * Returns the seconds remaining until the account lock expires.
     *
     * @param username the account username
     * @return remaining seconds, or 0 if the account is not locked
     */
    @Transactional(readOnly = true)
    public long remainingLockSeconds(String username) {
        return userRepository.findByUsername(username)
                .filter(User::isLocked)
                .map(user -> Duration.between(OffsetDateTime.now(ZoneOffset.UTC), user.getLockedUntil()).toSeconds())
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
