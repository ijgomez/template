package org.myorganization.template.web.controller;

import static org.junit.Assert.*;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

import org.junit.Before;
import org.junit.Test;
import org.junit.runner.RunWith;
import org.mockito.InjectMocks;
import org.mockito.MockitoAnnotations;
import org.springframework.test.context.junit4.SpringRunner;
import org.springframework.test.context.web.WebAppConfiguration;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.setup.MockMvcBuilders;

/**
 * Test of {@link HomeController}.
 *
 * @author ijgomez
 *
 */
@RunWith(SpringRunner.class)
@WebAppConfiguration
public class HomeControllerTest {
	
	@InjectMocks
	private HomeController controller;
	
	private MockMvc mockMvc;
	
	@Before
	public void setup() {
		
		// Process mock annotations
		MockitoAnnotations.initMocks(this);
		
		// Setup Spring test in standalone mode
        this.mockMvc = MockMvcBuilders.standaloneSetup(controller).build();
 
	}

	@Test
	public void testDefaultUrl() throws Exception {

		assertEquals("home", controller.getHome());

		this.mockMvc.perform(get("/"))
			.andExpect(status().isOk())
			.andExpect(view().name("home"));
	}

}
