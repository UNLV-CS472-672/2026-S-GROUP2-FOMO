import { auth } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";

export async function GET() {
  const { userId } = await auth();

  if (!userId) {
    return NextResponse.json({ userId: null }, { status: 401 });
  }

  return NextResponse.json({ userId });
}
