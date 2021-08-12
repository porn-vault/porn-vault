<template>
  <SettingsWrapper>
    <v-card class="mb-2">
      <v-row>
        <v-col class="pt-0" cols="12" sm="6" md="12">
          <v-card-title>General</v-card-title>

          <v-card-text>
            <v-btn
              color="gray darken-4"
              depressed
              dark
              @click="toggleDarkMode"
              class="text-none my-3"
              >Switch to {{ this.$vuetify.theme.dark ? "Light mode" : "Dark mode" }}</v-btn
            >
            <v-checkbox
              color="primary"
              hide-details
              v-model="showCardLabels"
              label="Show card labels on overview"
            />
            <v-checkbox
              color="primary"
              hide-details
              label="Show experimental (unstable) features"
              v-model="experimental"
            />
          </v-card-text>
        </v-col>
      </v-row>
    </v-card>

    <v-card class="mb-2">
      <v-row>
        <v-col class="pt-0" cols="12" sm="6" md="12">
          <v-card-title>Scenes</v-card-title>

          <v-card-text>
            <div class="subtitle-1">Scene &amp; marker cards</div>
            <v-radio-group v-model="sceneRatio" label="Aspect ratio">
              <v-radio color="primary" :value="1" label="Square"></v-radio>
              <v-radio color="primary" :value="16 / 9" label="16:9"></v-radio>
              <v-radio color="primary" :value="4 / 3" label="4:3"></v-radio>
            </v-radio-group>
          </v-card-text>

          <v-divider></v-divider>

          <v-card-text>
            <div class="subtitle-1">Video player</div>
            <v-checkbox
              color="primary"
              hide-details
              v-model="scenePauseOnUnfocus"
              label="Pause video on window unfocus"
            />
            <v-checkbox
              color="primary"
              hide-details
              label="Play scene preview on mouse hover"
              v-model="scenePreviewOnMouseHover"
            />

            <div class="body-2 mt-4">Seek duration</div>
            <v-row cols="12">
              <v-col class="pt-0" cols="12" sm="12" md="6">
                <v-text-field
                  :rules="seekRules"
                  color="primary"
                  v-model="sceneSeekBackward"
                  label="Backward duration"
                  suffix="s"
                  type="number"
                />
              </v-col>
              <v-col class="pt-0" cols="12" sm="12" md="6">
                <v-text-field
                  :rules="seekRules"
                  color="primary"
                  v-model="sceneSeekForward"
                  label="Forward duration"
                  suffix="s"
                  type="number"
                />
              </v-col>
            </v-row>
          </v-card-text>
        </v-col>
      </v-row>
    </v-card>

    <v-card class="mb-2">
      <v-row>
        <v-col class="pt-0" cols="12" sm="6" md="12">
          <v-card-title>{{ actorPlural }}</v-card-title>

          <v-card-text>
            <div class="body-2">Interface label</div>
            <v-row cols="12">
              <v-col class="pt-0" cols="12" md="6">
                <v-text-field
                  v-model="actorSingular"
                  label="Singular"
                  placeholder="Actor"
                ></v-text-field>
              </v-col>
              <v-col class="pt-0" cols="12" md="6">
                <v-text-field
                  v-model="actorPlural"
                  label="Plural"
                  placeholder="Actors"
                ></v-text-field>
              </v-col>
            </v-row>
          </v-card-text>

          <v-divider></v-divider>

          <v-card-text>
            <div class="subtitle-1">{{ actorSingular }} cards</div>
            <v-radio-group v-model="actorRatio" label="Aspect ratio">
              <v-radio color="primary" :value="1" label="Square"></v-radio>
              <v-radio color="primary" :value="9 / 16" label="9:16"></v-radio>
              <v-radio color="primary" :value="3 / 4" label="3:4"></v-radio>
            </v-radio-group>

            <v-checkbox
              color="primary"
              hide-details
              :label="`Fill ${actorSingular} thumbnails`"
              v-model="fillActorCards"
            />
          </v-card-text>
        </v-col>
      </v-row>
    </v-card>

    <v-card class="mb-2">
      <v-row>
        <v-col class="pt-0" cols="12" sm="6" md="12">
          <v-card-title>Movies</v-card-title>
          <v-card-text>
            <div class="subtitle-1">Details page</div>
            <v-checkbox
              color="primary"
              label="Use 3D viewer as default viewer"
              hint="You can always enter the fullscreen 3D viewer regardless of this setting"
              persistent-hint
              v-model="defaultDVDShow3d"
            />
          </v-card-text>
        </v-col>
      </v-row>
    </v-card>
  </SettingsWrapper>
</template>

<script lang="ts">
import { Component, Vue } from "vue-property-decorator";
import { contextModule } from "@/store/context";
import SettingsWrapper from "@/components/SettingsWrapper.vue";

@Component({
  components: {
    SettingsWrapper,
  },
})
export default class UI extends Vue {
  seekRules = [
    (v: string | number) => {
      v = typeof v === "string" ? parseFloat(v) : v;
      return !Number.isNaN(v) || "Value is not an integer";
    },
    (v: string | number) => {
      v = typeof v === "string" ? parseFloat(v) : v;
      return v > 0 || "Value must be greater than 0";
    },
    (v: string | number) => {
      v = typeof v === "string" ? parseFloat(v) : v;
      return v % 1 === 0 || "Value msut be an integer";
    },
  ];

  set experimental(val: boolean) {
    if (val) {
      localStorage.setItem("pm_experimental", "true");
    } else {
      localStorage.removeItem("pm_experimental");
    }
    contextModule.toggleExperimental(val);
  }

  get experimental() {
    return contextModule.experimental;
  }

  get actorSingular() {
    return contextModule.actorSingular;
  }

  set actorSingular(val: string) {
    localStorage.setItem("pm_actorSingular", val);
    contextModule.setActorSingular(val);
  }

  get actorPlural() {
    return contextModule.actorPlural;
  }

  set actorPlural(val: string) {
    localStorage.setItem("pm_actorPlural", val);
    contextModule.setActorPlural(val);
  }

  set fillActorCards(val: boolean) {
    localStorage.setItem("pm_fillActorCards", val.toString());
    contextModule.toggleActorCardStyle(val);
  }

  get fillActorCards() {
    return contextModule.fillActorCards;
  }

  set showCardLabels(val: boolean) {
    localStorage.setItem("pm_showCardLabels", val.toString());
    contextModule.toggleCardLabels(val);
  }

  get showCardLabels() {
    return contextModule.showCardLabels;
  }

  set actorRatio(val: number) {
    localStorage.setItem("pm_actorRatio", val.toString());
    contextModule.setActorAspectRatio(val);
  }

  get actorRatio() {
    return contextModule.actorAspectRatio;
  }

  set sceneRatio(val: number) {
    localStorage.setItem("pm_sceneRatio", val.toString());
    contextModule.setSceneAspectRatio(val);
  }

  get sceneRatio() {
    return contextModule.sceneAspectRatio;
  }

  set scenePauseOnUnfocus(val: boolean) {
    localStorage.setItem("pm_scenePauseOnUnfocus", val.toString());
    contextModule.setScenePauseOnUnfocus(val);
  }

  get scenePauseOnUnfocus() {
    return contextModule.scenePauseOnUnfocus;
  }

  set scenePreviewOnMouseHover(val: boolean) {
    localStorage.setItem("pm_scenePreviewOnMouseHover", val.toString());
    contextModule.setScenePreviewOnMouseHover(val);
  }

  get scenePreviewOnMouseHover() {
    return contextModule.scenePreviewOnMouseHover;
  }

  set sceneSeekBackward(val: number | string) {
    if (this.seekRules.some((rule) => rule(val) !== true)) {
      // Don't save the value if it is invalid
      return;
    }
    localStorage.setItem("pm_sceneSeekBackward", val.toString());
    val = typeof val === "string" ? parseInt(val) : val;
    val = Number.isNaN(val) ? 5 : val;
    contextModule.setSceneSeekBackward(val);
  }

  get sceneSeekBackward() {
    return contextModule.sceneSeekBackward;
  }

  set sceneSeekForward(val: number | string) {
    if (this.seekRules.some((rule) => rule(val) !== true)) {
      // Don't save the value if it is invalid
      return;
    }
    localStorage.setItem("pm_sceneSeekForward", val.toString());
    val = typeof val === "string" ? parseInt(val) : val;
    val = Number.isNaN(val) ? 5 : val;
    contextModule.setSceneSeekForward(val);
  }

  get sceneSeekForward() {
    return contextModule.sceneSeekForward;
  }

  toggleDarkMode() {
    // @ts-ignore
    this.$vuetify.theme.dark = !this.$vuetify.theme.dark;
    localStorage.setItem(
      "pm_darkMode",
      // @ts-ignore
      this.$vuetify.theme.dark ? "true" : "false"
    );
  }

  // MOVIES

  set defaultDVDShow3d(val: boolean) {
    localStorage.setItem("pm_defaultDVDShow3d", val.toString());
    contextModule.toggleDefaultDVDShow3d(val);
  }

  get defaultDVDShow3d() {
    return contextModule.defaultDVDShow3d;
  }
}
</script>
