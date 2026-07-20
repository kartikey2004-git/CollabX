import { Request, Response } from "express";

// A simple check to confirm the server is up and responding to requests
export const healthCheck = (req: Request, res: Response) => {
  // Send back a basic success response with status 200 (OK)
  res.status(200).json({
    message: "Hello World!",
    success: true,
    status: 200,
  });
};
