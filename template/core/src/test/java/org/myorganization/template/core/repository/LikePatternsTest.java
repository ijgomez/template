package org.myorganization.template.core.repository;

import static org.assertj.core.api.Assertions.assertThat;

import org.junit.jupiter.api.Test;

class LikePatternsTest {

    @Test
    void escape_shouldEscapeWildcardsAndEscapeChar() {
        assertThat(LikePatterns.escape("%")).isEqualTo("\\%");
        assertThat(LikePatterns.escape("a_b")).isEqualTo("a\\_b");
        assertThat(LikePatterns.escape("50%_off\\x")).isEqualTo("50\\%\\_off\\\\x");
    }

    @Test
    void escape_shouldLeaveRegularTextUntouched() {
        assertThat(LikePatterns.escape("john.doe@example.com")).isEqualTo("john.doe@example.com");
        assertThat(LikePatterns.escape("")).isEmpty();
    }
}
