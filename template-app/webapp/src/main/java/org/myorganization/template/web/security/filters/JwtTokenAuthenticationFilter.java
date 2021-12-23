package org.myorganization.template.web.security.filters;

import static org.springframework.http.HttpHeaders.AUTHORIZATION;

import java.io.IOException;

import javax.servlet.FilterChain;
import javax.servlet.ServletException;
import javax.servlet.ServletRequest;
import javax.servlet.ServletResponse;
import javax.servlet.http.HttpServletRequest;
import javax.servlet.http.HttpServletResponse;

import org.myorganization.template.security.domain.users.User;
import org.myorganization.template.web.security.model.TemplateUserDetails;
import org.myorganization.template.web.security.services.JWTService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.security.authentication.BadCredentialsException;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.web.authentication.WebAuthenticationDetailsSource;
import org.springframework.security.web.util.matcher.AntPathRequestMatcher;
import org.springframework.security.web.util.matcher.RequestMatcher;
import org.springframework.web.filter.GenericFilterBean;

import io.jsonwebtoken.ExpiredJwtException;
import io.jsonwebtoken.MalformedJwtException;

public class JwtTokenAuthenticationFilter extends GenericFilterBean {

	@Autowired
	private JWTService jwtService;
	
	private RequestMatcher requestMatcher = new AntPathRequestMatcher("/**");
	
	@Override
	public void doFilter(ServletRequest servletRequest, ServletResponse servletResponse, FilterChain chain) throws IOException, ServletException {
		
		HttpServletRequest request = (HttpServletRequest) servletRequest;
		HttpServletResponse response = (HttpServletResponse) servletResponse;
		
		if (!requiresAuthentication(request)) {
			/*
			 * if the URL requested doesn't match the URL handled by the filter, then we chain to the next filters.
			 */
			chain.doFilter(request, response);
			return;
		}
		
		String header = request.getHeader(AUTHORIZATION);
		if (header == null || !header.startsWith("Bearer ")) {
			/*
			 * If there's not authentication information, then we chain to the next filters. The SecurityContext will be
			 * analyzed by the chained filter that will throw AuthenticationExceptions if necessary
			 */
			chain.doFilter(request, response);
			return;
		}

		try {
			/*
			 * The token is extracted from the header. It's then checked (signature and expiration) An Authentication is
			 * then created and registered in the SecurityContext. The SecurityContext will be analyzed by chained
			 * filters that will throw Exceptions if necessary (like if authorizations are incorrect).
			 */
			SecurityContextHolder.getContext().setAuthentication(buildAuthenticationFromJwt(extractAndDecodeJwt(request), request));

			chain.doFilter(request, response);
		} catch (ExpiredJwtException | MalformedJwtException ex) {
			throw new BadCredentialsException("JWT not valid");
		}
		
		/* SecurityContext is then cleared since we are stateless. */
		SecurityContextHolder.clearContext();

	}
	
	private boolean requiresAuthentication(HttpServletRequest request) {
		return this.requestMatcher.matches(request);
	}
	
	private User extractAndDecodeJwt(HttpServletRequest request) {
		String authHeader = request.getHeader(AUTHORIZATION);
		return this.jwtService.parseAuthToken(authHeader.substring("Bearer ".length()));
	}
	
	private Authentication buildAuthenticationFromJwt(User user, HttpServletRequest request) {
		final TemplateUserDetails userDetails;
		UsernamePasswordAuthenticationToken authentication;
		
		userDetails = new TemplateUserDetails(user);
		authentication = new UsernamePasswordAuthenticationToken(userDetails, null, userDetails.getAuthorities());
		authentication.setDetails(new WebAuthenticationDetailsSource().buildDetails(request));
		return authentication;
	}

}
