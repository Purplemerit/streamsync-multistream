/** Run fn after the current effect flush (avoids sync setState-in-effect lint). */
export function deferEffect(fn) {
  void Promise.resolve().then(fn)
}
