import { Redis } from "@upstash/redis";
import { NextResponse } from "next/server";

const redis = new Redis({
  url: process.env.UPSTASH_REDIS_REST_URL,
  token: process.env.UPSTASH_REDIS_REST_TOKEN,
});

export async function POST(request) {
  try {
    const { token, sessionId } = await request.json();
    if (!token || !sessionId) {
      return NextResponse.json({ valid: false, reason: "missing" });
    }
    const raw = await redis.get(`token:${token}`);
    if (!raw) {
      return NextResponse.json({ valid: false, reason: "invalid" });
    }
    const data = typeof raw === "string" ? JSON.parse(raw) : raw;
    if (data.sessionId !== sessionId) {
      return NextResponse.json({ valid: false, reason: "session" });
    }
    if (data.used) {
      return NextResponse.json({ valid: false, reason: "used" });
    }
    return NextResponse.json({
      valid: true,
      submissions: data.submissions,
      puzzleNumber: data.puzzleNumber,
    });
  } catch (e) {
    return NextResponse.json({ valid: false, reason: "error" });
  }
}