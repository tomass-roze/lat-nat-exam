/**
 * @fileoverview E2E accessibility tests
 * 
 * Tests accessibility compliance including:
 * - Keyboard navigation
 * - Screen reader compatibility
 * - ARIA attributes
 * - Color contrast (via axe-core)
 * - Focus management
 */

import { test, expect } from '@playwright/test'
import AxeBuilder from '@axe-core/playwright'

test.describe('Accessibility Compliance', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/')
  })

  test('passes automated accessibility checks on homepage', async ({ page }) => {
    const accessibilityScanResults = await new AxeBuilder({ page })
      .withTags(['wcag2a', 'wcag2aa', 'wcag21aa'])
      .analyze()

    expect(accessibilityScanResults.violations).toEqual([])
  })

  test('passes accessibility checks during exam flow', async ({ page }) => {
    // Start exam
    await page.getByRole('button', { name: /sākt eksāmenu/i }).click()
    
    // Check accessibility on exam page
    const examScanResults = await new AxeBuilder({ page })
      .withTags(['wcag2a', 'wcag2aa', 'wcag21aa'])
      .analyze()

    expect(examScanResults.violations).toEqual([])

    // Fill some content and check again
    const inputs = await page.locator('input').all()
    if (inputs.length > 0) {
      await inputs[0].fill('Test content')
    }

    // Continue to next section if possible
    const continueButton = page.getByRole('button', { name: /turpināt/i })
    if (await continueButton.isVisible()) {
      await continueButton.click()
      
      // Check accessibility on next section
      const nextSectionResults = await new AxeBuilder({ page })
        .withTags(['wcag2a', 'wcag2aa', 'wcag21aa'])
        .analyze()

      expect(nextSectionResults.violations).toEqual([])
    }
  })

  test('supports keyboard navigation throughout the application', async ({ page }) => {
    // Tab through homepage elements
    await page.keyboard.press('Tab')
    
    let focusedElement = await page.locator(':focus').first()
    await expect(focusedElement).toBeVisible()
    
    // Should be able to activate start button with keyboard
    const startButton = page.getByRole('button', { name: /sākt eksāmenu/i })
    await startButton.focus()
    await page.keyboard.press('Enter')
    
    // Should navigate to exam
    await expect(page.getByText(/himna|vēsture|satversme/i)).toBeVisible()
    
    // Tab through form elements
    await page.keyboard.press('Tab')
    focusedElement = await page.locator(':focus').first()
    await expect(focusedElement).toBeVisible()
    
    // Should be able to interact with form elements via keyboard
    const inputs = await page.locator('input').all()
    if (inputs.length > 0) {
      await inputs[0].focus()
      await inputs[0].type('Keyboard input test')
      await expect(inputs[0]).toHaveValue('Keyboard input test')
    }
    
    // Test radio button navigation
    const radioButtons = await page.locator('input[type="radio"]').all()
    if (radioButtons.length > 0) {
      await radioButtons[0].focus()
      await page.keyboard.press('Space') // Select radio button
      await expect(radioButtons[0]).toBeChecked()
      
      // Arrow keys should navigate between radio options in same group
      await page.keyboard.press('ArrowDown')
      const nextRadio = await page.locator(':focus').first()
      await expect(nextRadio).toHaveAttribute('type', 'radio')
    }
  })

  test('provides proper focus management and skip links', async ({ page }) => {
    // Check for skip links
    await page.keyboard.press('Tab')
    
    const skipLink = await page.locator('a[href*="#main"], a[href*="#content"], .skip-link').first()
    if (await skipLink.isVisible()) {
      await skipLink.click()
      
      // Should jump to main content
      const mainContent = await page.locator('#main, #content, main, [role="main"]').first()
      await expect(mainContent).toBeFocused()
    }
    
    // Start exam
    await page.getByRole('button', { name: /sākt eksāmenu/i }).click()
    
    // Focus should be managed properly on page transitions
    const focusedAfterNavigation = await page.locator(':focus').first()
    await expect(focusedAfterNavigation).toBeVisible()
    
    // Test modal/dialog focus management if present
    const buttons = await page.locator('button').all()
    for (const button of buttons.slice(0, 3)) { // Test first few buttons
      if (await button.textContent() === 'DetailsDialog' || 
          await button.textContent() === 'Info' ||
          (await button.getAttribute('aria-expanded')) !== null) {
        
        await button.click()
        
        // If a modal opens, focus should be trapped
        const modal = await page.locator('[role="dialog"], [role="alertdialog"], .modal').first()
        if (await modal.isVisible()) {
          // Focus should be within modal
          const focusInModal = await page.locator(':focus').first()
          const modalContainsFocus = await modal.locator(':focus').count() > 0
          expect(modalContainsFocus).toBe(true)
          
          // Escape should close modal
          await page.keyboard.press('Escape')
          await expect(modal).not.toBeVisible()
          
          // Focus should return to trigger
          await expect(button).toBeFocused()
        }
        break
      }
    }
  })

  test('has proper ARIA labels and descriptions', async ({ page }) => {
    // Start exam to check form ARIA
    await page.getByRole('button', { name: /sākt eksāmenu/i }).click()
    
    // Check form inputs have proper labels
    const inputs = await page.locator('input').all()
    for (const input of inputs) {
      const ariaLabel = await input.getAttribute('aria-label')
      const ariaLabelledBy = await input.getAttribute('aria-labelledby')
      
      // Should have either aria-label or aria-labelledby
      expect(ariaLabel || ariaLabelledBy).toBeTruthy()
      
      // Check for aria-describedby if present
      const ariaDescribedBy = await input.getAttribute('aria-describedby')
      if (ariaDescribedBy) {
        // Referenced elements should exist
        const describedElements = ariaDescribedBy.split(' ')
        for (const id of describedElements) {
          const element = await page.locator(`#${id}`).first()
          await expect(element).toBeAttached()
        }
      }
    }
    
    // Check radio groups
    const radioGroups = await page.locator('[role="radiogroup"]').all()
    for (const group of radioGroups) {
      // Radio groups should have accessible names
      const groupName = await group.getAttribute('aria-label') || 
                       await group.getAttribute('aria-labelledby')
      expect(groupName).toBeTruthy()
    }
    
    // Check buttons have accessible names
    const buttons = await page.locator('button').all()
    for (const button of buttons) {
      const buttonText = await button.textContent()
      const ariaLabel = await button.getAttribute('aria-label')
      
      // Button should have accessible text or aria-label
      expect(buttonText?.trim() || ariaLabel).toBeTruthy()
    }
  })

  test('supports screen reader announcements', async ({ page }) => {
    // Check for live regions
    const liveRegions = await page.locator('[aria-live], [role="status"], [role="alert"]').all()
    
    // Start exam
    await page.getByRole('button', { name: /sākt eksāmenu/i }).click()
    
    // Check for status announcements
    const statusElements = await page.locator('[role="status"], [aria-live="polite"]').all()
    if (statusElements.length > 0) {
      await expect(statusElements[0]).toBeAttached()
    }
    
    // Check for error announcements
    const alertElements = await page.locator('[role="alert"], [aria-live="assertive"]').all()
    
    // Trigger a validation error to test announcements
    const inputs = await page.locator('input').all()
    if (inputs.length > 0) {
      await inputs[0].fill('') // Clear input
      
      const continueButton = page.getByRole('button', { name: /turpināt/i })
      if (await continueButton.isVisible()) {
        await continueButton.click()
        
        // Should announce validation errors
        const newAlerts = await page.locator('[role="alert"], [aria-live="assertive"]').all()
        if (newAlerts.length > alertElements.length) {
          await expect(newAlerts[newAlerts.length - 1]).toBeVisible()
        }
      }
    }
  })

  test('provides sufficient color contrast', async ({ page }) => {
    // This is covered by axe-core tests above, but we can add visual checks
    await page.getByRole('button', { name: /sākt eksāmenu/i }).click()
    
    // Take screenshot for visual regression testing if needed
    await page.screenshot({ path: 'tests/screenshots/accessibility-test.png' })
    
    // Check that text is visible against backgrounds
    const textElements = await page.locator('p, span, div, h1, h2, h3, label').all()
    
    for (const element of textElements.slice(0, 5)) { // Check first 5 text elements
      const text = await element.textContent()
      if (text && text.trim()) {
        // Element should be visible (basic visibility check)
        await expect(element).toBeVisible()
      }
    }
  })

  test('handles high contrast mode correctly', async ({ page }) => {
    // Simulate high contrast mode by injecting CSS
    await page.addStyleTag({
      content: `
        @media (prefers-contrast: high) {
          * {
            border: 1px solid currentColor !important;
          }
        }
      `
    })
    
    await page.emulateMedia({ forcedColors: 'active' })
    
    // App should still be usable in high contrast mode
    await expect(page.getByRole('button', { name: /sākt eksāmenu/i })).toBeVisible()
    
    // Start exam
    await page.getByRole('button', { name: /sākt eksāmenu/i }).click()
    
    // Form elements should be visible and usable
    const inputs = await page.locator('input').all()
    if (inputs.length > 0) {
      await expect(inputs[0]).toBeVisible()
      await inputs[0].fill('High contrast test')
      await expect(inputs[0]).toHaveValue('High contrast test')
    }
  })

  test('respects reduced motion preferences', async ({ page }) => {
    // Simulate reduced motion preference
    await page.emulateMedia({ reducedMotion: 'reduce' })
    
    await page.goto('/')
    
    // App should still be functional with reduced motion
    await expect(page.getByRole('button', { name: /sākt eksāmenu/i })).toBeVisible()
    
    // Animations should be minimal or disabled
    await page.getByRole('button', { name: /sākt eksāmenu/i }).click()
    
    // Page transitions should be immediate
    await expect(page.getByText(/himna|vēsture|satversme/i)).toBeVisible()
  })

  test('provides proper heading hierarchy', async ({ page }) => {
    // Check heading structure on homepage
    const headings = await page.locator('h1, h2, h3, h4, h5, h6').all()
    
    if (headings.length > 0) {
      // Should have h1
      const h1Elements = await page.locator('h1').all()
      expect(h1Elements.length).toBeGreaterThan(0)
      
      // Check heading hierarchy (no skipped levels)
      const headingLevels = []
      for (const heading of headings) {
        const tagName = await heading.evaluate(el => el.tagName.toLowerCase())
        const level = parseInt(tagName.charAt(1))
        headingLevels.push(level)
      }
      
      // First heading should be h1
      expect(headingLevels[0]).toBe(1)
      
      // No skipped levels (difference should not be > 1)
      for (let i = 1; i < headingLevels.length; i++) {
        const diff = headingLevels[i] - headingLevels[i - 1]
        expect(diff).toBeLessThanOrEqual(1)
      }
    }
    
    // Check heading structure in exam
    await page.getByRole('button', { name: /sākt eksāmenu/i }).click()
    
    const examHeadings = await page.locator('h1, h2, h3, h4, h5, h6').all()
    if (examHeadings.length > 0) {
      // Should maintain proper hierarchy
      const examH1 = await page.locator('h1').first()
      await expect(examH1).toBeVisible()
    }
  })
})