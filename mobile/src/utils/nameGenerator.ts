/**
 * nameGenerator.ts
 *
 * Generates anonymous jungle-themed aliases.
 * System always assigns — user never types their own name.
 * 30 adjectives × 30 animals = 900 unique combos.
 */

const ADJECTIVES = [
    'Midnight', 'Cosmic', 'Neon', 'Shadow', 'Ghost',
    'Mystic', 'Feral', 'Sneaky', 'Rogue', 'Cryptic',
    'Silent', 'Phantom', 'Blazing', 'Wild', 'Venom',
    'Frozen', 'Ember', 'Lunar', 'Solar', 'Thunder',
    'Stealth', 'Electric', 'Ancient', 'Primal', 'Savage',
    'Glitch', 'Pixel', 'Blur', 'Raven', 'Storm',
];

const ANIMALS = [
    'Jaguar', 'Gorilla', 'Macaw', 'Cobra', 'Lemur',
    'Toucan', 'Panther', 'Parrot', 'Mamba', 'Ocelot',
    'Gecko', 'Puma', 'Kinkajou', 'Tapir', 'Capybara',
    'Anaconda', 'Sloth', 'Mandrill', 'Marmoset', 'Coati',
    'Piranha', 'Caiman', 'Harpy', 'Iguana', 'Peccary',
    'Howler', 'Tamarin', 'Cassowary', 'Bushbaby', 'Quetzal',
];

/** Returns a random adjective+animal combo, e.g. "ShadowJaguar" */
export const generateJungleName = (): string => {
    const adj = ADJECTIVES[Math.floor(Math.random() * ADJECTIVES.length)];
    const animal = ANIMALS[Math.floor(Math.random() * ANIMALS.length)];
    return `${adj}${animal}`;
};

/** Returns N unique names (for preview strips etc.) */
export const generateMultipleNames = (count: number): string[] => {
    const seen = new Set<string>();
    const names: string[] = [];
    let attempts = 0;
    while (names.length < count && attempts < 200) {
        const name = generateJungleName();
        if (!seen.has(name)) { seen.add(name); names.push(name); }
        attempts++;
    }
    return names;
};
