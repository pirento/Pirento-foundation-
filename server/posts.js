import { Router } from 'express';
import { Post } from './models.js';

const router = Router();
router.get('/', async (_req, res) => {
  res.json({ posts: await Post.find({ published: true }, '-body').sort({ publishedAt: -1 }).limit(50).lean() });
});
router.get('/:slug', async (req, res) => {
  const post = await Post.findOne({ slug: String(req.params.slug), published: true }).lean();
  if (!post) return res.status(404).json({ error: 'Update not found.' });
  res.json({ post });
});
export default router;
