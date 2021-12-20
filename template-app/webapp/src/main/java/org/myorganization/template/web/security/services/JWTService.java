package org.myorganization.template.web.security.services;

import java.util.Calendar;

import org.myorganization.template.core.domain.security.users.User;
import org.myorganization.template.core.services.security.ProfileService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;

import io.jsonwebtoken.Claims;
import io.jsonwebtoken.Jwts;
import io.jsonwebtoken.SignatureAlgorithm;

public class JWTService {

	private static final String USERNAME = "username";
	
	private static final String PASSWORD = "password";
	
	private static final String PROFILE_ID = "profileId";


	/** The BASE64-encoded algorithm-specific signature verification key to use to validate any discovered JWS digital signature. */
	@Value("${security.jwt.secret}")
	private String secret;
	
	/** The Authentication Token Expiration time. */
	@Value("${security.jwt.authTokenExp}")
	private Integer authTokenExp;
	
	/** The Refresh Token Expiration time. */
	@Value("${security.jwt.refreshTokenExp}")
	private Integer refreshTokenExp;

	@Autowired
	private ProfileService profileService;

	/**
	 * Generates JWT auth token storing {@link User} attributes and specifies expiration date.
	 * 
	 * @param user for token generation.
	 * @return generated JWT token.
	 */
	public String generateAuthToken(final User user) {
		final Claims claims;
		
		claims = Jwts.claims().setSubject(user.getId().toString());
		claims.put(USERNAME, user.getUsername());
		claims.put(PROFILE_ID, user.getProfile().getId());
		return this.buildToken(claims, authTokenExp);
	}

	/**
	 * Parses {@link User} attributes from JWT token.
	 * 
	 * @param token to parse.
	 * @return retrieved {@link User}
	 */
	public User parseAuthToken(String token) {
		final Claims claims;
		final User user;
		
		claims = Jwts.parser().setSigningKey(secret).parseClaimsJws(token).getBody();
		
		user = new User();
		user.setId(Long.valueOf(claims.getSubject()));
		user.setUsername((String) claims.get(USERNAME));
		
		this.profileService.read(((Integer)claims.get(PROFILE_ID)).longValue()).ifPresent(user::setProfile);

		return user;
	}

	/**
	 * Verifies JWT refresh token.
	 * 
	 * @param token to refresh
	 * @return parsed {@link User}
	 */
	public User parseRefreshToken(String token) {
		final Claims claims;
		final User user;
		
		claims = Jwts.parser().setSigningKey(secret).parseClaimsJws(token).getBody();
		
		user = new User();
		user.setId(Long.valueOf(claims.getSubject()));
		user.setPassword((String)claims.get(PASSWORD));
		
		return user;
	}

	/**
	 * Generates JWT refresh token storing {@link User} attributes and specifies
	 * expiration date.
	 * 
	 * @param user for token refresh
	 * @return generated JWT token
	 */
	public String generateRefreshToken(User user) {
		final Claims claims;
		
		claims = Jwts.claims().setSubject(user.getId().toString());
		claims.put(PASSWORD, user.getPassword());
		
		return this.buildToken(claims, refreshTokenExp);
	}

	/**
	 * Generates JWT access token storing {@link User} attributes and specifies
	 * expiration (that never expires).
	 * 
	 * @param user for token generation
	 * @return generated JWT token
	 */
	public String generateAccessToken(User user) {
		final Claims claims;
		
		claims = Jwts.claims().setSubject(user.getId().toString());
		claims.put(PASSWORD, user.getPassword());
		
		return this.buildToken(claims, Integer.MAX_VALUE);
	}

	private String buildToken(Claims claims, Integer exp) {
		var c = Calendar.getInstance();
		c.add(Calendar.MINUTE, exp);
		return Jwts.builder().setClaims(claims).signWith(SignatureAlgorithm.HS512, secret).setExpiration(c.getTime()).compact();
	}

	public Integer getExpiration() {
		return authTokenExp;
	}
}
