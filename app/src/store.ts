import Vue from 'vue'
import Vuex from 'vuex'

Vue.use(Vuex)

import VideoModule from "@/store_modules/videos";

export default new Vuex.Store({
  modules: {
    videos: VideoModule
  }
})
