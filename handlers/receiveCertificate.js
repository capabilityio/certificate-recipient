/*
 * Copyright 2018-2019 Capability LLC. All Rights Reserved.
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

const events = require("events");
const Joi = require("@hapi/joi");
const schema = require("../schema/receiveCertificate.js");

module.exports = function(message, context)
{
    const self = this;
    const validationResult = Joi.validate(message, schema,
        {
            abortEarly: true,
            convert: true
        }
    );
    if (validationResult.error)
    {
        return self._end(
            {
                statusCode: 400,
                error: "Bad Request",
                message: `Invalid ${validationResult.error.details[0].path.join(".")}`
            }
        );
    }
    const workflow = new events.EventEmitter();
    setImmediate(() => workflow.emit("start", {}));
    workflow.on("start", dataBag => workflow.emit("store certificate in S3 bucket", dataBag));
    workflow.on("store certificate in S3 bucket", dataBag =>
        {
            const params =
            {
                Body: message.certificate,
                Bucket: self._config.aws.s3.bucket,
                Key: `certificate/${message.domain.split(".").reverse().join(".")}`
            };
            self._s3.putObject(params, (error, resp) =>
                {
                    if (error)
                    {
                        return self._end(self.SERVICE_UNAVAILABLE);
                    }
                    return workflow.emit("store key in S3 bucket", dataBag);
                }
            );
        }
    );
    workflow.on("store key in S3 bucket", dataBag =>
        {
            const params =
            {
                Body: message.key,
                Bucket: self._config.aws.s3.bucket,
                Key: `key/${message.domain.split(".").reverse().join(".")}`
            };
            self._s3.putObject(params, (error, resp) =>
                {
                    if (error)
                    {
                        return self._end(self.SERVICE_UNAVAILABLE);
                    }
                    return self._end(undefined,
                        {
                            statusCode: 200,
                            message: "OK"
                        }
                    );
                }
            );
        }
    );
};
