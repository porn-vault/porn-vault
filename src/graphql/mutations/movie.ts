import { collections } from "../../database";
import { onMovieCreate } from "../../plugins/events/movie";
import { indexMovies, removeMovie } from "../../search/movie";
import LabelledItem from "../../types/labelled_item";
import Movie from "../../types/movie";
import MovieScene from "../../types/movie_scene";
import { logger } from "../../utils/logger";
import { Dictionary } from "../../utils/types";

type IMovieUpdateOpts = Partial<{
  name: string;
  description: string;
  releaseDate: number;
  frontCover: string;
  backCover: string;
  spineCover: string;
  favorite: boolean;
  bookmark: number | null;
  rating: number;
  scenes: string[];
  studio: string | null;
  customFields: Dictionary<string[] | boolean | string | null>;
}>;

async function runMoviePlugins(id: string): Promise<Movie | null> {
  let movie = await Movie.getById(id);

  if (movie) {
    movie = await onMovieCreate(movie, "movieCustom");

    await collections.movies.upsert(movie._id, movie);
    await indexMovies([movie]);
  }

  return movie;
}

export default {
  async runMoviePlugins(_: unknown, { id }: { id: string }): Promise<Movie> {
    logger.debug(`Mutation: runMoviePlugins, for movie ${id}`);
    const result = await runMoviePlugins(id);
    if (!result) {
      throw new Error("Movie not found");
    }
    return result;
  },

  async addMovie(_: unknown, args: { name: string; scenes: string[] }): Promise<Movie> {
    let movie = new Movie(args.name);

    if (args.scenes) {
      if (Array.isArray(args.scenes)) {
        await Movie.setScenes(movie, args.scenes);
      }
    }

    try {
      movie = await onMovieCreate(movie);
    } catch (error) {
      logger.error(error);
    }

    await collections.movies.upsert(movie._id, movie);
    await indexMovies([movie]);

    return movie;
  },

  async removeMovies(_: unknown, { ids }: { ids: string[] }): Promise<boolean> {
    for (const id of ids) {
      const movie = await Movie.getById(id);

      if (movie) {
        await Movie.remove(movie._id);
        await removeMovie(movie._id);
        await LabelledItem.removeByItem(movie._id);
        await MovieScene.removeByMovie(movie._id);
      }
    }
    return true;
  },

  async updateMovies(
    _: unknown,
    { ids, opts }: { ids: string[]; opts: IMovieUpdateOpts }
  ): Promise<Movie[]> {
    const updatedMovies = [] as Movie[];

    for (const id of ids) {
      const movie = await Movie.getById(id);

      if (movie) {
        if (typeof opts.name === "string") {
          movie.name = opts.name.trim();
        }

        if (typeof opts.description === "string") {
          movie.description = opts.description.trim();
        }

        if (opts.studio !== undefined) {
          movie.studio = opts.studio;
        }

        if (typeof opts.frontCover === "string") {
          movie.frontCover = opts.frontCover;
        }

        if (typeof opts.backCover === "string") {
          movie.backCover = opts.backCover;
        }

        if (typeof opts.spineCover === "string") {
          movie.spineCover = opts.spineCover;
        }

        if (Array.isArray(opts.scenes)) {
          await Movie.setScenes(movie, opts.scenes);
        }

        if (typeof opts.bookmark === "number" || opts.bookmark === null) {
          movie.bookmark = opts.bookmark;
        }

        if (typeof opts.favorite === "boolean") {
          movie.favorite = opts.favorite;
        }

        if (typeof opts.rating === "number") {
          movie.rating = opts.rating;
        }

        if (opts.releaseDate !== undefined) {
          movie.releaseDate = opts.releaseDate;
        }

        if (opts.customFields) {
          for (const key in opts.customFields) {
            const value = opts.customFields[key] !== undefined ? opts.customFields[key] : null;
            logger.debug(`Set scene custom.${key} to ${JSON.stringify(value)}`);
            opts.customFields[key] = value;
          }
          movie.customFields = opts.customFields;
        }

        await collections.movies.upsert(movie._id, movie);
        updatedMovies.push(movie);
      }
    }

    await indexMovies(updatedMovies);
    return updatedMovies;
  },
};
