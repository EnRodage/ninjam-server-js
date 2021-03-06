'use strict';

var crypto = require('crypto');
var assert = require('assert').ok;
var SmartBuffer = require('smart-buffer');

function createAuthPasswordHash(challenge, username, password, anonymous) {
  assert(challenge !== null && challenge.length === 8);
  assert(username !== null);
  assert(password !== null);

  var hashA = crypto.createHash('sha1');
  if (!!anonymous) {
    hashA.update('anonymous:');
  }
  hashA.update(username + ':' + password);

  var hashB = crypto.createHash('sha1');
  hashB.update(hashA.digest());
  hashB.update(challenge);

  return hashB.digest();
}
exports.createAuthPasswordHash = createAuthPasswordHash;

function parseAuthChallenge(stream) {
  return {
    challenge: stream.readBuffer(/* length: */ 8),
    serverCaps: stream.readUInt32LE(),
    protocolVersion: stream.readUInt32LE(),
    licenseAgreement: stream.readStringNT()
  };
}
exports.parseAuthChallenge = parseAuthChallenge;

function buildAuthChallenge(challenge, serverCaps,
  protocolVersion, licenseAgreement) {
  assert(challenge.length === 8);

  var hasLicense = !!licenseAgreement;

  // Set the low bit for has-license flag.
  serverCaps = (hasLicense) ? (serverCaps | 1)
                            : (serverCaps & ~1);

  var buffer = new SmartBuffer();
  buffer.writeBuffer(challenge, /* offset: */ 0);
  buffer.writeUInt32LE(serverCaps);
  buffer.writeUInt32LE(protocolVersion);
  if (hasLicense) {
    buffer.writeStringNT(licenseAgreement);
  }

  return buffer.toBuffer();
}
exports.buildAuthChallenge = buildAuthChallenge;

exports.buildAuthReply =
function buildAuthReply(flag, message, maxChannels) {
  assert(0xff >= flag && flag >= 0x00);

  var buffer = new SmartBuffer();
  buffer.writeUInt8(flag);
  buffer.writeStringNT(message);
  buffer.writeUInt8(maxChannels);
  return buffer.toBuffer();
};

exports.parseAuthReply =
function parseAuthReply(stream) {
  return {
    flag: stream.readUInt8(),
    message: stream.readStringNT(),
    maxChannels: stream.readUInt8()
  };
};
