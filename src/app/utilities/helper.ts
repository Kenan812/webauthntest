import { Base64urlString } from "./Base64urlString";
import { Schema, SchemaProperty } from "./schema-format";

// import swal from 'sweetalert2';
// import { SweetAlert } from 'sweetalert/typings/core';

export function coerceToBase64Url (thing : any) {
    // Array or ArrayBuffer to Uint8Array
    if (Array.isArray(thing)) {
      console.log("Here") 
      thing = Uint8Array.from(thing);
    }
  
    if (thing instanceof ArrayBuffer) {
      console.log("Here") 
      thing = new Uint8Array(thing);
    }
  
    // Uint8Array to base64
    if (thing instanceof Uint8Array) {
      console.log("Here") 
      var str = "";
        var len = thing.byteLength;
  
        for (var i = 0; i < len; i++) {
            str += String.fromCharCode(thing[i]);
        }
        thing = window.btoa(str);
    }
  
    console.log(thing);
    if (typeof thing !== "string") {
        throw new Error("could not coerce to string");
    }
  
    // base64 to base64url
    // NOTE: "=" at the end of challenge is optional, strip it off here
    thing = thing.replace(/\+/g, "-").replace(/\//g, "_").replace(/=*$/g, "");
  
    return thing;
  }
  


export function coerceToArrayBuffer (thing : any, name : any) {
  if (typeof thing === "string") {
      // base64url to base64
      thing = thing.replace(/-/g, "+").replace(/_/g, "/");

      // base64 to Uint8Array
      var str = window.atob(thing);
      var bytes = new Uint8Array(str.length);
      for (var i = 0; i < str.length; i++) {
          bytes[i] = str.charCodeAt(i);
      }
      thing = bytes;
  }

  // Array to Uint8Array
  if (Array.isArray(thing)) {
    thing = new Uint8Array(thing);
  }

  // Uint8Array to ArrayBuffer
  if (thing instanceof Uint8Array) {
    thing = thing.buffer;
  }

  // error if none of the above worked
  if (!(thing instanceof ArrayBuffer)) {
    throw new TypeError("could not coerce '" + name + "' to ArrayBuffer");
  }
  
  return thing;
}



export function showErrorAlert (message : any, error : any) {
  let footermsg = '';
  if (error) {
      footermsg = 'exception:' + error.toString();
  }
  // swal({
  //     //type: 'error',
  //     title: 'Error',
  //     text: message,
  // })
}

export const copyValue = "copy";
export const convertValue = "convert";

export function convert<From, To>(
  conversionFn: (v: From) => To,
  schema: Schema,
  input: any,
): any {
  if (schema === copyValue) {
    return input;
  }
  if (schema === convertValue) {
    return conversionFn(input);
  }
  if (schema instanceof Array) {
    return input.map((v: any) => convert<From, To>(conversionFn, schema[0], v));
  }
  if (schema instanceof Object) {
    const output: any = {};
    for (const [key, schemaField] of Object.entries(schema)) {
      if (schemaField.derive) {
        const v = schemaField.derive(input);
        if (v !== undefined) {
          input[key] = v;
        }
      }

      if (!(key in input)) {
        if (schemaField.required) {
          throw new Error(`Missing key: ${key}`);
        }
        continue;
      }
      // Fields can be null (rather than missing or `undefined`), e.g. the
      // `userHandle` field of the `AuthenticatorAssertionResponse`:
      // https://www.w3.org/TR/webauthn/#iface-authenticatorassertionresponse
      if (input[key] == null) {
        output[key] = null;
        continue;
      }
      output[key] = convert<From, To>(
        conversionFn,
        schemaField.schema,
        input[key],
      );
    }
    return output;
  }
}

interface PublicKeyCredentialJSON {
  id: string;
  type: PublicKeyCredentialType;
  rawId: Base64urlString;
  // TODO: This field is technically not optional in the spec, but Firefox hasn't implemented it.
  authenticatorAttachment?: AuthenticatorAttachment | null;
}

type AuthenticatorTransportJSON = AuthenticatorTransport | "hybrid";

export interface AuthenticatorAttestationResponseJSON {
  clientDataJSON: Base64urlString;
  attestationObject: Base64urlString;
  transports: AuthenticatorTransportJSON[];
}

interface CredPropsAuthenticationExtensionsClientOutputsJSON {
  rk: boolean;
}

interface SimpleClientExtensionResultsJSON {
  appid?: boolean;
  appidExclude?: boolean;
  credProps?: CredPropsAuthenticationExtensionsClientOutputsJSON;
}

export interface PublicKeyCredentialWithAttestationJSON
  extends PublicKeyCredentialJSON {
  response: AuthenticatorAttestationResponseJSON;
  clientExtensionResults: SimpleClientExtensionResultsJSON;
}
