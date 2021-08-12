import { expect } from "chai";
import { existsSync, unlinkSync } from "fs";

import { collections } from "../../../src/database";
import sceneMutations from "../../../src/graphql/mutations/scene";
import { indexActors } from "../../../src/search/actor";
import { indexImages } from "../../../src/search/image";
import { indexScenes } from "../../../src/search/scene";
import { indexStudios } from "../../../src/search/studio";
import Actor from "../../../src/types/actor";
import Image from "../../../src/types/image";
import Label from "../../../src/types/label";
import Scene from "../../../src/types/scene";
import Studio from "../../../src/types/studio";
import { downloadFile } from "../../../src/utils/download";
import { TEST_VIDEOS } from "../../fixtures/files/dynamicTestFiles";
import { startTestServer, stopTestServer } from "../../testServer";
import { ApplyActorLabelsEnum, ApplyStudioLabelsEnum } from "./../../../src/config/schema";

describe("graphql", () => {
  describe("mutations", () => {
    describe("scene", () => {
      const sceneFilename = "dynamic_image001.jpg";

      async function seedDb() {
        expect(await Label.getAll()).to.be.empty;
        const actorLabel = new Label("def label");
        await collections.labels.upsert(actorLabel._id, actorLabel);
        const studioLabel = new Label("jkl label");
        await collections.labels.upsert(studioLabel._id, studioLabel);
        expect(await Label.getAll()).to.have.lengthOf(2);

        const seedActor = new Actor("abc actor");
        await collections.actors.upsert(seedActor._id, seedActor);
        await indexActors([seedActor]);

        await Actor.setLabels(seedActor, [actorLabel._id]);
        const actorLabels = await Actor.getLabels(seedActor);
        expect(actorLabels).to.have.lengthOf(1);

        const seedStudio = new Studio("dummy studio");
        await collections.studios.upsert(seedStudio._id, seedStudio);
        await indexStudios([seedStudio]);
        await Studio.setLabels(seedStudio, [studioLabel._id]);

        return {
          seedActor,
          actorLabel,
          seedStudio,
          studioLabel,
        };
      }

      async function seedDbWithScene() {
        const { seedActor, actorLabel, seedStudio, studioLabel } = await seedDb();
        const seedScene = new Scene("seed_scene");

        expect(await Scene.getAll()).to.be.empty;
        await collections.scenes.upsert(seedScene._id, seedScene);
        await indexScenes([seedScene]);
        expect(await Scene.getAll()).to.have.lengthOf(1);

        const updateLabel = new Label("ghi label");
        await collections.labels.upsert(updateLabel._id, updateLabel);
        expect(await Label.getAll()).to.have.lengthOf(3);

        // Image labels are not attached to image,
        // since we manually set the actors and labels
        expect(await Scene.getActors(seedScene)).to.have.lengthOf(0);
        expect(await Scene.getLabels(seedScene)).to.have.lengthOf(0);

        return {
          seedScene,
          seedActor,
          actorLabel,
          updateLabel,
          seedStudio,
          studioLabel,
        };
      }

      afterEach(() => {
        stopTestServer();
      });

      describe("addScene", () => {
        it("when applyActorLabels does not include creation, attaches actor, adds no labels", async function () {
          await startTestServer.call(this, {
            matching: {
              applyActorLabels: [],
            },
          });
          const { seedActor } = await seedDb();

          const addScene = {
            name: sceneFilename,
            actors: [seedActor._id],
            labels: [],
          };

          const outputScene = await sceneMutations.addScene(null, addScene);

          expect(outputScene.name).to.equal(addScene.name);

          const sceneActors = await Scene.getActors(outputScene);
          expect(sceneActors).to.have.lengthOf(1);
          expect(sceneActors[0]._id).to.equal(seedActor._id);

          expect(await Scene.getLabels(outputScene)).to.have.lengthOf(0);
        });

        it("when applyActorLabels includes creation, attaches actor, adds labels", async function () {
          await startTestServer.call(this, {
            matching: {
              applyActorLabels: [ApplyActorLabelsEnum.enum["event:scene:create"]],
            },
          });
          const { seedActor, actorLabel } = await seedDb();

          const addScene = {
            name: sceneFilename,
            actors: [seedActor._id],
            labels: [],
          };

          const outputScene = await sceneMutations.addScene(null, addScene);

          expect(outputScene.name).to.equal(addScene.name);

          const sceneActors = await Scene.getActors(outputScene);
          expect(sceneActors).to.have.lengthOf(1);
          expect(sceneActors[0]._id).to.equal(seedActor._id);

          const sceneLabels = await Scene.getLabels(outputScene);
          expect(sceneLabels).to.have.lengthOf(1);
          expect(sceneLabels[0]._id).to.equal(actorLabel._id);
        });
      });

      describe("updateScenes", () => {
        it("when applyActorLabels,applyStudioLabels does not include update, when name in path, attaches actor, adds no labels", async function () {
          await startTestServer.call(this, {
            matching: {
              applyActorLabels: [],
              applyStudioLabels: [],
            },
          });
          const { seedScene, seedActor, updateLabel, seedStudio } = await seedDbWithScene();

          const opts = {
            name: `${sceneFilename} update`,
            rating: 0,
            labels: [updateLabel._id],
            actors: [seedActor._id],
            favorite: false,
            studio: seedStudio._id,
            scene: null,
            customFields: undefined,
            color: null,
          };

          const outputScenes = await sceneMutations.updateScenes(null, {
            ids: [seedScene._id],
            opts,
          });

          expect(outputScenes).to.have.lengthOf(1);
          const outputScene = outputScenes[0];
          expect(outputScene.name).to.equal(opts.name);
          expect(outputScene.studio).to.equal(opts.studio);

          expect(await Scene.getActors(seedScene)).to.have.lengthOf(1);

          const sceneLabels = await Scene.getLabels(outputScene);
          expect(sceneLabels).to.have.lengthOf(1);
          // Only contains our direct label, not the actor/studio label
          expect(sceneLabels[0]._id).to.equal(updateLabel._id);
        });

        it("when applyActorLabels includes update, when name in path, attaches actor, adds labels", async function () {
          await startTestServer.call(this, {
            matching: {
              applyActorLabels: [ApplyActorLabelsEnum.enum["event:scene:update"]],
              applyStudioLabels: [ApplyStudioLabelsEnum.enum["event:scene:update"]],
            },
          });
          const {
            seedScene,
            seedActor,
            actorLabel,
            updateLabel,
            seedStudio,
            studioLabel,
          } = await seedDbWithScene();

          const opts = {
            name: `${sceneFilename} update`,
            rating: 0,
            labels: [updateLabel._id],
            actors: [seedActor._id],
            favorite: false,
            studio: seedStudio._id,
            scene: null,
            customFields: undefined,
            color: null,
          };

          const outputScenes = await sceneMutations.updateScenes(null, {
            ids: [seedScene._id],
            opts,
          });

          expect(outputScenes).to.have.lengthOf(1);
          const outputScene = outputScenes[0];
          expect(outputScene.name).to.equal(opts.name);

          expect(await Scene.getActors(seedScene)).to.have.lengthOf(1);

          const sceneLabels = await Scene.getLabels(outputScene);
          expect(sceneLabels).to.have.lengthOf(3);
          // Contains both our update label and the actor,studio label
          expect(!!sceneLabels.find((l) => l._id === actorLabel._id)).to.be.true;
          expect(!!sceneLabels.find((l) => l._id === studioLabel._id)).to.be.true;
          expect(!!sceneLabels.find((l) => l._id === updateLabel._id)).to.be.true;
        });
      });

      describe("runFFProbe", () => {
        for (const testName in TEST_VIDEOS) {
          const test = TEST_VIDEOS[testName];
          describe(testName, () => {
            const videoPath = `./test/fixtures/files/dynamic/${test.filename}`;

            before(async () => {
              await downloadFile(test.url, videoPath);
            });

            after(() => {
              if (existsSync(videoPath)) {
                unlinkSync(videoPath);
              }
            });

            it("sets metadata", async function () {
              await startTestServer.call(this, {});

              const { seedScene } = await seedDbWithScene();
              seedScene.path = videoPath;
              await collections.scenes.upsert(seedScene._id, seedScene);

              expect(seedScene.meta.size).to.be.null;
              expect(seedScene.meta.duration).to.be.null;
              expect(seedScene.meta.dimensions).to.be.null;
              expect(seedScene.meta.fps).to.be.null;
              expect(seedScene.meta).to.not.deep.equal(test.metadata);

              const res = (await sceneMutations.runFFProbe(null, { id: seedScene._id }))!;
              expect(res).to.not.be.null;
              const updatedScene = res.scene!;
              expect(updatedScene).to.not.be.null;

              expect(updatedScene.meta.size).to.not.be.null;
              expect(updatedScene.meta.duration).to.not.be.null;
              expect(updatedScene.meta.dimensions).to.not.be.null;
              expect(updatedScene.meta.fps).to.not.be.null;
              expect(updatedScene.meta).to.deep.equal(test.metadata);

              const sceneFromDb = (await Scene.getById(seedScene._id)) as Scene;
              expect(sceneFromDb).to.not.be.null;
              expect(sceneFromDb.meta.size).to.not.be.null;
              expect(sceneFromDb.meta.duration).to.not.be.null;
              expect(sceneFromDb.meta.dimensions).to.not.be.null;
              expect(sceneFromDb.meta.fps).to.not.be.null;
              expect(sceneFromDb.meta).to.deep.equal(test.metadata);
            });
          });
        }
      });

      describe("removeScene", () => {
        const videoPath = "./test/fixtures/files/dynamic/dynamic_video.mp4";

        beforeEach(async () => {
          await downloadFile(TEST_VIDEOS.MP4.url, videoPath);
        });

        afterEach(() => {
          if (existsSync(videoPath)) {
            unlinkSync(videoPath);
          }
        });

        it("deletes file", async function () {
          await startTestServer.call(this, {});

          const { seedScene } = await seedDbWithScene();
          seedScene.path = videoPath;
          await collections.scenes.upsert(seedScene._id, seedScene);

          expect(existsSync(videoPath)).to.be.true;

          const res = (await sceneMutations.removeScenes(null, {
            ids: [seedScene._id],
            deleteFile: true,
          }))!;
          expect(res).to.be.true;
          expect(existsSync(videoPath)).to.be.false;
        });

        it("keeps file", async function () {
          await startTestServer.call(this, {});

          const { seedScene } = await seedDbWithScene();
          seedScene.path = videoPath;
          await collections.scenes.upsert(seedScene._id, seedScene);

          expect(existsSync(videoPath)).to.be.true;

          const res = (await sceneMutations.removeScenes(null, {
            ids: [seedScene._id],
            deleteFile: false,
          }))!;
          expect(res).to.be.true;
          expect(existsSync(videoPath)).to.be.true;
        });

        it("deletes images", async function () {
          await startTestServer.call(this, {});

          const { seedScene } = await seedDbWithScene();
          seedScene.path = videoPath;
          await collections.scenes.upsert(seedScene._id, seedScene);

          const image = new Image("test image");
          image.scene = seedScene._id;
          await collections.images.upsert(image._id, image);
          await indexImages([image]);

          expect(await Image.getAll()).to.have.lengthOf(1);
          expect(await Image.getByScene(seedScene._id)).to.have.lengthOf(1);

          expect(existsSync(videoPath)).to.be.true;

          const res = (await sceneMutations.removeScenes(null, {
            ids: [seedScene._id],
            deleteImages: true,
          }))!;
          expect(res).to.be.true;
          expect(await Image.getAll()).to.have.lengthOf(0);
          expect(await Image.getByScene(seedScene._id)).to.have.lengthOf(0);
        });

        it("preserves images", async function () {
          await startTestServer.call(this, {});

          const { seedScene } = await seedDbWithScene();
          seedScene.path = videoPath;
          await collections.scenes.upsert(seedScene._id, seedScene);

          const image = new Image("test image");
          image.scene = seedScene._id;
          await collections.images.upsert(image._id, image);
          await indexImages([image]);

          expect(await Image.getAll()).to.have.lengthOf(1);
          expect(await Image.getByScene(seedScene._id)).to.have.lengthOf(1);

          expect(existsSync(videoPath)).to.be.true;

          const res = (await sceneMutations.removeScenes(null, {
            ids: [seedScene._id],
            deleteImages: false,
          }))!;
          expect(res).to.be.true;
          expect(await Image.getAll()).to.have.lengthOf(1);
          expect(await Image.getByScene(seedScene._id)).to.have.lengthOf(0);
        });
      });
    });
  });
});
