/**
 * List of lowercase HTML tag names which when parsing HTML (flow), result
 * in HTML that can inlcude include lines w/o exiting, until a closing tag also
 * in this list is found (condition 1).
 *
 * This module is copied from:
 * <https://spec.commonmark.org/0.29/#html-blocks>.
 *
 * Note that `textarea` is not available in CommonMark@0.29 but has been merged
 * to the primary branch and is slated to be released in the next release of
 * CommonMark.
 */
export const htmlRawNames = ['pre', 'script', 'style', 'textarea']
