import { NextResponse } from "next/server";

export function jsonError(error: string, code: string, status = 400) {
  return NextResponse.json({ error, code }, { status });
}

export function jsonOk<T extends Record<string, unknown>>(data: T, status = 200) {
  return NextResponse.json(data, { status });
}
