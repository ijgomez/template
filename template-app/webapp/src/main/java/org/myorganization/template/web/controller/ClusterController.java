package org.myorganization.template.web.controller;

import java.net.URI;
import java.util.List;
import java.util.Optional;

import org.myorganization.template.core.domain.system.cluster.ClusterNode;
import org.myorganization.template.core.domain.system.cluster.ClusterNodeCriteria;
import org.myorganization.template.core.services.system.ClusterNodeService;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.servlet.support.ServletUriComponentsBuilder;

@RestController
@RequestMapping("/api/cluster")
public class ClusterController {
	
	private static final Logger LOGGER = LoggerFactory.getLogger(ClusterController.class);
	
	@Autowired
	private ClusterNodeService clusterNodeService;
	
	@GetMapping
	public ResponseEntity<List<ClusterNode>> findAll() {
		List<ClusterNode> properties = clusterNodeService.findAll();
		if (properties.isEmpty()) {
			return ResponseEntity.noContent().build();
		}
		return ResponseEntity.ok(properties);
	}

	@PostMapping("/search")
	public ResponseEntity<List<ClusterNode>> findByCriteria(@RequestBody ClusterNodeCriteria criteria) {
		
		LOGGER.info("find by criteria: " + criteria);
		
		List<ClusterNode> properties = clusterNodeService.findByCriteria(criteria);
		if (properties.isEmpty()) {
			return ResponseEntity.noContent().build();
		}
		return ResponseEntity.ok(properties);
	}
	
	@PostMapping("/count")
	public ResponseEntity<Long> countByCriteria(@RequestBody ClusterNodeCriteria criteria) {
		
		LOGGER.info("find by criteria: " + criteria);
		
		Long records = clusterNodeService.countByCriteria(criteria);

		return ResponseEntity.ok(records);
	}
	
	@PostMapping
	public ResponseEntity<ClusterNode> create(@RequestBody ClusterNode clusterNode) {
		clusterNode = clusterNodeService.create(clusterNode);
		
		if (clusterNode == null) {
			return ResponseEntity.noContent().build();
		}

		URI location = ServletUriComponentsBuilder.fromCurrentRequest().path("/{id}").buildAndExpand(clusterNode.getId()).toUri();
		return ResponseEntity.created(location).build();
	}

	@GetMapping("/{id}")
	public ResponseEntity<ClusterNode> read(@PathVariable("id") Long id) {
		Optional<ClusterNode> clusterNode = this.clusterNodeService.read(id);
		if (clusterNode.isPresent()) {
			return ResponseEntity.ok(clusterNode.get());
		}
		return ResponseEntity.notFound().build();
	}
	
	@PutMapping("/{id}")
	public ResponseEntity<ClusterNode> update(@PathVariable Long id, @RequestBody ClusterNode clusterNode) {
		
		LOGGER.info("update {} - {}", id, clusterNode);
		
		clusterNode = this.clusterNodeService.update(id, clusterNode);
		if (null == clusterNode) {
			return ResponseEntity.notFound().build();
		}

		return ResponseEntity.ok(clusterNode);
	}
	
	@DeleteMapping("/{id}")
	public ResponseEntity<Long> delete(@PathVariable("id") Long id) {
		
		if (null == this.clusterNodeService.delete(id)) {
			return ResponseEntity.notFound().build();
		}

		return ResponseEntity.ok(id);
	}
}
