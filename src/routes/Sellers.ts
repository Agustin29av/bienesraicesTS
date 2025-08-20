import { Router } from "express";
import { validate } from "../middlewares/validate";
import { asyncHandler } from "../utils/asyncHandler";
import { auth, requireRole } from "../middlewares/authMiddleware";
import {
  createSellerBody,
  updateSellerBody,
  sellerIdParam,
  listSellersQuery,
} from "../DTOs/sellers.dto";
import * as SellerController from "../controllers/SellerController";

const router = Router();

// Públicos (si preferís, podés pedir auth también)
router.get(
  "/",
  validate({ query: listSellersQuery }),
  asyncHandler(SellerController.getSellers)
);

router.get(
  "/:id",
  validate({ params: sellerIdParam }),
  asyncHandler(SellerController.getSellerById)
);

// Protegidos
router.post(
  "/",
  auth(true),
  requireRole("admin", "seller"),
  validate({ body: createSellerBody }),
  asyncHandler(SellerController.createSeller)
);

router.put(
  "/:id",
  auth(true),
  requireRole("admin", "seller"),
  validate({ params: sellerIdParam, body: updateSellerBody }),
  asyncHandler(SellerController.updateSeller)
);

router.delete(
  "/:id",
  auth(true),
  requireRole("admin"),
  validate({ params: sellerIdParam }),
  asyncHandler(SellerController.removeSeller)
);

export default router;
