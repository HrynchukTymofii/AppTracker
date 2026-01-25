import { User } from "@prisma/client";
import jwt from "jsonwebtoken";

const JWT_SECRET = process.env.JWT_SECRET!;

export function createJwtToken(user: User) {
  return jwt.sign(
    { id: user.userId, email: user.email },
    JWT_SECRET,
    { expiresIn: "60d" }
  );
}
