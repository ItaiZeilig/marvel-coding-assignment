import _ from "lodash";

/**
 * Movie and actor utility functions
 * Contains reusable functions for processing movie and actor data
 */

/**
 * Filter cast members to only include relevant actors
 * @param {Array} cast - Array of cast members
 * @param {Array} relevantActors - Array of actor names to filter by
 * @returns {Array} Filtered cast members
 */
export const filterRelevantActors = (cast, relevantActors) => {
  return _.filter(cast, (member) =>
    _.some(relevantActors, (actor) => {
      const normalizedActor = normalizeActorName(actor);
      const normalizedMember = normalizeActorName(member.name);
      // Use exact match or very close match to avoid false positives
      return normalizedActor === normalizedMember;
    })
  );
};

/**
 * Normalize name for comparison
 * @param {string} name - Name to normalize
 * @param {boolean} preserveSlashes - Whether to preserve forward slashes
 * @returns {string} Normalized name
 */
const normalizeName = (name, preserveSlashes = false) => {
  if (!name) return "";

  const pattern = preserveSlashes ? /[^\w\s\/]/g : /[^\w\s]/g;

  return (
    _.chain(name)
      .trim()
      .toLower()
      // Normalize unicode characters to their base forms (e.g., ñ -> n, é -> e)
      .deburr()
      .replace(pattern, "")
      .replace(/_/g, "")
      .value()
  );
};

/**
 * Normalize actor name for comparison
 * @param {string} name - Actor name to normalize
 * @returns {string} Normalized name
 */
export const normalizeActorName = (name) => {
  return normalizeName(name, false);
};

/**
 * Normalize character name for comparison
 * @param {string} name - Character name to normalize
 * @returns {string} Normalized name
 */
export const normalizeCharacterName = (name) => {
  return normalizeName(name, true);
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
 * Trim character names by removing unnecessary information
 * @param {string} fullName - Full character name
 * @returns {string} Trimmed character name
 */
export const trimCharacterName = (fullName) => {
  if (!fullName) return "";

  let result = _.chain(fullName).split("/").head().value();

  // Remove nested parentheses and brackets iteratively
  let iterations = 0;
  const maxIterations = 10; // Prevent infinite loops

  while (
    (result.includes("(") || result.includes("[")) &&
    iterations < maxIterations
  ) {
    const before = result;
    // Handle nested parentheses by removing innermost first
    result = result
      .replace(/\([^()]*\)/g, "") // Remove innermost parentheses
      .replace(/\[[^\[\]]*\]/g, ""); // Remove innermost brackets

    // If no change occurred, break to avoid infinite loop
    if (result === before) break;
    iterations++;
  }

  return _.chain(result).replace(/\s+/g, " ").trim().value();
};

/**
 * Check if there are multiple unique characters
 * @param {Array} characters - Array of character names
 * @returns {boolean} True if multiple unique characters exist
 */
export const isMoreThanOneCharacter = (characters) => {
  if (_.isEmpty(characters) || characters.length < 2) {
    return false;
  }

  const cleanedCharacters = _.chain(characters)
    .map((char) => trimCharacterName(char))
    .filter((char) => !_.isEmpty(char))
    .uniq()
    .value();

  if (cleanedCharacters.length < 2) {
    return false;
  }

  // Extract core character identities by removing titles and variations
  const coreCharacters = _.map(cleanedCharacters, extractCoreCharacterName);
  const uniqueCoreCharacters = _.uniq(coreCharacters);

  // If we have multiple unique core characters, it's truly multiple characters
  return uniqueCoreCharacters.length > 1;
};
