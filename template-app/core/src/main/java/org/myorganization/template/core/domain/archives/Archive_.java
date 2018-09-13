package org.myorganization.template.core.domain.archives;

import javax.persistence.metamodel.SingularAttribute;
import javax.persistence.metamodel.StaticMetamodel;

@StaticMetamodel(Archive.class)
public class Archive_ {

	public static volatile SingularAttribute<Archive, Integer> id;
	public static volatile SingularAttribute<Archive, String> filename;
	public static volatile SingularAttribute<Archive, String> filetype;
	public static volatile SingularAttribute<Archive, Long> size;
	
}
