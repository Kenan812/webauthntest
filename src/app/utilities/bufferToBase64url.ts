import { Base64urlString } from "./Base64urlString";

export function bufferToBase64url(buffer: ArrayBuffer): Base64urlString {
    // Buffer to binary string
    const byteView = new Uint8Array(buffer);
    let str = "";
    for (const charCode of byteView) {
      str += String.fromCharCode(charCode);
    }
  
    // Binary string to base64
    const base64String = btoa(str);
  
    // Base64 to base64url
    // We assume that the base64url string is well-formed.
    const base64urlString = base64String.replace(/\+/g, "-").replace(
      /\//g,
      "_",
    ).replace(/=/g, "");
    return base64urlString;
  }