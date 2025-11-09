import * as zustand from 'zustand';

// Resolve the `create` factory in a robust way at runtime.
// Zustand can be exported in multiple shapes depending on bundler/tsconfig:
// - a function (commonjs)
// - { default: function } (esModuleInterop)
// - { create: function } (named export)
// We try common patterns and pick the first function we find.
let create: any;
try {
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    const req = require('zustand') as any;
    if (typeof req === 'function') create = req;
    else if (req && typeof req.default === 'function') create = req.default;
    else if (req && typeof req.create === 'function') create = req.create;
    else {
        // fallback to the namespace import
        const ns = zustand as any;
        if (typeof ns === 'function') create = ns;
        else if (ns && typeof ns.default === 'function') create = ns.default;
        else if (ns && typeof ns.create === 'function') create = ns.create;
        else {
            // try to find any function exported by the module
            const maybe = Object.values(req || ns || {}).find((v) => typeof v === 'function');
            if (maybe) create = maybe;
        }
    }
} catch (e) {
    const ns = zustand as any;
    if (typeof ns === 'function') create = ns;
    else if (ns && typeof ns.default === 'function') create = ns.default;
    else if (ns && typeof ns.create === 'function') create = ns.create;
    else {
        const maybe = Object.values(ns || {}).find((v) => typeof v === 'function');
        if (maybe) create = maybe;
    }
}

if (typeof create !== 'function') {
    // Throw early with a helpful message so the developer can fix environment/config.
    throw new Error('Zustand create factory could not be resolved at runtime. Check zustand installation and tsconfig esModuleInterop settings.');
}

// Cast to a generic-accepting signature so TypeScript accepts create<State>(...)
const createTyped = (create as unknown) as (<T>(f: any) => any);

export type Pad = {
    id: string;
    label?: string;
    soundUri?: any; // puede ser un require(...) (número local) o una URL
    volume?: number;
    color?: string;
};

type DrumState = {
    pads: Pad[];
    addPad: (pad: Pad) => void;
    updatePad: (id: string, data: Partial<Pad>) => void;
    removePad: (id: string) => void;
    setPads: (pads: Pad[]) => void;
};
type SetState = (partial: Partial<DrumState> | ((state: DrumState) => Partial<DrumState>)) => void;

export const useDrumStore = createTyped<DrumState>((set: SetState) => ({
    pads: [],
    addPad: (pad: Pad) => set((s: DrumState) => ({ pads: [...s.pads, pad] })),
    updatePad: (id: string, data: Partial<Pad>) =>
        set((s: DrumState) => ({ pads: s.pads.map((p: Pad) => (p.id === id ? { ...p, ...data } : p)) })),
    removePad: (id: string) => set((s: DrumState) => ({ pads: s.pads.filter((p: Pad) => p.id !== id) })),
    setPads: (pads: Pad[]) => set(() => ({ pads })),
}));
