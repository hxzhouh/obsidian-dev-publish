import type { requestUrl } from "obsidian";
type RequestUrl = typeof requestUrl;

export const postArticle = async (
  input: { apiKey: string },
  requestUrl: RequestUrl,
) => {
  const body = {
    article: {
      title: "Hello, World!",
      published: false,
      body_markdown: "Hello DEV, this is my first post",
      tags: [],
      series: "Hello series",
    },
  };
  const response = await requestUrl({
    url: "https://dev.to/api/articles",
    method: "POST",
    body: JSON.stringify(body),
    headers: {
      "api-key": input.apiKey,
    },
    contentType: "application/json",
  });
  return response.json;
};
