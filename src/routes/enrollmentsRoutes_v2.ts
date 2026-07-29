import { Router, type Response } from "express";

import { enrollments } from "../db/db.js";
import authenticateToken from "../middlewares/authenticateToken.js";

import type { CustomRequest } from "../libs/types.js";
import { zEnrollmentPostBody, zCourseId } from "../libs/zodValidators.js";

const router = Router();

// GET /api/v2/enrollments
router.get("/", authenticateToken, (req: CustomRequest, res: Response) => {

    const user = req.user;

    if (!user) {
        return res.status(401).json({
            success: false,
            message: "Unauthorized"
        });
    }

    if (user.role === "ADMIN") {
        return res.status(200).json({
            ok: true,
            enrollments
        });
    }

    const myEnrollments = enrollments.filter(
        e => e.studentId === user.studentId
    );

    const responseData = myEnrollments.map(enrollment => ({
    studentId: enrollment.studentId,
    courseNo: enrollment.courseId,
    }));

    return res.status(200).json({
      ok: true,
      enrollments: responseData,
    });

});

// POST /api/v2/enrollments
router.post("/", authenticateToken, (req: CustomRequest, res: Response) => {

    const user = req.user;

    if (!user) {
        return res.status(401).json({
            success: false,
            message: "Unauthorized"
        });
    }

    if (user.role === "ADMIN") {
        return res.status(403).json({
            ok: false,
            message: "Only Student can access this API route"
        });
    }

    const body = req.body;

    const validation = zEnrollmentPostBody.safeParse(body);

    if (!validation.success) {
        return res.status(400).json({
            ok: false,
            message: validation.error.issues[0]?.message
        });
    }

    enrollments.push({
        studentId: user.studentId!,
        courseId: body.courseNo
    });

    return res.status(200).json({
        ok: true,
        message: "Enrollment added"
    });

});

// DELETE /api/v2/enrollments
router.delete("/", authenticateToken, (req: CustomRequest, res: Response) => {

    const user = req.user;

    if (!user) {
        return res.status(401).json({
            success: false,
            message: "Unauthorized"
        });
    }

    if (user.role === "ADMIN") {
        return res.status(403).json({
            ok: false,
            message: "Only Student can access this API route"
        });
    }

    const courseNo = req.body.courseNo;

    const validation = zCourseId.safeParse(courseNo);

    if (!validation.success) {
        return res.status(400).json({
            ok: false,
            message: validation.error.issues[0]?.message
        });
    }

    const foundIndex = enrollments.findIndex(
        e =>
            e.studentId === user.studentId &&
            e.courseId === courseNo
    );

    if (foundIndex === -1) {
        return res.status(404).json({
            ok: false,
            message: "Enrollment does not exist"
        });
    }

    enrollments.splice(foundIndex, 1);

    return res.status(200).json({
        ok: true,
        message: "You has dropped from this course. See you next semester."
    });
});

export default router;