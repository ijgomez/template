package org.myorganization.template.core.audit;

import static org.assertj.core.api.Assertions.assertThat;

import java.lang.reflect.Method;
import java.util.Arrays;

import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.params.ParameterizedTest;
import org.junit.jupiter.params.provider.CsvSource;
import org.myorganization.template.core.service.ActionService;
import org.myorganization.template.core.service.ParameterService;
import org.myorganization.template.core.service.ProfileService;
import org.myorganization.template.core.service.UserService;
import org.myorganization.template.domain.enums.AuditSection;
import org.myorganization.template.domain.enums.OperationType;

/**
 * Guards the audit trail of security-relevant administrative operations: permission grants,
 * account changes and system parameters must stay annotated with {@link Auditable}.
 */
class AdministrativeOperationsAuditedTest {

    @ParameterizedTest(name = "{0}.{1} is audited as {2}")
    @CsvSource({
            "UserService, update, UPDATE, SECURITY",
            "UserService, delete, DELETE, SECURITY",
            "ProfileService, create, CREATE, SECURITY",
            "ProfileService, update, UPDATE, SECURITY",
            "ProfileService, delete, DELETE, SECURITY",
            "ParameterService, create, CREATE, SYSTEM",
            "ParameterService, update, UPDATE, SYSTEM",
            "ParameterService, delete, DELETE, SYSTEM",
            "ActionService, update, UPDATE, SECURITY"
    })
    @DisplayName("administrative operations carry @Auditable")
    void administrativeOperation_isAuditable(String service, String method, OperationType op, AuditSection section) {
        Class<?> type = switch (service) {
            case "UserService" -> UserService.class;
            case "ProfileService" -> ProfileService.class;
            case "ParameterService" -> ParameterService.class;
            case "ActionService" -> ActionService.class;
            default -> throw new IllegalArgumentException(service);
        };
        Method target = Arrays.stream(type.getDeclaredMethods())
                .filter(m -> m.getName().equals(method) && m.getParameterCount() >= 1 && m.isAnnotationPresent(Auditable.class))
                .findFirst()
                .orElse(null);
        assertThat(target).as("%s.%s must be annotated with @Auditable", service, method).isNotNull();
        Auditable auditable = target.getAnnotation(Auditable.class);
        assertThat(auditable.operationType()).isEqualTo(op);
        assertThat(auditable.section()).isEqualTo(section);
    }
}
