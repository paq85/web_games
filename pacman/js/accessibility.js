export function createAnnouncer(politeElement, assertiveElement) {
  let clearTimer = null;

  function announce(element, message) {
    if (!element) {
      return;
    }
    element.textContent = '';
    requestAnimationFrame(() => {
      element.textContent = message;
    });
  }

  return {
    announcePolite(message) {
      announce(politeElement, message);
    },
    announceAssertive(message) {
      announce(assertiveElement, message);
    },
    flashStatus(message, timeout = 1800) {
      if (clearTimer) {
        clearTimeout(clearTimer);
      }
      announce(politeElement, message);
      clearTimer = setTimeout(() => {
        if (politeElement) {
          politeElement.textContent = '';
        }
      }, timeout);
    }
  };
}

export function focusFirstInteractive(container) {
  if (!container) {
    return;
  }
  const first = container.querySelector('button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])');
  first?.focus();
}

export function prefersReducedMotion() {
  if (typeof window === 'undefined' || typeof window.matchMedia !== 'function') {
    return false;
  }
  return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
}

export function isTouchDevice() {
  if (typeof window === 'undefined') {
    return false;
  }
  return navigator.maxTouchPoints > 0 || window.matchMedia('(pointer: coarse)').matches;
}
