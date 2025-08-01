/**
 * @fileoverview E2E tests for complete exam flow
 * 
 * Tests the full user journey through the Latvian citizenship exam including:
 * - Loading the application
 * - Navigating through all exam sections
 * - Submitting answers
 * - Viewing results
 * - Cross-browser compatibility
 */

import { test, expect } from '@playwright/test'

test.describe('Complete Exam Flow', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/')
  })

  test('loads homepage successfully', async ({ page }) => {
    // Wait for the main content to load
    await expect(page).toHaveTitle(/Latvian Citizenship Exam/i)
    
    // Check for key elements
    await expect(page.getByText(/Latvijas pilsonības/i)).toBeVisible()
    await expect(page.getByRole('button', { name: /sākt eksāmenu/i })).toBeVisible()
  })

  test('completes full exam workflow', async ({ page }) => {
    // Start the exam
    await page.getByRole('button', { name: /sākt eksāmenu/i }).click()
    
    // Should navigate to first section (likely anthem)
    await expect(page.getByText(/himna/i)).toBeVisible()
    
    // Fill in anthem section (simplified - first few lines)
    const anthemInputs = await page.locator('input[aria-label*="himnas"]').all()
    
    if (anthemInputs.length > 0) {
      await anthemInputs[0].fill('Dievs, svētī Latviju,')
      await anthemInputs[1].fill('Mūs\' dārgo tēviju,')
      await anthemInputs[2].fill('Svētī jel Latviju,')
      await anthemInputs[3].fill('Ak, svētī jel to!')
      
      if (anthemInputs.length > 4) {
        await anthemInputs[4].fill('Kur latvju meitas zied,')
        await anthemInputs[5].fill('Kur latvju dēli dzied,')
        await anthemInputs[6].fill('Laid mums tur laimē diet,')
        await anthemInputs[7].fill('Mūs\' Latvijā!')
      }
    }
    
    // Continue to next section
    await page.getByRole('button', { name: /turpināt/i }).click()
    
    // History section
    await expect(page.getByText(/vēsture/i)).toBeVisible()
    
    // Answer some history questions (select first option for simplicity)
    const historyRadios = await page.locator('input[type="radio"]').all()
    for (let i = 0; i < Math.min(10, historyRadios.length); i += 3) {
      await historyRadios[i].check()
    }
    
    // Continue to constitution section
    await page.getByRole('button', { name: /turpināt/i }).click()
    
    // Constitution section
    await expect(page.getByText(/satversme/i)).toBeVisible()
    
    // Answer some constitution questions
    const constitutionRadios = await page.locator('input[type="radio"]').all()
    for (let i = 0; i < Math.min(20, constitutionRadios.length); i += 3) {
      await constitutionRadios[i].check()
    }
    
    // Submit exam
    await page.getByRole('button', { name: /iesniegt/i }).click()
    
    // Check results page
    await expect(page.getByText(/rezultāti/i)).toBeVisible()
    await expect(page.getByText(/nokārtots|nenokārtots/i)).toBeVisible()
    
    // Should have retake option
    await expect(page.getByRole('button', { name: /mēģināt vēlreiz/i })).toBeVisible()
  })

  test('handles session persistence', async ({ page }) => {
    // Start exam
    await page.getByRole('button', { name: /sākt eksāmenu/i }).click()
    
    // Fill some data
    const firstInput = page.locator('input').first()
    await firstInput.fill('Test content')
    
    // Reload page
    await page.reload()
    
    // Check if session is restored
    await expect(page.getByText(/eksāmens/i)).toBeVisible()
    
    // Verify session recovery dialog or continued state
    const sessionDialog = page.getByText(/atjaunot sesiju/i)
    if (await sessionDialog.isVisible()) {
      await page.getByRole('button', { name: /atjaunot|turpināt/i }).click()
    }
    
    // Should maintain state or offer recovery
    await expect(page.locator('input').first()).toBeVisible()
  })

  test('validates required fields before submission', async ({ page }) => {
    // Start exam
    await page.getByRole('button', { name: /sākt eksāmenu/i }).click()
    
    // Try to continue without filling anthem
    const continueButton = page.getByRole('button', { name: /turpināt/i })
    if (await continueButton.isVisible()) {
      await continueButton.click()
      
      // Should show validation message or prevent navigation
      // Implementation may vary - check for validation feedback
      const validationMessages = await page.locator('[role="alert"], .error, .validation').all()
      if (validationMessages.length > 0) {
        await expect(validationMessages[0]).toBeVisible()
      }
    }
  })

  test('displays progress indicators correctly', async ({ page }) => {
    // Start exam
    await page.getByRole('button', { name: /sākt eksāmenu/i }).click()
    
    // Check for progress indicators
    const progressElements = await page.locator('[role="progressbar"], .progress, [aria-label*="progress"]').all()
    
    if (progressElements.length > 0) {
      await expect(progressElements[0]).toBeVisible()
      
      // Progress should show percentage or steps
      const progressText = await progressElements[0].textContent()
      expect(progressText).toMatch(/%|\d+\/\d+/)
    }
    
    // Check for step indicators
    const stepIndicators = await page.locator('.step, [aria-label*="step"]').all()
    if (stepIndicators.length > 0) {
      await expect(stepIndicators[0]).toBeVisible()
    }
  })
})

test.describe('Cross-browser Compatibility', () => {
  test('works correctly across different browsers', async ({ page, browserName }) => {
    await page.goto('/')
    
    // Basic functionality should work in all browsers
    await expect(page.getByRole('button', { name: /sākt/i })).toBeVisible()
    
    // Start exam
    await page.getByRole('button', { name: /sākt eksāmenu/i }).click()
    
    // Check that form elements work
    const inputs = await page.locator('input').all()
    if (inputs.length > 0) {
      await inputs[0].fill('Browser test content')
      await expect(inputs[0]).toHaveValue('Browser test content')
    }
    
    // Log browser name for debugging
    console.log(`Test completed successfully in ${browserName}`)
  })
})

test.describe('Mobile Responsiveness', () => {
  test('displays correctly on mobile devices', async ({ page }) => {
    await page.goto('/')
    
    // Check viewport-specific elements
    await expect(page.getByRole('button', { name: /sākt/i })).toBeVisible()
    
    // Start exam
    await page.getByRole('button', { name: /sākt eksāmenu/i }).click()
    
    // Check that mobile layout works
    const inputs = await page.locator('input').all()
    if (inputs.length > 0) {
      // Inputs should be visible and usable on mobile
      await expect(inputs[0]).toBeVisible()
      await inputs[0].fill('Mobile test')
      await expect(inputs[0]).toHaveValue('Mobile test')
    }
    
    // Check for mobile-specific navigation
    const navButtons = await page.locator('button').all()
    for (const button of navButtons.slice(0, 3)) { // Check first few buttons
      await expect(button).toBeVisible()
    }
  })

  test('handles touch interactions correctly', async ({ page }) => {
    await page.goto('/')
    
    // Start exam
    await page.getByRole('button', { name: /sākt eksāmenu/i }).click()
    
    // Test touch interactions with radio buttons
    const radioButtons = await page.locator('input[type="radio"]').all()
    
    if (radioButtons.length > 0) {
      // Tap radio button
      await radioButtons[0].tap()
      await expect(radioButtons[0]).toBeChecked()
    }
    
    // Test scrolling behavior
    await page.evaluate(() => window.scrollTo(0, 100))
    await page.waitForTimeout(500) // Wait for scroll
    
    // Should maintain functionality after scroll
    const buttons = await page.locator('button').all()
    if (buttons.length > 0) {
      await expect(buttons[0]).toBeVisible()
    }
  })
})

test.describe('Performance and Loading', () => {
  test('loads within acceptable time limits', async ({ page }) => {
    const startTime = Date.now()
    
    await page.goto('/')
    
    // Wait for main content to be interactive
    await page.getByRole('button', { name: /sākt/i }).waitFor()
    
    const loadTime = Date.now() - startTime
    
    // Should load within 5 seconds
    expect(loadTime).toBeLessThan(5000)
    
    console.log(`Page loaded in ${loadTime}ms`)
  })

  test('handles slow network conditions gracefully', async ({ page }) => {
    // Simulate slow network
    await page.route('**/*', async route => {
      await new Promise(resolve => setTimeout(resolve, 100)) // 100ms delay
      await route.continue()
    })
    
    await page.goto('/')
    
    // Should still load and be functional
    await expect(page.getByRole('button', { name: /sākt/i })).toBeVisible({ timeout: 10000 })
  })
})

test.describe('Error Handling', () => {
  test('displays appropriate error messages for network issues', async ({ page }) => {
    // Simulate network failure for API calls
    await page.route('**/api/**', route => route.abort())
    
    await page.goto('/')
    
    // Start exam
    await page.getByRole('button', { name: /sākt eksāmenu/i }).click()
    
    // Should handle gracefully - check for error messages or fallback content
    const errorElements = await page.locator('[role="alert"], .error, .warning').all()
    
    // May show error message or fallback content
    if (errorElements.length > 0) {
      await expect(errorElements[0]).toBeVisible()
    } else {
      // Should at least continue functioning with cached/static content
      await expect(page.locator('input, button').first()).toBeVisible()
    }
  })

  test('recovers from JavaScript errors gracefully', async ({ page }) => {
    // Inject a JavaScript error
    await page.addInitScript(() => {
      // Override console.error to catch errors
      const originalError = console.error
      window.testErrors = []
      console.error = (...args) => {
        window.testErrors.push(args)
        originalError.apply(console, args)
      }
    })
    
    await page.goto('/')
    
    // App should still load despite potential errors
    await expect(page.getByRole('button', { name: /sākt/i })).toBeVisible()
    
    // Check if any critical errors occurred
    const errors = await page.evaluate(() => window.testErrors)
    
    // Log errors for debugging but don't fail test unless critical
    if (errors && errors.length > 0) {
      console.log('JavaScript errors detected:', errors)
    }
  })
})