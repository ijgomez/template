package org.myorganization.template.cluster.helper;

import java.net.InetAddress;
import java.net.UnknownHostException;

public class ClusterHelper {
	
	public static String getLocalHostName() throws UnknownHostException {
        return InetAddress.getLocalHost().getHostName();
    }
	
	public static String getLocalIp() throws UnknownHostException {
        var ip = "";
        final var inetAddress = InetAddress.getLocalHost();
        final byte[] address = inetAddress.getAddress();
        for (var i = 0; i < address.length; i++) {
            if (i > 0) {
                ip += ".";
            }
            ip += address[i] & 0xFF;
        }
        return ip;
    }
	
	private ClusterHelper() { }

}
