package org.myorganization.template.core.domain.base;

import static org.junit.Assert.*;

import org.junit.Test;

public class RepositoryQueriesHelperTest {

	@Test
	public void testWildcard() {
		
		assertEquals("value", RepositoryQueriesHelper.wildcard("value"));
		assertEquals("valu%e", RepositoryQueriesHelper.wildcard("valu*e"));
		assertEquals("%value", RepositoryQueriesHelper.wildcard("*value"));
		assertEquals("value%", RepositoryQueriesHelper.wildcard("value*"));
		assertEquals("%value%", RepositoryQueriesHelper.wildcard("*value*"));
	}

}
