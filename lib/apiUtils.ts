import type { NextApiRequest, NextApiResponse } from "next";

export function requireMethod(req: NextApiRequest, res: NextApiResponse, method: string) {
  if (req.method !== method) {
    res.setHeader("Allow", method);
    res.status(405).json({ error: `Method ${req.method} not allowed` });
    return false;
  }
  return true;
}

export function parseId(raw: string | string[] | undefined): number | null {
  const s = Array.isArray(raw) ? raw[0] : raw;
  if (!s) return null;
  const n = Number(s);
  return Number.isFinite(n) ? n : null;
}

