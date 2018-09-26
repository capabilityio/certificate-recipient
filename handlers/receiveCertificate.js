/*
 * Copyright 2018 Capability LLC. All Rights Reserved.
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
const Joi = require("joi");
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
};
