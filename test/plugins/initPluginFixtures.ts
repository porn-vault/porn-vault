import { assert } from "chai";
import { existsSync, unlinkSync } from "fs";
import path from "path";
import sinon from "sinon";

import { checkConfig, findAndLoadConfig, getConfig, resetLoadedConfig } from "../../src/config";
import defaultConfig from "../../src/config/default";
import { IConfig } from "../../src/config/schema";
import { writeFileAsync } from "../../src/utils/fs/async";

const configJSONPath = path.resolve("config.test.json");
const configJSONMergedPath = path.resolve("config.test.merged.json");
const configYAMLPath = path.resolve("config.test.yaml");
const configYAMLMergedPath = path.resolve("config.test.merged.yaml");

interface TestConfigFixture {
  name: string;
  config: IConfig;
}

export const CONFIG_FIXTURES: TestConfigFixture[] = [
  {
    name: "JS plugin config",
    config: {
      ...defaultConfig,
      plugins: {
        ...defaultConfig.plugins,
        events: {
          actorCreated: ["actor_plugin_fixture_js"],
          actorCustom: ["actor_plugin_fixture_js"],
          sceneCreated: ["scene_plugin_fixture_js"],
          sceneCustom: ["scene_plugin_fixture_js"],
          movieCreated: ["movie_plugin_fixture_js"],
          movieCustom: ["movie_plugin_fixture_js"],
          studioCreated: ["studio_plugin_fixture_js"],
          studioCustom: ["studio_plugin_fixture_js"],
        },
        register: {
          actor_plugin_fixture_js: {
            path: "./test/plugins/fixtures/actor_plugin.fixture.js",
          },
          movie_plugin_fixture_js: {
            path: "./test/plugins/fixtures/movie_plugin.fixture.js",
          },
          scene_plugin_fixture_js: {
            path: "./test/plugins/fixtures/scene_plugin.fixture.js",
          },
          studio_plugin_fixture_js: {
            path: "./test/plugins/fixtures/studio_plugin.fixture.js",
          },
        },
      },
    } as IConfig,
  },
  {
    name: "TS plugin config",
    config: {
      ...defaultConfig,
      plugins: {
        ...defaultConfig.plugins,
        events: {
          actorCreated: ["actor_plugin_fixture_ts"],
          actorCustom: ["actor_plugin_fixture_ts"],
          sceneCreated: ["scene_plugin_fixture_ts"],
          sceneCustom: ["scene_plugin_fixture_ts"],
          movieCreated: ["movie_plugin_fixture_ts"],
          movieCustom: ["movie_plugin_fixture_ts"],
          studioCreated: ["studio_plugin_fixture_js"],
          studioCustom: ["studio_plugin_fixture_js"],
        },
        register: {
          actor_plugin_fixture_ts: {
            path: "./test/plugins/fixtures/actor_plugin.fixture.ts",
          },
          movie_plugin_fixture_ts: {
            path: "./test/plugins/fixtures/movie_plugin.fixture.ts",
          },
          scene_plugin_fixture_ts: {
            path: "./test/plugins/fixtures/scene_plugin.fixture.ts",
          },
          studio_plugin_fixture_js: {
            path: "./test/plugins/fixtures/studio_plugin.fixture.js",
          },
        },
      },
    } as IConfig,
  },
];

let exitStub = null as sinon.SinonStub | null;

/**
 * Restores the exit stub, ensuring that it was not called.
 */
const restoreExitStub = () => {
  const wasCalled = exitStub?.called;
  exitStub?.restore();
  exitStub = null;

  if (wasCalled) {
    throw new Error(
      "Exit stub was called during plugin tests. A test may have failed somewhere, or the config may not have been loaded."
    );
  }
};

/**
 * Removes existing test configs
 */
const cleanupFiles = async () => {
  // Cleanup for other test
  for (const configFilename of [
    configJSONPath,
    configJSONMergedPath,
    configYAMLPath,
    configYAMLMergedPath,
  ]) {
    if (existsSync(configFilename)) {
      unlinkSync(configFilename);
    }
    assert.isFalse(existsSync(configFilename));
  }
};

/**
 * Writes the given test config config to "config.test.json"
 *
 * @param config - the config to write
 */
const writeTestConfig = async (config: IConfig) => {
  await writeFileAsync(configJSONPath, JSON.stringify(config, null, 2), "utf-8");
  assert.isTrue(existsSync(configJSONPath));
};

/**
 * Write the plugin test config, stubs the process exit and loads the config.
 * To run before any test that requires the mock plugins to be in the loaded config
 *
 * @param fixture - the test config fixture
 */
export const initPluginsConfig = async (fixture: TestConfigFixture) => {
  await cleanupFiles();
  await writeTestConfig(fixture.config);

  // Stub the exit, just in case something fails.
  // This way, the tests will still proceed
  exitStub = sinon.stub(process, "exit");

  resetLoadedConfig();
  assert.isFalse(!!getConfig());

  await findAndLoadConfig();
  checkConfig(getConfig());
  assert.isTrue(!!getConfig());
  assert.deepEqual(getConfig(), fixture.config);
  restoreExitStub();
};

/**
 * Cleans up test files, stubs, loaded config.
 * To run after any test that used the mock plugin config
 */
export const cleanupPluginsConfig = async () => {
  await cleanupFiles();

  resetLoadedConfig();

  restoreExitStub();
};
