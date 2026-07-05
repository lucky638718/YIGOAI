package com.iris.ai;

import java.util.Scanner;

public class Main {
    public static void main(String[] args) {
        System.out.println("=========================================");
        System.out.println("        IRIS AI - CORE ACTIVATED");
        System.out.println("=========================================");
        
        DesktopAutomationService desktopService = new DesktopAutomationService();
        Scanner scanner = new Scanner(System.in);
        
        LLMService llmService = new LLMService();
        System.out.println("[IRIS] System is ready. Say something (type it here) or 'exit' to quit:");
        
        while (true) {
            System.out.print("[STT-Mock]> ");
            String input = scanner.nextLine().trim();
            
            if (input.equalsIgnoreCase("exit")) {
                System.out.println("[IRIS] Shutting down...");
                break;
            }
            
            // 1. STT gives us text (which is `input` here)
            // 2. Pass to LLM to understand intent
            LLMService.Intent intent = llmService.extractIntent(input);
            
            // 3. Execute intent
            if ("OPEN_APP".equals(intent.action)) {
                desktopService.openApplication(intent.parameter);
            } else if ("TYPE_TEXT".equals(intent.action)) {
                desktopService.typeText(intent.parameter);
                desktopService.pressEnter();
            } else {
                System.out.println("[IRIS] I'm sorry, I didn't understand that command.");
            }
        }
        
        scanner.close();
    }
}
