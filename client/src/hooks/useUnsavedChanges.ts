import { useEffect } from 'react';
import * as React from 'react';
import { createRoot } from 'react-dom/client';
import {
  AlertDialog,
  AlertDialogContent,
  AlertDialogHeader,
  AlertDialogFooter,
  AlertDialogTitle,
  AlertDialogDescription,
  AlertDialogAction,
  AlertDialogCancel,
} from '@/components/ui/alert-dialog';

// Global registry of unsaved change checks
const unsavedChecks = new Set<() => boolean>();

// Track current position in history
let currentIdx = 0;
let isNavigatingConfirmed = false;

// Initialize history state index
if (typeof window !== 'undefined') {
  if (!window.history.state || typeof window.history.state.idx !== 'number') {
    window.history.replaceState({ ...window.history.state, idx: 0 }, '');
  } else {
    currentIdx = window.history.state.idx;
  }
}

let activeDialogResolve: ((value: boolean) => void) | null = null;

function showConfirmationDialog(): Promise<boolean> {
  if (activeDialogResolve) {
    activeDialogResolve(false);
  }

  return new Promise<boolean>((resolve) => {
    activeDialogResolve = resolve;
    const container = document.createElement('div');
    document.body.appendChild(container);
    const root = createRoot(container);

    const triggerElement = document.activeElement as HTMLElement | null;

    const cleanup = (confirmed: boolean) => {
      activeDialogResolve = null;
      root.unmount();
      container.remove();
      if (!confirmed && triggerElement) {
        // Return focus to the triggering element per WAI-ARIA APG standards
        setTimeout(() => triggerElement.focus(), 0);
      }
      resolve(confirmed);
    };

    root.render(
      React.createElement(AlertDialog, {
        open: true,
        onOpenChange: (open) => {
          if (!open) cleanup(false);
        }
      },
        React.createElement(AlertDialogContent, null,
          React.createElement(AlertDialogHeader, null,
            React.createElement(AlertDialogTitle, null, "Unsaved Changes"),
            React.createElement(AlertDialogDescription, null, "You have unsaved changes. Are you sure you want to leave this page? Your changes will be lost.")
          ),
          React.createElement(AlertDialogFooter, null,
            React.createElement(AlertDialogCancel, { onClick: () => cleanup(false) }, "Stay"),
            React.createElement(AlertDialogAction, { onClick: () => cleanup(true) }, "Leave")
          )
        )
      )
    );
  });
}

// Monkey-patch history API once
if (typeof window !== 'undefined' && !(window as any).__unsavedChangesPatched) {
  (window as any).__unsavedChangesPatched = true;

  const originalPushState = window.history.pushState;
  const originalReplaceState = window.history.replaceState;

  window.history.pushState = function (state, title, url) {
    const hasUnsaved = Array.from(unsavedChecks).some((check) => check());

    if (hasUnsaved && !isNavigatingConfirmed) {
      showConfirmationDialog().then((confirmed) => {
        if (confirmed) {
          isNavigatingConfirmed = true;
          currentIdx++;
          originalPushState.call(window.history, { ...state, idx: currentIdx }, title, url);
          window.dispatchEvent(new Event('pushState'));
          isNavigatingConfirmed = false;
        }
      });
      return;
    }

    currentIdx++;
    originalPushState.call(this, { ...state, idx: currentIdx }, title, url);
    window.dispatchEvent(new Event('pushState'));
  };

  window.history.replaceState = function (state, title, url) {
    originalReplaceState.call(this, { ...state, idx: currentIdx }, title, url);
    window.dispatchEvent(new Event('replaceState'));
  };

  window.addEventListener('popstate', (event) => {
    const hasUnsaved = Array.from(unsavedChecks).some((check) => check());
    
    if (isNavigatingConfirmed) {
      if (event.state && typeof event.state.idx === 'number') {
        currentIdx = event.state.idx;
      }
      return;
    }

    if (hasUnsaved) {
      const targetIdx = event.state && typeof event.state.idx === 'number' ? event.state.idx : 0;
      const delta = targetIdx - currentIdx;

      if (delta !== 0) {
        // Revert history movement immediately
        isNavigatingConfirmed = true;
        window.history.go(-delta);

        showConfirmationDialog().then((confirmed) => {
          if (confirmed) {
            isNavigatingConfirmed = true;
            window.history.go(delta);
            setTimeout(() => {
              isNavigatingConfirmed = false;
            }, 0);
          } else {
            isNavigatingConfirmed = false;
          }
        });
      }
    } else {
      if (event.state && typeof event.state.idx === 'number') {
        currentIdx = event.state.idx;
      }
    }
  });
}

/**
 * Hook to warn users about unsaved changes before leaving the page.
 * Shows a browser confirmation dialog if there are unsaved changes.
 * Also intercepts SPA navigation.
 */
export function useUnsavedChanges(hasUnsavedChanges: boolean, message?: string) {
  useEffect(() => {
    if (!hasUnsavedChanges) return;

    const check = () => hasUnsavedChanges;
    unsavedChecks.add(check);

    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      e.preventDefault();
      e.returnValue = message || 'You have unsaved changes. Are you sure you want to leave?';
      return e.returnValue;
    };

    window.addEventListener('beforeunload', handleBeforeUnload);

    return () => {
      unsavedChecks.delete(check);
      window.removeEventListener('beforeunload', handleBeforeUnload);
    };
  }, [hasUnsavedChanges, message]);
}
