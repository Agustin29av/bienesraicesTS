import { Router } from "express";
import { validate } from "../middlewares/validate";
import { asyncHandler } from "../utils/asyncHandler";
import { auth, requireRole } from "../middlewares/authMiddleware";
import { registerBody, loginBody, userIdParam } from "../DTOs/users.dto";
import UserController from "../controllers/UserController";

const router = Router();
const ctrl = new UserController();

// público
router.post("/register",
  validate({ body: registerBody }),
  asyncHandler(ctrl.register)
);

router.post("/login",
  validate({ body: loginBody }),
  asyncHandler(ctrl.login)
);

// privado
router.get("/me",
  auth(true),
  asyncHandler(ctrl.me)
);

// solo admin (ejemplo)
router.delete("/:id",
  auth(true),
  requireRole("admin"),
  validate({ params: userIdParam }),
  asyncHandler(ctrl.remove)
);

export default router;
