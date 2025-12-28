'use client';

import { useState } from 'react';
import { Card, CardContent } from './ui/card';
import { Button } from './ui/button';
import { ChevronLeft, ChevronRight } from 'lucide-react';

const steps = [
  {
    number: 1,
    text: 'Create your account in seconds. No credit card required, no hidden fees, Ink-lings will always be free. Start your journaling journey today.'
  },
  {
    number: 2,
    text: 'Choose what types of prompts you want from categories like personal reflection, creativity, relationships, and more. Then pick your schedule of when you want the prompts delivered - daily, weekly, or custom days that work for you.'
  },
  {
    number: 3,
    text: 'Sit back and let us do the work. You\'ll receive thoughtfully crafted journal prompts right in your email based on the schedule you set, ready to inspire your writing.'
  }
];

export function HowItWorksCarousel() {
  const [currentStep, setCurrentStep] = useState(0);

  const nextStep = () => {
    setCurrentStep((prev) => (prev + 1) % steps.length);
  };

  const prevStep = () => {
    setCurrentStep((prev) => (prev - 1 + steps.length) % steps.length);
  };

  const goToStep = (index: number) => {
    setCurrentStep(index);
  };

  return (
    <div className="w-full max-w-4xl" style={{ fontFamily: 'var(--font-shadows-into-light)' }}>
      {/* Carousel Card */}
      <Card className="w-full overflow-hidden shadow-2xl border-2 border-blue-600 dark:border-blue-500 bg-white dark:bg-gray-800">
        <CardContent className="p-8 md:p-12">
          <div className="flex flex-col items-center">
            {/* Header - Inside Card */}
            <div className="mb-6 text-center">
              <h2 className="text-4xl font-bold text-gray-800 dark:text-gray-200 mb-2">
                How Ink-lings Works
              </h2>
              <p className="text-lg text-gray-600 dark:text-gray-400">
                Get started in three simple steps
              </p>
            </div>

            {/* Step Indicators - Inside Card */}
            <div className="flex justify-center items-center mb-8 gap-4">
              {steps.map((step, index) => (
                <div key={step.number} className="flex items-center">
                  <button
                    onClick={() => goToStep(index)}
                    className={`w-12 h-12 rounded-full flex items-center justify-center text-xl font-bold transition-all duration-300 ${
                      index === currentStep
                        ? 'bg-blue-500 text-white border-4 border-blue-300 shadow-lg scale-110'
                        : index < currentStep
                        ? 'bg-blue-300 text-white border-2 border-blue-400'
                        : 'bg-gray-200 dark:bg-gray-700 text-gray-600 dark:text-gray-400 border-2 border-gray-300 dark:border-gray-600'
                    }`}
                  >
                    {step.number}
                  </button>
                  {index < steps.length - 1 && (
                    <div className={`w-12 h-0.5 mx-2 transition-all duration-300 ${
                      index < currentStep ? 'bg-blue-500' : 'bg-gray-300 dark:bg-gray-600'
                    }`} />
                  )}
                </div>
              ))}
            </div>

            {/* Step Content */}
            <div className="text-center mb-8">
              <p className="text-lg text-blue-600 dark:text-blue-400 font-semibold max-w-2xl mx-auto leading-relaxed">
                {steps[currentStep].text}
              </p>
            </div>

            {/* Navigation Arrows */}
            <div className="flex items-center justify-center gap-4 mt-8">
              <Button
                variant="outline"
                size="icon"
                onClick={prevStep}
                className="rounded-full w-12 h-12"
                aria-label="Previous step"
              >
                <ChevronLeft className="h-6 w-6" />
              </Button>
              
              <div className="flex gap-2">
                {steps.map((_, index) => (
                  <button
                    key={index}
                    onClick={() => goToStep(index)}
                    className={`w-3 h-3 rounded-full transition-all duration-300 ${
                      index === currentStep
                        ? 'bg-blue-500 w-8'
                        : 'bg-gray-300 dark:bg-gray-600'
                    }`}
                    aria-label={`Go to step ${index + 1}`}
                  />
                ))}
              </div>
              
              <Button
                variant="outline"
                size="icon"
                onClick={nextStep}
                className="rounded-full w-12 h-12"
                aria-label="Next step"
              >
                <ChevronRight className="h-6 w-6" />
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

