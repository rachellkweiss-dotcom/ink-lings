'use client';

interface OnboardingProgressProps {
  currentPhase: number;
  totalPhases?: number;
}

export function OnboardingProgress({ currentPhase, totalPhases = 4 }: OnboardingProgressProps) {
  const phases = [
    { id: 1, label: 'Topics', header: '1. Choose Journal Topics' },
    { id: 2, label: 'Notifications', header: '2. Set Up Notifications' },
    { id: 3, label: 'Schedule', header: '3. Choose Schedule' },
    { id: 4, label: 'Review', header: '4. Review & Complete' }
  ];

  const currentPhaseData = phases[currentPhase - 1] || phases[0];

  return (
    <div className="w-full max-w-4xl mx-auto mb-8" style={{ fontFamily: 'var(--font-shadows-into-light)' }}>
      {/* Progress Bar Container */}
      <div className="relative bg-gradient-to-r from-blue-500 to-cyan-500 rounded-lg p-6 mb-6">
        {/* Step Indicators */}
        <div className="flex justify-between items-center relative z-10">
          {phases.map((phase) => (
            <div key={phase.id} className="flex flex-col items-center space-y-3">
              <div className={`w-12 h-12 rounded-full flex items-center justify-center text-xl font-bold transition-all duration-300 ${
                phase.id === currentPhase
                  ? 'bg-white/30 text-white border-4 border-white shadow-lg backdrop-blur-sm'
                  : phase.id < currentPhase
                  ? 'bg-white/20 text-white border-2 border-white backdrop-blur-sm'
                  : 'bg-white/20 text-white border-2 border-white backdrop-blur-sm'
              }`}>
                {phase.id}
              </div>
              <div className="max-w-24 text-center">
                <span className="text-sm font-medium text-white">
                  {phase.label}
                </span>
              </div>
            </div>
          ))}
        </div>
        
        {/* Progress Line */}
        <div className="absolute top-[44px] left-0 right-0 h-0.5 bg-white/30 z-0">
          <div 
            className="h-full bg-white transition-all duration-500 ease-in-out"
            style={{ width: `${((currentPhase - 1) / (totalPhases - 1)) * 100}%` }}
          />
        </div>
      </div>


    </div>
  );
}
