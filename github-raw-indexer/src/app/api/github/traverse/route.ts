import { NextResponse } from "next/server";

import { resolveRef } from "@/lib/github/api";
import { AppError, toErrorLike } from "@/lib/github/errors";
import { parseTarget } from "@/lib/github/parseTarget";
import { traverse } from "@/lib/github/traverse";
import type { ParsedTarget } from "@/lib/github/types";

export const runtime = "nodejs";

interface TraverseRequestBody {
  url?: string;
  maxDepth?: number;
}

export async function POST(request: Request) {
  let body: TraverseRequestBody;
  try {
    body = await request.json();
  } catch (error) {
    const err = new AppError("invalid_body", "Request body must be valid JSON.", { cause: error });
    return NextResponse.json({ error: toErrorLike(err) }, { status: 400 });
  }

  const url = body.url ?? "";
  const parsed = parseTarget(url);
  if ("code" in parsed) {
    return NextResponse.json({ error: parsed }, { status: parsed.status ?? 400 });
  }

  const maxDepthRaw = body.maxDepth;
  const maxDepthValue =
    typeof maxDepthRaw === "number"
      ? maxDepthRaw
      : Number.isFinite(Number(maxDepthRaw))
        ? Number(maxDepthRaw)
        : 0;

  try {
    const ref = await resolveRef(parsed);
    const target: ParsedTarget = { ...parsed, ref };
    const nodes = await traverse(target, maxDepthValue);
    return NextResponse.json({ nodes, target }, { status: 200 });
  } catch (error) {
    const err = toErrorLike(error);
    const status = err.status ?? (err.code === "rate_limit" ? 429 : 500);
    return NextResponse.json({ error: err }, { status });
  }
}
