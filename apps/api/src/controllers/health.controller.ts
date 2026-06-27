import db from "@repo/database";
import { Request, Response } from "express";

export const healthCheck = (req: Request, res: Response) => {
  res.status(200).json({
    message: "Hello World!",
    success: true,
    status: 200,
  });
};

export const getAllTestUsers = async (req: Request, res: Response) => {
  
  const users = await db.user.findMany();

  res.status(200).json({
    message: "All Users!",
    success: true,
    status: 200,
    users,
  });
}