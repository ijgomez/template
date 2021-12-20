package org.myorganization.template.web.controller;

import java.util.Optional;

import javax.validation.Valid;

import org.apache.commons.lang3.StringUtils;
import org.myorganization.template.core.domain.security.users.User;
import org.myorganization.template.core.services.security.UserService;
import org.myorganization.template.web.security.exceptions.ForbiddenOperationException;
import org.myorganization.template.web.security.exceptions.InvalidCredentialsException;
import org.myorganization.template.web.security.exceptions.UserNotFoundException;
import org.myorganization.template.web.security.model.AccessTokenVO;
import org.myorganization.template.web.security.model.AuthenticationTokenVO;
import org.myorganization.template.web.security.model.CredentialsVO;
import org.myorganization.template.web.security.model.RefreshTokenVO;
import org.myorganization.template.web.security.model.TUserDetails;
import org.myorganization.template.web.security.services.JWTService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.BadCredentialsException;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.validation.annotation.Validated;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import lombok.extern.slf4j.Slf4j;

@RestController
@Validated
@RequestMapping("api/auth")
@Slf4j
public class AuthController {

	@Autowired
	private JWTService jwtService;
	
	@Autowired
	private UserService userService;
	
	@Autowired
	private AuthenticationManager authenticationManager;

	@PostMapping("/login")
	public ResponseEntity<AuthenticationTokenVO> login(@Valid @RequestBody CredentialsVO credentials) {
		AuthenticationTokenVO authenticationToken = null;
		try {
			SecurityContextHolder.getContext().setAuthentication(this.authenticationManager.authenticate(new UsernamePasswordAuthenticationToken(credentials.getUsername(), credentials.getPassword())));

			Optional<User> u = userService.findByUsername(credentials.getUsername());
			
			if (u.isPresent()) {
				var user = u.get();
				
				log.warn("User with username {} has been authorized!!!", user.getUsername());
				
				authenticationToken = this.buildAuthenticationToken(user);
				
				this.userService.updateLastLoginDate(user.getId());
				
				return ResponseEntity.ok(authenticationToken);
			}
		}
		catch(Exception e) {
			log.error("Fail to login user: {}", e.getMessage(), e);
			throw new BadCredentialsException(e.getMessage());
		}
		return ResponseEntity.badRequest().build();
	}
	
	@PostMapping("/logout")
	public void logout() {
		//TODO: pending to...
	}
	
	@PostMapping("/refresh")
	public ResponseEntity<AuthenticationTokenVO> refresh(@RequestBody @Valid RefreshTokenVO refreshToken) throws ForbiddenOperationException {
		AuthenticationTokenVO authenticationToken = null;
		try {
			User jwtUser = this.jwtService.parseRefreshToken(refreshToken.getRefreshToken());
			
			
			Optional<User> u = this.userService.read(jwtUser.getId());
			if (!u.isPresent()) {
				throw new UserNotFoundException("User " + jwtUser.getUsername() + " not found");
			}
			
			User user = u.get();
			// TODO: Do not verify password for demo user as far as it breaks demo JWT token
			if(!StringUtils.equals("admin", user.getUsername()) && !StringUtils.equals(user.getPassword(), jwtUser.getPassword()))
			{
				// Invalid Credentials
				throw new InvalidCredentialsException("Invalid Credentials");
			}
			
			authenticationToken = this.buildAuthenticationToken(user);
			
			userService.updateLastLoginDate(user.getId());
		}
		catch(Exception e) {
			throw new ForbiddenOperationException("Forbidden Operation", e);
		}	
		
		return ResponseEntity.ok(authenticationToken);
	}
	
	@GetMapping("/access")
	public ResponseEntity<AccessTokenVO> accessToken() {
		var userDetails = getUserDetails();
		if (userDetails instanceof TUserDetails) {
			Optional<User> user = userService.findByUsername(((TUserDetails) userDetails).getUsername());
			if (user.isPresent()) {
				String accessToken = jwtService.generateAccessToken(user.get());
				return ResponseEntity.ok(new AccessTokenVO(accessToken));
			} else {
				return ResponseEntity.notFound().build();
			}
		}
		return ResponseEntity.badRequest().build();
	}
	
	private AuthenticationTokenVO buildAuthenticationToken(User user) {
		return new AuthenticationTokenVO("Bearer", 
				jwtService.generateAuthToken(user), 
				jwtService.generateRefreshToken(user), 
				jwtService.getExpiration());
	}
	
	private UserDetails getUserDetails() {
		return (UserDetails) SecurityContextHolder.getContext().getAuthentication().getPrincipal();
	}
}
