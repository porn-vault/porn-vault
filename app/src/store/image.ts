import { VuexModule, Module, Mutation } from "vuex-class-modules";

@Module
class ImageModule extends VuexModule {}

import store from "./index";
export const imageModule = new ImageModule({ store, name: "images" });
