package org.myorganization.template.core.domain;

import static org.junit.Assert.assertEquals;

import java.util.HashSet;

import org.junit.Before;
import org.junit.Test;
import org.myorganization.template.core.domain.security.actions.Action;
import org.myorganization.template.core.domain.security.profiles.Profile;
import org.myorganization.template.core.domain.security.users.User;

import com.fasterxml.jackson.databind.ObjectMapper;

public class SecurityDomainTest {
	
	private Action action;
	
	private Profile profile;
	
	private User user;
	
	@Before
	public void setup() {
		action = buildTestAction(1L, "CREATE", "description - create");

		profile = new Profile();
		profile.setId(1L);
		profile.setName("Administrator");
		profile.setDescription("Administrator");
		profile.setActions(new HashSet<>());
		
		profile.getActions().add(action);
		profile.getActions().add(buildTestAction(2L, "READ", "description - read"));
		profile.getActions().add(buildTestAction(3L, "UPDATE", "description - update"));
		profile.getActions().add(buildTestAction(4L, "DELETE", "description - delete"));
		
		action.setProfiles(new HashSet<>());
		action.getProfiles().add(profile);
		
		user = new User();
		user.setId(1L);
		user.setUsername("username");
		user.setPassword("password");
		user.setProfile(profile);
		
		profile.setUsers(new HashSet<>());
		profile.getUsers().add(user);
	}
	
	@Test
	public void testSerializableAction() throws Exception {
		assertEquals("{\"id\":1,\"name\":\"CREATE\",\"description\":\"description - create\"}", new ObjectMapper().writeValueAsString(action));
	}
	
	@Test
	public void testSerializableProfile() throws Exception {
		assertEquals("{\"id\":1,\"name\":\"Administrator\",\"description\":\"Administrator\",\"actions\":[{\"id\":3,\"name\":\"UPDATE\",\"description\":\"description - update\"},{\"id\":1,\"name\":\"CREATE\",\"description\":\"description - create\"},{\"id\":4,\"name\":\"DELETE\",\"description\":\"description - delete\"},{\"id\":2,\"name\":\"READ\",\"description\":\"description - read\"}]}", new ObjectMapper().writeValueAsString(profile));
	}
	
	@Test
	public void testSerializableUser() throws Exception {
		assertEquals("{\"id\":1,\"username\":\"username\",\"password\":\"password\",\"profile\":{\"id\":1,\"name\":\"Administrator\",\"description\":\"Administrator\",\"actions\":[{\"id\":3,\"name\":\"UPDATE\",\"description\":\"description - update\"},{\"id\":1,\"name\":\"CREATE\",\"description\":\"description - create\"},{\"id\":4,\"name\":\"DELETE\",\"description\":\"description - delete\"},{\"id\":2,\"name\":\"READ\",\"description\":\"description - read\"}]}}", new ObjectMapper().writeValueAsString(user));
		
	}
	
	
	private Action buildTestAction(Long id, String name, String description) {
		Action action = new Action();
		action.setId(id);
		action.setName(name);
		action.setDescription(description);
		
		return action;
	}
	
}
