import { Router } from "express";
import { validate } from "../middlewares/validate";
import { asyncHandler } from "../utils/asyncHandler";
import { requirePropertyOwnershipOrAdmin } from "../middlewares/ownership";
import { auth, requireRole } from "../middlewares/authMiddleware";
import {
  createPropertyBody,
  updatePropertyBody,
  propertyIdParam,
  listPropertiesQuery,
  searchPropertiesQuery,
} from "../DTOs/properties.dto";
import * as PropertyController from "../controllers/PropertyController";

const router = Router();

// Públicos
router.get(
  "/search",
  validate({ query: searchPropertiesQuery }),
  asyncHandler(PropertyController.searchProperties)
);

router.get(
  "/with-sellers",
  asyncHandler(PropertyController.getPropertiesWithSellerInfo)
);

router.get(
  "/:id",
  validate({ params: propertyIdParam }),
  asyncHandler(PropertyController.getPropertyById)
);

router.get(
  "/",
  validate({ query: listPropertiesQuery }),
  asyncHandler(PropertyController.getProperties)
);

// Protegidos
router.post(
  "/",
  auth(true),
  requireRole("admin", "seller"),
  validate({ body: createPropertyBody }),
  asyncHandler(PropertyController.createProperty)
);

router.put(
  "/:id",
  auth(true),
  requireRole("admin", "seller"),
  requirePropertyOwnershipOrAdmin(),
  validate({ params: propertyIdParam, body: updatePropertyBody }),
  asyncHandler(PropertyController.updateProperty)
);

router.delete(
  "/:id",
  auth(true),
  requireRole("admin", "seller"),
  requirePropertyOwnershipOrAdmin(),
  validate({ params: propertyIdParam }),
  asyncHandler(PropertyController.removeProperty)
);

export default router;
