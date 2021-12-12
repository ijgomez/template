package org.myorganization.template.core.domain.reports;

import javax.persistence.metamodel.SingularAttribute;
import javax.persistence.metamodel.StaticMetamodel;

import org.myorganization.template.core.domain.archives.Archive;

@StaticMetamodel(Report.class)
@SuppressWarnings({"squid:S1118", "squid:S101", "squid:S3077", "squid:S1104", "squid:S1444"})
public class Report_ {
	
	public static volatile SingularAttribute<Report, Integer> id;
	public static volatile SingularAttribute<Report, String> name;
	public static volatile SingularAttribute<Report, String> description;
	public static volatile SingularAttribute<Report, Archive> archive;
	
}