import { Router } from "express";
import { createArticle, getArticles } from "../controllers/articles.controllers.js";

const router = Router();

router.post("/", createArticle);
router.get("/", getArticles);

export default router;
