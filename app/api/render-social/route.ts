import { NextRequest, NextResponse } from 'next/server';
import { renderSocialSchema } from '@/lib/api-validation';
import { rateLimit } from '@/lib/rate-limit';
import { z } from 'zod';
import axios from 'axios';

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
export async function OPTIONS() {
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
export async function GET() {
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

    // Get raw body to transform Airtable format
    let rawBody: Record<string, unknown>;
    try {
      rawBody = await request.json() as Record<string, unknown>;
    } catch {
      return NextResponse.json(
        { error: 'Invalid JSON in request body' },
        { 
          status: 400,
          headers: { 'Content-Type': 'application/json' },
        }
      );
    }
    
    // Transform Airtable format to expected format
    // Airtable attachment fields come as arrays: [{url: "..."}]
    let backgroundImage: string;
    if (Array.isArray(rawBody.backgroundImage)) {
      // Extract URL from first attachment
      const firstItem = rawBody.backgroundImage[0];
      if (firstItem && typeof firstItem === 'object' && 'url' in firstItem) {
        backgroundImage = String((firstItem as { url: unknown }).url || firstItem || '');
      } else {
        backgroundImage = String(firstItem || '');
      }
    } else if (rawBody.backgroundImage && typeof rawBody.backgroundImage === 'object' && 'url' in rawBody.backgroundImage) {
      backgroundImage = String((rawBody.backgroundImage as { url: unknown }).url || '');
    } else {
      backgroundImage = String(rawBody.backgroundImage || '');
    }

    // Transform textElements if needed
    const textElementsArray = Array.isArray(rawBody.textElements) ? rawBody.textElements : [];
    const transformedTextElements = textElementsArray.map((element: unknown) => {
      const el = element as Record<string, unknown>;
      return {
        text: String(el.text || ''),
        x: typeof el.x === 'string' ? parseInt(el.x, 10) : (typeof el.x === 'number' ? el.x : 0),
        y: typeof el.y === 'string' ? parseInt(el.y, 10) : (typeof el.y === 'number' ? el.y : 0),
        fontFamily: Array.isArray(el.fontFamily) 
          ? String(el.fontFamily[0] || 'Arial')
          : String(el.fontFamily || 'Arial'),
        fontSize: typeof el.fontSize === 'string' ? parseInt(el.fontSize, 10) : (typeof el.fontSize === 'number' ? el.fontSize : 24),
        color: String(el.color || '#000000'),
        textAlign: (el.textAlign || 'left') as 'left' | 'center' | 'right',
        fontWeight: String(el.fontWeight || 'normal'),
        maxWidth: el.maxWidth ? (typeof el.maxWidth === 'string' ? parseInt(el.maxWidth, 10) : el.maxWidth as number) : undefined,
      };
    });

    // Create transformed body for validation
    const transformedBody = {
      backgroundImage,
      width: typeof rawBody.width === 'string' ? parseInt(rawBody.width, 10) : (typeof rawBody.width === 'number' ? rawBody.width : 1080),
      height: typeof rawBody.height === 'string' ? parseInt(rawBody.height, 10) : (typeof rawBody.height === 'number' ? rawBody.height : 1080),
      textElements: transformedTextElements,
    };

    // Validate transformed body using Zod directly
    let validatedBgImage: string;
    let width: number;
    let height: number;
    let textElements: Array<{
      text: string;
      x: number;
      y: number;
      fontFamily: string;
      fontSize: number;
      color: string;
      textAlign?: 'left' | 'center' | 'right';
      fontWeight?: string;
      maxWidth?: number;
    }>;
    
    try {
      const validated = renderSocialSchema.parse(transformedBody);
      validatedBgImage = validated.backgroundImage;
      width = validated.width;
      height = validated.height;
      textElements = validated.textElements;
    } catch (error: unknown) {
      if (error instanceof z.ZodError) {
        return NextResponse.json(
          {
            error: 'Validation failed',
            details: error.issues,
          },
          {
            status: 400,
            headers: { 'Content-Type': 'application/json' },
          }
        );
      }
      return NextResponse.json(
        { 
          error: 'Validation failed', 
          message: error instanceof Error ? error.message : 'Unknown validation error'
        },
        {
          status: 400,
          headers: { 'Content-Type': 'application/json' },
        }
      );
    }

    // Use HTML/CSS to Image API for reliable text rendering
    // This avoids native dependency issues and provides consistent results
    
    // Build HTML with background image and text elements
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
        line-height: ${element.fontSize * 1.2}px;
      `.trim().replace(/\s+/g, ' ');

      // Escape HTML in text
      const escapedText = element.text
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#039;');

      return `<div style="${style}">${escapedText}</div>`;
    }).join('\n');

    const html = `
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
              background-image: url('${validatedBgImage}');
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

    // Use htmlcsstoimage.com API (free tier: 50 images/month)
    // Alternative: screenshotapi.net or similar
    const htmlcsstoimageApiKey = process.env.HTMLCSSTOIMAGE_API_KEY;
    const htmlcsstoimageUserId = process.env.HTMLCSSTOIMAGE_USER_ID;

    if (!htmlcsstoimageApiKey || !htmlcsstoimageUserId) {
      // Fallback: Use screenshotapi.net (no API key needed for basic usage)
      try {
        const screenshotResponse = await axios.post(
          'https://screenshotapi.net/api/v1/screenshot',
          {
            token: process.env.SCREENSHOTAPI_TOKEN || 'demo', // Get free token at screenshotapi.net
            url: `data:text/html;base64,${Buffer.from(html).toString('base64')}`,
            width: width,
            height: height,
            output: 'image',
            file_type: 'png',
          },
          {
            responseType: 'arraybuffer',
            timeout: 30000,
          }
        );

        const base64Image = Buffer.from(screenshotResponse.data, 'binary').toString('base64');
        const dataUrl = `data:image/png;base64,${base64Image}`;

        return NextResponse.json(
          {
            success: true,
            base64: dataUrl,
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
      } catch (error) {
        console.error('Screenshot API error:', error);
        return NextResponse.json(
          {
            error: 'Failed to generate image',
            message: 'Image generation service unavailable. Please set HTMLCSSTOIMAGE_API_KEY and HTMLCSSTOIMAGE_USER_ID, or SCREENSHOTAPI_TOKEN in environment variables.',
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

    // Use htmlcsstoimage.com if API key is provided
    try {
      const response = await axios.post(
        'https://hcti.io/v1/image',
        {
          html: html,
          css: '',
          google_fonts: textElements.map(e => e.fontFamily).join('|'),
        },
        {
          auth: {
            username: htmlcsstoimageUserId,
            password: htmlcsstoimageApiKey,
          },
          timeout: 30000,
        }
      );

      // Fetch the generated image
      const imageResponse = await axios.get(response.data.url, {
        responseType: 'arraybuffer',
      });

      const base64Image = Buffer.from(imageResponse.data, 'binary').toString('base64');
      const dataUrl = `data:image/png;base64,${base64Image}`;

      return NextResponse.json(
        {
          success: true,
          base64: dataUrl,
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
    } catch (error) {
      console.error('HTML/CSS to Image API error:', error);
      return NextResponse.json(
        {
          error: 'Failed to generate image',
          message: error instanceof Error ? error.message : 'Unknown error',
        },
        {
          status: 500,
          headers: {
            'Content-Type': 'application/json',
          },
        }
      );
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


