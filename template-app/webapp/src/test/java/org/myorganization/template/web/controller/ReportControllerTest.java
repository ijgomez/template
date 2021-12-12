package org.myorganization.template.web.controller;

import static org.junit.Assert.*;
import static org.mockito.Mockito.*;
import static org.hamcrest.Matchers.*;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

import java.util.ArrayList;

import org.junit.Before;
import org.junit.Ignore;
import org.junit.Test;
import org.junit.runner.RunWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.MockitoAnnotations;
import org.mockito.invocation.InvocationOnMock;
import org.mockito.stubbing.Answer;
import org.myorganization.template.core.domain.reports.Report;
import org.myorganization.template.core.services.reports.ReportService;
import org.myorganization.template.web.exceptions.AppResponseEntityExceptionHandler;
import org.myorganization.template.web.testing.TestEntityFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.context.annotation.Profile;
import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.http.MediaType;
import org.springframework.test.context.ContextConfiguration;
import org.springframework.test.context.junit4.SpringRunner;
import org.springframework.test.context.web.WebAppConfiguration;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.setup.MockMvcBuilders;

import com.fasterxml.jackson.annotation.JsonInclude.Include;

@RunWith(SpringRunner.class)
@ContextConfiguration({"classpath:applicationContext-test.xml"})
@Profile("test")
@WebAppConfiguration
public class ReportControllerTest {
	
	private static final String URL_REPORTS = "/api/reports";
	
	private static final String APPLICATION_JSON_CHARSET_UTF_8 = "application/json;charset=UTF-8";
	
	@Mock
	private ReportService reportService;
	
	@InjectMocks
	private ReportController controller;
	
	@InjectMocks
	private AppResponseEntityExceptionHandler controllerAdvice;
	
	@Autowired
	private TestEntityFactory testEntityFactory;
	
	private MockMvc mockMvc;

	@Before
	public void setup(){
		// Process mock annotations
        MockitoAnnotations.initMocks(this);
        
        // Setup Spring test in standalone mode
        this.mockMvc = MockMvcBuilders.standaloneSetup(controller).setControllerAdvice(controllerAdvice).build();
	}

	@Test
	public void testFindAll() throws Exception {
		int num = 50;
		
		when(reportService.findAll()).thenReturn(this.testEntityFactory.generateReports(num));
		
		this.mockMvc.perform(get(URL_REPORTS).accept(MediaType.parseMediaType(APPLICATION_JSON_CHARSET_UTF_8)))
			.andExpect(status().isOk())
			.andExpect(content().contentType(APPLICATION_JSON_CHARSET_UTF_8))
			.andExpect(jsonPath("$", hasSize(num)));
			//.andExpect(jsonPath("$[*].id", is(0)));
			//.andExpect(jsonPath("$[0].name", is("Lorem ipsum")));
		
		verify(reportService, times(1)).findAll();
        verifyNoMoreInteractions(reportService);
	}
	
	@Test
	public void testFindAllNoContent() throws Exception {
		when(reportService.findAll()).thenReturn(new ArrayList<Report>());
		
		this.mockMvc.perform(get(URL_REPORTS).accept(MediaType.parseMediaType(APPLICATION_JSON_CHARSET_UTF_8)))
			.andExpect(status().isNoContent());
		
		verify(reportService, times(1)).findAll();
        verifyNoMoreInteractions(reportService);
	}

	@Test
	public void testRead() throws Exception {
	
		when(reportService.read(1L)).then(new Answer<Report>() {
			@Override
		    public Report answer(InvocationOnMock invocation) {
				Report report;
				
				report = new Report();
				report.setId((Long) invocation.getArguments()[0]);
				report.setName("");
		        return report;
		    }
		});
		
		this.mockMvc.perform(get(URL_REPORTS + "/{id}", 1L).accept(MediaType.parseMediaType(APPLICATION_JSON_CHARSET_UTF_8)))
			.andExpect(status().isOk())
			.andExpect(content().contentType(APPLICATION_JSON_CHARSET_UTF_8))
			.andExpect(jsonPath("$.id", is(1)))
	        .andExpect(jsonPath("$.name", is("")));

		verify(reportService, times(1)).read(1L);
        verifyNoMoreInteractions(reportService);
	}

	@Test
	public void testReadNotFound() throws Exception {
		this.mockMvc.perform(get(URL_REPORTS + "/{id}", 1L).accept(MediaType.parseMediaType(APPLICATION_JSON_CHARSET_UTF_8)))
			.andExpect(status().isNotFound());
		
		verify(reportService, times(1)).read(1L);
        verifyNoMoreInteractions(reportService);
	}

	@Test
	public void testCreate() throws Exception {
		Report report;
		
		report = new Report();
		report.setName(this.testEntityFactory.random());
		

		when(reportService.create(report)).then(new Answer<Report>() {
			@Override
		    public Report answer(InvocationOnMock invocation) {
				Report report;
				
				report = new Report();
				report.setId(1L);
				report.setName(((Report) invocation.getArguments()[0]).getName());
		        return report;
		    }
		});
		
		this.mockMvc.perform(post(URL_REPORTS)
				.contentType(MediaType.parseMediaType(APPLICATION_JSON_CHARSET_UTF_8))
				.content(this.testEntityFactory.convertObjectToJsonBytes(report, Include.NON_NULL)))
			.andExpect(status().isCreated());
		
		verify(reportService, times(1)).create(report);
		verifyNoMoreInteractions(reportService);
	}

	@Test
	public void testCreateEmptyFields() throws Exception {
		Report report;
		
		report = new Report();
		report.setName(this.testEntityFactory.random());
		
		when(reportService.create(report)).thenThrow(new DataIntegrityViolationException(""));
		
		this.mockMvc.perform(post(URL_REPORTS)
				.contentType(MediaType.parseMediaType(APPLICATION_JSON_CHARSET_UTF_8))
				.content(this.testEntityFactory.convertObjectToJsonBytes(report, Include.USE_DEFAULTS)))
			.andExpect(status().isBadRequest())
			.andExpect(status().reason(containsString("Bad request")))
			.andExpect(content().contentType(APPLICATION_JSON_CHARSET_UTF_8))
			.andExpect(jsonPath("$.message", is("")))
			;
		
		verify(reportService, times(1)).create(report);
		verifyNoMoreInteractions(reportService);
	}

	@Ignore
	@Test
	public void testDelete() throws Exception {
		fail("Not yet implemented");
	}

	@Ignore
	@Test
	public void testUpdate() throws Exception {
		fail("Not yet implemented");
	}

}
