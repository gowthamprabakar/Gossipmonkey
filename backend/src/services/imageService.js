
/**
 * Generates an image URL using Pollinations.ai (Free, No Key Required)
 * @param {string} prompt - The description of the image
 * @returns {string} - The URL of the generated image
 */
export const generateImage = async (prompt) => {
    try {
        const safePrompt = String(prompt || '').trim();
        if (!safePrompt || safePrompt === 'null' || safePrompt === 'undefined') {
            console.warn('[ImageService] Empty or null prompt — skipping generation');
            return null;
        }
        const encodedPrompt = encodeURIComponent(safePrompt);
        // Pollinations directly returns the image at this URL
        return `https://image.pollinations.ai/prompt/${encodedPrompt}?width=512&height=512&seed=${Math.floor(Math.random() * 1000)}`;
    } catch (error) {
        console.error('Image Gen Error:', error);
        return null;
    }
};
