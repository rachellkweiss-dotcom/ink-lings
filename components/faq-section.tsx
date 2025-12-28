'use client';

import { Card, CardContent } from './ui/card';

const faqs = [
  {
    question: 'Is there a cost?',
    answer: 'No, Ink-lings is completely free. There are no hidden fees, no credit card required, and no premium tiers. We believe journaling should be accessible to everyone.'
  },
  {
    question: 'How do I answer the questions?',
    answer: 'Simply grab a pen and paper! When you receive a prompt in your email, take a few minutes to reflect and write your thoughts. There\'s no need to submit anything - your journal is private and personal. Ink-lings only provides the prompt; you decide what to do with it. If you only want to use it as a conversation starter at dinner - that\'s perfect.'
  },
  {
    question: 'Can I change my preferences once I set them?',
    answer: 'Absolutely! You can update your preferences anytime from your account page. Change your categories, schedule, or notification time whenever you want. If you need a break, you can always pause your notifications too.'
  },
  {
    question: 'Do the prompts repeat?',
    answer: 'Eventually, yes. But Ink-lings was designed with variety in mind! If you chose every single category and you get a prompt every day, you won\'t get a repeat prompt for 18 years! We figure by then...you probably won\'t remember the repeats and your answers may have changed by then!'
  }
];

export function FAQSection() {
  return (
    <div className="w-full max-w-6xl mx-auto px-8" style={{ fontFamily: 'var(--font-shadows-into-light)' }}>
      <Card className="bg-white dark:bg-gray-800 border-2 border-blue-600 dark:border-blue-500 shadow-2xl">
        <CardContent className="p-8">
          <div className="mb-6 text-center">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-800 dark:text-gray-200 mb-2">
              Frequently Asked Questions
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {faqs.map((faq, index) => (
              <Card 
                key={index}
                className="bg-gradient-to-br from-blue-200 to-blue-300 dark:from-blue-800/40 dark:to-blue-900/40 border-2 border-blue-600 dark:border-blue-500 shadow-lg"
              >
                <CardContent className="p-6">
                  <h3 className="text-xl font-bold text-gray-800 dark:text-gray-200 mb-3">
                    {faq.question}
                  </h3>
                  <p className="text-base text-gray-700 dark:text-gray-300 leading-relaxed">
                    {faq.answer}
                  </p>
                </CardContent>
              </Card>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

