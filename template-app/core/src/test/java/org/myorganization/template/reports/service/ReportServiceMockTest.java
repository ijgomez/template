package org.myorganization.template.reports.service;

import static org.junit.Assert.*;
import static org.mockito.Matchers.*;
import static org.mockito.Mockito.*;

import java.util.List;
import java.util.Optional;

import org.junit.Before;
import org.junit.Test;
import org.junit.runner.RunWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.MockitoAnnotations;
import org.mockito.invocation.InvocationOnMock;
import org.mockito.stubbing.Answer;
import org.myorganization.template.core.testing.TestEntityFactory;
import org.myorganization.template.reports.domain.report.Report;
import org.myorganization.template.reports.domain.report.ReportRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.context.annotation.Profile;
import org.springframework.test.context.ContextConfiguration;
import org.springframework.test.context.junit4.SpringRunner;

@RunWith(SpringRunner.class)
@ContextConfiguration({"classpath:applicationContext-test.xml"})
@Profile("test")
public class ReportServiceMockTest {
	
	@InjectMocks
	private ReportService reportService;
	
	@Mock
	private ReportRepository reportRepository;
	
	@Autowired
	private TestEntityFactory testEntityFactory;
	
	@Before
	public void setup() {
		// Process mock annotations
		MockitoAnnotations.initMocks(this);


	}
	
	@Test
	public void testFindAll() throws Exception {
		when(reportRepository.findAll()).thenReturn(this.testEntityFactory.generateReports(50));
		
		List<Report> data = this.reportService.findAll();
		
		assertNotNull(data);
		assertEquals(50, data.size());
		for (Report report : data) {
			assertNotNull(report.getId());
			assertNotNull(report.getName());
		}
		
		verify(reportRepository, times(1)).findAll();
        verifyNoMoreInteractions(reportRepository);
	}
	
	@Test
	public void testFindAllEmpty() throws Exception {
		when(reportRepository.findAll()).thenReturn(this.testEntityFactory.generateReports(0));
		
		List<Report> data = this.reportService.findAll();
		
		assertNotNull(data);
		assertEquals(0, data.size());
		
		verify(reportRepository, times(1)).findAll();
        verifyNoMoreInteractions(reportRepository);
	}

	@Test
	public void testCreate() throws Exception {
		
		when(reportRepository.save(any(Report.class))).then(new Answer<Report>() {
			@Override
			public Report answer(InvocationOnMock invocation) throws Throwable {
				Report report = new Report();
				report.setId(Long.MAX_VALUE);
				report.setName(((Report)invocation.getArguments()[0]).getName());
				return report;
			}
		});

		Report report = this.testEntityFactory.generateReport();
		
		assertNotNull(report);
		assertNull(report.getId());
		assertNotNull(report.getName());
		
		Report entity = this.reportService.create(report);
		
		assertNotNull(entity);
		assertNotEquals(report, entity);
		assertNotNull(entity.getId());
		assertNotNull(entity.getName());
		
		verify(reportRepository, times(1)).save(report);
        verifyNoMoreInteractions(reportRepository);

	}
	


	@Test
	public void testRead() throws Exception {
		when(reportRepository.findById(anyLong())).then(new Answer<Optional<Report>>() {
			@Override
		    public Optional<Report> answer(InvocationOnMock invocation) {
				Optional<Report> optional = Optional.of(testEntityFactory.generateReport((Long) invocation.getArguments()[0]));
		        return optional;
		    }
		});
		
		Long id = 1L;
		Report report = this.reportService.read(id).get();
		
		assertNotNull(report);
		assertNotNull(report.getId());
		assertEquals(id, report.getId());
		assertNotNull(report.getName());
	}
	
	@Test
	public void testReadNotFound() throws Exception {
		when(reportRepository.findById(anyLong())).thenReturn(Optional.empty());
		
		Long id = 1L;
		Report report = this.reportService.read(id).get();
		
		assertNull(report);
	}

	@Test
	public void testUpdate() throws Exception {
		when(reportRepository.findById(anyLong())).then(new Answer<Optional<Report>>() {
			@Override
		    public Optional<Report> answer(InvocationOnMock invocation) {
				Optional<Report> optional = Optional.of(testEntityFactory.generateReport((Long) invocation.getArguments()[0]));
		        return optional;
		    }
		});
		
		Report report = this.reportService.read(20L).get();
		
		assertNotNull(report);
		assertNotNull(report.getId());
		assertNotNull(report.getName());
		
		report.setName(this.testEntityFactory.random());
		
		Report entity = this.reportService.update(20L, report);
		
		assertNotNull(entity);
		assertNotNull(entity.getId());
		assertNotNull(entity.getName());
		assertEquals(report.getName(), entity.getName());
	}
	
	@Test
	public void testUpdateNotFound() throws Exception {
		when(reportRepository.findById(anyLong())).then(new Answer<Optional<Report>>() {
			@Override
		    public Optional<Report> answer(InvocationOnMock invocation) {
				Optional<Report> optional = Optional.of(testEntityFactory.generateReport((Long) invocation.getArguments()[0]));
		        return optional;
		    }
		});
		
		Report report = this.reportService.read(20L).get();
		
		assertNotNull(report);
		assertNotNull(report.getId());
		assertNotNull(report.getName());
		
		report.setName(this.testEntityFactory.random());
		
		when(reportRepository.findById(anyLong())).thenReturn(Optional.empty());
		
		Report entity = this.reportService.update(20L, report);
		
		assertNull(entity);
		
	}

	@Test
	public void testDelete() throws Exception {
		doNothing().when(reportRepository).deleteById(anyLong());

		Long id = 20L;
		
		Long result = this.reportService.delete(id);
		assertEquals(id, result);
	}
}
