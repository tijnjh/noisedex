import { Command } from "@effect/ui";
import { Context, Effect, Layer, Queue, Schema, Stream } from "effect";

const playOnHoverKey = "play-on-hover";

// settings kept in the browser across visits
export class Preferences extends Context.Service<
  Preferences,
  {
    // the stored value, then every change another tab makes
    readonly playOnHover: Stream.Stream<boolean>;
    readonly setPlayOnHover: (value: boolean) => Effect.Effect<void>;
  }
>()("noisedex/Preferences") {
  static readonly layerLocalStorage = Layer.sync(Preferences, () => {
    const read = (raw: string | null) => {
      try {
        return raw === null ? false : JSON.parse(raw) === true;
      } catch {
        return false;
      }
    };

    const stored = Effect.sync(() => {
      try {
        return read(localStorage.getItem(playOnHoverKey));
      } catch {
        return false;
      }
    });

    const changes = Stream.callback<boolean>((queue) =>
      Effect.acquireRelease(
        Effect.sync(() => {
          const listener = (event: StorageEvent) => {
            if (event.key === playOnHoverKey) Queue.offerUnsafe(queue, read(event.newValue));
          };
          addEventListener("storage", listener);
          return listener;
        }),
        (listener) => Effect.sync(() => removeEventListener("storage", listener)),
      ),
    );

    return Preferences.of({
      playOnHover: Stream.concat(Stream.fromEffect(stored), changes),
      setPlayOnHover: (value) =>
        Effect.sync(() => {
          try {
            localStorage.setItem(playOnHoverKey, JSON.stringify(value));
          } catch {}
        }),
    });
  });
}

export class SavePlayOnHover extends Command.Service<SavePlayOnHover>()(
  "preferences/SavePlayOnHover",
  {
    args: { value: Schema.Boolean },
  },
) {
  static readonly layer = this.toLayer(
    Effect.gen(function* () {
      const preferences = yield* Preferences;
      return ({ value }) => preferences.setPlayOnHover(value);
    }),
  );
}
