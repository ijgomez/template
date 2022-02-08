package org.myorganization.template.core.helper;

import java.io.ByteArrayOutputStream;
import java.io.IOException;
import java.io.OutputStreamWriter;
import java.util.Base64;
import java.util.List;

import com.opencsv.CSVWriter;
import com.opencsv.bean.StatefulBeanToCsv;
import com.opencsv.bean.StatefulBeanToCsvBuilder;
import com.opencsv.exceptions.CsvException;

/**
 * Class with commons operations over or about files.
 * 
 * @author ijgomez
 *
 */
public class FileHelper {
	
	public static byte[] decode64(String src) {
		return Base64.getDecoder().decode(src);
	}
	
	public static <T> byte[] toByteArray(List<T> objects) throws CsvException, IOException {
		var stream = new ByteArrayOutputStream();
	    var streamWriter = new OutputStreamWriter(stream);
	    var writer = new CSVWriter(streamWriter);

	    StatefulBeanToCsv<T> beanToCsv = new StatefulBeanToCsvBuilder<T>(writer).build();
	    beanToCsv.write(objects);
	    streamWriter.flush();
	    
	    return stream.toByteArray();
	}

	/**
	 * New Instance.
	 */
	private FileHelper() { }

}
