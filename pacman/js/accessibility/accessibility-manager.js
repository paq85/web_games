export class AccessibilityManager {
  constructor({ politeRegion, assertiveRegion, captionText, statusBanner, canvas }) {
    this.politeRegion = politeRegion;
    this.assertiveRegion = assertiveRegion;
    this.captionText = captionText;
    this.statusBanner = statusBanner;
    this.canvas = canvas;
  }

  setCaption(text) {
    if (this.captionText) {
      this.captionText.textContent = text;
    }
    if (this.statusBanner) {
      this.statusBanner.textContent = text;
    }
  }

  announce(text, priority = 'polite') {
    const region = priority === 'assertive' ? this.assertiveRegion : this.politeRegion;
    if (!region) {
      return;
    }
    region.textContent = '';
    window.requestAnimationFrame(() => {
      region.textContent = text;
    });
  }

  focusCanvas() {
    this.canvas?.focus({ preventScroll: false });
  }

  focusFirstInteractive(container) {
    const target = container?.querySelector('button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])');
    target?.focus();
  }
}
