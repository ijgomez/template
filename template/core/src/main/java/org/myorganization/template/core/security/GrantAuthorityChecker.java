package org.myorganization.template.core.security;

import org.springframework.security.access.AccessDeniedException;
import org.springframework.security.authentication.AnonymousAuthenticationToken;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.GrantedAuthority;
import org.springframework.security.core.context.SecurityContextHolder;

/**
 * Segregación de funciones en el módulo de administración (SEC-07).
 * <p>
 * Administrar perfiles o usuarios ({@code PROFILE_WRITE}/{@code USER_WRITE}) no
 * es lo mismo que <em>conceder permisos</em>. Sin esta distinción un perfil con
 * {@code PROFILE_WRITE} podía reemplazar las acciones de un perfil (incluido el
 * suyo) y uno con {@code USER_WRITE} podía asignar el perfil administrador a
 * cualquier cuenta.
 * <p>
 * La operación de concesión exige una autoridad dedicada
 * ({@link #PROFILE_GRANT} o {@link #USER_GRANT}) que se comprueba contra el
 * usuario autenticado en el {@link SecurityContextHolder}.
 * <p>
 * Política cuando no hay actor autenticado: las llamadas internas o de test
 * que invocan el servicio sin contexto de seguridad se consideran de confianza
 * (no se aplica la segregación). Una petición anónima, en cambio, se rechaza:
 * es una petición HTTP real sin autenticar.
 */
public final class GrantAuthorityChecker {

    /** Conceder o revocar acciones de un perfil. */
    public static final String PROFILE_GRANT = "PROFILE_GRANT";

    /** Asignar o cambiar el perfil (permisos) de un usuario. */
    public static final String USER_GRANT = "USER_GRANT";

    private GrantAuthorityChecker() {
    }

    /**
     * Verifica que el usuario autenticado posea la autoridad de concesión.
     *
     * @param grantAuthority autoridad exigida ({@link #PROFILE_GRANT} o
     *                       {@link #USER_GRANT})
     * @throws AccessDeniedException si hay una petición anónima o autenticada que
     *                               no posee la autoridad
     */
    public static void checkGrant(String grantAuthority) {
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();

        // Llamada interna o de test sin contexto de seguridad: no se aplica.
        if (authentication == null) {
            return;
        }

        // Petición HTTP sin autenticar: nunca puede conceder permisos.
        if (authentication instanceof AnonymousAuthenticationToken) {
            throw denied(grantAuthority);
        }

        boolean granted = authentication.getAuthorities().stream()
                .map(GrantedAuthority::getAuthority)
                .anyMatch(grantAuthority::equals);

        if (!granted) {
            throw denied(grantAuthority);
        }
    }

    private static AccessDeniedException denied(String grantAuthority) {
        return new AccessDeniedException(
                "Granting permissions requires the " + grantAuthority + " authority");
    }
}
