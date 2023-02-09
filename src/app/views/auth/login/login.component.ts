import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { coerceToBase64Url, coerceToArrayBuffer, showErrorAlert, PublicKeyCredentialWithAttestationJSON, convert } from 'src/app/utilities/helper';
import { HttpClient } from '@angular/common/http';
import { bufferToBase64url } from 'src/app/utilities/Base64urlString';
import { AuthenticationPublicKeyCredential } from '@github/webauthn-json/dist/types/browser-ponyfill.extended';
import { PublicKeyCredentialWithAssertionJSON } from '@github/webauthn-json/dist/types/basic/json';
import { publicKeyCredentialWithAssertion } from 'src/app/utilities/scema';
import { AuthenticationResponseJSON } from '@github/webauthn-json/dist/types/browser-ponyfill';

@Component({
  selector: 'app-login',
  templateUrl: './login.component.html',
  styleUrls: ['./login.component.scss']
})

export class LoginComponent implements OnInit {


  errorMessage: any;
  username:string = ""


  constructor(
    private http: HttpClient,
    private router: Router
  ) { 
    this.errorMessage = '';
  }

  ngOnInit(): void {
 
  }

  async submit() {
    let username = this.username;

    // possible values: preferred, required, discouraged
    let user_verification = "required";


    const authenticatorSelection: AuthenticatorSelectionCriteria = {};
    authenticatorSelection.residentKey = "required";

    const user : PublicKeyCredentialUserEntity = {
      id: coerceToArrayBuffer(username, "user.id"),
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

    
    const originalOptions : CredentialRequestOptions = {
      publicKey: {
        rpId: "",
        allowCredentials: excludeCredentials,
        extensions: extensions,
        timeout: 36000,
        userVerification: undefined,
        challenge: coerceToArrayBuffer("Ds", "Ds")
      }
    };


    // send to server for registering
    let makeAssertionOptions;
    try {

      makeAssertionOptions = await this.makeAssertionOption(username);
    } catch (e) {
      console.error(e);
      let msg = "Something wen't really wrong";
      console.log(msg);
    }


    console.log("dnoqdiwndiwoqndoiqndoinqwidnwoqdnk")
    makeAssertionOptions?.subscribe(
      (response: any) => { 
        let obj = response['result']['result']['response']
        // console.log(obj)

        decodedOptions.challenge = coerceToArrayBuffer(obj.challenge, "challenge");
        decodedOptions.user = user;
        decodedOptions.authenticatorSelection = authenticatorSelection
        if (originalOptions.publicKey !== undefined) {
          originalOptions.publicKey.challenge = coerceToArrayBuffer(obj.challenge, "dsd");
          originalOptions.publicKey.allowCredentials = obj.allowCredentials;
          originalOptions.publicKey.extensions = obj.extensions;
          originalOptions.publicKey.rpId = obj.rpId;
          originalOptions.publicKey.timeout = obj.timeout;
          originalOptions.publicKey.userVerification = obj.userVerification
        }

      },
    );



  
    await new Promise(f => setTimeout(f, 4000));

    const credential = await navigator.credentials.get(  {
      publicKey: decodedOptions
    }) as AuthenticationPublicKeyCredential;


    let fsdf =  this.getResponseToJSON(credential);


    let response;
    try {
      response = await this.makeAssetion(fsdf, originalOptions);
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
  }


  makeAssertionOption(username: string): any {
    return this.http.post<any>('https://localhost:44396/api/Account/make-assertion-options', {"email":username});
  }

  redirectToSignup() {
    this.router.navigate(['/auth/sign_up']);
  }
  
  getResponseToJSON(
    credential: PublicKeyCredential,
  ): PublicKeyCredentialWithAssertionJSON {
    return convert(
      bufferToBase64url,
      publicKeyCredentialWithAssertion,
      credential,
    );
  }
  makeAssetion = async(credential : PublicKeyCredentialWithAssertionJSON, originalOptions : CredentialRequestOptions) => {
    credential.response.authenticatorData
    const asser: AuthenticationResponseJSON = {
      authenticatorAttachment: credential.authenticatorAttachment,
      id: credential.id,
      rawId: credential.rawId,
      clientExtensionResults: credential.clientExtensionResults,
      type: credential.type,
      response: {
        authenticatorData: credential.response.authenticatorData,
        clientDataJSON: credential.response.clientDataJSON,
        signature: credential.response.signature,
        userHandle: credential.response.userHandle
      }
    }

    return this.http.post<any>('https://localhost:44396/api/Account/make-assertion', { 
      "ClientResponse" :asser,
      "options" : {
        "allowCredentials" : originalOptions.publicKey?.allowCredentials,
        "rpId" : originalOptions.publicKey?.rpId,
        "timeout": originalOptions.publicKey?.timeout,
        "extensions" : originalOptions.publicKey?.extensions,
        "userVerification" : originalOptions.publicKey?.userVerification,
        "challenge" : coerceToBase64Url(originalOptions.publicKey?.challenge) 
      }
     });
  }
}
