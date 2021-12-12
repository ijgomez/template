package org.myorganization.template.core.helper;

import java.lang.reflect.InvocationTargetException;
import java.lang.reflect.Method;
import java.util.Base64;
import java.util.List;

public class FileHelper {
	
	public static byte[] decode64(String src) {
		return Base64.getDecoder().decode(src);
	}
	
	public static byte[] toCsvByteArray(List<?> objects) throws IllegalAccessException, IllegalArgumentException, InvocationTargetException {

		Class<?> classType = objects.get(0).getClass();

		StringBuilder builder = new StringBuilder();
		Method[] methods = classType.getDeclaredMethods();

		for (Method m : methods) {
			if (m.getParameterTypes().length == 0) {
				if (m.getName().startsWith("get")) {
					builder.append(m.getName().substring(3)).append(',');
				} else if (m.getName().startsWith("is")) {
					builder.append(m.getName().substring(2)).append(',');
				}

			}

		}
		builder.deleteCharAt(builder.length() - 1);
		builder.append('\n');
		for (Object object : objects) {
			for (Method m : methods) {
				if (m.getParameterTypes().length == 0) {
					if (m.getName().startsWith("get") || m.getName().startsWith("is")) {
						//builder.append(m.invoke(object).toString()).append(',');
					}
				}
			}
			builder.append('\n');
		}
		builder.deleteCharAt(builder.length() - 1);
		return builder.toString().getBytes();
	}
	
	private FileHelper() { }
	
}
