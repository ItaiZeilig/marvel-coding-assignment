import _ from "lodash";

/**
 * Movie and actor utility functions
 * Contains reusable functions for processing movie and actor data from TMDB API
 */

/**
 * Normalize actor name for comparison
 * @param {string} name - Actor name to normalize
 * @returns {string} Normalized name
 */
export const normalizeActorName = (name) => {
  if (!name) return "";
  
  return _.chain(name)
    .trim()
    .toLower()
    .deburr()
    .replace(/[^\w\s]/g, "")
    .value();
};

/**
 * Normalize character name for comparison
 * @param {string} name - Character name to normalize  
 * @returns {string} Normalized name
 */
export const normalizeCharacterName = (name) => {
  if (!name) return "";
  
  return _.chain(name)
    .trim()
    .toLower()
    .deburr()
    .replace(/[^\w\s\/]/g, "")
    .replace(/_/g, "")
    .value();
};

/**
 * Filter cast members to only include relevant actors
 * @param {Array} cast - Array of cast members from TMDB
 * @param {Array} relevantActors - Array of actor names to filter by
 * @returns {Array} Filtered cast members
 */
export const filterRelevantActors = (cast, relevantActors) => {
  return _.filter(cast, (member) =>
    _.some(relevantActors, (actor) => {
      const normalizedActor = normalizeActorName(actor);
      const normalizedMember = normalizeActorName(member.name);
      return normalizedActor === normalizedMember;
    })
  );
};

/**
 * Find matching actor from relevant actors list
 * @param {Object} castMember - Cast member object with name property
 * @param {Array} relevantActors - Array of relevant actor names
 * @returns {string|undefined} Matched actor name or undefined
 */
export const findActorMatch = (castMember, relevantActors) => {
  if (!castMember || !castMember.name) {
    return undefined;
  }

  const castName = normalizeActorName(castMember.name);

  return _.find(relevantActors, (actor) => {
    const actorName = normalizeActorName(actor);
    return actorName === castName;
  });
};

/**
 * Parse character names that may contain multiple identities separated by " / "
 * @param {string} characterString - Character string from TMDB (e.g., "Steve Rogers / Captain America")
 * @returns {Array} Array of individual character names
 */
export const parseCharacterNames = (characterString) => {
  if (!characterString) return [];
  
  return _.chain(characterString)
    .split('/')
    .map(name => _.trim(name))
    .filter(name => !_.isEmpty(name))
    .value();
};

/**
 * Extract the primary character name from a character string
 * For simplicity, we take the first name from the split
 * @param {string} characterString - Character string from TMDB
 * @returns {string} Primary character name
 */
export const extractPrimaryCharacterName = (characterString) => {
  const names = parseCharacterNames(characterString);
  return names.length > 0 ? names[0] : '';
};

/**
 * Check if an actor has multiple distinct characters
 * Simple comparison based on primary character names (first part before " / ")
 * @param {Array} characterStrings - Array of character strings for an actor
 * @returns {boolean} True if actor has multiple distinct characters
 */
export const hasMultipleDistinctCharacters = (characterStrings) => {
  if (_.isEmpty(characterStrings) || characterStrings.length < 2) {
    return false;
  }

  // Extract primary character names (first part before " / ") and normalize them
  const primaryNames = _.chain(characterStrings)
    .map(extractPrimaryCharacterName)
    .map(normalizeCharacterName)
    .filter(name => !_.isEmpty(name))
    .uniq()
    .value();

  // If we have more than one unique primary character name, they're distinct characters
  return primaryNames.length > 1;
};

/**
 * Create a mapping of character names to their normalized forms
 * This helps identify the same character across different movies
 * @param {string} characterString - Character string from TMDB
 * @returns {string} Normalized character for grouping
 */
export const normalizeCharacterForGrouping = (characterString) => {
  const primaryName = extractPrimaryCharacterName(characterString);
  return normalizeCharacterName(primaryName);
};