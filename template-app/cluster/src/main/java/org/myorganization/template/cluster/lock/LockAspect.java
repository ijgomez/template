package org.myorganization.template.cluster.lock;

import java.util.Arrays;

import org.aspectj.lang.ProceedingJoinPoint;
import org.aspectj.lang.annotation.Around;
import org.aspectj.lang.annotation.Aspect;
import org.springframework.stereotype.Component;

import lombok.extern.slf4j.Slf4j;

@Aspect
@Component
@Slf4j
public class LockAspect {
	
	@Around("execution(* *(..)) && @annotation(lock)")
	public Object lockAround(ProceedingJoinPoint joinPoint, Lock lock) throws Throwable {

		long t = System.currentTimeMillis();
		log.debug(">>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>");
		log.debug("annotation: {}", lock);
		log.debug("jointPoint: {}", joinPoint);
		log.debug("method: {}", joinPoint.getSignature().getName());
		log.debug("arguments: {}", Arrays.toString(joinPoint.getArgs()));
		
		Object o = joinPoint.proceed();
		
		log.debug("time executed: {} milliseconds", (System.currentTimeMillis() - t));
		log.debug("<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<");

		return o;

	}
}
