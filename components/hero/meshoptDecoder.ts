import { MeshoptDecoder } from 'three/examples/jsm/libs/meshopt_decoder.module.js';

type Args = [count: number, stride: number, source: Uint8Array, mode: string, filter?: string];
type Job = { args: Args; resolve: (out: Uint8Array) => void; reject: (err: unknown) => void };

function decodeHere(...[count, stride, source, mode, filter]: Args) {
  return MeshoptDecoder.ready.then(() => {
    const out = new Uint8Array(count * stride);
    MeshoptDecoder.decodeGltfBuffer(out, count, stride, source, mode, filter);
    return out;
  });
}

/**
 * Meshopt decoder for GLTFLoader that unpacks the models on a small pool of background workers, so
 * a multi-megabyte model never freezes the page while it's decoded. (Our own worker bundle: the
 * decoder's built-in worker mode doesn't survive production minification.) If workers can't start
 * or fail, everything still decodes, on the main thread as before.
 */
export function createMeshoptDecoder() {
  let workers: Worker[] = [];
  try {
    const n = Math.min(2, Math.max(1, (navigator.hardwareConcurrency || 2) - 1));
    for (let i = 0; i < n; i++) workers.push(new Worker(new URL('./meshoptWorker.ts', import.meta.url)));
  } catch {
    workers.forEach((w) => w.terminate());
    workers = [];
  }

  const jobs = new Map<number, Job>();
  let broken = workers.length === 0;
  let seq = 0;
  const runHere = (job: Job) => decodeHere(...job.args).then(job.resolve, job.reject);
  const fail = () => {
    if (broken) return;
    broken = true;
    workers.forEach((w) => w.terminate());
    jobs.forEach(runHere);
    jobs.clear();
  };
  for (const w of workers) {
    w.onmessage = (e: MessageEvent<{ id: number; out?: Uint8Array }>) => {
      const job = jobs.get(e.data.id);
      if (!job) return;
      jobs.delete(e.data.id);
      if (e.data.out) job.resolve(e.data.out);
      else runHere(job);
    };
    w.onerror = fail;
    w.onmessageerror = fail;
  }

  return {
    supported: true,
    ready: MeshoptDecoder.ready,
    decodeGltfBuffer: MeshoptDecoder.decodeGltfBuffer,
    decodeGltfBufferAsync: (...args: Args) =>
      new Promise<Uint8Array>((resolve, reject) => {
        const job: Job = { args, resolve, reject };
        if (broken) return void runHere(job);
        const id = ++seq;
        jobs.set(id, job);
        const [count, stride, source, mode, filter] = args;
        const copy = source.slice(); // the source is a view into the whole file: send only its bytes
        workers[id % workers.length].postMessage({ id, count, stride, source: copy, mode, filter }, [copy.buffer]);
      }),
  };
}
