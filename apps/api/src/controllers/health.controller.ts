import { Request, Response } from "express";

export const healthCheck = (req: Request, res: Response) => {
  // A simple check to confirm the server is up and responding to requests by sending back a basic success response with status 200 (OK)

  res.status(200).json({
    message: "Hello World!",
    success: true,
    status: 200,
  });
};
