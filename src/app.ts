import express from "express";
import cors from "cors";
import helmet from "helmet";
import rateLimit from "express-rate-limit";
import UsersRoutes from "./routes/Users";
import SellersRoutes from "./routes/Sellers";
import PropertiesRoutes from "./routes/Properties";
import { errorHandler } from "./middlewares/errorHandler";

const app = express();

app.use(express.json());
app.use(cors());
app.use(helmet());

// rate limit solo a login/registro para evitar abuso
const authLimiter = rateLimit({ windowMs: 15 * 60 * 1000, max: 50 });
app.use("/api/users/login", authLimiter);
app.use("/api/users/register", authLimiter);

// rutas
app.use("/api/users", UsersRoutes);
app.use("/api/sellers", SellersRoutes);
app.use("/api/properties", PropertiesRoutes);

// error handler SIEMPRE al final
app.use(errorHandler);

export default app;
