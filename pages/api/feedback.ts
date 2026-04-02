import { NextApiRequest, NextApiResponse } from "next";
import { FeedbackService } from "../../lib/services/feedbackService";

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method === "POST") {
    try {
      const feedbackData = req.body;

      if (!feedbackData.userId || !feedbackData.creationId) {
        return res.status(400).json({ error: "User ID and Creation ID are required" });
      }

      if (!feedbackData.feedbackType ||
          (feedbackData.feedbackType === "preset" && !feedbackData.presetFeedback) ||
          (feedbackData.feedbackType === "custom" && !feedbackData.customFeedback)) {
        return res.status(400).json({ error: "Feedback content is required" });
      }

      const feedbackService = new FeedbackService();
      const result = await feedbackService.createFeedback(feedbackData);

      res.status(200).json({ success: true, feedback: result });
    } catch (error) {
      console.error("Error processing feedback:", error);
      res.status(500).json({ error: "Internal server error" });
    }
  } else if (req.method === "GET") {
    try {
      const { userId } = req.query;

      if (!userId || typeof userId !== "string") {
        return res.status(400).json({ error: "User ID is required" });
      }

      const feedbackService = new FeedbackService();
      const stats = await feedbackService.getFeedbackStats(userId);

      res.status(200).json({ stats });
    } catch (error) {
      console.error("Error getting feedbacks:", error);
      res.status(500).json({ error: "Internal server error" });
    }
  } else {
    res.setHeader("Allow", ["GET", "POST"]);
    res.status(405).end(`Method ${req.method} Not Allowed`);
  }
}
