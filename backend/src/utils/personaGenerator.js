import crypto from 'crypto';

const adjectives = ['Sneaky', 'Lazy', 'Hyper', 'Grumpy', 'Cheeky', 'Wise', 'Clumsy', 'Brave', 'Wild', 'Zen'];
const nouns = ['Monkey', 'Ape', 'Lemur', 'Chimp', 'Gorilla', 'Baboon', 'Orangutan', 'Gibbon', 'Marmoset', 'Tamarin'];

export const generatePersona = () => {
    const adj = adjectives[Math.floor(Math.random() * adjectives.length)];
    const noun = nouns[Math.floor(Math.random() * nouns.length)];
    const name = `${adj} ${noun}`;

    const avatarUrl = `https://api.dicebear.com/7.x/bottts/svg?seed=${name}`;

    return {
        id: crypto.randomUUID(),
        name,
        avatar: avatarUrl,
        score: 100, // Default starting score
        createdAt: new Date(),
        status: 'active' // active, banned, shadow-banned
    };
};
