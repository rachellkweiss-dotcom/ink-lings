// Background service to automatically send prompts
// This runs every hour at :55 minutes

let isRunning = false;
let intervalId: NodeJS.Timeout | null = null;

export function startPromptScheduler() {
  if (isRunning) {
    console.log('Prompt scheduler is already running');
    return;
  }

  console.log('🚀 Starting Ink-lings prompt scheduler...');
  isRunning = true;

  // Function to send prompts
  const sendPrompts = async () => {
    try {
      console.log('⏰ Running scheduled prompt sending...');
      
      // Call your send-prompts API
      const response = await fetch(`${process.env.NEXT_PUBLIC_BASE_URL}/api/send-prompts`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          scheduled: true,
          timestamp: new Date().toISOString()
        })
      });

      if (response.ok) {
        const result = await response.json();
        console.log('✅ Prompts sent successfully:', result);
      } else {
        console.error('❌ Failed to send prompts:', response.status);
      }
    } catch (error) {
      console.error('❌ Error sending prompts:', error);
    }
  };

  // Calculate time until next :55 minute
  const now = new Date();
  let minutesUntilNext = 55 - now.getMinutes();
  
  // If we're past :55 this hour, calculate for next hour
  if (minutesUntilNext <= 0) {
    minutesUntilNext += 60; // Add 60 minutes to get to next hour
  }
  
  const secondsUntilNext = minutesUntilNext * 60 - now.getSeconds();
  
  console.log(`⏰ Current time: ${now.getHours()}:${now.getMinutes().toString().padStart(2, '0')}`);
  console.log(`⏰ Minutes until next :55: ${minutesUntilNext}`);
  console.log(`⏰ Seconds until next run: ${secondsUntilNext}`);
  
  // Wait until next :55
  setTimeout(() => {
    sendPrompts();
    // Then run every hour
    intervalId = setInterval(sendPrompts, 60 * 60 * 1000);
  }, secondsUntilNext * 1000);

  console.log(`⏰ Next prompt run scheduled for ${minutesUntilNext > 0 ? 'next hour' : 'this hour'} at :55`);
}

export function stopPromptScheduler() {
  if (intervalId) {
    clearInterval(intervalId);
    intervalId = null;
  }
  isRunning = false;
  console.log('🛑 Prompt scheduler stopped');
}

export function getSchedulerStatus() {
  return {
    isRunning,
    nextRun: isRunning ? 'Every hour at :55' : 'Not running'
  };
}
