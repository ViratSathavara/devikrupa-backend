import { Request, Response } from "express";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import { ENV } from "../config/env";

export const signup = async (req: Request, res: Response) => {
  const { email, password } = req.body;

  const hashedPassword = await bcrypt.hash(password, 10);

  // DB save will come later (Prisma)
  res.json({
    message: "User registered",
    email,
    password: hashedPassword
  });
};

export const login = async (req: Request, res: Response) => {
  const { email } = req.body;

  const token = jwt.sign({ email }, ENV.JWT_SECRET, {
    expiresIn: "1d"
  });

  res.json({ token });
};
