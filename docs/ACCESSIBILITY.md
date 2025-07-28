# Accessibility Guide - Latvian Citizenship Exam App

## Overview

This application is designed to meet **WCAG 2.1 AA compliance** standards, ensuring accessibility for all users including those using assistive technologies.

## Implemented Accessibility Features

### 1. Semantic HTML Structure
- **Proper heading hierarchy**: H1 → H2 → H3 logical flow
- **Landmark roles**: `banner`, `main`, `navigation` for page structure
- **Semantic elements**: `<section>`, `<fieldset>`, `<legend>` for content organization

### 2. Skip Navigation
- **Skip links**: Available via Tab key for keyboard users
- **Quick navigation**: Jump to main content, exam sections, and submission
- **Focus management**: Automatic focus on destination elements

### 3. ARIA Support
- **Live regions**: `aria-live` for dynamic content updates
- **Labels and descriptions**: Comprehensive `aria-label` and `aria-describedby`
- **Form associations**: Proper field-to-error message relationships
- **Role attributes**: Interactive elements have appropriate roles

### 4. Keyboard Navigation
- **Full keyboard support**: All functionality accessible via keyboard
- **Tab order**: Logical navigation sequence
- **Keyboard shortcuts**:
  - `Ctrl/Cmd + 1`: Navigate to Anthem section
  - `Ctrl/Cmd + 2`: Navigate to History section
  - `Ctrl/Cmd + 3`: Navigate to Constitution section
  - `Ctrl/Cmd + 4`: Navigate to Submission section
  - `Escape`: Return focus to main content
  - `Ctrl/Cmd + Home`: Jump to top of page
  - `Ctrl/Cmd + End`: Jump to submission section

### 5. Focus Management
- **Focus trapping**: Modal dialogs contain focus appropriately
- **Visible focus indicators**: 3px outline with sufficient contrast
- **Focus restoration**: Focus returns to logical elements after actions

### 6. Screen Reader Optimization
- **Descriptive labels**: All interactive elements have clear labels
- **Status announcements**: Dynamic content changes announced
- **Context information**: Additional context provided via `aria-describedby`
- **Screen reader only content**: Important instructions for AT users

### 7. Color and Contrast
- **WCAG AA compliance**: Minimum 4.5:1 contrast ratio
- **High contrast mode**: Automatic adaptation for `prefers-contrast: high`
- **Color independence**: Information not conveyed by color alone

### 8. Motion and Animation
- **Reduced motion support**: Respects `prefers-reduced-motion` preference
- **Optional animations**: Smooth scrolling can be disabled

## Testing Protocol

### Automated Testing
```bash
# Run accessibility tests
npm run test

# Check with axe-core (automatically runs in development)
npm run dev
```

### Manual Testing Checklist

#### Keyboard Navigation
- [ ] Tab through all interactive elements
- [ ] All buttons and links are focusable
- [ ] Focus indicators are visible
- [ ] Modal dialogs trap focus
- [ ] Keyboard shortcuts work as expected

#### Screen Reader Testing
- [ ] Test with NVDA (Windows)
- [ ] Test with JAWS (Windows) 
- [ ] Test with VoiceOver (macOS)
- [ ] Test with TalkBack (Android)
- [ ] Verify content is announced properly
- [ ] Check form error announcements

#### Color and Contrast
- [ ] Test with high contrast mode
- [ ] Verify contrast ratios meet 4.5:1 minimum
- [ ] Test with color blindness simulators
- [ ] Ensure information isn't color-dependent

## Component-Specific Accessibility

### ExamSection Components
- Use `<fieldset>` and `<legend>` for question groups
- Proper `aria-describedby` for instructions
- Required field indicators with screen reader text

### Form Components
- All inputs have associated labels
- Error messages linked via `aria-describedby`
- Invalid state indicated with `aria-invalid`
- Required fields marked with `aria-required`

### Navigation Components
- Skip links for efficient keyboard navigation
- Landmark roles for structure
- Current section indication for screen readers

### Dialog Components
- Focus trapped within modal
- Proper `aria-labelledby` and `aria-describedby`
- Escape key closes dialog
- Focus returns to trigger element

## Development Guidelines

### Code Standards
```typescript
// Good: Proper ARIA labeling
<button aria-label="Close dialog" onClick={handleClose}>
  <X className="h-4 w-4" />
</button>

// Good: Form field association
<Label htmlFor="email">Email Address</Label>
<Input 
  id="email" 
  aria-describedby="email-error"
  aria-invalid={hasError ? 'true' : 'false'}
/>
{hasError && (
  <div id="email-error" role="alert">
    Please enter a valid email address
  </div>
)}

// Good: Live region for announcements
<div aria-live="polite" aria-atomic="true" className="sr-only">
  {statusMessage}
</div>
```

### CSS Utilities
```css
/* Screen reader only content */
.sr-only {
  position: absolute;
  width: 1px;
  height: 1px;
  padding: 0;
  margin: -1px;
  overflow: hidden;
  clip: rect(0, 0, 0, 0);
  white-space: nowrap;
  border: 0;
}

/* Focus indicators */
.focus-visible:focus-visible {
  outline: 3px solid var(--ring);
  outline-offset: 2px;
}
```

## Common Issues and Solutions

### Issue: Buttons without accessible names
**Solution**: Always provide `aria-label` for icon-only buttons
```tsx
<Button aria-label="Add new item">
  <Plus className="h-4 w-4" />
</Button>
```

### Issue: Form errors not announced
**Solution**: Use `role="alert"` and link with `aria-describedby`
```tsx
<Input aria-describedby={hasError ? 'field-error' : undefined} />
{hasError && (
  <div id="field-error" role="alert">
    Error message here
  </div>
)}
```

### Issue: Modal focus not trapped
**Solution**: Use FocusTrap component
```tsx
<FocusTrap active={isOpen} onDeactivate={handleClose}>
  <div role="dialog" aria-labelledby="title">
    {/* Modal content */}
  </div>
</FocusTrap>
```

## Resources

- [WCAG 2.1 Quick Reference](https://www.w3.org/WAI/WCAG21/quickref/)
- [ARIA Authoring Practices Guide](https://www.w3.org/WAI/ARIA/apg/)
- [axe-core Documentation](https://github.com/dequelabs/axe-core)
- [WebAIM Screen Reader Testing](https://webaim.org/articles/screenreader_testing/)

## Maintenance

This accessibility implementation should be:
- Tested with each new feature addition
- Validated with automated tools in CI/CD
- Periodically audited with real assistive technology users
- Updated as WCAG guidelines evolve

For questions or issues, consult the development team's accessibility specialist.