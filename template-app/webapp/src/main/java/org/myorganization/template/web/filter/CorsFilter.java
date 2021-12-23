package org.myorganization.template.web.filter;

import static org.springframework.http.HttpHeaders.ACCESS_CONTROL_ALLOW_ORIGIN;
import static org.springframework.http.HttpHeaders.ACCESS_CONTROL_ALLOW_METHODS;
import static org.springframework.http.HttpHeaders.ACCESS_CONTROL_ALLOW_HEADERS;

import java.io.IOException;

import javax.servlet.Filter;
import javax.servlet.FilterChain;
import javax.servlet.FilterConfig;
import javax.servlet.ServletException;
import javax.servlet.ServletRequest;
import javax.servlet.ServletResponse;
import javax.servlet.http.HttpServletResponse;

public class CorsFilter implements Filter {

	@Override
	public void init(FilterConfig config) throws ServletException { 
		// Do nothing
	}
	

	@Override
	public void doFilter(ServletRequest servletRequest, ServletResponse servletResponse, FilterChain chain)
			throws IOException, ServletException {
		
		// Establece aquí la cabecera que quieras
        HttpServletResponse response = (HttpServletResponse) servletResponse;
        response.addHeader(ACCESS_CONTROL_ALLOW_ORIGIN,"*");
        response.addHeader(ACCESS_CONTROL_ALLOW_METHODS,"GET,POST,PUT,DELETE");
        response.addHeader(ACCESS_CONTROL_ALLOW_HEADERS,"Origin, X-Requested-With, Content-Type, Accept");
        chain.doFilter(servletRequest, servletResponse);
		
	}


	@Override
	public void destroy() { 
		// Do nothing
	}

}
