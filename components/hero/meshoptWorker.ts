// Background worker: unpacks one meshopt-compressed glTF buffer per message (see meshoptDecoder.ts).
import { MeshoptDecoder } from 'three/examples/jsm/libs/meshopt_decoder.module.js';

type Job = { id: number; count: number; stride: number; source: Uint8Array; mode: string; filter?: string };

const scope = self as unknown as {
  onmessage: ((e: MessageEvent<Job>) => void) | null;
  postMessage(message: unknown, transfer?: Transferable[]): void;
};

scope.onmessage = async (e) => {
  const { id, count, stride, source, mode, filter } = e.data;
  try {
    await MeshoptDecoder.ready;
    const out = new Uint8Array(count * stride);
    MeshoptDecoder.decodeGltfBuffer(out, count, stride, source, mode, filter);
    scope.postMessage({ id, out }, [out.buffer]);
  } catch (err) {
    scope.postMessage({ id, error: String(err) });
  }
};
