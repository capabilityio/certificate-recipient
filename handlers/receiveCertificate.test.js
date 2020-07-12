/*
 * Copyright 2018-2020 Capability LLC. All Rights Reserved.
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *     http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */
"use strict";

const clone = require("clone");
const countdown = require("../test/countdown.js");
const fs = require("fs");
const errors = require("../errors");

const Recipient = require("../index.js");

const INSTANTIATED_CONFIG = require("../test/config/instantiated.js");
const RECEIVE_CERTIFICATE =
{
    certificate: fs.readFileSync(__dirname + "/../test/certs/example-cert.pem", "utf8"),
    domain: "example.com",
    key: fs.readFileSync(__dirname + "/../test/secrets/example-key.pem", "utf8")
};

describe("RecieveCertificate", () =>
{
    let config;
    beforeEach(() =>
        {
            jest.resetModules();
            config = clone(INSTANTIATED_CONFIG);
        }
    );
    describe("invalid message", () =>
    {
        [
            "certificate", "domain", "key"
        ]
        .map(prop =>
        {
            describe(`missing "${prop}"`, () =>
            {
                it("returns 400 Bad Request", done =>
                    {
                        const lambda = new Recipient(config);
                        const msg = clone(RECEIVE_CERTIFICATE);
                        delete msg[prop];
                        lambda.handle(
                            msg,
                            {},
                            (error, resp) =>
                            {
                                expect(error).toBe(undefined);
                                expect(resp).toEqual(
                                    new errors.BadRequest(
                                        `Invalid ${prop}`
                                    )
                                );
                                done();
                            }
                        );
                    }
                );
            });
        });
    });
    describe("puts certificate into configured S3 bucket", () =>
    {
        it("if error, returns 503 Service Unavailable", done =>
            {
                const finish = countdown(done, 2);
                const mock =
                {
                    config,
                    finish,
                    RECEIVE_CERTIFICATE
                };
                jest.mock("aws-sdk", () => (
                    {
                        S3: function()
                        {
                            return (
                                {
                                    putObject(params, callback)
                                    {
                                        expect(params).toEqual(
                                            {
                                                Body: mock.RECEIVE_CERTIFICATE.certificate,
                                                Bucket: mock.config.aws.s3.bucket,
                                                Key: "certificate/com.example"
                                            }
                                        );
                                        mock.finish();
                                        return callback(new Error("boom"));
                                    }
                                }
                            );
                        }
                    }
                ));
                const lambda = new (require("../index.js"))(config);
                lambda.handle(
                    clone(RECEIVE_CERTIFICATE),
                    {},
                    (error, resp) =>
                    {
                        expect(error).toBe(undefined);
                        expect(resp).toEqual(new errors.ServiceUnavailable());
                        finish();
                    }
                );
            }
        );
    });
    describe("puts key into configured S3 bucket", () =>
    {
        it("if error, returns 503 Service Unavailable", done =>
            {
                const finish = countdown(done, 2);
                const mock =
                {
                    config,
                    finish,
                    RECEIVE_CERTIFICATE
                };
                jest.mock("aws-sdk", () => (
                    {
                        S3: function()
                        {
                            return (
                                {
                                    putObject(params, callback)
                                    {
                                        if (params.Key == "certificate/com.example")
                                        {
                                            return callback();
                                        }
                                        expect(params).toEqual(
                                            {
                                                Body: mock.RECEIVE_CERTIFICATE.key,
                                                Bucket: mock.config.aws.s3.bucket,
                                                Key: "key/com.example"
                                            }
                                        );
                                        mock.finish();
                                        return callback(new Error("boom"));
                                    }
                                }
                            );
                        }
                    }
                ));
                const lambda = new (require("../index.js"))(config);
                lambda.handle(
                    clone(RECEIVE_CERTIFICATE),
                    {},
                    (error, resp) =>
                    {
                        expect(error).toBe(undefined);
                        expect(resp).toEqual(new errors.ServiceUnavailable());
                        finish();
                    }
                );
            }
        );
        it("if success, succeeds", done =>
            {
                const finish = countdown(done, 3);
                const mock =
                {
                    config,
                    finish,
                    RECEIVE_CERTIFICATE
                };
                jest.mock("aws-sdk", () => (
                    {
                        S3: function()
                        {
                            return (
                                {
                                    putObject(params, callback)
                                    {
                                        mock.finish();
                                        return callback();
                                    }
                                }
                            );
                        }
                    }
                ));
                const lambda = new (require("../index.js"))(config);
                lambda.handle(
                    clone(RECEIVE_CERTIFICATE),
                    {},
                    (error, resp) =>
                    {
                        expect(error).toBe(undefined);
                        expect(resp).toEqual(
                            {
                                statusCode: 200,
                                message: "OK"
                            }
                        );
                        finish();
                    }
                );
            }
        );
    });
});
