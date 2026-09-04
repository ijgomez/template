package org.myorganization.template.webapp.config;

import org.springframework.context.annotation.Configuration;
import org.springframework.core.io.Resource;
import org.springframework.lang.NonNull;
import org.springframework.web.servlet.config.annotation.ResourceHandlerRegistry;
import org.springframework.web.servlet.config.annotation.WebMvcConfigurer;
import org.springframework.web.servlet.resource.PathResourceResolver;

/**
 * Serves the Angular SPA from {@code classpath:/static/} with client-side routing support.
 * <p>
 * The frontend uses Angular's HTML5 path location strategy (no hash), so deep links and
 * page reloads on routes such as {@code /login} or {@code /dashboard} reach the server.
 * A custom {@link PathResourceResolver} serves the physical resource when it exists (JS,
 * CSS, JSON, images, i18n files, etc.) and falls back to {@code index.html} for any other
 * path, letting the Angular router resolve it on the client.
 * <p>
 * API endpoints ({@code /api/**}) are never routed here: they are handled by their
 * controllers and are excluded from the fallback so a missing API path does not return
 * the SPA shell.
 */
@Configuration
public class SpaWebMvcConfig implements WebMvcConfigurer {

    private static final String STATIC_LOCATION = "classpath:/static/";

    @Override
    public void addResourceHandlers(@NonNull ResourceHandlerRegistry registry) {
        registry.addResourceHandler("/**")
                .addResourceLocations(STATIC_LOCATION)
                .resourceChain(true)
                .addResolver(new SpaPathResourceResolver());
    }

    /**
     * Resolves a physical static resource; when none exists and the path is not an API
     * call, returns {@code index.html} so the Angular router can handle the route.
     */
    private static class SpaPathResourceResolver extends PathResourceResolver {

        private final Resource index = new org.springframework.core.io.ClassPathResource("static/index.html");

        @Override
        protected Resource getResource(@NonNull String resourcePath, @NonNull Resource location) throws java.io.IOException {
            Resource requested = super.getResource(resourcePath, location);
            if (requested != null) {
                return requested;
            }
            // Do not serve the SPA shell for API paths; let them 404 through the API layer.
            if (resourcePath.startsWith("api/") || resourcePath.equals("api")) {
                return null;
            }
            return index.exists() && index.isReadable() ? index : null;
        }
    }

}
