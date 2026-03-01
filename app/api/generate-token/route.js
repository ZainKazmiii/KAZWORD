import { Redis } from "@upstash/redis";
import { NextResponse } from "next/server";

const redis = new Redis({
  url: process.env.UPSTASH_REDIS_REST_URL,
  token: process.env.UPSTASH_REDIS_REST_TOKEN,
});

function generateToken() {
  const arr = new Uint8Array(32);
  crypto.getRandomValues(arr);
  return Array.from(arr, (b) => b.toString(16).padStart(2, "0")).join("");
}

export async function POST(request) {
  try {
    const { submissions, puzzleNumber } = await request.json();
    if (!submissions || !puzzleNumber) {
      return NextResponse.json({ error: "Missing data" }, { status: 400 });
    }
    if (submissions >= 20) {
      return NextResponse.json({ error: "Not eligible" }, { status: 403 });
    }
    const token = generateToken();
    const sessionId = generateToken();
    const data = {
      submissions,
      puzzleNumber,
      sessionId,
      used: false,
      createdAt: Date.now(),
    };
    await redis.set(`token:${token}`, JSON.stringify(data), { ex: 172800 });
    return NextResponse.json({ token, sessionId });
  } catch (e) {
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}