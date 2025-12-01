export type Pad = {
    id: string;
    label?: string;
    soundUri?: any;
    volume?: number;
    color?: string;
};

export type DrumState = {
    pads: Pad[];
    addPad: (pad: Pad) => void;
    updatePad: (id: string, data: Partial<Pad>) => void;
    removePad: (id: string) => void;
    setPads: (pads: Pad[]) => void;
};

export default Pad;
