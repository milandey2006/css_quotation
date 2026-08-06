/**
 * Converts a number to Indian Currency text format.
 * e.g., 123456 -> "Rupees One Lakh Twenty Three Thousand Four Hundred Fifty Six Only"
 */
const a = [
    "", "One ", "Two ", "Three ", "Four ", "Five ", "Six ", "Seven ", "Eight ", "Nine ", "Ten ",
    "Eleven ", "Twelve ", "Thirteen ", "Fourteen ", "Fifteen ", "Sixteen ", "Seventeen ", "Eighteen ", "Nineteen "
];
const b = ["", "", "Twenty", "Thirty", "Forty", "Fifty", "Sixty", "Seventy", "Eighty", "Ninety"];

// Converts a whole number (< 1e9) into words, no "Rupees"/"Only" wrapper.
const integerToWords = (num) => {
    if ((num = num.toString()).length > 9) return "Overflow";

    const n = ('000000000' + num).substr(-9).match(/^(\d{2})(\d{2})(\d{2})(\d{1})(\d{2})$/);
    if (!n) return "";

    let str = "";
    str += (n[1] != 0) ? (a[Number(n[1])] || b[n[1][0]] + ' ' + a[n[1][1]]) + "Crore " : "";
    str += (n[2] != 0) ? (a[Number(n[2])] || b[n[2][0]] + ' ' + a[n[2][1]]) + "Lakh " : "";
    str += (n[3] != 0) ? (a[Number(n[3])] || b[n[3][0]] + ' ' + a[n[3][1]]) + "Thousand " : "";
    str += (n[4] != 0) ? (a[Number(n[4])] || b[n[4][0]] + ' ' + a[n[4][1]]) + "Hundred " : "";
    str += (n[5] != 0) ? ((str != "") ? "and " : "") + (a[Number(n[5])] || b[n[5][0]] + ' ' + a[n[5][1]]) : "";

    return str.trim();
};

/**
 * Converts a rupee amount (with optional paise) to Indian Currency text format.
 * e.g., 123456.75 -> "Rupees One Lakh Twenty Three Thousand Four Hundred Fifty Six and Seventy Five Paise Only"
 */
export const numberToWords = (num) => {
    const amount = Number(num) || 0;
    const rupees = Math.floor(amount);
    const paise = Math.round((amount - rupees) * 100);

    const rupeeWords = integerToWords(rupees);
    const paiseWords = paise > 0 ? integerToWords(paise) : '';

    if (!rupeeWords && !paiseWords) return "";

    let result = "Rupees " + (rupeeWords || "Zero");
    if (paiseWords) result += " and " + paiseWords + " Paise";
    return result + " Only";
};
