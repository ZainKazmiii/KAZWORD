import { Redis } from "@upstash/redis";
import { NextResponse } from "next/server";

const redis = new Redis({
  url: process.env.UPSTASH_REDIS_REST_URL,
  token: process.env.UPSTASH_REDIS_REST_TOKEN,
});

export async function POST(request) {
  try {


	const { token, sessionId, theme, words, notifyMethod, username, creatorName } =
      await request.json();

    if (!token || !sessionId) {
      return NextResponse.json({ success: false, reason: "missing" });
    }
    const raw = await redis.get(`token:${token}`);
    if (!raw) {
      return NextResponse.json({ success: false, reason: "invalid" });
    }
    const data = typeof raw === "string" ? JSON.parse(raw) : raw;
    if (data.sessionId !== sessionId) {
      return NextResponse.json({ success: false, reason: "session" });
    }
    if (data.used) {
      return NextResponse.json({ success: false, reason: "used" });
    }
    // Mark token as used immediately
    data.used = true;
    await redis.set(`token:${token}`, JSON.stringify(data), { ex: 172800 });
    // Save submission



	const submission = {
      puzzleNumber: data.puzzleNumber,
      submissions: data.submissions,
      creatorName,
      theme,
      words,
      notifyMethod,
      username,
      submittedAt: new Date().toISOString(),
    };

    await redis.lpush("submissions", JSON.stringify(submission));
    return NextResponse.json({ success: true });
  } catch (e) {
    return NextResponse.json({ success: false, reason: "error" });
  }
}