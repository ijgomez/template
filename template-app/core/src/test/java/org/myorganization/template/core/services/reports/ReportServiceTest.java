package org.myorganization.template.core.services.reports;

import static org.junit.Assert.assertEquals;
import static org.junit.Assert.assertNotNull;
import static org.junit.Assert.assertNull;

import java.util.List;

import javax.transaction.Transactional;

import org.junit.Before;
import org.junit.Test;
import org.junit.runner.RunWith;
import org.myorganization.template.core.domain.reports.Report;
import org.myorganization.template.core.testing.TestEntityFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.context.annotation.Profile;
import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.test.context.ContextConfiguration;
import org.springframework.test.context.junit4.SpringRunner;

@RunWith(SpringRunner.class)
@ContextConfiguration({"classpath:applicationContext-test.xml"})
@Profile("test")
@Transactional
public class ReportServiceTest {
	
	@Autowired
	private ReportService reportService;

	@Autowired
	private TestEntityFactory testEntityFactory;
	
	@Before
	public void setup() {

	}
	
	@Test
	public void testFindAll() throws Exception {
		for (int i = 0; i <= 50; i++) {
			this.reportService.create(this.testEntityFactory.generateReport((long) (i+1)));
		}
		
		
		List<Report> data = this.reportService.findAll();
		
		assertNotNull(data);
		assertEquals(50, data.size());
		for (Report report : data) {
			assertNotNull(report.getId());
			assertNotNull(report.getName());
		}

	}
	
	@Test
	public void testFindAllEmpty() throws Exception {

		List<Report> data = this.reportService.findAll();
		
		assertNotNull(data);
		assertEquals(0, data.size());

	}

	@Test
	public void testCreate() throws Exception {
		


		Report report = this.testEntityFactory.generateReport();
		
		assertNotNull(report);
		assertNull(report.getId());
		assertNotNull(report.getName());
		
		Report entity = this.reportService.create(report);
		
		assertNotNull(entity);
		assertEquals(report, entity);
		assertNotNull(entity.getId());
		assertNotNull(entity.getName());


	}
	
	@Test(expected=DataIntegrityViolationException.class)
	public void testCreateNullFields() throws Exception {

		Report report = new Report();
		
		assertNotNull(report);
		assertNull(report.getId());
		assertNull(report.getName());
		
		this.reportService.create(report);

	}

	@Test
	public void testRead() throws Exception {
		Report r = this.reportService.create(this.testEntityFactory.generateReport(1L));

		Report report = this.reportService.read(r.getId()).get();
		
		assertNotNull(report);
		assertNotNull(report.getId());
		assertEquals(r.getId(), report.getId());
		assertNotNull(report.getName());
	}
	
	@Test
	public void testReadNotFound() throws Exception {
		Report r = this.reportService.create(this.testEntityFactory.generateReport(1L));

		Report report = this.reportService.read(r.getId() + 1).get();
		
		assertNull(report);
	}

	@Test
	public void testUpdate() throws Exception {
		Report r = this.reportService.create(this.testEntityFactory.generateReport(1L));
		
		Report report = this.reportService.read(r.getId()).get();
		
		assertNotNull(report);
		assertNotNull(report.getId());
		assertNotNull(report.getName());
		
		report.setName(this.testEntityFactory.random());
		
		Report entity = this.reportService.update(r.getId(), report);
		
		assertNotNull(entity);
		assertNotNull(entity.getId());
		assertNotNull(entity.getName());
		assertEquals(report.getName(), entity.getName());
	}
	
	@Test
	public void testUpdateNotFound() throws Exception {
		Report r = this.reportService.create(this.testEntityFactory.generateReport(1L));
		
		Report report = this.reportService.read(r.getId()).get();
		
		assertNotNull(report);
		assertNotNull(report.getId());
		assertNotNull(report.getName());
		
		report.setName(this.testEntityFactory.random());

		Report entity = this.reportService.update(r.getId() + 1, report);
		
		assertNull(entity);
		
	}

	@Test
	public void testDelete() throws Exception {

		Report r = this.reportService.create(this.testEntityFactory.generateReport(1L));

		Long result = this.reportService.delete(r.getId());
		assertEquals(r.getId(), result);
	}
}
