const lowdb = require("lowdb");
import FileSync from "lowdb/adapters/FileSync";
import mkdirp from "mkdirp";

try {
  mkdirp.sync('./library/scenes');
  mkdirp.sync('./library/images');
  mkdirp.sync('./library/thumbnails');
}
catch(err) {}

const adapter = new FileSync('./library/db.json');
const database = lowdb(adapter);

database
  .defaults({
    actors: [],
    labels: [],
    scenes: [],
    images: [],
    movies: [],
    studios: [],

    settings: {
      LIBRARY_PATH: "./library/"
    }
  })
  .write()

export { database };