package org.myorganization.template.core.service;

import static org.assertj.core.api.Assertions.assertThat;

import java.util.LinkedHashMap;
import java.util.Map;

import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;

class SensitivePropertyMaskerEmbeddedSecretsTest {

    private static String maskValue(String key, String value) {
        Map<String, String> in = new LinkedHashMap<>();
        in.put(key, value);
        return SensitivePropertyMasker.mask(in).get(key);
    }

    @Test
    @DisplayName("keys with newer sensitive fragments are masked (DB_PASS, *_PWD, *_AUTH, cookie, private)")
    void newFragments_areMasked() {
        for (String key : new String[] {"DB_PASS", "SERVICE_PWD", "PROXY_AUTH", "SESSION_COOKIE", "PRIVATE_PEM", "SMTP_SALT", "DB_DSN"}) {
            assertThat(maskValue(key, "x")).as(key).isEqualTo(SensitivePropertyMasker.MASKED_VALUE);
        }
    }

    @Test
    @DisplayName("JVM options with a sensitive name keep the name and hide the value")
    void jvmOptions_valuesAreHidden() {
        String masked = maskValue("JAVA_OPTS", "-Xmx512m -Ddb.password=s3cr3t -Dapp.mode=prod -Dapi.token=abc");
        assertThat(masked).isEqualTo("-Xmx512m -Ddb.password=****** -Dapp.mode=prod -Dapi.token=******");
    }

    @Test
    @DisplayName("URL user-info password is hidden; user and host stay")
    void urlUserInfo_passwordIsHidden() {
        assertThat(maskValue("DATASOURCE_URL", "postgresql://app:s3cr3t@db:5432/template"))
                .isEqualTo("postgresql://app:******@db:5432/template");
    }

    @Test
    @DisplayName("query string and connection string secrets are hidden")
    void queryString_secretsAreHidden() {
        assertThat(maskValue("JDBC", "jdbc:postgresql://db/t?user=app&password=s3cr3t&ssl=true"))
                .isEqualTo("jdbc:postgresql://db/t?user=app&password=******&ssl=true");
    }

    @Test
    @DisplayName("ordinary values are not altered")
    void ordinaryValues_areUnchanged() {
        assertThat(maskValue("java.class.path", "/opt/app/lib/a.jar:/opt/app/lib/b.jar")).isEqualTo("/opt/app/lib/a.jar:/opt/app/lib/b.jar");
        assertThat(maskValue("JAVA_OPTS", "-Xmx512m -Dfile.encoding=UTF-8")).isEqualTo("-Xmx512m -Dfile.encoding=UTF-8");
    }

    @Test
    @DisplayName("redaction is idempotent")
    void redaction_isIdempotent() {
        String once = maskValue("JAVA_OPTS", "-Ddb.password=s3cr3t postgresql://u:p@h/db");
        assertThat(maskValue("JAVA_OPTS", once)).isEqualTo(once);
    }

    @Test
    @DisplayName("null and empty values are preserved for non-sensitive keys")
    void nullAndEmpty_arePreserved() {
        assertThat(maskValue("plain", null)).isNull();
        assertThat(maskValue("plain", "")).isEmpty();
    }

    @Test
    @org.junit.jupiter.api.Timeout(5)
    @DisplayName("very large values are processed in linear time")
    void hugeValues_areProcessedQuickly() {
        String huge = "v".repeat(1_048_577);
        assertThat(maskValue("plain", huge)).isEqualTo(huge);
        String hugeWithMarkers = "a=b ".repeat(200_000) + "x://" + "y".repeat(300_000);
        assertThat(maskValue("plain", hugeWithMarkers)).isNotNull();
    }
}
