/* eslint-disable no-console */
import { fetchRequestUrlWrapper } from "./obsidian-wrappers";

/*
 * Abandoned attempt at uploading images
 *
 * The DEV API does not expose an endpoint for uploading images. Internally,
 * when using the UI, it uploads to /image_uploads, so I tried to see if
 * posting to this endpoint with an API KEY in the header would work.
 *
 * But that doesn't appear to be the case. Instead of responsing with a JSON
 * value containing the URL of an uploaded image, the server responds with
 * STATUS: 200
 * Content-type: text/html
 * Body:
 * i.e. no text in the body - unleass I completely misunderstand how to
 * interpret the response, but neither .text() or .arrayBuffer() generated
 * content.
 *
 * Thus, if we are to upload images, we must upload to another server.
 */
//specify.only("Upload image", async () => {
//  if (!process.env.DEV_API_KEY) {
//    throw new Error("Missing api key");
//  }
//  const fileName =
//    "/Users/peter/src/obsidian-plugins/Plugin Development/temp.png";
//  const formData = new FormData();
//  formData.append("image[]", fs.createReadStream(fileName));
//  const r = await fetch("https://dev.to/image_uploads", {
//    method: "POST",
//    headers: {
//      accept: "application/json",
//      "api-key": process.env.DEV_API_KEY as string,
//    },
//    body: formData,
//  });
//  console.log("Status: ", r.status);
//  r.headers.forEach((val, key) => {
//    console.log("Header", key, val);
//  });
//  //const ab = await r.arrayBuffer()
//  //const b = Buffer.from(ab)
//  console.log("Body: ", await r.text());
//});

describe("Post to dev, using a fetch->requestUrl wrapper for feedback", () => {
  before(async () => {
    /**
     * During development, delete all my draft articles before running, to
     * cleanup.
     *
     * Still, goal is to create a productive feedback loop.
     */
  });

  it.skip("Dev feedback - explore creating a rich article", async () => {
    const articleId = 1875096;
    const body = {
      article: {
        title: "Hello, World 2!",
        published: false,
        body_markdown:
          "# Hello\n\nTest article\n## Subheading\n\n```ocaml\nlet example=42\n\nlet ( >>= ) = Result.bind\n```\n\nTest",
        tags: [],
        series: "Hello series",
      },
    };
    const response = await fetchRequestUrlWrapper({
      url: `https://dev.to/api/articles/${articleId}`,
      method: "PUT",
      body: JSON.stringify(body),
      headers: {
        "api-key": process.env.DEV_API_KEY as string,
      },
      contentType: "application/json",
    });
    const response_body = await response.json;
    // eslint-disable-next-line
    console.log(response_body);
  });

  it.skip("Dev feedback tool only - Get my articles", async () => {
    const response = await fetchRequestUrlWrapper({
      url: "https://dev.to/api/articles/me/unpublished",
      headers: {
        // "api-key": process.env.DEV_API_KEY as string,
      },
    });
    const json = await response.json;
    console.log(json);
  });

  // it.skip("Dev feedback tool only - Should create an article on dev.to", async () => {
  //   console.log("FOO");
  //   const response = await postArticle(
  //     {
  //       apiKey: process.env.DEV_API_KEY as string,
  //     },
  //     fetchRequestUrlWrapper,
  //   );
  //   console.log("RESPONSE", response);
  // });
});

/*
 *
 * Example obsidian response:
 */
// eslint-disable-next-line
const response = {
  type_of: "article",
  id: 1875178,
  title: "Hello, World!",
  description: "Hello DEV, this is my first post",
  readable_publish_date: null,
  slug: "hello-world-326a-temp-slug-2508115",
  path: "/stroiman/hello-world-326a-temp-slug-2508115",
  url: "https://dev.to/stroiman/hello-world-326a-temp-slug-2508115",
  comments_count: 0,
  public_reactions_count: 0,
  collection_id: 27578,
  published_timestamp: "",
  positive_reactions_count: 0,
  cover_image: null,
  social_image: "https://dev.to/social_previews/article/1875178.png",
  canonical_url: "https://dev.to/stroiman/hello-world-326a-temp-slug-2508115",
  created_at: "2024-06-03T09:31:39Z",
  edited_at: null,
  crossposted_at: null,
  published_at: null,
  last_comment_at: "2017-01-01T05:00:00Z",
  reading_time_minutes: 1,
  tag_list: "",
  tags: [],
  body_html: "<p>Hello DEV, this is my first post</p>\n\n",
  body_markdown: "Hello DEV, this is my first post",
  user: {
    name: "Peter Strøiman",
    username: "stroiman",
    twitter_username: null,
    github_username: "stroiman",
    user_id: 1510381,
    website_url: null,
    profile_image:
      "https://media.dev.to/cdn-cgi/image/width=640,height=640,fit=cover,gravity=auto,format=auto/https%3A%2F%2Fdev-to-uploads.s3.amazonaws.com%2Fuploads%2Fuser%2Fprofile_image%2F1510381%2F22f48b63-eaaf-41e1-8ac1-d265c7568b7f.jpeg",
    profile_image_90:
      "https://media.dev.to/cdn-cgi/image/width=90,height=90,fit=cover,gravity=auto,format=auto/https%3A%2F%2Fdev-to-uploads.s3.amazonaws.com%2Fuploads%2Fuser%2Fprofile_image%2F1510381%2F22f48b63-eaaf-41e1-8ac1-d265c7568b7f.jpeg",
  },
};
