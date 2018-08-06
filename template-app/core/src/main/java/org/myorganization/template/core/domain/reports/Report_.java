package org.myorganization.template.core.domain.reports;

import javax.persistence.metamodel.SingularAttribute;
import javax.persistence.metamodel.StaticMetamodel;

@StaticMetamodel(Report.class)
public class Report_ {

	public static volatile SingularAttribute<Report, Integer> id;
	public static volatile SingularAttribute<Report, String> name;
	public static volatile SingularAttribute<Report, String> description;
	
}
