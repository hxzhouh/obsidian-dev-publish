import sinon, { match } from "sinon";
import MediumGateway, { CreateArticleResult } from "src/medium-gateway";
import Publisher from "src/publisher";
import { createFakeFile } from "./factories";
import { FakeApp, FakeFile, FakeGetFrontMatterInfo } from "./fakes";
import { expect } from "chai";
import { DialogController } from "../src/image-mapping-dialog";

const createPostArticleResponse = (input?: Partial<CreateArticleResult>) => ({
  id: 1,
  url: "",
  canonicalUrl: "",
  ...input,
});

describe("Publish a file from a TFile structure", () => {
  let gateway: sinon.SinonStubbedInstance<MediumGateway>;
  let publisher: Publisher<FakeFile>;

  beforeEach(() => {
    gateway = sinon.createStubInstance(MediumGateway);
    publisher = new Publisher(
      new FakeApp(),
      gateway,
      new FakeGetFrontMatterInfo(),
    );
  });

  describe("Map images", () => {
    let fileWithImageEmbeds: FakeFile;
    let dialogController: DialogController;
    let showImageMappingDialog: sinon.SinonStub;

    beforeEach(() => {
      fileWithImageEmbeds = createFakeFile({
        contents: "foobar ![[image1.png]] baz ![[folder/image2.png]]",
      });
      showImageMappingDialog = sinon.stub();
      dialogController = { showImageMappingDialog };
    });

    it("Opens the image dialog initialised with images embeds from the markdown", async () => {
      await publisher.mapImages(fileWithImageEmbeds, dialogController);
      showImageMappingDialog.resolves(null);
      dialogController.showImageMappingDialog.should.have.been.calledOnceWith(
        match([
          match({ imageFile: "image1.png" }),
          match({ imageFile: "folder/image2.png" }),
        ]),
      );
    });

    it("Updates the metadata on close", async () => {
      showImageMappingDialog.resolves([
        {
          imageFile: "image1.png",
          publicUrl: "https://example.com/image1.png",
        },
        {
          imageFile: "folder/image2.png",
          publicUrl: "",
        },
      ]);
      await publisher.mapImages(fileWithImageEmbeds, dialogController);
      expect(fileWithImageEmbeds.frontmatter["dev-image-map"]).to.be.like([
        {
          imageFile: "[[image1.png]]",
          publicUrl: "https://example.com/image1.png",
        },
      ]);
    });

    it("Ignores non-image embeds", async () => {
      const file = createFakeFile({
        contents:
          "foobar ![[image1.png]] baz ![[markdown embed]] ![[pdf-embed.pdf]]",
      });
      await publisher.mapImages(file, dialogController);
      expect(showImageMappingDialog).to.have.been.calledOnceWith(
        match([
          {
            imageFile: "image1.png",
            publicUrl: "",
          },
        ]),
      );
    });

    context("When frontmatter already contains mapping information", () => {
      beforeEach(() => {
        fileWithImageEmbeds.frontmatter["dev-image-map"] = [
          {
            imageFile: "[[image1.png]]",
            publicUrl: "https://example.com/image1.png",
          },
        ];
      });

      it("Prefills targets with values from metadata", async () => {
        await publisher.mapImages(fileWithImageEmbeds, dialogController);
        showImageMappingDialog.should.have.been.calledOnceWith(
          match([
            match({
              imageFile: "image1.png",
              publicUrl: "https://example.com/image1.png",
            }),
            { imageFile: "folder/image2.png", publicUrl: "" },
          ]),
        );
      });

      it("Does not change existing frontmatter when cancelled", async () => {
        showImageMappingDialog.resolves(null);
        await publisher.mapImages(fileWithImageEmbeds, dialogController);
        expect(fileWithImageEmbeds.frontmatter["dev-image-map"]).to.deep.equal([
          {
            imageFile: "[[image1.png]]",
            publicUrl: "https://example.com/image1.png",
          },
        ]);
      });
    });
  });

  describe("Update status", () => {
    it("Should do nothing if no article id is present", async () => {
      const obsidianFile = createFakeFile({
        frontmatter: {
          "dev-article-id": undefined as any,
        },
      });
      await publisher.updateStatus(obsidianFile);
      gateway.getArticleStatus.should.not.have.been.called;
    });

    it("Should leave url and canonicalUrl alone when a file is not published", async () => {
      const obsidianFile = createFakeFile({
        frontmatter: {
          "dev-article-id": 42,
          "dev-url": "https://example.com/temporary_url",
          "dev-canonical-url": "https://example.com/temporary_canonical_url",
        },
      });
      gateway.getArticleStatus.resolves({ published: false });
      await publisher.updateStatus(obsidianFile);
      obsidianFile.frontmatter.should.be.like({
        "dev-article-id": 42,
        "dev-published": false,
        "dev-url": "https://example.com/temporary_url",
        "dev-canonical-url": "https://example.com/temporary_canonical_url",
      });
    });

    it("Should update url and canonicalUrl when a file is published", async () => {
      const obsidianFile = createFakeFile({
        frontmatter: {
          "dev-article-id": 42,
          "dev-url": "https://example.com/temporary_url",
          "dev-canonical-url": "https://example.com/temporary_canonical_url",
        },
      });
      gateway.getArticleStatus.resolves({
        published: true,
        url: "https://example.com/published_url",
        canonicalUrl: "https://example.com/published_canonical_url",
      });
      await publisher.updateStatus(obsidianFile);
      obsidianFile.frontmatter.should.be.like({
        "dev-article-id": 42,
        "dev-published": true,
        "dev-url": "https://example.com/published_url",
        "dev-canonical-url": "https://example.com/published_canonical_url",
      });
    });
  });

  describe("Article has previously been created", () => {
    describe("Article has not yet been published", () => {
      beforeEach(async () => {
        gateway.getArticleStatus.resolves({ published: false });
      });

      it("Should _update_ if the file has already been created", async () => {
        const obsidianFile = createFakeFile({
          frontmatter: { "dev-article-id": 42 },
        });
        await publisher.publish(obsidianFile);
        gateway.updateArticle.should.have.been.calledOnceWith(
          match({
            id: 42,
          }),
        );
      });
    });

    describe("Article has been published", () => {
      beforeEach(() => {
        gateway.getArticleStatus.resolves({
          published: true,
          url: "https://example.com/url",
          canonicalUrl: "https://example.com/canonical_url",
        });
      });

      it("Should update properties", async () => {
        const obsidianFile = createFakeFile({
          frontmatter: { "dev-article-id": 42 },
        });
        await publisher.publish(obsidianFile);
        obsidianFile.frontmatter.should.be.like({
          "dev-url": "https://example.com/url",
          "dev-canonical-url": "https://example.com/canonical_url",
        });
      });
    });
  });

  describe("The file has not been created", () => {
    let obsidianFile: FakeFile;

    beforeEach(() => {
      gateway.createArticle.resolves(createPostArticleResponse({ id: 43 }));
      obsidianFile = createFakeFile({
        frontmatter: {},
      });
    });

    it("Should create an article", async () => {
      await publisher.publish(obsidianFile);
      gateway.createArticle.should.have.been.calledOnce;
    });

    it("Should update the frontmatter", async () => {
      await publisher.publish(obsidianFile);
      expect(obsidianFile.frontmatter["dev-article-id"]).to.equal(43);
    });

    describe("Series", () => {
      it("Should not be included in the posted data if the `categories` metadata doesn't exist", async () => {
        // This is already the default state, but I want the test to make this explicit
        delete obsidianFile.frontmatter["categories"];
        await publisher.publish(obsidianFile);
        gateway.createArticle.should.have.been.calledWith(
          match({ article: { series: match.typeOf("undefined") } }),
        );
      });

      it("Should be set in the data if the `categories` metadata has a string value", async () => {
        // This is already the default state, but I want the test to make this explicit
        obsidianFile.frontmatter["categories"] = "My awesome series";
        await publisher.publish(obsidianFile);
        gateway.createArticle.should.have.been.calledWith(
          match({
            article: { series: "My awesome series" },
          }),
        );
      });

      it("Should be ignored data if the `categories` metadata is not a string", async () => {
        // This is already the default state, but I want the test to make this explicit
        obsidianFile.frontmatter["categories"] = 42;
        await publisher.publish(obsidianFile);
        gateway.createArticle.should.have.been.calledWith(
          match({ article: { series: match.typeOf("undefined") } }),
        );
      });
    });

    describe("Publishing tags", () => {
      it("Should not create `tags` if none exists in frontmatter", async () => {
        // This is already the default state, but I want the test to make this explicit
        delete obsidianFile.frontmatter["tags"];
        await publisher.publish(obsidianFile);
        const article = gateway.createArticle.firstCall.args[0];
        article.should.not.haveOwnProperty("tags");
      });

      it("Should create `tags` if they exists in frontmatter", async () => {
        // This is already the default state, but I want the test to make this explicit
        obsidianFile.frontmatter["tags"] = ["tag1", "tag2"];
        await publisher.publish(obsidianFile);
        gateway.createArticle.should.have.been.calledOnceWith(
          match({
            article: { tags: ["tag1", "tag2"] },
          }),
        );
      });

      it("Should ignore tags if not an array", async () => {
        obsidianFile.frontmatter["tags"] = 42;
        await publisher.publish(obsidianFile);
        gateway.createArticle.should.have.been.calledOnceWith(
          match({
            article: { tags: undefined },
          }),
        );
      });

      it("Should filter out tags that are not strings", async () => {
        obsidianFile.frontmatter["tags"] = ["foo", {}, "bar"];
        await publisher.publish(obsidianFile);
        gateway.createArticle.should.have.been.calledOnceWith(
          match({
            article: { tags: ["foo", "bar"] },
          }),
        );
      });

      it("Should truncate if there are more than 4 tags", async () => {
        obsidianFile.frontmatter["tags"] = [
          "Tag-1",
          "Tag-2",
          "Tag-3",
          "Tag-4",
          "Tag-5",
          "Tag-6",
        ];
        await publisher.publish(obsidianFile);
        gateway.createArticle.should.have.been.calledOnceWith(
          match({
            article: { tags: ["Tag-1", "Tag-2", "Tag-3", "Tag-4"] },
          }),
        );
      });
    });

    // describe("Contents does not contains frontmatter", () => {
    //   beforeEach(() => {
    //     obsidianFile.contents = "# Heading\n\n Foo bar";
    //   });

    //   it("Should publish contents after the H1", async () => {
    //     await publisher.publish(obsidianFile);
    //     gateway.createArticle.should.have.been.calledOnceWith(
    //       match({
    //         article: {
    //           title: "Heading",
    //           markdown: "Foo bar",
    //         },
    //       }),
    //     );
    //   });
    // });

    describe("Contents contain frontmatter but no heading", () => {
      beforeEach(() => {
        obsidianFile.contents = "---\nfoo: Bar\n---\nFoo bar";
      });

      it("Should publish the entire file contents", async () => {
        await publisher.publish(obsidianFile);
        gateway.createArticle.should.have.been.calledOnceWith(
          match({
            article: {
              markdown: "Foo bar",
            },
          }),
        );
      });
    });
  });
});
