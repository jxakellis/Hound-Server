const jwt = require('jsonwebtoken');
const NodeCache = require('node-cache');
const { pki } = require('node-forge');
const { areAllDefined } = require('./validateDefined');
const { ValidationError, ExternalServerError } = require('../general/errors');
const { logServerError } = require('../logging/logServerError');

// The cache is set to expire every 6 hours, and checks for expired keys every 15 seconds
// If you want to store more items in the cache, you can continue using the same NodeCache instance.
const certificateCache = new NodeCache({ stdTTL: 60 * 60 * 6, checkperiod: 15 });

// https://www.apple.com/certificateauthority/
const appleCertificates = [
  // Apple Root CA - G3 Root
  `-----BEGIN CERTIFICATE-----
  MIICQzCCAcmgAwIBAgIILcX8iNLFS5UwCgYIKoZIzj0EAwMwZzEbMBkGA1UEAwwS
  QXBwbGUgUm9vdCBDQSAtIEczMSYwJAYDVQQLDB1BcHBsZSBDZXJ0aWZpY2F0aW9u
  IEF1dGhvcml0eTETMBEGA1UECgwKQXBwbGUgSW5jLjELMAkGA1UEBhMCVVMwHhcN
  MTQwNDMwMTgxOTA2WhcNMzkwNDMwMTgxOTA2WjBnMRswGQYDVQQDDBJBcHBsZSBS
  b290IENBIC0gRzMxJjAkBgNVBAsMHUFwcGxlIENlcnRpZmljYXRpb24gQXV0aG9y
  aXR5MRMwEQYDVQQKDApBcHBsZSBJbmMuMQswCQYDVQQGEwJVUzB2MBAGByqGSM49
  AgEGBSuBBAAiA2IABJjpLz1AcqTtkyJygRMc3RCV8cWjTnHcFBbZDuWmBSp3ZHtf
  TjjTuxxEtX/1H7YyYl3J6YRbTzBPEVoA/VhYDKX1DyxNB0cTddqXl5dvMVztK517
  IDvYuVTZXpmkOlEKMaNCMEAwHQYDVR0OBBYEFLuw3qFYM4iapIqZ3r6966/ayySr
  MA8GA1UdEwEB/wQFMAMBAf8wDgYDVR0PAQH/BAQDAgEGMAoGCCqGSM49BAMDA2gA
  MGUCMQCD6cHEFl4aXTQY2e3v9GwOAEZLuN+yRhHFD/3meoyhpmvOwgPUnPWTxnS4
  at+qIxUCMG1mihDK1A3UT82NQz60imOlM27jbdoXt2QfyFMm+YhidDkLF1vLUagM
  6BgD56KyKA==
   -----END CERTIFICATE-----`,
  // Worldwide Developer Relations - G8 (Expiring 01/24/2025 00:00:00 UTC)
  `-----BEGIN CERTIFICATE-----
  MIIEVTCCAz2gAwIBAgIUVLULr3kNjX+Mr2hMVi9QaQoaul8wDQYJKoZIhvcNAQEF
  BQAwYjELMAkGA1UEBhMCVVMxEzARBgNVBAoTCkFwcGxlIEluYy4xJjAkBgNVBAsT
  HUFwcGxlIENlcnRpZmljYXRpb24gQXV0aG9yaXR5MRYwFAYDVQQDEw1BcHBsZSBS
  b290IENBMB4XDTIzMDYyMDIzMzcxNVoXDTI1MDEyNDAwMDAwMFowdTELMAkGA1UE
  BhMCVVMxEzARBgNVBAoMCkFwcGxlIEluYy4xCzAJBgNVBAsMAkc4MUQwQgYDVQQD
  DDtBcHBsZSBXb3JsZHdpZGUgRGV2ZWxvcGVyIFJlbGF0aW9ucyBDZXJ0aWZpY2F0
  aW9uIEF1dGhvcml0eTCCASIwDQYJKoZIhvcNAQEBBQADggEPADCCAQoCggEBANBA
  ENQI+VIhY088aPfUnIICjINovLeNf4jnQk0s7yKlwonevQzXTWFQLTnkMHOl0tVo
  mjPy79kqrS4fA7r4pfFCC1cuRsbQWNNwX/eyN+9qHz6/iTnCrf71BftYljHIhyzV
  I7p1sCz1q6C68iAMTOskY2npIkDwjlhb3mR7iRtREgTgF7JZzd/x586vLDLoacHQ
  CH4dokdz0Us7/bmF3EenKIJ5KUiJAijiwewsH1uG/Ni2y3HAcwFL/AUREWwBAzRa
  9oHCXh98FA7eP2shy0/112HmhAOSvOclKZ7NWwzB2+PEOtl2V6wvOBQZyLexolVP
  X06OGVmp2v1y2rAEIQUCAwEAAaOB7zCB7DASBgNVHRMBAf8ECDAGAQH/AgEAMB8G
  A1UdIwQYMBaAFCvQaUeUdgn+9GuNLkCm90dNfwheMEQGCCsGAQUFBwEBBDgwNjA0
  BggrBgEFBQcwAYYoaHR0cDovL29jc3AuYXBwbGUuY29tL29jc3AwMy1hcHBsZXJv
  b3RjYTAuBgNVHR8EJzAlMCOgIaAfhh1odHRwOi8vY3JsLmFwcGxlLmNvbS9yb290
  LmNybDAdBgNVHQ4EFgQUtb28gMQM4zik9LetI7PvRM65WoUwDgYDVR0PAQH/BAQD
  AgEGMBAGCiqGSIb3Y2QGAgEEAgUAMA0GCSqGSIb3DQEBBQUAA4IBAQBMs+t6OZRK
  lWb6FjHqDYqPXUI4xgfN6MkirPwIQn5fk18xKqgiwXYZK+6ucum9Vs9JJJII980Z
  dcP5GicNDtwpjT+226VPTHLEYJGJEX4klUMiYGe83/+r5TwWF52CFE6d9HX+ULmt
  BbK4efaV1hDl9lP0zyPmdw/suEtp+OKeAjHZjtnKvmNeX+Ggac7BzW5Jo3hhrzk8
  aksKNCVk1TC1PKvdEYE5cejAw1iAERAaEdLCvFnwitk1c8DmbeTJfWIUPoICqRBp
  N3lhb/BGlD419ausY9DYXllXadG4S25d1F8TnHBOJRHcJCweFp6WWgTtRe467mdd
  j8OGsPVMH2gQ
  -----END CERTIFICATE-----`,
];

async function validateAppleSignedPayload(signedPayload) {
  // Parse header and payload
  const [encodedHeader, encodedPayload] = signedPayload.split('.');
  const header = JSON.parse(Buffer.from(encodedHeader, 'base64').toString());
  console.log('1');

  // Extract x5c and alg from header
  const { x5c, alg } = header;
  console.log('2');

  // Get the certificate in DER format and convert it into PEM
  let certificate = Buffer.from(x5c[0], 'base64').toString('binary');
  certificate = `-----BEGIN CERTIFICATE-----\n${certificate}\n-----END CERTIFICATE-----`;
  console.log('3');

  // Check the cache for the public key corresponding to the certificate
  let publicKey = certificateCache.get(x5c[0]);
  console.log('4');

  if (!publicKey) {
    // Verify the certificate chain, you may need to add Apple's root and intermediate certificates for chain verification
    const caStore = pki.createCaStore(appleCertificates);
    console.log('5');
    const cert = pki.certificateFromPem(certificate);
    console.log('6');
    try {
      pki.verifyCertificateChain(caStore, [cert]);
      console.log('7');
    }
    catch (error) {
      console.log(error);
      logServerError('Certificate chain verification failed', error);
      throw new ExternalServerError('Failed to verify Apple\'s certificate chain', global.CONSTANT.ERROR.GENERAL.APPLE_SERVER_FAILED);
    }

    console.log('8');
    // Extract the public key from the certificate
    publicKey = pki.publicKeyToPem(cert.publicKey);
    console.log('9');

    // Cache the public key
    certificateCache.set(x5c[0], publicKey);
    console.log('10');
  }

  let verifiedPayload;
  try {
    // Validate the signed payload using the public key and the algorithm from the header
    verifiedPayload = jwt.verify(`${encodedHeader}.${encodedPayload}`, publicKey, { algorithms: [alg] });
    console.log('11');

    // Perform whatever processing is necessary on the verified payload
  }
  catch (error) {
    console.log('12');
    console.log(error);
    logServerError('Payload verification failed', error);
    throw new ValidationError('Failed to verify the signed payload', global.CONSTANT.ERROR.VALUE.MISSING);
  }

  // TO DO return info from [1] so we don't decode it 3 times in createForAppStoreServerNotif
  return verifiedPayload;
}

module.exports = { validateAppleSignedPayload };
