import type { Pad } from '@/types';

export const DEFAULT_PADS: Pad[] = [
    {
        id: 'kick',
        label: 'Kick',
        soundUri: require('../assets/sounds/kick.wav'),
        color: '#ff6b6b',
    },
    {
        id: 'snare',
        label: 'Snare',
        soundUri: require('../assets/sounds/snare.wav'),
        color: '#4d96ff',
    },
    {
        id: 'hihat_closed',
        label: 'Hi-Hat (Closed)',
        soundUri: require('../assets/sounds/hihat_closed.wav'),
        color: '#ffd166',
    },
    {
        id: 'hihat_open',
        label: 'Hi-Hat (Open)',
        soundUri: require('../assets/sounds/hihat_open.wav'),
        color: '#ffd166',
    },
    {
        id: 'tom_high',
        label: 'Tom High',
        soundUri: require('../assets/sounds/tom_high.wav'),
        color: '#06d6a0',
    },
    {
        id: 'tom_mid',
        label: 'Tom Mid',
        soundUri: require('../assets/sounds/tom_mid.wav'),
        color: '#06d6a0',
    },
    {
        id: 'tom_low',
        label: 'Tom Low',
        soundUri: require('../assets/sounds/tom_low.wav'),
        color: '#ffd166',
    },
    {
        id: 'clap',
        label: 'Clap',
        soundUri: require('../assets/sounds/clap.wav'),
        color: '#a66cff',
    },
    {
        id: 'rimshot',
        label: 'Rimshot',
        soundUri: require('../assets/sounds/rimshot.wav'),
        color: '#ff9f1c',
    },
    {
        id: 'cowbell',
        label: 'Cowbell',
        soundUri: require('../assets/sounds/cowbell.wav'),
        color: '#f15bb5',
    },
    {
        id: 'ride_bell',
        label: 'Ride Bell',
        soundUri: require('../assets/sounds/ride_bell.wav'),
        color: '#2ec4b6',
    },
    {
        id: 'crash',
        label: 'Crash',
        soundUri: require('../assets/sounds/crash.wav'),
        color: '#2ec4b6',
    },
    {
        id: 'shaker',
        label: 'Shaker',
        soundUri: require('../assets/sounds/shaker.wav'),
        color: '#00b4d8',
    },
    {
        id: 'bongo',
        label: 'Bongo',
        soundUri: require('../assets/sounds/bongo.wav'),
        color: '#ffb4a2',
    },
    {
        id: 'clave',
        label: 'Clave',
        soundUri: require('../assets/sounds/clave.wav'),
        color: '#8ac926',
    },
];

export default DEFAULT_PADS;
