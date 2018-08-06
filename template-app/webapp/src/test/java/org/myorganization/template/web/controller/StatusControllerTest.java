package org.myorganization.template.web.controller;

import static org.mockito.Mockito.*;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

import java.util.Calendar;

import org.junit.Before;
import org.junit.Test;
import org.junit.runner.RunWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.MockitoAnnotations;
import org.myorganization.template.core.services.system.StatusService;
import org.springframework.context.annotation.Profile;
import org.springframework.http.MediaType;
import org.springframework.test.context.ContextConfiguration;
import org.springframework.test.context.junit4.SpringRunner;
import org.springframework.test.context.web.WebAppConfiguration;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.setup.MockMvcBuilders;

@RunWith(SpringRunner.class)
@ContextConfiguration({"classpath:applicationContext-test.xml"})
@Profile("test")
@WebAppConfiguration
public class StatusControllerTest {

	private static final String APPLICATION_JSON_CHARSET_UTF_8 = "application/json;charset=UTF-8";

	@Mock
	private StatusService statusService;
	
	@InjectMocks
	private StatusController controller;

	private MockMvc mockMvc;

	@Before
	public void setup(){
		// Process mock annotations
        MockitoAnnotations.initMocks(this);
        
     // Setup Spring test in standalone mode
        this.mockMvc = MockMvcBuilders.standaloneSetup(controller).build();
	}
	
	@Test
	public void testGetServerTimestamp() throws Exception {
		Calendar c = Calendar.getInstance();
		
		when(this.statusService.getServerTimestamp()).thenReturn(c);
		
		this.mockMvc.perform(get("/api/status/time").accept(MediaType.parseMediaType(APPLICATION_JSON_CHARSET_UTF_8)))
			.andExpect(status().isOk())
			.andExpect(content().contentType(APPLICATION_JSON_CHARSET_UTF_8))
			.andExpect(jsonPath("$").value(Long.valueOf(c.getTimeInMillis())));
		
		verify(statusService, times(1)).getServerTimestamp();
        verifyNoMoreInteractions(statusService);
	}

}
