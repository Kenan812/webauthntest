import { Base64urlString } from "../utilities/Base64urlString";

export class AuthenticatorAttestationResponse{
    public Id: string | undefined;
    public RawId: string | undefined;
    public Type: string | undefined;
    public AttestationObject: Base64urlString | undefined;
    public ClientDataJson: Base64urlString | undefined;
}