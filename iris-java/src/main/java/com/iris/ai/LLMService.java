package com.iris.ai;

/**
 * Mock LLM Service that simulates intent extraction from natural language.
 * In production, this would make an HTTP request to an LLM like Gemini or OpenAI.
 */
public class LLMService {
    
    public static class Intent {
        public String action; // e.g., "OPEN_APP", "TYPE_TEXT"
        public String parameter; // e.g., "notepad", "hello world"
    }

    public Intent extractIntent(String text) {
        Intent intent = new Intent();
        text = text.toLowerCase().trim();
        
        System.out.println("[LLM] Analyzing text: '" + text + "'");
        
        if (text.contains("open") || text.contains("launch")) {
            intent.action = "OPEN_APP";
            // naive extraction
            String[] words = text.split(" ");
            intent.parameter = words[words.length - 1]; 
        } else if (text.contains("type") || text.contains("write")) {
            intent.action = "TYPE_TEXT";
            intent.parameter = text.replace("type", "").replace("write", "").trim();
        } else {
            intent.action = "UNKNOWN";
        }
        
        return intent;
    }
}
