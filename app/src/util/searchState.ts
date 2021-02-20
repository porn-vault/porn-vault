import Vue from "vue";
import { Dictionary } from "vue-router/types/router";

export interface PropConfig<F extends { [prop: string]: unknown } = {}> {
  localStorageKey?: string;
  default?: () => unknown;
  serialize?: (value: any) => string;
  deserialize?: (str: string, state: Partial<F>) => unknown;
}

export interface StateOptions<F extends { [prop: string]: unknown } = {}> {
  localStorageNamer?: (key: string) => string;
  props: { [key: string]: boolean | PropConfig<F> };
}

export const isQueryDifferent = (
  queryA: Dictionary<string>,
  queryB: Dictionary<string>
): boolean => {
  return Object.entries(queryA).some(([prop, val]) => val !== queryB[prop]);
};

export class SearchStateManager<F extends { [prop: string]: unknown } = {}> {
  private _state: F = Vue.observable({}) as any;
  private _config: StateOptions<F> = {
    props: {},
  };

  public refreshed = Vue.observable(true);

  public constructor(config: StateOptions<F>) {
    this._config = config;
  }

  private getLocalStorageName = (key: string): string => {
    const propConfig = this._config.props[key];
    const name =
      typeof propConfig !== "boolean" && propConfig.localStorageKey
        ? propConfig.localStorageKey
        : key;

    if (typeof this._config.localStorageNamer === "function") {
      return this._config.localStorageNamer(name);
    }
    return name;
  };

  /**
   * Initializes state of all props from url query, localStorage or defaults
   *
   * @param query - page url query
   */
  public initState(query: Dictionary<string>): void {
    Object.entries(this._config.props).forEach(([key, propConfig]) => {
      if (propConfig === false) {
        return;
      }

      let initialValue: unknown = null;
      if (Object.hasOwnProperty.call(query, key)) {
        // Get from query first ONLY if it exists in query
        initialValue = this.deserialize(key, query[key]);
      } else {
        // Else fallback to localStorage
        const strValue = localStorage.getItem(this.getLocalStorageName(key));
        if (strValue !== null) {
          try {
            initialValue = this.deserialize(key, strValue);
          } catch (err) {
            // ignore json error
          }
        }
      }

      if (initialValue == null && typeof propConfig !== "boolean" && propConfig.default) {
        // Fallback to default in config
        initialValue = propConfig.default();
      }

      initialValue = initialValue ?? null;

      Vue.set(this._state, key, initialValue);
    });
  }

  private serialize(key: string, deserializedValue: unknown): string {
    let serializedValue: string;

    const propConfig = this._config.props[key];

    if (typeof propConfig !== "boolean" && propConfig?.serialize) {
      serializedValue = propConfig.serialize(deserializedValue);
    } else {
      serializedValue = JSON.stringify(deserializedValue);
    }

    return serializedValue;
  }

  private deserialize(key: string, serializedValue: string): unknown {
    let deserializedValue: unknown | null = null;

    const propConfig = this._config.props[key];

    if (typeof propConfig !== "boolean" && propConfig?.deserialize) {
      deserializedValue = propConfig.deserialize(serializedValue, this._state);
    } else {
      try {
        deserializedValue = JSON.parse(serializedValue);
      } catch (err) {
        // ignore
      }
    }
    return deserializedValue;
  }

  public toQuery(): Record<string, string> {
    const query: Record<string, string> = {};
    Object.entries(this._state).forEach(([key, value]) => {
      const serializedValue = this.serialize(key, value);
      query[key] = serializedValue;
    });

    return query;
  }

  /**
   * Parses the query state to update the internal state
   *
   * @param query - page url query
   */
  public parseFromQuery(query: Dictionary<string>): void {
    Object.entries(query).forEach(([key, value]) => {
      if (
        !Object.hasOwnProperty.call(this._config.props, key) ||
        this._config.props[key] === false
      ) {
        return;
      }

      const deserializedValue = this.deserialize(key, value);
      Vue.set(this._state, key, deserializedValue);
    });
  }

  public onValueChanged(key: string, value: unknown): void {
    if (!Object.hasOwnProperty.call(this._config.props, key) || this._config.props[key] === false) {
      return;
    }

    this.refreshed = false;

    Vue.set(this._state, key, value);

    const strValue = this.serialize(key, value);
    localStorage.setItem(this.getLocalStorageName(key), strValue);
  }

  public get state() {
    return this._state;
  }
}
