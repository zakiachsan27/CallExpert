import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface ParsedExperience {
  title: string
  company: string
  location: string | null
  start_date: string | null
  end_date: string | null
  is_current: boolean
  description: string | null
}

interface ParsedEducation {
  institution: string
  degree: string | null
  field_of_study: string | null
  start_date: string | null
  end_date: string | null
}

interface ParsedResume {
  name: string | null
  email: string | null
  phone: string | null
  location: string | null
  summary: string | null
  experiences: ParsedExperience[]
  education: ParsedEducation[]
  skills: string[]
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    if (req.method !== 'POST') {
      return new Response(
        JSON.stringify({ error: 'Method not allowed' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 405 }
      )
    }

    const { resumeText } = await req.json()

    if (!resumeText || typeof resumeText !== 'string') {
      return new Response(
        JSON.stringify({ error: 'Missing or invalid resumeText' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
      )
    }

    const openaiApiKey = Deno.env.get('OPENAI_API_KEY')
    if (!openaiApiKey) {
      throw new Error('OPENAI_API_KEY not set')
    }

    console.log('Parsing resume with AI, text length:', resumeText.length)

    const systemPrompt = `You are a resume parser. Extract structured data from the resume text provided.
Return ONLY a valid JSON object with this exact structure:

{
  "name": "Full name of the person",
  "email": "Email address or null",
  "phone": "Phone number or null",
  "location": "City/Location or null",
  "summary": "Professional summary or objective statement or null",
  "experiences": [
    {
      "title": "Job title",
      "company": "Company name",
      "location": "Job location or null",
      "start_date": "Start date in YYYY-MM format or null",
      "end_date": "End date in YYYY-MM format or null (null if current)",
      "is_current": true/false,
      "description": "Job description/responsibilities or null"
    }
  ],
  "education": [
    {
      "institution": "School/University name",
      "degree": "Degree type (e.g., Bachelor, Master) or null",
      "field_of_study": "Major/Field of study or null",
      "start_date": "Start date in YYYY-MM format or null",
      "end_date": "End date in YYYY-MM format or null"
    }
  ],
  "skills": ["skill1", "skill2", "skill3"]
}

Important parsing rules:
- For dates, convert Indonesian months (Januari, Februari, etc.) to numbers
- "Sekarang", "Present", "Current" means end_date is null and is_current is true
- Extract ALL work experiences, even if they have similar formatting issues
- For experiences without clear dates, still include them with null dates
- Skills should be individual items, not grouped
- Return valid JSON only, no markdown or explanations`

    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${openaiApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'gpt-4o-mini',
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: `Parse this resume:\n\n${resumeText}` }
        ],
        temperature: 0.1,
        max_tokens: 4000,
      }),
    })

    if (!response.ok) {
      const errorText = await response.text()
      console.error('OpenAI API error:', errorText)
      throw new Error(`OpenAI API error: ${response.status}`)
    }

    const data = await response.json()
    const aiResponse = data.choices[0]?.message?.content

    if (!aiResponse) {
      throw new Error('No response from AI')
    }

    console.log('AI response received, parsing JSON...')

    // Try to parse the JSON response
    let parsedResume: ParsedResume
    try {
      // Remove any markdown code blocks if present
      let jsonStr = aiResponse.trim()
      if (jsonStr.startsWith('```json')) {
        jsonStr = jsonStr.slice(7)
      } else if (jsonStr.startsWith('```')) {
        jsonStr = jsonStr.slice(3)
      }
      if (jsonStr.endsWith('```')) {
        jsonStr = jsonStr.slice(0, -3)
      }
      jsonStr = jsonStr.trim()

      parsedResume = JSON.parse(jsonStr)
    } catch (parseError) {
      console.error('Failed to parse AI response as JSON:', aiResponse)
      throw new Error('AI returned invalid JSON')
    }

    // Validate structure
    if (!parsedResume.experiences) {
      parsedResume.experiences = []
    }
    if (!parsedResume.education) {
      parsedResume.education = []
    }
    if (!parsedResume.skills) {
      parsedResume.skills = []
    }

    console.log('Successfully parsed resume:', {
      name: parsedResume.name,
      experienceCount: parsedResume.experiences.length,
      educationCount: parsedResume.education.length,
      skillCount: parsedResume.skills.length,
    })

    return new Response(
      JSON.stringify({
        success: true,
        data: parsedResume,
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 200 }
    )

  } catch (error) {
    console.error('Error:', error)
    return new Response(
      JSON.stringify({
        success: false,
        error: error.message
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
    )
  }
})
