import { Component, OnInit } from '@angular/core';
import { NgModule } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { coerceToBase64Url, coerceToArrayBuffer, showErrorAlert, PublicKeyCredentialWithAttestationJSON, convert } from 'src/app/utilities/helper';
import { HttpClient } from '@angular/common/http';
import { AuthenticatorAttestationResponse } from 'src/app/models/AuthenticatorAttestationRawResponse';
import { Base64urlString, base64urlToBuffer } from 'src/app/utilities/Base64urlString';
import { bufferToBase64url } from 'src/app/utilities/Base64urlString';
import { publicKeyCredentialWithAttestation } from 'src/app/utilities/scema';
import { RP } from 'src/app/models/RP';
import { FidoUser } from 'src/app/models/FidoUser';
import base64url from 'base64url';
import { create } from '@github/webauthn-json';
import { ClientDataObj } from 'src/app/models/client-data-obj';
import { DecodedAttestionObj } from 'src/app/models/decoded-attestion-obj';


@Component({
  selector: 'app-register',
  templateUrl: './register.component.html',
  styleUrls: ['./register.component.scss']
})
export class RegisterComponent implements OnInit {

  public email:string = "";

  public RequestVerificationToken: any
  constructor(private http: HttpClient) { 
    this.email="";
  }

  ngOnInit(): void {
 
  }


  handleRegisterSubmit = async () => {
    
    var data = new FormData();
    data.append('userId', '57d9ff83-7747-48a6-ae33-7cf260b51cb4');

    let userId = '57d9ff83-7747-48a6-ae33-7cf260b51cb4';

    let makeCredentialOptions;
    try {
      makeCredentialOptions = await this.makeCredentialsOption(userId);
    } catch (e) {
      console.error(e);
      let msg = "Something wen't really wrong";
      console.log(msg);
    }

    // console.log("Make credential", makeCredentialOptions);

    const authenticatorSelection: AuthenticatorSelectionCriteria = {};
    authenticatorSelection.residentKey = "required";

    const user : PublicKeyCredentialUserEntity = {
      id: coerceToArrayBuffer(userId, "user.id"),
      name: "6TF5HND",
      displayName:"6TF5HND"
    };

    const rp : PublicKeyCredentialRpEntity = {
      id: "localhost",
      name: "Hello"
    };

    let excludeCredentials: PublicKeyCredentialDescriptor[] | undefined;    

    const extensions : AuthenticationExtensionsClientInputs = {  }

    const publicKeyParameters: PublicKeyCredentialParameters[] = [
      { alg: -7, type: "public-key"},
      { alg: -256, type: "public-key"}
    ]

    const decodedOptions : PublicKeyCredentialCreationOptions = {
      rp:rp,
      user:user,
      challenge: coerceToArrayBuffer("fewfewfs", "challenge"),
      authenticatorSelection: authenticatorSelection,
      timeout: 360000,
      excludeCredentials: excludeCredentials,
      extensions: extensions,
      pubKeyCredParams: publicKeyParameters,
      attestation: "none"
    };

    const originalDecodedOptions : PublicKeyCredentialCreationOptions = {
      rp:rp,
      user:user,
      challenge: coerceToArrayBuffer("fewfewfs", "challenge"),
      authenticatorSelection: authenticatorSelection,
      timeout: 360000,
      excludeCredentials: excludeCredentials,
      extensions: extensions,
      pubKeyCredParams: publicKeyParameters,
      attestation: "none"
    }

    makeCredentialOptions?.subscribe(
      (response: any) => { 
        let obj = response['result']['result']['response']
        // console.log(obj)
        // console.log("dnoqdiwndiwoqndoiqndoinqwidnwoqdnk")
        authenticatorSelection.authenticatorAttachment = obj.authenticatorSelection.authenticatorAttachment;
        authenticatorSelection.userVerification = obj.authenticatorSelection.userVerification;

        user.id = coerceToArrayBuffer(obj.user.id, "id");
        user.displayName = obj.user.displayName;
        user.name = obj.user.name;
        
        // obj.challeng = is base64url string
        decodedOptions.challenge = coerceToArrayBuffer(obj.challenge, "challenge");
        // decodedOptions.challenge = obj.challenge
        decodedOptions.user = user;
        decodedOptions.authenticatorSelection = authenticatorSelection
        originalDecodedOptions.challenge = obj.challenge
        // console.log("Original Challenge: ")
        // console.log(obj.challenge)
        // console.log("Decoded Options's Challenge: ")
        // console.log(decodedOptions.challenge)
      },
    );

   await new Promise(f => setTimeout(f, 5000));
    // ////////////////////////////////////////////////////////////////////////////////
    const credential = await navigator.credentials.create(  {
      publicKey: decodedOptions
    }) as PublicKeyCredential;
    // ////////////////////////////////////////////////////////////////////////////////


    // console.log("Credentials Original: ")
    // console.log(credential)
    // console.log(credential.response.clientDataJSON)
    let fsdf =  this.createResponseToJSON(credential);
    // console.log("Credential modified: " )
    // console.log(fsdf)
    //let clientData = JSON.parse(base64url.decode( fsdf.response.clientDataJSON));
    //console.log(clientData)
    //create(parseCreationOptionsFromJSON())

    const utf8Decoder = new TextDecoder('utf-8');
    const decodedClientData = utf8Decoder.decode(credential.response.clientDataJSON);

    const clientDataObj: ClientDataObj = JSON.parse(decodedClientData);
    // console.log('clientDataObj', clientDataObj);


    let response;
    try {
      response = await this.makeCredentials(fsdf, decodedOptions, originalDecodedOptions);
    } catch (e) {
      console.error(e);
      let msg = "Something wen't really wrong";
      console.log(msg);
    }
    response?.subscribe(
      (response: any) => { 
        console.log(response)
      },
    );

  };

  makeCredentialsOption = async(id: string) => {
    return this.http.post<any>('https://localhost:44396/api/Account/make-credential-options', {"userId":id});
  }

  makeCredentials = async(credential : PublicKeyCredentialWithAttestationJSON, decodedOptions : PublicKeyCredentialCreationOptions, originalDecodedOptions : PublicKeyCredentialCreationOptions) => {


    const authentificatorResponse : AuthenticatorAttestationResponse = {
      Id: credential.id.toString(),
      RawId: credential.rawId.toString(),
      AttestationObject: credential.response.attestationObject,
      Type : credential.type,
      ClientDataJson: credential.response.clientDataJSON,
    }
  

    return this.http.post<any>('https://localhost:44396/api/Account/make-credential', { 
      "authenticatorResponse" : authentificatorResponse,
      "options" : {
        "rp" : {
          "Id": decodedOptions.rp.id,
          "Name": decodedOptions.rp.name
        },
        "user" : {
          "Id": coerceToBase64Url(decodedOptions.user.id),
          "Name": decodedOptions.user.name,
          "DisplayName": decodedOptions.user.displayName
        },
        "Challenge" : originalDecodedOptions.challenge,
        "publicKeyParameters" : decodedOptions.pubKeyCredParams,
        "timeout" : decodedOptions.timeout,
        "attestation" : decodedOptions.attestation,
        "authenticatorSelection" : decodedOptions.authenticatorSelection,
      }
     });
  }

  createResponseToJSON = (credential: PublicKeyCredential): PublicKeyCredentialWithAttestationJSON => {
    return convert(
      bufferToBase64url,
      publicKeyCredentialWithAttestation,
      credential,
    );
  }
}

