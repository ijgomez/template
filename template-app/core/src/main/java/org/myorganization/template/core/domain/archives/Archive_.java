package org.myorganization.template.core.domain.archives;

import javax.persistence.metamodel.SingularAttribute;
import javax.persistence.metamodel.StaticMetamodel;

import org.myorganization.template.core.domain.reports.Report;

@StaticMetamodel(Archive.class)
@SuppressWarnings({"squid:S1118", "squid:S101", "squid:S3077", "squid:S1104", "squid:S1444"})
public class Archive_ {

	public static volatile SingularAttribute<Archive, Integer> id;
	public static volatile SingularAttribute<Archive, String> filename;
	public static volatile SingularAttribute<Archive, String> filetype;
	public static volatile SingularAttribute<Archive, Long> size;
	public static volatile SingularAttribute<Archive, Report> report;
	public static volatile SingularAttribute<Archive, Long> value;
	
}
