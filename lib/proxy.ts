import jwt from "jsonwebtoken";

export function verifyJWT(token?: string) {
  if (!token) {
    return { valid: false, reason: "MISSING" };
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET!);
    return { valid: true, decoded };
  } catch (err) {
    return { valid: false, reason: (err as Error).message };
  }
}
