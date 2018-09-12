package org.myorganization.template.core.domain.base;


import java.lang.reflect.ParameterizedType;

import java.util.List;

import javax.persistence.EntityManager;
import javax.persistence.PersistenceContext;
import javax.persistence.TypedQuery;
import javax.persistence.criteria.CriteriaBuilder;
import javax.persistence.criteria.CriteriaQuery;
import javax.persistence.criteria.Predicate;
import javax.persistence.criteria.Root;

public abstract class RepositoryQueriesBase<E, C extends Criteria> {

	@PersistenceContext
    private EntityManager entityManager;
	
	protected Class<E> entityClass;
	
	@SuppressWarnings("unchecked")
	public RepositoryQueriesBase() {
		this.entityClass = (Class<E>) ((ParameterizedType) getClass().getGenericSuperclass()).getActualTypeArguments()[0];
	}

	public List<E> findByCriteria(C criteria) {
		CriteriaBuilder builder;
		CriteriaQuery<E> criteriaQuery;
		Root<E> root;
		TypedQuery<E> query;
		
		builder = entityManager.getCriteriaBuilder();
		criteriaQuery = builder.createQuery(this.entityClass);
		
		root = criteriaQuery.from(this.entityClass);
		criteriaQuery.select(root);
		
		List<Predicate> predicates = this.toWhereClause(criteria, builder, root);
		
		if (predicates != null && !predicates.isEmpty()) {
			criteriaQuery.where(predicates.toArray(new Predicate[predicates.size()]));
		}
		
		if (criteria != null && criteria.getSortField() != null && criteria.getSortOrder() != null) {
			if (criteria.getSortOrder().equalsIgnoreCase("ASC")) {
				criteriaQuery.orderBy(builder.asc(root.get(criteria.getSortField())));
			} else {
				criteriaQuery.orderBy(builder.desc(root.get(criteria.getSortField())));
			}
			
		}

		query = entityManager.createQuery(criteriaQuery);
		
		if (criteria != null && criteria.getPageNumber() != null && criteria.getPageSize() != null) {
			//query.setFirstResult(criteria.getPageNumber() * criteria.getPageSize());
			query.setFirstResult(criteria.getPageNumber());
			query.setMaxResults(criteria.getPageSize());
		}
		
		return query.getResultList();
	}

	public Long countByCriteria(C criteria) {
		CriteriaBuilder builder;
		CriteriaQuery<Long> criteriaQuery;
		Root<E> root;
		TypedQuery<Long> query;
		
		builder = entityManager.getCriteriaBuilder();
		criteriaQuery = builder.createQuery(Long.class);
		
		root = criteriaQuery.from(this.entityClass);
		criteriaQuery.select(builder.count(root));
		
		List<Predicate> predicates = this.toWhereClause(criteria, builder, root);
		
		if (predicates != null && !predicates.isEmpty()) {
			criteriaQuery.where(predicates.toArray(new Predicate[predicates.size()]));
		}
		
		query = entityManager.createQuery(criteriaQuery);

		return query.getSingleResult().longValue();
	}
	
	protected abstract List<Predicate> toWhereClause(C criteria, CriteriaBuilder builder, Root<E> root);
}
