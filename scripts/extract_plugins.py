#!/usr/bin/env python3
"""
JDownloader 2 Plugin & Domain Database Extractor
Scans JDownloader 2 plugins (decrypter & hoster) and updates database.json.
"""

import os
import sys
import subprocess
import json

def run_extraction():
    jd_home = r'C:\Users\Duy\AppData\Local\JDownloader 2'
    if not os.path.isdir(jd_home):
        print(f"Error: JDownloader 2 directory not found at: {jd_home}")
        sys.exit(1)

    script_dir = os.path.dirname(os.path.abspath(__file__))
    project_dir = os.path.dirname(script_dir)
    scratch_dir = os.path.join(project_dir, 'scratch_build')
    os.makedirs(scratch_dir, exist_ok=True)

    java_file = os.path.join(scratch_dir, 'ExtractAllPlugins.java')
    
    # Generate Java extractor code
    java_src = r'''import org.jdownloader.plugins.controller.crawler.CrawlerPluginController;
import org.jdownloader.plugins.controller.crawler.LazyCrawlerPlugin;
import org.jdownloader.plugins.controller.host.HostPluginController;
import org.jdownloader.plugins.controller.host.LazyHostPlugin;

import java.io.File;
import java.io.FileOutputStream;
import java.io.OutputStreamWriter;
import java.nio.charset.StandardCharsets;
import java.util.*;

public class ExtractAllPlugins {
    public static String classNameToDomain(String name) {
        if (name == null || name.isEmpty()) return "";
        String clean = name.replaceAll("(?i)(Crawler|Folder|Hoster|Decrypter|Gallery|Video|ComV2.*|V2)$", "");
        if (clean.isEmpty()) clean = name;

        String[] tlds = {"Com", "Net", "Org", "Nz", "Vn", "Io", "Me", "Co", "To", "Tv", "Cc", "Ru", "De", "Fr", "Uk", "Us", "Info", "Biz", "Sx", "Xyz", "Top", "Pl", "La", "My", "In", "Eu", "Es", "It", "Pt", "Ro", "Ch", "At", "Be", "Nl", "Se", "No", "Fi", "Dk", "Cz", "Sk", "Hu", "Gr", "Tr", "Ua", "By", "Kz", "Jp", "Kr", "Cn", "Hk", "Tw", "Sg", "Th", "Ph", "Id", "Br", "Mx", "Ar", "Cl", "Za", "Link", "Site", "Online", "Store", "Club", "Vip", "Pro", "App", "Dev", "Tech", "Space", "Cloud", "Live", "Life", "World", "Zone", "Fun", "Tube", "Porn", "Sex", "Adult"};

        for (String tld : tlds) {
            if (clean.endsWith(tld) && clean.length() > tld.length()) {
                String domainPart = clean.substring(0, clean.length() - tld.length());
                return domainPart.toLowerCase() + "." + tld.toLowerCase();
            }
        }
        return clean.toLowerCase();
    }

    public static void main(String[] args) {
        try {
            Map<String, Set<String>> domainToTypes = new TreeMap<>();
            Map<String, String> domainToPlugin = new HashMap<>();
            Set<String> allDomains = new TreeSet<>();

            Collection<LazyHostPlugin> hostPlugins = HostPluginController.getInstance().list();
            if (hostPlugins != null) {
                for (LazyHostPlugin p : hostPlugins) {
                    Set<String> domains = new TreeSet<>();
                    if (p.getHost() != null && !p.getHost().trim().isEmpty()) domains.add(p.getHost().trim().toLowerCase());
                    if (p.getSitesSupported() != null) {
                        for (String s : p.getSitesSupported()) {
                            if (s != null && !s.trim().isEmpty()) domains.add(s.trim().toLowerCase());
                        }
                    }
                    for (String d : domains) {
                        allDomains.add(d);
                        domainToTypes.computeIfAbsent(d, k -> new TreeSet<>()).add("hoster");
                        domainToPlugin.putIfAbsent(d, p.getClassName());
                    }
                }
            }

            Collection<LazyCrawlerPlugin> crawlerPlugins = CrawlerPluginController.getInstance().list();
            if (crawlerPlugins != null) {
                for (LazyCrawlerPlugin p : crawlerPlugins) {
                    Set<String> domains = new TreeSet<>();
                    if (p.getHost() != null && !p.getHost().trim().isEmpty()) domains.add(p.getHost().trim().toLowerCase());
                    if (p.getSitesSupported() != null) {
                        for (String s : p.getSitesSupported()) {
                            if (s != null && !s.trim().isEmpty()) domains.add(s.trim().toLowerCase());
                        }
                    }
                    for (String d : domains) {
                        allDomains.add(d);
                        domainToTypes.computeIfAbsent(d, k -> new TreeSet<>()).add("decrypter");
                        domainToPlugin.putIfAbsent(d, p.getClassName());
                    }
                }
            }

            File jdHome = new File("''' + jd_home.replace('\\', '\\\\') + r'''");
            File decFolder = new File(jdHome, "jd/plugins/decrypter");
            File hostFolder = new File(jdHome, "jd/plugins/hoster");

            if (decFolder.exists()) {
                for (File f : decFolder.listFiles()) {
                    if (f.getName().endsWith(".class") && !f.getName().contains("$")) {
                        String name = f.getName().substring(0, f.getName().length() - 6);
                        String guessed = classNameToDomain(name);
                        if (guessed.contains(".")) {
                            allDomains.add(guessed);
                            domainToTypes.computeIfAbsent(guessed, k -> new TreeSet<>()).add("decrypter");
                            domainToPlugin.putIfAbsent(guessed, "jd.plugins.decrypter." + name);
                        }
                    }
                }
            }

            if (hostFolder.exists()) {
                for (File f : hostFolder.listFiles()) {
                    if (f.getName().endsWith(".class") && !f.getName().contains("$")) {
                        String name = f.getName().substring(0, f.getName().length() - 6);
                        String guessed = classNameToDomain(name);
                        if (guessed.contains(".")) {
                            allDomains.add(guessed);
                            domainToTypes.computeIfAbsent(guessed, k -> new TreeSet<>()).add("hoster");
                            domainToPlugin.putIfAbsent(guessed, "jd.plugins.hoster." + name);
                        }
                    }
                }
            }

            StringBuilder sb = new StringBuilder();
            sb.append("{\n  \"total\": ").append(allDomains.size()).append(",\n  \"domains\": {\n");

            int idx = 0;
            int total = allDomains.size();
            for (String domain : allDomains) {
                idx++;
                sb.append("    \"").append(domain).append("\": {");
                Set<String> types = domainToTypes.get(domain);
                sb.append("\"types\": [");
                if (types != null) {
                    int tIdx = 0;
                    for (String t : types) {
                        if (tIdx++ > 0) sb.append(", ");
                        sb.append("\"").append(t).append("\"");
                    }
                }
                sb.append("]");
                String plugin = domainToPlugin.get(domain);
                if (plugin != null) {
                    String pShort = plugin.contains(".") ? plugin.substring(plugin.lastIndexOf('.') + 1) : plugin;
                    sb.append(", \"plugin\": \"").append(pShort).append("\"");
                }
                sb.append("}");
                if (idx < total) sb.append(",");
                sb.append("\n");
            }
            sb.append("  }\n}\n");

            File outFile = new File("''' + os.path.join(project_dir, 'database.json').replace('\\', '\\\\') + r'''");
            try (OutputStreamWriter writer = new OutputStreamWriter(new FileOutputStream(outFile), StandardCharsets.UTF_8)) {
                writer.write(sb.toString());
            }
            System.out.println("SUCCESS: " + allDomains.size() + " domains written to " + outFile.getAbsolutePath());
        } catch (Throwable t) {
            t.printStackTrace();
        }
    }
}
'''
    with open(java_file, 'w', encoding='utf-8') as f:
        f.write(java_src)

    cp = f"{os.path.join(jd_home, 'Core.jar')};{os.path.join(jd_home, 'JDownloader.jar')};{os.path.join(jd_home, 'libs', '*')}"

    print("Compiling Java extractor...")
    subprocess.run(['javac', '-cp', cp, '-d', scratch_dir, java_file], check=True)

    print("Executing extraction...")
    full_cp = f"{scratch_dir};{cp}"
    subprocess.run(['java', '-cp', full_cp, 'ExtractAllPlugins'], cwd=jd_home, check=True)

if __name__ == '__main__':
    run_extraction()
