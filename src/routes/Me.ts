import { Router, type Request, type Response } from "express";

const router = Router();

router.get("/", (req: Request, res: Response) => {
  res.status(200).json({
    success: true,
    message: "Student Information",
    data: {
      studentId: "680610730",
      firstName: "Sermsub",
      lastName: "Bunjopkarn",
      program: "CPE",
      section: "001",
    },
  });
});

export default router;