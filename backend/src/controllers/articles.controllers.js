import { articlesService } from "../services/articles.services.js";

export async function createArticle(req, res, next) {
  try {
    const validated = articlesService.validateCreateArticleInput(req.body);

    if (validated.error) {
      return res.status(400).json({ error: validated.error });
    }

    const result = await articlesService.createArticle(validated.data);

    if (!result.created) {
      return res.status(409).json({
        status: "duplicate",
        article: result.article,
      });
    }

    return res.status(201).json({
      status: "created",
      article: result.article,
    });
  } catch (error) {
    return next(error);
  }
}

export async function getArticles(req, res, next) {
  try {
    const parsed = articlesService.parsePagination(req.query);

    if (parsed.error) {
      return res.status(400).json({ error: parsed.error });
    }

    const result = await articlesService.listArticles(parsed);
    return res.status(200).json(result);
  } catch (error) {
    return next(error);
  }
}
