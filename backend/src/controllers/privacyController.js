import { getPrivacyPreferences, updatePrivacyPreferences } from '../services/privacyService.js';

export const getPrivacyMe = (req, res) => {
  const preferences = getPrivacyPreferences(req.persona.id);
  return res.json({ success: true, data: preferences });
};

export const patchPrivacyMe = (req, res) => {
  const preferences = updatePrivacyPreferences({ personaId: req.persona.id, patch: req.body || {} });
  return res.json({ success: true, data: preferences });
};
