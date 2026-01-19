// @ts-ignore - Deno types
import { serve } from "https://deno.land/std@0.168.0/http/server.ts"

serve(async (req: Request) => {
  // Set CORS headers
  if (req.method === 'OPTIONS') {
    return new Response('ok', {
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'POST, OPTIONS',
        'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
      }
    })
  }

  try {
    // For now, return mock data since Selenium needs special setup in Deno
    // You'll need to run the scraper separately (via cron job or automation script)
    const courts = [
      {
        courtNumber: "Court 3",
        date: "Sat 24.1. 16:00 - 17:00",
        time: "16:00 - 17:00",
        bookingUrl: "https://www.tuni.fi/sportuni/omasivu/?page=selection&lang=en&type=3&area=2&week=0",
        isAvailable: true
      }
    ];

    return new Response(
      JSON.stringify(courts),
      {
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*',
        },
        status: 200,
      },
    )
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return new Response(
      JSON.stringify({ error: errorMessage }),
      {
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*',
        },
        status: 500,
      },
    )
  }
})
