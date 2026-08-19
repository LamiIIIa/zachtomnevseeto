import { initMutualPromotion } from "../components/mutual-promotion.js";
import { initScrollablePostTables } from "../components/post-components/tables-in-posts.js";

export function initTopicView({ main, topicId }) {
  main?.classList.add("forum-design-topic");
  if (topicId !== null) main?.setAttribute("data-topic-id", String(topicId));

  main?.querySelectorAll('.post[id^="p"]').forEach((post, index) => {
    post.dataset.postIndex = String(index);
  });

  initMutualPromotion(main);
  initScrollablePostTables(main ?? document);
}
