import { useState, useEffect, useCallback } from 'react';

interface GuideStep {
  id: string;
  titleKey?: string;
  contentKey?: string;
  title?: string;
  content?: string;
  position?: 'top' | 'bottom' | 'left' | 'right';
}

interface UseHoverGuideReturn {
  isActive: boolean;
  currentStep: number;
  steps: GuideStep[];
  startGuide: () => void;
  stopGuide: () => void;
  nextStep: () => void;
  previousStep: () => void;
  goToStep: (step: number) => void;
}

export const useHoverGuide = (steps: GuideStep[]): UseHoverGuideReturn => {
  const [isActive, setIsActive] = useState(false);
  const [currentStep, setCurrentStep] = useState(0);

  const highlightStep = useCallback((stepIndex: number) => {
    if (stepIndex < 0 || stepIndex >= steps.length) {
      return;
    }
    
    // Remove previous highlights
    steps.forEach((step) => {
      const element = document.querySelector(`[data-guide-id="${step.id}"]`);
      if (element) {
        element.classList.remove('guide-highlight');
      }
    });

    // Highlight current step
    const currentStepData = steps[stepIndex];
    if (currentStepData) {
      const element = document.querySelector(`[data-guide-id="${currentStepData.id}"]`);
      if (element) {
        element.classList.add('guide-highlight');
        // Scroll into view if needed
        element.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }
    }
  }, [steps]);

  const startGuide = useCallback(() => {
    setIsActive(true);
    setCurrentStep(0);
    // Highlight first step with delay to ensure DOM is ready
    setTimeout(() => highlightStep(0), 100);
  }, [highlightStep]);

  const stopGuide = useCallback(() => {
    setIsActive(false);
    // Remove all highlights
    steps.forEach((step) => {
      const element = document.querySelector(`[data-guide-id="${step.id}"]`);
      if (element) {
        element.classList.remove('guide-highlight');
      }
    });
  }, [steps]);

  const nextStep = useCallback(() => {
    setCurrentStep((prevStep) => {
      if (prevStep < steps.length - 1) {
        const next = prevStep + 1;
        // Use setTimeout to ensure state update happens before highlight
        setTimeout(() => highlightStep(next), 100);
        return next;
      } else {
        return prevStep;
      }
    });
  }, [steps, highlightStep]);

  const previousStep = useCallback(() => {
    setCurrentStep((prevStep) => {
      if (prevStep > 0) {
        const prev = prevStep - 1;
        highlightStep(prev);
        return prev;
      }
      return prevStep;
    });
  }, [highlightStep]);

  const goToStep = useCallback((step: number) => {
    if (step >= 0 && step < steps.length) {
      setCurrentStep(step);
      highlightStep(step);
    }
  }, [steps, highlightStep]);

  useEffect(() => {
    if (isActive && steps.length > 0 && currentStep >= 0 && currentStep < steps.length) {
      // Use setTimeout to ensure DOM is ready
      const timer = setTimeout(() => {
        highlightStep(currentStep);
      }, 100);
      return () => clearTimeout(timer);
    }
  }, [isActive, currentStep, steps.length, highlightStep]);

  return {
    isActive,
    currentStep,
    steps,
    startGuide,
    stopGuide,
    nextStep,
    previousStep,
    goToStep,
  };
};

