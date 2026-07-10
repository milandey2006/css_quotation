// =============================================================================
//  BACKEND URL — YOU MUST SET THIS BEFORE BUILDING THE RELEASE APK
// =============================================================================
// This is the public HTTPS address of the Champion Security web app (the Vercel
// deployment). The phone app posts pairing, punch, and GPS-ping requests here
// over the internet, so it has to be the real deployed URL — NOT localhost.
//
// (no trailing slash)
export const API_BASE_URL = 'https://quotation.championsecuritysystem.com';

// How far the phone must move (metres) before a new GPS ping is recorded. Lower
// = more precise trail but more battery/data. 25m is a sensible field default.
export const DISTANCE_FILTER_M = 25;
