package com.jacy.t;

import org.openqa.selenium.By;
import org.openqa.selenium.WebDriver;
import org.openqa.selenium.firefox.FirefoxDriver;
import org.openqa.selenium.support.ui.ExpectedCondition;
import org.openqa.selenium.support.ui.WebDriverWait;

public class SeleniumTest {
public static void main(String[] args) {
	WebDriver driver = new FirefoxDriver();
	driver.get("https://twitter.com");
	(new WebDriverWait(driver, 300)).until(new ExpectedCondition<Boolean>() {
        public Boolean apply(WebDriver d) {
            return d.findElement(By.linkText("johnson")).isDisplayed();
        }
    });
	System.out.println("=======================");
	driver.findElement(By.linkText("johnson")).click();
}
}
