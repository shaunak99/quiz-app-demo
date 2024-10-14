import { NextResponse } from 'next/server';

export async function POST(request) {
  try {
    const { topic, numQuestions, difficulty } = await request.json();
    const inputData = `Create a quiz on ${topic} with ${numQuestions} questions at ${difficulty} difficulty.`;

    const requestBody = {
      agent_id: "<your-api-key>",
      input_data: inputData,
      json_mode: true,
    };

    console.log("Yo")

    const response = await fetch('https://trytruffle.ai/api/v0/run', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': process.env.TRUFFLE_API_KEY,
      },
      body: JSON.stringify(requestBody),
    });

    if (!response.ok) {
      throw new Error(`API request failed with status ${response.status}`);
    }

    const data = await response.json();
    return NextResponse.json(JSON.parse(data.data));
  } catch (error) {
    console.error("Error generating quiz:", error);
    return NextResponse.json({ error: "Error generating quiz" }, { status: 500 });
  }
}