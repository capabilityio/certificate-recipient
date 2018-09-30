# certificate-recipient

_Stability: 1 - [Experimental](https://github.com/tristanls/stability-index#stability-1---experimental)_

[![NPM version](https://badge.fury.io/js/certificate-recipient.svg)](http://npmjs.org/package/certificate-recipient)

Recipient of certificates delivered by Certificate Manager Service.

## Contents

  * [Installation](#installation)
  * [Usage](#usage)
  * [Tests](#tests)
  * [Documentation](#documentation)
    * [Recipient.handle(message, context, callback)](#recipienthandlemessage-context-callback)
  * [Releases](#releases)

## Installation

The intended usage of `certificate-recipient` is as part of [capability-cli](https://github.com/capabilityio/capability-cli) `certificate-manager config aws` functionality.

To install locally:

```
npm install certificate-recipient
```

## Usage

This module is intended to be executed as an AWS Lambda function as part of [capability-cli](https://github.com/capabilityio/capability-cli) `certificate-manager config aws` functionality that configures this module as well as grants the requisite permissions and creates required supporting infrastructure.

## Tests

```
npm test
```

## Documentation

  * [Recipient.handle(message, context, callback)](#recipienthandlemessage-context-callback)

#### Recipient.handle(message, context, callback)

  * `message`: _Object_ Message from Certificate Manager Service delivering a certificate.
    * `certificate`: _String_ Certificate public key, including intermediate certificate chain, in PEM format.
    * `domain`: _String_ Domain name for which the certificate is issued.
    * `key`: _String_ Certificate private key in PEM format.
  * `context`: _Object_ AWS Lambda context.
  * `callback`: _Function_ `(error, resp) => {}` AWS Lambda callback.

Stores the `certificate` and `key` in configured S3 bucket. Each file is stored in the `certificate` or `key` folder in a file named with reverse `domain`. For example, if the `domain` is `my.domain.example.com` and the S3 bucket is `my-certs-bucket`, then `certificate` content will be in `s3:///my-certs-bucket/certificate/com.example.domain.my` and `key` content will be in `s3:///my-certs-bucket/key/com.example.domain.my`.

## Releases

### Policy

We follow the semantic versioning policy ([semver.org](http://semver.org/)) with a caveat:

> Given a version number MAJOR.MINOR.PATCH, increment the:
>
>MAJOR version when you make incompatible API changes,<br/>
>MINOR version when you add functionality in a backwards-compatible manner, and<br/>
>PATCH version when you make backwards-compatible bug fixes.

**caveat**: Major version zero is a special case indicating development version that may make incompatible API changes without incrementing MAJOR version.

