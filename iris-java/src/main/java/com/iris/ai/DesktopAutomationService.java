package com.iris.ai;

import java.awt.AWTException;
import java.awt.Robot;
import java.awt.event.KeyEvent;
import java.io.IOException;

public class DesktopAutomationService {
    private Robot robot;

    public DesktopAutomationService() {
        try {
            this.robot = new Robot();
        } catch (AWTException e) {
            System.err.println("Failed to initialize Robot for Desktop Automation: " + e.getMessage());
        }
    }

    /**
     * Opens an application by name (Windows specific logic)
     */
    public void openApplication(String appName) {
        System.out.println("[IRIS] Opening application: " + appName);
        try {
            // Use Windows 'start' command
            new ProcessBuilder("cmd", "/c", "start", appName).start();
        } catch (IOException e) {
            System.err.println("Failed to open application: " + e.getMessage());
        }
    }

    /**
     * Types a given text on the keyboard using Robot
     */
    public void typeText(String text) {
        if (robot == null) return;
        System.out.println("[IRIS] Typing text: " + text);
        for (char c : text.toCharArray()) {
            int keyCode = KeyEvent.getExtendedKeyCodeForChar(c);
            if (KeyEvent.CHAR_UNDEFINED == keyCode) {
                throw new RuntimeException("Key code not found for character '" + c + "'");
            }
            robot.keyPress(keyCode);
            robot.keyRelease(keyCode);
            robot.delay(10);
        }
    }

    /**
     * Simulates pressing the Enter key
     */
    public void pressEnter() {
        if (robot == null) return;
        robot.keyPress(KeyEvent.VK_ENTER);
        robot.keyRelease(KeyEvent.VK_ENTER);
    }
}
