import { NextRequest, NextResponse } from 'next/server';
import { chromium } from 'playwright';
import { validateRequestBody, renderSocialSchema } from '@/lib/api-validation';
import { rateLimit } from '@/lib/rate-limit';

/**
 * API endpoint to render social media images
 * 
 * Accepts a background image and text elements, then uses Playwright
 * to render them as a PNG image.
 * 
 * Expected payload:
 * {
 *   "backgroundImage": "url or data:image/... base64",
 *   "width": 1080,
 *   "height": 1080,
 *   "textElements": [
 *     {
 *       "text": "Hello World",
 *       "x": 100,
 *       "y": 200,
 *       "fontFamily": "Arial",
 *       "fontSize": 24,
 *       "color": "#000000",
 *       "textAlign": "left|center|right",
 *       "fontWeight": "normal|bold",
 *       "maxWidth": 800 // optional
 *     }
 *   ]
 * }
 */
// Handle CORS preflight
export async function OPTIONS(request: NextRequest) {
  return new NextResponse(null, {
    status: 200,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'POST, GET, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, x-webhook-secret, Authorization',
    },
  });
}

// Simple GET handler for testing
export async function GET(request: NextRequest) {
  return NextResponse.json(
    { 
      message: 'Render Social API is working. Use POST to render images.',
      endpoint: '/api/render-social',
      method: 'POST',
    },
    {
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
      },
    }
  );
}

export async function POST(request: NextRequest) {
  try {
    // SECURITY: Rate limiting - 30 requests per minute
    const rateLimitResult = rateLimit(request, 30, 60 * 1000);
    if (rateLimitResult) {
      return rateLimitResult;
    }

    // SECURITY: Webhook secret authentication
    const expectedSecret = process.env.RENDER_SOCIAL_WEBHOOK_SECRET;
    if (expectedSecret) {
      const providedSecret = 
        request.headers.get('x-webhook-secret') || 
        request.headers.get('authorization')?.replace('Bearer ', '');
      
      if (!providedSecret || providedSecret !== expectedSecret) {
        return NextResponse.json(
          { error: 'Unauthorized', message: 'Valid webhook secret required' },
          { 
            status: 401,
            headers: {
              'Content-Type': 'application/json',
            },
          }
        );
      }
    }

    // Validate request body
    const validationResult = await validateRequestBody(request, renderSocialSchema);
    if (validationResult.error) {
      return validationResult.error;
    }

    const { backgroundImage, width, height, textElements } = validationResult.data;

    // Launch browser with serverless-friendly settings
    const browser = await chromium.launch({
      headless: true,
      args: [
        '--no-sandbox',
        '--disable-setuid-sandbox',
        '--disable-dev-shm-usage',
        '--disable-accelerated-2d-canvas',
        '--no-first-run',
        '--no-zygote',
        '--disable-gpu',
      ],
    });

    try {
      const page = await browser.newPage();
      
      // Set viewport to match desired dimensions
      await page.setViewportSize({ width, height });

      // Generate HTML with background image and text elements
      const html = generateHTML(backgroundImage, width, height, textElements);
      
      // Set content and wait for fonts/images to load
      await page.setContent(html, { waitUntil: 'networkidle' });
      
      // Wait a bit for any fonts to load
      await page.waitForTimeout(500);

      // Take screenshot
      const screenshot = await page.screenshot({
        type: 'png',
        fullPage: false,
      });

      // Convert to base64
      const base64Image = screenshot.toString('base64');
      const dataUrl = `data:image/png;base64,${base64Image}`;

      return NextResponse.json(
        {
          success: true,
          base64: dataUrl, // Also include as 'base64' for Airtable compatibility
          image: dataUrl,
          format: 'png',
          dimensions: { width, height },
        },
        {
          headers: {
            'Content-Type': 'application/json',
            'Access-Control-Allow-Origin': '*',
          },
        }
      );
    } finally {
      await browser.close();
    }
  } catch (error) {
    console.error('Error rendering social media image:', error);
    return NextResponse.json(
      { 
        error: 'Internal server error',
        message: error instanceof Error ? error.message : 'Unknown error'
      },
      { 
        status: 500,
        headers: {
          'Content-Type': 'application/json',
        },
      }
    );
  }
}

/**
 * Generate HTML for rendering
 */
function generateHTML(
  backgroundImage: string,
  width: number,
  height: number,
  textElements: Array<{
    text: string;
    x: number;
    y: number;
    fontFamily: string;
    fontSize: number;
    color: string;
    textAlign?: 'left' | 'center' | 'right';
    fontWeight?: string;
    maxWidth?: number;
  }>
): string {
  // Escape HTML in text
  const escapeHtml = (text: string) => {
    return text
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#039;');
  };

  // Generate text element styles
  const textElementsHTML = textElements.map((element) => {
    const style = `
      position: absolute;
      left: ${element.x}px;
      top: ${element.y}px;
      font-family: ${element.fontFamily}, sans-serif;
      font-size: ${element.fontSize}px;
      color: ${element.color};
      text-align: ${element.textAlign || 'left'};
      font-weight: ${element.fontWeight || 'normal'};
      ${element.maxWidth ? `max-width: ${element.maxWidth}px;` : ''}
      margin: 0;
      padding: 0;
      white-space: ${element.maxWidth ? 'normal' : 'nowrap'};
      word-wrap: ${element.maxWidth ? 'break-word' : 'normal'};
    `.trim();

    return `<div style="${style}">${escapeHtml(element.text)}</div>`;
  }).join('\n');

  return `
    <!DOCTYPE html>
    <html>
      <head>
        <meta charset="UTF-8">
        <style>
          * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
          }
          body {
            width: ${width}px;
            height: ${height}px;
            position: relative;
            overflow: hidden;
            background-image: url('${backgroundImage}');
            background-size: cover;
            background-position: center;
            background-repeat: no-repeat;
          }
        </style>
      </head>
      <body>
        ${textElementsHTML}
      </body>
    </html>
  `;
}

