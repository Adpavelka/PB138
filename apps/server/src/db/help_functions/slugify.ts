export const slugify = (text: string): string => {
    return text
        .normalize("NFD")                   // split accented characters into base + accent
        .replace(/[\u0300-\u036f]/g, "")    // remove the accent marks (combining diacritics)
        .toLowerCase()
        .trim()
        .replace(/[^a-z0-9\s-]/g, "")       // remove anything that isn't a letter, number, or space
        .replace(/[\s_]+/g, "-")            // replace spaces and underscores with a single hyphen
        .replace(/-+/g, "-");               // prevent multiple consecutive hyphens
};