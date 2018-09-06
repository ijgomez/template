package org.myorganization.template.core.lock;

import java.util.Arrays;

import org.aspectj.lang.ProceedingJoinPoint;
import org.aspectj.lang.annotation.Around;
import org.aspectj.lang.annotation.Aspect;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Component;

@Aspect
@Component
public class LockAspect {
	
	private static final Logger LOGGER = LoggerFactory.getLogger(LockAspect.class);

	@Around("execution(* *(..)) && @annotation(lock)")
	public Object lockAround(ProceedingJoinPoint joinPoint, Lock lock) throws Throwable {

		long t = System.currentTimeMillis();
		LOGGER.debug(">>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>");
		LOGGER.debug("annotation: {}", lock);
		LOGGER.debug("jointPoint: {}", joinPoint);
		LOGGER.debug("method: {}", joinPoint.getSignature().getName());
		LOGGER.debug("arguments: {}", Arrays.toString(joinPoint.getArgs()));
		
		Object o = joinPoint.proceed();
		
		LOGGER.debug("time executed: {} milliseconds", (System.currentTimeMillis() - t));
		LOGGER.debug("<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<");

		return o;

	}
}
