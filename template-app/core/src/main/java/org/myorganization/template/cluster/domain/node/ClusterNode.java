package org.myorganization.template.cluster.domain.node;

import java.time.LocalDateTime;

import javax.persistence.Column;
import javax.persistence.Entity;
import javax.persistence.EnumType;
import javax.persistence.Enumerated;
import javax.persistence.GeneratedValue;
import javax.persistence.GenerationType;
import javax.persistence.Id;
import javax.persistence.SequenceGenerator;
import javax.persistence.Table;
import javax.persistence.UniqueConstraint;

import org.myorganization.template.cluster.enums.ClusterNodeStatus;
import org.myorganization.template.core.domain.base.TemplateEntity;
import org.myorganization.template.core.domain.base.TemplateEntityBase;
import org.springframework.validation.annotation.Validated;

import lombok.Data;
import lombok.EqualsAndHashCode;

@Entity
@Table(uniqueConstraints={@UniqueConstraint(name = "uk_cluster_node_hostname", columnNames={"hostname"})})
@Validated
@Data
@EqualsAndHashCode(callSuper=false)
public class ClusterNode extends TemplateEntityBase implements TemplateEntity {

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

	@Enumerated(EnumType.STRING)
	@Column(nullable = false)
	private ClusterNodeStatus status;
	
	@Column(nullable = false)
	private Long usedMemory;
	
	@Column(nullable = false)
	private Long totalMemory;

}
