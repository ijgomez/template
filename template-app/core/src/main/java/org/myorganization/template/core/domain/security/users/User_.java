package org.myorganization.template.core.domain.security.users;

import javax.persistence.metamodel.SingularAttribute;
import javax.persistence.metamodel.StaticMetamodel;

import org.myorganization.template.core.domain.security.profiles.Profile;

@StaticMetamodel(User.class)
@SuppressWarnings({"squid:S1118", "squid:S101", "squid:S3077", "squid:S1104", "squid:S1444"})
public class User_ {

	public static volatile SingularAttribute<User, Integer> id;
	public static volatile SingularAttribute<User, String> username;
	public static volatile SingularAttribute<User, String> password;
	public static volatile SingularAttribute<User, Profile> profile;
	
}
