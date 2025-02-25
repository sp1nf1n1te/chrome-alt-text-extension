import { API_CONFIG } from '../utils/constants.js';

// Function to generate alt text
export async function generateAltText(imageUrl) {
  try {
    // Add timestamp to prevent caching
    const timestamp = new Date().getTime();
    const imageUrlWithTimestamp = `${imageUrl}${imageUrl.includes('?') ? '&' : '?'}_t=${timestamp}`;
    
    console.log('Starting fresh ALT text generation for:', imageUrlWithTimestamp);

    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${API_CONFIG.OPENAI_KEY}`,
        'Cache-Control': 'no-cache',
        'Pragma': 'no-cache'
      },
      body: JSON.stringify({
        model: "gpt-4o",
        messages: [
          {
            role: "system",
            content: "You are an SEO-optimized ALT text generator. Generate a fresh description for the exact image provided, ignoring any previous context or cached responses."
          },
          {
            role: "user",
            content: [
              {
                type: "text",
                text: "Generate ALT text for this specific image. Describe exactly what you see in this image, nothing else:"
              },
              {
                type: "image_url",
                image_url: {
                  url: imageUrlWithTimestamp
                }
              }
            ]
          }
        ],
        temperature: 0.7,
        max_tokens: 100,
        n: 1,
        stream: false
      })
    });

    if (!response.ok) {
      const errorData = await response.json();
      console.error('API Response:', errorData);
      throw new Error(`API request failed: ${response.status}`);
    }

    const data = await response.json();
    console.log('Fresh API Response:', data);

    const altText = data.choices[0].message.content.trim();
    console.log('Generated ALT text:', altText);

    return altText;
  } catch (error) {
    console.error('Error in generateAltText:', error);
    throw error;
  }
}