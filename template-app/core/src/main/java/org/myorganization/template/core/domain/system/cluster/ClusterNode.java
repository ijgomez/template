package org.myorganization.template.core.domain.system.cluster;

import java.time.LocalDateTime;

import javax.persistence.Column;
import javax.persistence.Entity;
import javax.persistence.GeneratedValue;
import javax.persistence.GenerationType;
import javax.persistence.Id;
import javax.persistence.SequenceGenerator;

import org.myorganization.template.core.domain.base.TemplateEntity;

import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Entity
@Getter @Setter @NoArgsConstructor
public class ClusterNode extends TemplateEntity {

	@Id
	@GeneratedValue(strategy = GenerationType.SEQUENCE, generator = "cluster_node_seq")
	@SequenceGenerator(name = "cluster_node_seq", sequenceName = "cluster_node_seq", allocationSize = 1)
	private Long id;

	@Column(nullable = false)
	private String ip;
	
	@Column(nullable = false)
	private String hostname;
	
	@Column(nullable = false)
	private LocalDateTime startDatetime;
	
	@Column(nullable = false)
	private LocalDateTime lastUpdateTime;

	@Column(nullable = false)
	private ClusterNodeStatus status;
	
	@Column(nullable = false)
	private Long usedMemory;
	
	@Column(nullable = false)
	private Long totalMemory;

}
